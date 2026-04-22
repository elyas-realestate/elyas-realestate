import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/totp";

// POST /api/2fa/verify
// body: { code: "123456" }
// يتحقّق من رمز TOTP أوّل، يُفعّل 2FA، ويُرجع 10 رموز استرداد (مرّة واحدة فقط).
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
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "أدخل رمزاً من 6 أرقام" }, { status: 400 });
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // اجلب السرّ
  const { data: row, error: selErr } = await svc
    .from("user_2fa_secrets")
    .select("secret, is_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selErr || !row) {
    return NextResponse.json({ error: "لم تبدأ التسجيل. اذهب للإعدادات أولاً." }, { status: 404 });
  }

  // تحقّق من الرمز
  const ok = verifyTotp(row.secret, code);

  // سجّل المحاولة
  const ua = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  await svc.from("user_2fa_attempts").insert({
    user_id: user.id,
    success: ok,
    method: "totp",
    ip_address: ip,
    user_agent: ua,
  });

  if (!ok) {
    return NextResponse.json({ error: "رمز غير صحيح. تأكّد من تزامن الساعة وحاول مرة أخرى." }, { status: 400 });
  }

  // فعّل 2FA إن لم يكن مفعّلاً
  const wasAlreadyEnabled = row.is_enabled;
  if (!wasAlreadyEnabled) {
    await svc
      .from("user_2fa_secrets")
      .update({
        is_enabled: true,
        enabled_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  } else {
    await svc
      .from("user_2fa_secrets")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }

  // لو كانت هذه أوّل عملية تفعيل → ولّد رموز استرداد
  let recoveryCodes: string[] = [];
  if (!wasAlreadyEnabled) {
    recoveryCodes = generateRecoveryCodes(10);
    // امسح أي رموز قديمة (إن وُجدت)
    await svc.from("user_recovery_codes").delete().eq("user_id", user.id);
    // أدخل الهاشات
    const rows = recoveryCodes.map((c) => ({
      user_id: user.id,
      code_hash: hashRecoveryCode(c),
    }));
    await svc.from("user_recovery_codes").insert(rows);
  }

  return NextResponse.json({
    success: true,
    enabled: true,
    recoveryCodes, // فارغة لو كانت 2FA مفعّلة من قبل (الرموز تُعرض مرّة واحدة عند التفعيل)
  });
}
