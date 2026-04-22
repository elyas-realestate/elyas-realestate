import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { verifyTotp, hashRecoveryCode } from "@/lib/totp";

// POST /api/2fa/disable
// body: { code: "123456" | "XXXX-XXXX-XXXX" }
// يُعطّل 2FA بعد التحقّق من رمز TOTP حالي أو رمز استرداد.
// هذا يمنع تعطيل 2FA من جلسة مسروقة (لا تكفي الجلسة المصادَقة وحدها).
export async function POST(req: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }
  const code = (body.code || "").trim();
  if (!code) return NextResponse.json({ error: "الرمز مطلوب" }, { status: 400 });

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: row } = await svc
    .from("user_2fa_secrets")
    .select("secret, is_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row || !row.is_enabled) {
    return NextResponse.json({ error: "المصادقة الثنائية غير مفعّلة" }, { status: 400 });
  }

  let verified = false;
  let method: "totp" | "recovery_code" = "totp";

  // حالة 1: رمز TOTP من 6 أرقام
  if (/^\d{6}$/.test(code)) {
    verified = verifyTotp(row.secret, code);
    method = "totp";
  } else {
    // حالة 2: رمز استرداد بصيغة XXXX-XXXX-XXXX
    const codeHash = hashRecoveryCode(code);
    const { data: recovery } = await svc
      .from("user_recovery_codes")
      .select("id, used_at")
      .eq("user_id", user.id)
      .eq("code_hash", codeHash)
      .maybeSingle();

    if (recovery && !recovery.used_at) {
      verified = true;
      method = "recovery_code";
      // اعتبر الرمز مستخدماً
      await svc
        .from("user_recovery_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", recovery.id);
    }
  }

  // سجّل المحاولة
  const ua = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  await svc.from("user_2fa_attempts").insert({
    user_id: user.id,
    success: verified,
    method,
    ip_address: ip,
    user_agent: ua,
  });

  if (!verified) {
    return NextResponse.json({ error: "رمز غير صحيح" }, { status: 400 });
  }

  // عطّل 2FA: احذف السرّ وجميع رموز الاسترداد
  await svc.from("user_2fa_secrets").delete().eq("user_id", user.id);
  await svc.from("user_recovery_codes").delete().eq("user_id", user.id);

  return NextResponse.json({ success: true, disabled: true });
}
