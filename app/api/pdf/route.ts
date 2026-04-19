import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function money(n: number | null | undefined) {
  if (!n) return "0";
  return Number(n).toLocaleString("ar-SA");
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "invoice" | "quotation"
  const id   = searchParams.get("id");

  if (!type || !id) return NextResponse.json({ error: "missing params" }, { status: 400 });
  if (type !== "invoice" && type !== "quotation") return NextResponse.json({ error: "invalid type" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const table = type === "invoice" ? "invoices" : "quotations";
  const { data: doc, error } = await supabase.from(table).select("*").eq("id", id).single();
  if (error || !doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: identity } = await supabase.from("broker_identity").select("broker_name, fal_license, phone").limit(1).single();
  const { data: settings } = await supabase.from("site_settings").select("site_name, phone, email, site_logo").limit(1).single();

  const brokerName = identity?.broker_name || settings?.site_name || "وسيط برو";
  const falLicense = identity?.fal_license || "";
  const phone      = identity?.phone || settings?.phone || "";
  const email      = settings?.email || "";
  const logo       = settings?.site_logo || "";

  const isInvoice = type === "invoice";
  const docTitle  = isInvoice ? "فاتورة" : "عرض سعر";
  const docNumber = doc.invoice_number || doc.quotation_number || `#${id.slice(0, 8).toUpperCase()}`;
  const total     = Number(doc.amount || 0);
  const vat       = Number(doc.vat_amount || 0);
  const grandTotal = total + vat;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${docTitle} — ${docNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #C6914C; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-circle { width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #C6914C, #8A5F2E); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 900; flex-shrink: 0; }
    .brand-name { font-size: 20px; font-weight: 800; color: #1a1a1a; }
    .brand-sub { font-size: 12px; color: #888; margin-top: 2px; }
    .doc-info { text-align: left; }
    .doc-type { font-size: 28px; font-weight: 900; color: #C6914C; }
    .doc-number { font-size: 13px; color: #666; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .meta-box { background: #f8f8f8; border-radius: 12px; padding: 16px 20px; }
    .meta-label { font-size: 11px; color: #888; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
    .meta-value { font-size: 14px; color: #1a1a1a; font-weight: 600; line-height: 1.7; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { background: #C6914C; color: #fff; font-weight: 700; font-size: 13px; padding: 12px 16px; text-align: right; }
    .items-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .items-table tr:last-child td { border-bottom: none; }
    .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; margin-bottom: 32px; }
    .total-row { display: flex; gap: 40px; font-size: 13px; }
    .total-row.grand { font-size: 16px; font-weight: 800; color: #C6914C; padding-top: 10px; border-top: 2px solid #C6914C; margin-top: 4px; }
    .total-label { color: #666; min-width: 120px; text-align: right; }
    .total-value { min-width: 100px; text-align: left; font-weight: 600; }
    .notes-box { background: #fffbf5; border: 1px solid #f0e6d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 32px; }
    .notes-label { font-size: 11px; font-weight: 700; color: #C6914C; margin-bottom: 6px; }
    .notes-text { font-size: 13px; color: #555; line-height: 1.7; white-space: pre-wrap; }
    .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; }
    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="${brokerName}" style="width:50px;height:50px;border-radius:12px;object-fit:cover;">` : `<div class="logo-circle">${brokerName.charAt(0)}</div>`}
      <div>
        <div class="brand-name">${brokerName}</div>
        <div class="brand-sub">${falLicense ? `رخصة فال: ${falLicense}` : "وسيط عقاري مرخّص"}</div>
        ${phone ? `<div class="brand-sub">${phone}</div>` : ""}
        ${email ? `<div class="brand-sub">${email}</div>` : ""}
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-type">${docTitle}</div>
      <div class="doc-number">${docNumber}</div>
      <div class="doc-number">التاريخ: ${formatDate(doc.created_at)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">العميل</div>
      <div class="meta-value">
        ${doc.client_name || "—"}<br>
        ${doc.client_phone ? doc.client_phone : ""}
      </div>
    </div>
    <div class="meta-box">
      <div class="meta-label">${isInvoice ? "تاريخ الاستحقاق" : "صالح حتى"}</div>
      <div class="meta-value">${formatDate(isInvoice ? doc.due_date : doc.valid_until)}</div>
      ${doc.status ? `<div style="margin-top:8px;"><span class="status-badge" style="background:rgba(198,145,76,0.1);color:#C6914C;">${doc.status}</span></div>` : ""}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>الوصف</th>
        <th style="text-align:left;width:140px;">المبلغ (ريال)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${doc.title}</td>
        <td style="text-align:left;font-weight:700;">${money(total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span class="total-label">المجموع قبل الضريبة:</span>
      <span class="total-value">${money(total)} ريال</span>
    </div>
    ${vat > 0 ? `<div class="total-row"><span class="total-label">ضريبة القيمة المضافة (15%):</span><span class="total-value">${money(vat)} ريال</span></div>` : ""}
    <div class="total-row grand">
      <span class="total-label">الإجمالي:</span>
      <span class="total-value">${money(grandTotal)} ريال</span>
    </div>
  </div>

  ${doc.notes ? `<div class="notes-box"><div class="notes-label">ملاحظات</div><div class="notes-text">${doc.notes}</div></div>` : ""}

  <div class="footer">
    <span>مُولَّد بواسطة وسيط برو</span>
    <span>جميع المبالغ بالريال السعودي</span>
  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
