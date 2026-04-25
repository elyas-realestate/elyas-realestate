import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "@/lib/ai-call";
import { buildEmployeeContext, logEmployeeActivity } from "@/lib/ai-org-context";

// ══════════════════════════════════════════════════════════════
// /api/cron/ai-analyst — محلّل البيانات
// يعمل أسبوعياً الأحد الساعة 9 صباحاً
// لكل مستأجر مفعِّل الميزة:
//   1. يحسب مقاييس آخر 7 أيام (عقارات/عملاء/صفقات جديدة، أكثر المدن، أنواع ساخنة)
//   2. يولِّد تقريراً نصياً + توصيات عبر AI
//   3. يحفظ في weekly_insights
// ══════════════════════════════════════════════════════════════

interface TenantSettings {
  tenant_id: string;
  analyst_enabled: boolean;
  ai_provider: string;
  ai_model: string;
  analyst_report_email: string | null;
}

function authOK(req: NextRequest): boolean {
  const hdr = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  return process.env.CRON_SECRET ? hdr === expected : true;
}

function topN<T extends string>(items: (T | null | undefined)[], n: number): Array<{ key: T; count: number }> {
  const map = new Map<T, number>();
  for (const it of items) {
    if (!it) continue;
    map.set(it, (map.get(it) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export async function GET(req: NextRequest) {
  if (!authOK(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: settingsList, error: settingsErr } = await admin
    .from("ai_employee_settings")
    .select("tenant_id, analyst_enabled, ai_provider, ai_model, analyst_report_email")
    .eq("analyst_enabled", true);

  if (settingsErr) return NextResponse.json({ error: settingsErr.message }, { status: 500 });

  const tenants = (settingsList || []) as TenantSettings[];
  const results: Array<{ tenant_id: string; ok: boolean; insight_id?: string; error?: string }> = [];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  const periodStart = weekAgo.toISOString();
  const periodEnd = now.toISOString();

  for (const t of tenants) {
    try {
      // نشاط المستأجر
      const { data: tenantRow } = await admin
        .from("tenants").select("is_active, owner_id, slug").eq("id", t.tenant_id).single();
      if (!tenantRow?.is_active) continue;

      // هوية
      const { data: identity } = await admin
        .from("broker_identity")
        .select("broker_name, specialization, coverage_areas")
        .eq("tenant_id", t.tenant_id)
        .maybeSingle();

      // مقاييس
      const [propsRes, clientsRes, dealsRes, invoicesRes] = await Promise.all([
        admin.from("properties")
          .select("id, city, district, main_category, offer_type, price, created_at, is_published")
          .eq("tenant_id", t.tenant_id).gte("created_at", periodStart),
        admin.from("clients")
          .select("id, category, city, sentiment, created_at")
          .eq("tenant_id", t.tenant_id).gte("created_at", periodStart),
        admin.from("deals")
          .select("id, deal_type, current_stage, target_value, expected_commission, created_at")
          .eq("tenant_id", t.tenant_id).gte("created_at", periodStart),
        admin.from("invoices")
          .select("id, total, status, created_at")
          .eq("tenant_id", t.tenant_id).gte("created_at", periodStart),
      ]);

      const props = propsRes.data || [];
      const clients = clientsRes.data || [];
      const deals = dealsRes.data || [];
      const invoices = invoicesRes.data || [];

      const rawMetrics = {
        new_properties: props.length,
        new_clients: clients.length,
        new_deals: deals.length,
        new_invoices: invoices.length,
        published_properties: props.filter((p: { is_published?: boolean }) => p.is_published).length,
        paid_invoice_total: invoices
          .filter((i: { status?: string }) => i.status === "مدفوعة")
          .reduce((sum: number, i: { total?: number }) => sum + Number(i.total || 0), 0),
        hot_clients: clients.filter((c: { sentiment?: string }) => c.sentiment === "hot").length,
        cold_clients: clients.filter((c: { sentiment?: string }) => c.sentiment === "cold").length,
        top_cities: topN(props.map((p: { city?: string }) => p.city), 5),
        top_districts: topN(props.map((p: { district?: string }) => p.district), 5),
        top_property_types: topN(props.map((p: { main_category?: string }) => p.main_category), 5),
        top_offer_types: topN(props.map((p: { offer_type?: string }) => p.offer_type), 3),
        top_client_categories: topN(clients.map((c: { category?: string }) => c.category), 5),
        expected_commission_total: deals.reduce(
          (sum: number, d: { expected_commission?: number }) => sum + Number(d.expected_commission || 0), 0
        ),
        period_start: periodStart,
        period_end: periodEnd,
      };

      // ✨ بناء context الموظف
      const ctx = await buildEmployeeContext(t.tenant_id, "financial_analyst");
      if (!ctx) continue;

      // الـ system prompt يأتي من ctx، فقط نضيف توجيه التنسيق المطلوب لهذا التقرير
      const taskInstructions = `\n\n=== مهمتك الحالية ===
حلّل مقاييس الأسبوع وأنتج:
1. ملخص تنفيذي واضح (4-6 جمل)
2. توصيات عملية (3-5 نقاط)

التنسيق المطلوب بالضبط:
## الملخص التنفيذي
[4-6 جمل]

## التوصيات العملية
1. [توصية محددة]
2. [توصية محددة]
...`;

      const userPrompt = `مقاييس الأسبوع (${weekAgo.toLocaleDateString("ar-SA")} إلى ${now.toLocaleDateString("ar-SA")}):
${JSON.stringify(rawMetrics, null, 2)}`;

      let reportText = "";
      try {
        reportText = await generateText({
          provider: ctx.employee.ai_provider,
          model: ctx.employee.ai_model,
          systemPrompt: ctx.systemPrompt + taskInstructions,
          userPrompt,
          temperature: 0.6,
          maxTokens: 1500,
        });
      } catch (e) {
        console.warn(`[ai-analyst] generate failed tenant=${t.tenant_id}:`, e);
      }

      // فصل الملخص عن التوصيات
      let summary = reportText;
      let recommendations = "";
      const recMatch = reportText.match(/##\s*التوصيات[^\n]*\n([\s\S]+)$/);
      if (recMatch) {
        recommendations = recMatch[1].trim();
        summary = reportText.slice(0, recMatch.index).replace(/##\s*الملخص[^\n]*\n/, "").trim();
      }

      const emailTo = t.analyst_report_email || null;

      const { data: inserted, error: insErr } = await admin
        .from("weekly_insights")
        .insert({
          tenant_id: t.tenant_id,
          period_start: periodStart,
          period_end: periodEnd,
          raw_metrics: rawMetrics,
          summary_text: summary,
          recommendations,
          email_to: emailTo,
          generated_by_model: `${ctx.employee.ai_provider}:${ctx.employee.ai_model}`,
        })
        .select("id")
        .single();

      // ✨ تسجيل النشاط
      await logEmployeeActivity({
        tenantId: t.tenant_id,
        employeeId: ctx.employee.id,
        action: "generated_weekly_insight",
        details: {
          insight_id: inserted?.id,
          metrics_summary: rawMetrics,
          directives_applied: ctx.directiveCount,
          kb_items_loaded: ctx.kbCount,
        },
      });

      if (insErr) {
        results.push({ tenant_id: t.tenant_id, ok: false, error: insErr.message });
      } else {
        results.push({ tenant_id: t.tenant_id, ok: true, insight_id: inserted.id });
      }
    } catch (e) {
      results.push({
        tenant_id: t.tenant_id, ok: false,
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    ran_at: new Date().toISOString(),
    tenants_processed: tenants.length,
    results,
  });
}
