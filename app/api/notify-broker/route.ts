import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/notify-broker
 * يُستدعى عند إرسال طلب جديد من صفحة الوسيط العامة
 * يرسل بريداً إلكترونياً للوسيط عبر Resend (إذا كان RESEND_API_KEY متاحاً)
 *
 * Body: { tenantId, type: "request"|"client", data: { name, phone, ... } }
 */
export async function POST(req: NextRequest) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@waseet-pro.com";

  // إذا لم يُضبط Resend — أرجع 200 بصمت (اختياري)
  if (!RESEND_KEY) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
  }

  const body = await req.json().catch(() => ({}));
  const { tenantId, type, data } = body as {
    tenantId?: string;
    type?: "request" | "client";
    data?: Record<string, string>;
  };

  if (!tenantId || !type || !data) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  // ── جلب إيميل الوسيط من site_settings ──
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: settings } = await supabase
    .from("site_settings")
    .select("broker_name, contact_email")
    .eq("tenant_id", tenantId)
    .single();

  const brokerEmail = settings?.contact_email;
  if (!brokerEmail) {
    return NextResponse.json({ skipped: true, reason: "no broker email" });
  }

  // ── بناء محتوى الإيميل ──
  const brokerName = settings?.broker_name || "الوسيط";
  const isRequest  = type === "request";

  const subject = isRequest
    ? `🏠 طلب عقار جديد — ${data.name || "زائر"}`
    : `👤 عميل محتمل جديد — ${data.name || "زائر"}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
  .card { background: #fff; border-radius: 12px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #C6914C, #8A5F2E); padding: 24px 28px; }
  .header h1 { color: #fff; margin: 0; font-size: 18px; font-weight: 800; }
  .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
  .body { padding: 24px 28px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
  .label { color: #888; font-size: 13px; }
  .value { color: #1a1a1a; font-size: 14px; font-weight: 600; }
  .btn { display: inline-block; background: #C6914C; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 20px; }
  .footer { background: #f9f9f9; padding: 14px 28px; font-size: 11px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>${isRequest ? "🏠 طلب عقار جديد" : "👤 عميل محتمل جديد"}</h1>
    <p>وصل عبر صفحتك الشخصية — وسيط برو</p>
  </div>
  <div class="body">
    <p style="color:#444;font-size:14px;margin-top:0">مرحباً ${brokerName}، وصلك ${isRequest ? "طلب عقار" : "عميل محتمل"} جديد:</p>
    ${Object.entries(data).map(([k, v]) => v ? `
    <div class="row">
      <span class="label">${k}</span>
      <span class="value">${v}</span>
    </div>` : "").join("")}
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://waseet-pro.com"}/dashboard/${isRequest ? "requests" : "clients"}" class="btn">
      عرض في لوحة التحكم
    </a>
  </div>
  <div class="footer">تم الإرسال تلقائياً من منصة وسيط برو · يمكنك إيقاف هذه الإشعارات من الإعدادات</div>
</div>
</body>
</html>
`;

  // ── إرسال عبر Resend ──
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [brokerEmail],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return NextResponse.json({ error: "فشل إرسال البريد" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
