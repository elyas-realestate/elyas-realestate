import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { generateTotpSecret, buildOtpAuthUri } from "@/lib/totp";

// POST /api/2fa/enroll
// يُولّد سرّ TOTP جديد ويحفظه (is_enabled=false) — يُرجع otpauth URI للمسح بالجوّال.
// لن يُفعّل 2FA إلا بعد تأكيد المستخدم لرمز أوّل عبر /api/2fa/verify.
export async function POST(req: NextRequest) {
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

  // لو المستخدم عنده 2FA مفعّل سابقاً، نمنع إعادة التسجيل (يجب تعطيلها أولاً)
  const { data: existing } = await svc
    .from("user_2fa_secrets")
    .select("is_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.is_enabled) {
    return NextResponse.json(
      { error: "المصادقة الثنائية مفعّلة بالفعل. عطّلها أولاً ثم أعد التسجيل." },
      { status: 409 }
    );
  }

  // توليد سرّ جديد (يُستبدل أي سرّ سابق غير مفعّل)
  const secret = generateTotpSecret();
  const { error: upsertErr } = await svc
    .from("user_2fa_secrets")
    .upsert({
      user_id: user.id,
      secret,
      is_enabled: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  const accountName = user.email || user.id;
  const otpauthUri = buildOtpAuthUri({
    secret,
    accountName,
    issuer: "Waseet Pro",
  });

  return NextResponse.json({
    secret,         // نعرضه للمستخدم مرّة واحدة ليدخله يدوياً لو تعذّر المسح
    otpauthUri,     // سنحوّله لـ QR code على جانب العميل
    accountName,
    issuer: "Waseet Pro",
  });
}
