/**
 * CEO Assistant Tools — K-9 Phase 2
 * أدوات السكرتير الذكي تجلب بيانات حقيقية من DB وترد بنصوص بشرية مختصرة.
 *
 * كل أداة:
 *  - تأخذ tenantId + arguments
 *  - ترجع text قصيرة جاهزة لإرسالها واتساب (٣ أسطر كحد أقصى)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { formatSAR } from "./format";

type Admin = SupabaseClient;

function makeAdmin(): Admin {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ════════════════════════════════════════════════════════════════
// كشف الـ intent من نص الرسالة
// ════════════════════════════════════════════════════════════════

export type ToolIntent =
  | "deals_summary"
  | "clients_summary"
  | "properties_summary"
  | "today_tasks"
  | "property_requests"
  | "daily_summary"
  | "add_task"
  | "none";

export function detectIntent(text: string): ToolIntent {
  const t = text.trim().toLowerCase();

  // كلمات مفتاحية لكل intent
  if (/(صفق|deal|pipeline|مسار|تفاوض|إغلاق)/.test(t)) {
    if (/(كم|عدد|how many|count|إحصائ|status|حالة)/.test(t)) return "deals_summary";
  }
  if (/(عميل|عملاء|client|lead|ساخن|دافئ|بارد)/.test(t)) {
    if (/(كم|عدد|إحصائ|how many|status|حالة)/.test(t)) return "clients_summary";
  }
  if (/(عقار|عقارات|property|properties)/.test(t)) {
    if (/(كم|عدد|إحصائ|how many|status|حالة|منشور|مسودة)/.test(t)) return "properties_summary";
  }
  if (/(مهام|مهمة|task|today|اليوم|todo)/.test(t)) {
    if (/(أضف|إضاف|أنشئ|سجّل|add|create)/.test(t)) return "add_task";
    return "today_tasks";
  }
  if (/(طلبات|طلب عقار|requests|new lead|leads جديد)/.test(t)) return "property_requests";
  if (/(ملخص|summary|تقرير|report|اليوم|الوضع|brief)/.test(t)) return "daily_summary";

  return "none";
}

// ════════════════════════════════════════════════════════════════
// 1) Deals summary — عدد الصفقات حسب المرحلة
// ════════════════════════════════════════════════════════════════

export async function toolDealsSummary(tenantId: string): Promise<string> {
  const admin = makeAdmin();
  const { data, error } = await admin
    .from("deals")
    .select("current_stage, target_value")
    .eq("tenant_id", tenantId);

  if (error) return `تعذّر جلب الصفقات: ${error.message}`;
  if (!data || data.length === 0) return "لا توجد صفقات في الـ pipeline حالياً.";

  const byStage: Record<string, { count: number; value: number }> = {};
  for (const d of data) {
    const s = (d as any).current_stage || "غير محدد";
    if (!byStage[s]) byStage[s] = { count: 0, value: 0 };
    byStage[s].count++;
    byStage[s].value += Number((d as any).target_value || 0);
  }

  const totalValue = Object.values(byStage).reduce((s, v) => s + v.value, 0);
  const lines = [`📊 ${data.length} صفقة، إجمالي ${formatSAR(totalValue, { short: true })}`];
  Object.entries(byStage)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .forEach(([stage, v]) => {
      lines.push(`• ${stage}: ${v.count} صفقة (${formatSAR(v.value, { short: true })})`);
    });

  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════
// 2) Clients summary — عدد العملاء حسب الحرارة
// ════════════════════════════════════════════════════════════════

export async function toolClientsSummary(tenantId: string): Promise<string> {
  const admin = makeAdmin();
  const { data, error } = await admin
    .from("clients")
    .select("sentiment, full_name, created_at")
    .eq("tenant_id", tenantId);

  if (error) return `تعذّر جلب العملاء: ${error.message}`;
  if (!data || data.length === 0) return "لا يوجد عملاء بعد.";

  const counts = { hot: 0, warm: 0, cold: 0, none: 0 };
  for (const c of data) {
    const s = (c as any).sentiment;
    if (s === "hot") counts.hot++;
    else if (s === "warm") counts.warm++;
    else if (s === "cold") counts.cold++;
    else counts.none++;
  }

  const recent = data
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map((c: any) => c.full_name || "بدون اسم")
    .join("، ");

  return [
    `👥 ${data.length} عميل: 🔥${counts.hot} ☀️${counts.warm} ❄️${counts.cold}`,
    recent ? `آخر إضافات: ${recent}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ════════════════════════════════════════════════════════════════
// 3) Properties summary — حالة محفظة العقارات
// ════════════════════════════════════════════════════════════════

export async function toolPropertiesSummary(tenantId: string): Promise<string> {
  const admin = makeAdmin();
  const { data, error } = await admin
    .from("properties")
    .select("is_published, offer_type, price, district")
    .eq("tenant_id", tenantId);

  if (error) return `تعذّر جلب العقارات: ${error.message}`;
  if (!data || data.length === 0) return "لا توجد عقارات في المخزون.";

  const published = data.filter((p: any) => p.is_published).length;
  const drafts = data.length - published;
  const forSale = data.filter((p: any) => p.offer_type === "بيع").length;
  const forRent = data.filter((p: any) => p.offer_type === "إيجار").length;
  const totalValue = data.reduce((s: number, p: any) => s + (Number(p.price) || 0), 0);

  return [
    `🏠 ${data.length} عقار: ${published} منشور، ${drafts} مسودة`,
    `${forSale} للبيع، ${forRent} للإيجار — إجمالي ${formatSAR(totalValue, { short: true })}`,
  ].join("\n");
}

// ════════════════════════════════════════════════════════════════
// 4) Today tasks — مهام اليوم
// ════════════════════════════════════════════════════════════════

export async function toolTodayTasks(tenantId: string): Promise<string> {
  const admin = makeAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await admin
    .from("tasks")
    .select("title, due_date, status, priority")
    .eq("tenant_id", tenantId)
    .gte("due_date", today.toISOString().slice(0, 10))
    .lt("due_date", tomorrow.toISOString().slice(0, 10))
    .order("due_date", { ascending: true })
    .limit(10);

  if (error) return `تعذّر جلب المهام: ${error.message}`;
  if (!data || data.length === 0) return "لا توجد مهام مجدولة اليوم.";

  const lines = [`📅 ${data.length} مهمة اليوم:`];
  data.slice(0, 5).forEach((t: any) => {
    const status =
      t.status === "مكتمل" || t.status === "completed"
        ? "✅"
        : t.priority === "عاجل" || t.priority === "high"
          ? "🔴"
          : "⏳";
    lines.push(`${status} ${t.title}`);
  });

  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════
// 5) Property requests — طلبات عقارية جديدة
// ════════════════════════════════════════════════════════════════

export async function toolPropertyRequests(tenantId: string): Promise<string> {
  const admin = makeAdmin();
  const { data, error } = await admin
    .from("property_requests")
    .select("contact_name, request_type, main_category, district, status, created_at")
    .eq("tenant_id", tenantId)
    .neq("status", "محول")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return `تعذّر جلب الطلبات: ${error.message}`;
  if (!data || data.length === 0) return "لا توجد طلبات عقارية جديدة.";

  const lines = [`📩 ${data.length} طلب عقاري نشط:`];
  data.slice(0, 4).forEach((r: any) => {
    lines.push(
      `• ${r.contact_name || "عميل"} — ${r.request_type || ""} ${r.main_category || ""}${r.district ? " في " + r.district : ""}`
    );
  });

  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════
// 6) Daily summary — ملخص شامل
// ════════════════════════════════════════════════════════════════

export async function toolDailySummary(tenantId: string): Promise<string> {
  const admin = makeAdmin();
  const [dealsRes, clientsRes, propsRes, requestsRes] = await Promise.all([
    admin.from("deals").select("id, current_stage", { count: "exact" }).eq("tenant_id", tenantId),
    admin.from("clients").select("id, sentiment", { count: "exact" }).eq("tenant_id", tenantId),
    admin
      .from("properties")
      .select("id, is_published", { count: "exact" })
      .eq("tenant_id", tenantId),
    admin
      .from("property_requests")
      .select("id, status", { count: "exact" })
      .eq("tenant_id", tenantId)
      .neq("status", "محول"),
  ]);

  const deals = dealsRes.data || [];
  const clients = clientsRes.data || [];
  const props = propsRes.data || [];
  const requests = requestsRes.data || [];

  const hotClients = clients.filter((c: any) => c.sentiment === "hot").length;
  const publishedProps = props.filter((p: any) => p.is_published).length;
  const activeDeals = deals.filter(
    (d: any) => d.current_stage !== "ملغاة" && d.current_stage !== "مكتملة"
  ).length;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "☀️ صباح الخير" : h < 17 ? "🌤️ مساء الخير" : "🌙 مساء الخير";
  })();

  return [
    `${greeting} أستاذ إلياس، ملخّص اليوم:`,
    `🏠 ${publishedProps}/${props.length} عقار منشور`,
    `💼 ${activeDeals} صفقة نشطة، 🔥 ${hotClients} عميل ساخن`,
    requests.length > 0
      ? `📩 ${requests.length} طلب جديد لم يُحوَّل لصفقة`
      : "📩 لا طلبات جديدة معلّقة",
  ].join("\n");
}

// ════════════════════════════════════════════════════════════════
// 7) Add task — تسجيل مهمة جديدة
// ════════════════════════════════════════════════════════════════

export async function toolAddTask(
  tenantId: string,
  title: string,
  dueAt?: string
): Promise<string> {
  const admin = makeAdmin();
  const due = dueAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const dueDate = due.slice(0, 10); // YYYY-MM-DD

  const { error } = await admin.from("tasks").insert({
    tenant_id: tenantId,
    title: title.slice(0, 200),
    due_date: dueDate,
    status: "جديد",
    priority: "متوسط",
    task_type: "أخرى",
    notes: "أُضيفت عبر السكرتير الذكي (واتساب)",
  } as never);

  if (error) return `تعذّر إضافة المهمة: ${error.message}`;
  return `✅ سجّلت المهمة: "${title.slice(0, 60)}" — موعدها ${new Date(due).toLocaleDateString("en-US")}`;
}

// ════════════════════════════════════════════════════════════════
// Router الموحَّد — يستدعى من webhook
// ════════════════════════════════════════════════════════════════

export async function executeIntent(
  intent: ToolIntent,
  tenantId: string,
  text: string
): Promise<string | null> {
  switch (intent) {
    case "deals_summary":
      return toolDealsSummary(tenantId);
    case "clients_summary":
      return toolClientsSummary(tenantId);
    case "properties_summary":
      return toolPropertiesSummary(tenantId);
    case "today_tasks":
      return toolTodayTasks(tenantId);
    case "property_requests":
      return toolPropertyRequests(tenantId);
    case "daily_summary":
      return toolDailySummary(tenantId);
    case "add_task": {
      // استخراج العنوان من النص: "أضف مهمة: عنوان المهمة"
      const m = text.match(/(?:أضف|إضاف|أنشئ|سجّل|add|create)\s*(?:مهمة|task)?\s*[:\-،,]?\s*(.+)/i);
      const title = m?.[1]?.trim() || text.replace(/(?:أضف|إضاف|أنشئ|سجّل|مهمة|task)/gi, "").trim();
      if (!title || title.length < 3)
        return "صيغة غير واضحة. مثال: 'أضف مهمة: زيارة فيلا النرجس غداً ٤م'";
      return toolAddTask(tenantId, title);
    }
    case "none":
      return null;
  }
}
