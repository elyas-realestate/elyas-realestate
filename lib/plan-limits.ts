import { SupabaseClient } from "@supabase/supabase-js";

// ── تعريف حدود الخطط ──────────────────────────────────────
export const PLAN_LIMITS = {
  free:  { properties: 5,   clients: 10, ai_requests: 0,  documents: false },
  basic: { properties: 50,  clients: -1, ai_requests: 50, documents: true  },
  pro:   { properties: -1,  clients: -1, ai_requests: -1, documents: true  },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;
export type ResourceKey = "properties" | "clients" | "ai_requests" | "documents";

// ── جلب خطة المستخدم الحالي ──────────────────────────────
export async function getCurrentPlan(supabase: SupabaseClient): Promise<PlanId> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("plan")
    .limit(1)
    .single();

  // إذا فشل الاستعلام أو عمود plan غير موجود — المالك يحصل على pro
  if (error || !data) return "pro";

  const plan = data.plan as PlanId | undefined;
  return (plan && plan in PLAN_LIMITS) ? plan : "pro";
}

// ── التحقق من حد معين ─────────────────────────────────────
// يُرجع: { allowed: true } أو { allowed: false, reason: "..." }
export async function checkLimit(
  supabase: SupabaseClient,
  resource: ResourceKey
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  const plan    = await getCurrentPlan(supabase);
  const limits  = PLAN_LIMITS[plan];

  // وثائق قانونية
  if (resource === "documents") {
    if (!limits.documents) {
      return { allowed: false, reason: `الوثائق القانونية غير متاحة في الخطة ${PLAN_NAMES[plan]} — يرجى الترقية` };
    }
    return { allowed: true };
  }

  const limit = limits[resource] as number;

  // غير محدود
  if (limit === -1) return { allowed: true };

  // محظور كلياً (ai_requests في الخطة المجانية = 0)
  if (limit === 0) {
    return {
      allowed: false,
      reason: BLOCK_MESSAGES[resource]?.[plan] || `هذه الميزة غير متاحة في الخطة ${PLAN_NAMES[plan]}`,
      current: 0,
      limit: 0,
    };
  }

  // عدّ الموارد الحالية
  const tableMap: Record<string, string> = {
    properties: "properties",
    clients:    "clients",
    ai_requests: "content",
  };

  const table = tableMap[resource];
  if (!table) return { allowed: true };

  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  const current = count || 0;
  if (current >= limit) {
    return {
      allowed: false,
      reason: `وصلت للحد الأقصى (${limit}) في خطتك — يرجى الترقية`,
      current,
      limit,
    };
  }

  return { allowed: true, current, limit };
}

// ── رسائل الحظر المخصصة ──────────────────────────────────
const BLOCK_MESSAGES: Partial<Record<ResourceKey, Partial<Record<PlanId, string>>>> = {
  ai_requests: {
    free: "وكيل المحتوى الذكي غير متاح في الخطة المجانية — يرجى الترقية للخطة الأساسية",
  },
};

// ── أسماء الخطط ───────────────────────────────────────────
export const PLAN_NAMES: Record<PlanId, string> = {
  free:  "المجانية",
  basic: "الأساسية",
  pro:   "الاحترافية",
};
