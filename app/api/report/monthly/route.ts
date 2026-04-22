import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

// GET /api/report/monthly?year=2026&month=4
// يُولّد تقرير شهري كامل HTML (يطبع نفسه تلقائياً — المتصفح يحوّله لـ PDF)

function h(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(n: number | null | undefined): string {
  if (!n) return "0";
  return Number(n).toLocaleString("ar-SA");
}

function arabicMonth(m: number): string {
  return ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"][m - 1] || "";
}

export async function GET(req: NextRequest) {
  // ── المصادقة ──
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year  = parseInt(searchParams.get("year")  || String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "التاريخ غير صالح" }, { status: 400 });
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // ── tenant_id للمستخدم ──
  const { data: tenantRow } = await svc
    .from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
  const tenantId = tenantRow?.id;
  if (!tenantId) return NextResponse.json({ error: "لا يوجد حساب مرتبط" }, { status: 403 });

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate   = new Date(Date.UTC(year, month, 1));
  const startIso = startDate.toISOString();
  const endIso   = endDate.toISOString();

  // ── جلب الهوية ──
  const { data: identity } = await svc
    .from("broker_identity")
    .select("broker_name, fal_license, phone, vat_number")
    .eq("tenant_id", tenantId).maybeSingle();
  const { data: settings } = await svc
    .from("site_settings")
    .select("site_name, phone, email, site_logo")
    .eq("tenant_id", tenantId).maybeSingle();

  const brokerName = identity?.broker_name || settings?.site_name || "وسيط برو";
  const logo       = settings?.site_logo || "";
  const falLicense = identity?.fal_license || "";

  // ── استعلامات متوازية ──
  const [
    propsAddedRes, propsTotalRes,
    clientsAddedRes, clientsTotalRes,
    dealsInMonthRes, dealsClosedRes,
    invoicesPaidRes, invoicesPendingRes, invoicesOverdueRes,
    topPropsRes, staleCountRes,
  ] = await Promise.all([
    svc.from("properties").select("id", { count: "exact", head: true })
       .eq("tenant_id", tenantId).gte("created_at", startIso).lt("created_at", endIso),
    svc.from("properties").select("id", { count: "exact", head: true })
       .eq("tenant_id", tenantId),
    svc.from("clients").select("id", { count: "exact", head: true })
       .eq("tenant_id", tenantId).gte("created_at", startIso).lt("created_at", endIso),
    svc.from("clients").select("id", { count: "exact", head: true })
       .eq("tenant_id", tenantId),
    svc.from("deals").select("*")
       .eq("tenant_id", tenantId).gte("created_at", startIso).lt("created_at", endIso),
    svc.from("deals").select("*")
       .eq("tenant_id", tenantId).eq("current_stage", "مغلق - فوز")
       .gte("updated_at", startIso).lt("updated_at", endIso),
    svc.from("invoices").select("amount, vat_amount, status, created_at")
       .eq("tenant_id", tenantId).eq("status", "paid")
       .gte("created_at", startIso).lt("created_at", endIso),
    svc.from("invoices").select("amount, vat_amount, status")
       .eq("tenant_id", tenantId).in("status", ["pending", "sent"]),
    svc.from("invoices").select("amount, vat_amount, due_date")
       .eq("tenant_id", tenantId).neq("status", "paid").lt("due_date", endIso),
    svc.from("properties").select("id, title, city, district, price")
       .eq("tenant_id", tenantId).eq("is_published", true)
       .order("created_at", { ascending: false }).limit(5),
    svc.from("properties").select("id", { count: "exact", head: true })
       .eq("tenant_id", tenantId).lt("updated_at", new Date(Date.now() - 30*24*60*60*1000).toISOString()),
  ]);

  const propsAdded    = propsAddedRes.count || 0;
  const propsTotal    = propsTotalRes.count || 0;
  const clientsAdded  = clientsAddedRes.count || 0;
  const clientsTotal  = clientsTotalRes.count || 0;
  const dealsCount    = (dealsInMonthRes.data || []).length;
  const dealsClosed   = dealsClosedRes.data || [];
  const closedRevenue = dealsClosed.reduce((s, d: any) => s + (Number(d.expected_commission) || 0), 0);
  const paidRevenue   = (invoicesPaidRes.data || []).reduce(
    (s, i: any) => s + (Number(i.amount) || 0) + (Number(i.vat_amount) || 0), 0
  );
  const pendingAmount = (invoicesPendingRes.data || []).reduce(
    (s, i: any) => s + (Number(i.amount) || 0) + (Number(i.vat_amount) || 0), 0
  );
  const overdueAmount = (invoicesOverdueRes.data || []).reduce(
    (s, i: any) => s + (Number(i.amount) || 0) + (Number(i.vat_amount) || 0), 0
  );
  const staleCount = staleCountRes.count || 0;
  const topProps   = topPropsRes.data || [];

  // ── توزيع أسبوعي للعقارات المُضافة (sparkline) ──
  const weeklyBins = [0, 0, 0, 0, 0];
  const { data: weeklyData } = await svc
    .from("properties")
    .select("created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  (weeklyData || []).forEach((p: any) => {
    const d = new Date(p.created_at);
    const day = d.getUTCDate();
    const w = Math.min(4, Math.floor((day - 1) / 7));
    weeklyBins[w]++;
  });
  const maxWeek = Math.max(...weeklyBins, 1);

  // ── بناء HTML ──
  const monthLabel = `${arabicMonth(month)} ${year}`;
  const generatedAt = new Date().toLocaleString("ar-SA");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير ${monthLabel} — ${h(brokerName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; font-size: 14px; }
    .cover { min-height: 60vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px 20px; background: linear-gradient(135deg, rgba(198,145,76,0.08), rgba(138,95,46,0.02)); border-radius: 20px; margin-bottom: 40px; page-break-after: always; }
    .cover-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 40px; }
    .logo-circle { width: 72px; height: 72px; border-radius: 18px; background: linear-gradient(135deg, #C6914C, #8A5F2E); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 32px; font-weight: 900; }
    .cover h1 { font-size: 42px; font-weight: 900; color: #1a1a1a; margin-bottom: 8px; }
    .cover .sub { font-size: 18px; color: #888; margin-bottom: 30px; }
    .cover .month { font-size: 56px; font-weight: 900; color: #C6914C; margin-bottom: 12px; }
    .cover .meta { font-size: 13px; color: #aaa; margin-top: 30px; }

    h2 { font-size: 22px; font-weight: 800; margin: 30px 0 16px; color: #1a1a1a; padding-bottom: 10px; border-bottom: 2px solid #C6914C; }
    h3 { font-size: 16px; font-weight: 700; margin: 20px 0 10px; color: #555; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
    .stat { background: #fafafa; border-radius: 14px; padding: 18px; border: 1px solid #f0f0f0; }
    .stat-label { font-size: 11px; color: #888; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 8px; text-transform: uppercase; }
    .stat-value { font-size: 26px; font-weight: 900; color: #1a1a1a; line-height: 1; }
    .stat-sub { font-size: 11px; color: #999; margin-top: 6px; }
    .stat-value.gold { color: #C6914C; }
    .stat-value.green { color: #16a34a; }
    .stat-value.red { color: #dc2626; }

    .revenue-box { background: linear-gradient(135deg, #C6914C, #8A5F2E); color: #fff; border-radius: 16px; padding: 28px 24px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; }
    .revenue-box .label { font-size: 13px; opacity: 0.9; margin-bottom: 8px; }
    .revenue-box .value { font-size: 36px; font-weight: 900; }
    .revenue-box .note { font-size: 12px; opacity: 0.85; margin-top: 8px; }

    .week-chart { display: flex; align-items: flex-end; gap: 12px; height: 120px; padding: 20px; background: #fafafa; border-radius: 14px; margin-bottom: 20px; }
    .week-bar { flex: 1; background: linear-gradient(to top, #C6914C, #8A5F2E); border-radius: 8px 8px 0 0; position: relative; transition: all 0.3s; min-height: 4px; }
    .week-bar-label { position: absolute; bottom: -22px; left: 0; right: 0; text-align: center; font-size: 11px; color: #888; font-weight: 600; }
    .week-bar-value { position: absolute; top: -20px; left: 0; right: 0; text-align: center; font-size: 12px; color: #1a1a1a; font-weight: 700; }

    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
    th { background: #f5f5f5; padding: 10px 12px; text-align: right; font-weight: 700; color: #555; font-size: 12px; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:last-child td { border-bottom: none; }

    .invoices-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .inv-box { padding: 16px; border-radius: 12px; }
    .inv-box.paid    { background: #dcfce7; border: 1px solid #86efac; }
    .inv-box.pending { background: #fef9c3; border: 1px solid #fde047; }
    .inv-box.overdue { background: #fee2e2; border: 1px solid #fca5a5; }
    .inv-label { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
    .inv-value { font-size: 20px; font-weight: 900; }

    .alert { background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin: 20px 0; display: flex; gap: 10px; align-items: center; font-size: 13px; color: #92400e; }

    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }

    @media print {
      body { padding: 20px; }
      @page { margin: 12mm; size: A4; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <!-- ═══ صفحة الغلاف ═══ -->
  <div class="cover">
    <div class="cover-brand">
      ${logo ? `<img src="${h(logo)}" style="width:72px;height:72px;border-radius:18px;object-fit:cover;">` : `<div class="logo-circle">${h(brokerName.charAt(0))}</div>`}
      <div style="text-align:right;">
        <div style="font-size:22px;font-weight:800;">${h(brokerName)}</div>
        ${falLicense ? `<div style="font-size:13px;color:#888;margin-top:4px;">رخصة فال: ${h(falLicense)}</div>` : ""}
      </div>
    </div>
    <div class="sub">التقرير الشهري</div>
    <div class="month">${h(monthLabel)}</div>
    <h1>أداء الأعمال</h1>
    <div class="meta">صدر في ${h(generatedAt)}</div>
  </div>

  <!-- ═══ الإحصائيات الرئيسية ═══ -->
  <h2>نظرة عامة</h2>
  <div class="stats-grid">
    <div class="stat">
      <div class="stat-label">عقارات جديدة</div>
      <div class="stat-value gold">${propsAdded}</div>
      <div class="stat-sub">من ${propsTotal} إجمالي</div>
    </div>
    <div class="stat">
      <div class="stat-label">عملاء جدد</div>
      <div class="stat-value gold">${clientsAdded}</div>
      <div class="stat-sub">من ${clientsTotal} إجمالي</div>
    </div>
    <div class="stat">
      <div class="stat-label">صفقات جديدة</div>
      <div class="stat-value">${dealsCount}</div>
      <div class="stat-sub">في ${h(monthLabel)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">صفقات مُغلقة</div>
      <div class="stat-value green">${dealsClosed.length}</div>
      <div class="stat-sub">بنجاح هذا الشهر</div>
    </div>
  </div>

  <!-- ═══ الإيرادات ═══ -->
  <h2>الإيرادات والعمولات</h2>
  <div class="revenue-box">
    <div>
      <div class="label">إجمالي الإيرادات المحصّلة (فواتير مدفوعة)</div>
      <div class="value">${money(paidRevenue)} ر.س</div>
      <div class="note">شاملة ضريبة القيمة المضافة</div>
    </div>
    <div style="text-align:left;">
      <div class="label">العمولات المتوقّعة من الصفقات المُغلقة</div>
      <div class="value" style="font-size:24px;">${money(closedRevenue)} ر.س</div>
    </div>
  </div>

  <div class="invoices-grid">
    <div class="inv-box paid">
      <div class="inv-label" style="color:#166534;">محصّلة هذا الشهر</div>
      <div class="inv-value" style="color:#166534;">${money(paidRevenue)} ر.س</div>
    </div>
    <div class="inv-box pending">
      <div class="inv-label" style="color:#854d0e;">معلّقة (غير مستحقة بعد)</div>
      <div class="inv-value" style="color:#854d0e;">${money(pendingAmount)} ر.س</div>
    </div>
    <div class="inv-box overdue">
      <div class="inv-label" style="color:#991b1b;">متأخّرة (تتطلّب متابعة)</div>
      <div class="inv-value" style="color:#991b1b;">${money(overdueAmount)} ر.س</div>
    </div>
  </div>

  <!-- ═══ النشاط الأسبوعي ═══ -->
  <h2>توزيع النشاط خلال الشهر</h2>
  <h3>عقارات مُضافة حسب الأسبوع</h3>
  <div class="week-chart">
    ${weeklyBins.map((v, i) => `
      <div class="week-bar" style="height:${(v / maxWeek) * 100}%;">
        <div class="week-bar-value">${v}</div>
        <div class="week-bar-label">الأسبوع ${i + 1}</div>
      </div>
    `).join("")}
  </div>
  <div style="height:30px;"></div>

  <!-- ═══ أفضل العقارات ═══ -->
  ${topProps.length > 0 ? `
  <h2>آخر العقارات المنشورة</h2>
  <table>
    <thead>
      <tr>
        <th>العقار</th>
        <th>المدينة / الحي</th>
        <th style="text-align:left;">السعر</th>
      </tr>
    </thead>
    <tbody>
      ${topProps.map((p: any) => `
        <tr>
          <td style="font-weight:700;">${h(p.title)}</td>
          <td>${h(p.city || "—")} — ${h(p.district || "—")}</td>
          <td style="text-align:left;font-weight:700;color:#C6914C;">${money(p.price)} ر.س</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}

  <!-- ═══ تحذيرات ═══ -->
  ${staleCount > 0 ? `
  <div class="alert">
    ⚠️ <strong>${staleCount}</strong> عقار لم يتحدّث منذ أكثر من 30 يوماً — راجع إتاحتها قريباً.
  </div>
  ` : ""}

  ${overdueAmount > 0 ? `
  <div class="alert" style="background:#fee2e2;border-color:#fca5a5;color:#991b1b;">
    💰 لديك <strong>${money(overdueAmount)} ر.س</strong> في فواتير متأخّرة — تواصل مع العملاء لتحصيلها.
  </div>
  ` : ""}

  <div class="footer">
    تقرير شهري مُولَّد آلياً بواسطة وسيط برو — ${h(generatedAt)}
  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 600);</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
