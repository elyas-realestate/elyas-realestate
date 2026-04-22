import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { verifyTotp, hashRecoveryCode } from "@/lib/totp";

// POST /api/2fa/challenge
// body: { code: "123456" | "XXXX-XXXX-XXXX" }
// يُستخدم في تدفّق تسجيل الدخول: بعد إدخال كلمة السر، لو المستخدم مفعّل 2FA يُطلب منه رمز.
// المستخدم يكون مصادَقاً في Supabase لكن لم يُجتز 2FA بعد — نضع علامة cookie عند النجاح.
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
    // المستخدم لا يحتاج تحدي 2FA — نُرجع نجاحاً مباشرة
    return NextResponse.json({ success: true, required: false });
  }

  let verified = false;
  let method: "totp" | "recovery_code" = "totp";

  if (/^\d{6}$/.test(code)) {
    verified = verifyTotp(row.secret, code);
    method = "totp";
    if (verified) {
      await svc
        .from("user_2fa_secrets")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
  } else {
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

  // اضبط cookie يُثبت اجتياز 2FA للجلسة الحالية (12 ساعة)
  const res = NextResponse.json({ success: true, required: true, passed: true });
  res.cookies.set("2fa_passed", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 ساعة
  });
  return res;
}

// GET /api/2fa/challenge → هل المستخدم الحالي يحتاج تحدي؟
export async function GET(req: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: row } = await svc
    .from("user_2fa_secrets")
    .select("is_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  const enabled = !!row?.is_enabled;
  const passedCookie = req.cookies.get("2fa_passed")?.value === "1";

  return NextResponse.json({
    enabled,
    passed: passedCookie,
    requiresChallenge: enabled && !passedCookie,
  });
}
