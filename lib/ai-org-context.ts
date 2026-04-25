// ══════════════════════════════════════════════════════════════
// lib/ai-org-context.ts — محرّك التوجيهات والمعرفة
//
// الفلسفة:
//   كل استدعاء AI من cron أو webhook لا يستخدم system prompt جامد.
//   بدلاً من ذلك يبني الـ prompt ديناميكياً من:
//     1. هوية الوسيط (broker_identity)
//     2. توجيهات المدير (الموروثة للموظف)
//     3. توجيهات الموظف (custom + suggestions معتمَدة)
//     4. قاعدة معرفة المدير + الموظف
//
// النتيجة: كل وسيط يحصل على AI يتبع توجيهاته الخاصة بدون deploy.
// ══════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/lib/ai-call";

interface DirectiveRow {
  title: string;
  content: string;
  source: string;
}

interface KBRow {
  title: string;
  content: string;
  category: string;
}

interface BrokerIdentity {
  broker_name?: string;
  specialization?: string;
  writing_tone?: string;
  coverage_areas?: string | string[];
  brand_keywords?: string | string[];
  avoid_phrases?: string | string[];
}

export interface OrgContext {
  manager: {
    id: string;
    code: string;
    name: string;
    description: string;
    ai_provider: AIProvider;
    ai_model: string;
  };
  employee: {
    id: string;
    code: string;
    name: string;
    description: string;
    ai_provider: AIProvider;
    ai_model: string;
  };
  systemPrompt: string;       // الـ prompt الجاهز للحقن
  directiveCount: number;
  kbCount: number;
}

/**
 * يبني context كامل لموظف معيَّن في tenant معيَّن.
 * يُستدعى من cron/webhook قبل كل استدعاء AI.
 *
 * @param tenantId — المستأجر
 * @param employeeCode — code الموظف (whatsapp_qualifier, content_creator, ...)
 */
export async function buildEmployeeContext(
  tenantId: string,
  employeeCode: string
): Promise<OrgContext | null> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ١) جلب الموظف ومديره
  const { data: emp } = await admin
    .from("ai_employees")
    .select("id, code, name, description, manager_id, default_ai_provider, default_ai_model")
    .eq("code", employeeCode)
    .eq("is_active", true)
    .single();
  if (!emp) return null;

  const { data: mgr } = await admin
    .from("ai_managers")
    .select("id, code, name, description, default_ai_provider, default_ai_model")
    .eq("id", emp.manager_id)
    .single();
  if (!mgr) return null;

  // ٢) tenant overrides (provider/model)
  const [{ data: empOverride }, { data: mgrOverride }] = await Promise.all([
    admin.from("tenant_ai_config")
      .select("ai_provider_override, ai_model_override, is_enabled")
      .eq("tenant_id", tenantId).eq("target_kind", "employee").eq("target_id", emp.id)
      .maybeSingle(),
    admin.from("tenant_ai_config")
      .select("ai_provider_override, ai_model_override, is_enabled")
      .eq("tenant_id", tenantId).eq("target_kind", "manager").eq("target_id", mgr.id)
      .maybeSingle(),
  ]);

  // إذا الموظف أو مديره معطّل → null
  if (empOverride && empOverride.is_enabled === false) return null;
  if (mgrOverride && mgrOverride.is_enabled === false) return null;

  const empProvider = (empOverride?.ai_provider_override || emp.default_ai_provider) as AIProvider;
  const empModel = empOverride?.ai_model_override || emp.default_ai_model;
  const mgrProvider = (mgrOverride?.ai_provider_override || mgr.default_ai_provider) as AIProvider;
  const mgrModel = mgrOverride?.ai_model_override || mgr.default_ai_model;

  // ٣) هوية الوسيط
  const { data: identityData } = await admin
    .from("broker_identity")
    .select("broker_name, specialization, writing_tone, coverage_areas, brand_keywords, avoid_phrases")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const identity = (identityData || {}) as BrokerIdentity;

  // ٤) توجيهات المدير (active فقط — هذي الموروثة)
  const { data: mgrDirectives } = await admin
    .from("directives")
    .select("title, content, source")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "manager")
    .eq("target_id", mgr.id)
    .eq("status", "active")
    .order("display_order");

  // ٥) توجيهات الموظف (active فقط — custom + accepted suggestions)
  const { data: empDirectives } = await admin
    .from("directives")
    .select("title, content, source")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "employee")
    .eq("target_id", emp.id)
    .eq("status", "active")
    .order("display_order");

  // ٦) KB المدير (للسياق الأوسع)
  const { data: mgrKB } = await admin
    .from("knowledge_base")
    .select("title, content, category")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "manager")
    .eq("target_id", mgr.id)
    .eq("is_active", true)
    .limit(20); // حدّ أعلى لتجنّب tokens زائدة

  // ٧) KB الموظف
  const { data: empKB } = await admin
    .from("knowledge_base")
    .select("title, content, category")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "employee")
    .eq("target_id", emp.id)
    .eq("is_active", true)
    .limit(15);

  // ─────────────────────────────────────────────────────────────
  // بناء System Prompt
  // ─────────────────────────────────────────────────────────────
  const sections: string[] = [];

  // ── دور الموظف ──
  sections.push(`أنت ${emp.name} في شركة عقارية سعودية.\nدورك: ${emp.description}`);

  // ── المدير المسؤول ──
  sections.push(`\nترفع تقارير لـ ${mgr.name}.\n${mgr.description}`);

  // ── هوية العلامة ──
  const identityParts: string[] = [];
  if (identity.broker_name) identityParts.push(`اسم الوسيط: ${identity.broker_name}`);
  if (identity.specialization) identityParts.push(`التخصص: ${identity.specialization}`);
  if (identity.coverage_areas) {
    const areas = Array.isArray(identity.coverage_areas) ? identity.coverage_areas.join(", ") : identity.coverage_areas;
    identityParts.push(`نطاق التغطية: ${areas}`);
  }
  if (identity.writing_tone) identityParts.push(`نبرة الكتابة: ${identity.writing_tone}`);
  if (identity.brand_keywords) {
    const kw = Array.isArray(identity.brand_keywords) ? identity.brand_keywords.join(", ") : identity.brand_keywords;
    identityParts.push(`كلمات مفتاحية للعلامة: ${kw}`);
  }
  if (identity.avoid_phrases) {
    const av = Array.isArray(identity.avoid_phrases) ? identity.avoid_phrases.join(", ") : identity.avoid_phrases;
    identityParts.push(`عبارات يُمنع استخدامها: ${av}`);
  }
  if (identityParts.length > 0) {
    sections.push(`\n=== هوية العلامة ===\n${identityParts.join("\n")}`);
  }

  // ── توجيهات المدير (الموروثة) ──
  const mgrDirArr = (mgrDirectives || []) as DirectiveRow[];
  if (mgrDirArr.length > 0) {
    sections.push(`\n=== التوجيهات الاستراتيجية من ${mgr.name} ===\n${
      mgrDirArr.map((d, i) => `${i + 1}. ${d.title}\n   ${d.content}`).join("\n\n")
    }`);
  }

  // ── توجيهات الموظف ──
  const empDirArr = (empDirectives || []) as DirectiveRow[];
  if (empDirArr.length > 0) {
    sections.push(`\n=== توجيهاتك التشغيلية المخصّصة ===\n${
      empDirArr.map((d, i) => `${i + 1}. ${d.title}\n   ${d.content}`).join("\n\n")
    }`);
  }

  // ── قاعدة معرفة المدير ──
  const mgrKBArr = (mgrKB || []) as KBRow[];
  if (mgrKBArr.length > 0) {
    sections.push(`\n=== قاعدة معرفة القسم ===\n${
      mgrKBArr.map(k => `[${k.category}] ${k.title}: ${k.content}`).join("\n\n")
    }`);
  }

  // ── قاعدة معرفة الموظف ──
  const empKBArr = (empKB || []) as KBRow[];
  if (empKBArr.length > 0) {
    sections.push(`\n=== قاعدة معرفتك الخاصة ===\n${
      empKBArr.map(k => `[${k.category}] ${k.title}: ${k.content}`).join("\n\n")
    }`);
  }

  // ── قواعد عامة ──
  sections.push(`\n=== قواعد عامة ===
- لا تخترع معلومات غير مذكورة في السياق أعلاه
- إذا لم تعرف شيئاً، قل بصراحة "أحتاج توجيه من المدير"
- التزم بنبرة الكتابة المحدّدة
- اللغة العربية الفصحى دائماً (ما لم يُذكر خلاف)
- التزم بأنظمة الهيئة العامة للعقار السعودية (REGA)`);

  return {
    manager: {
      id: mgr.id, code: mgr.code, name: mgr.name, description: mgr.description,
      ai_provider: mgrProvider, ai_model: mgrModel,
    },
    employee: {
      id: emp.id, code: emp.code, name: emp.name, description: emp.description,
      ai_provider: empProvider, ai_model: empModel,
    },
    systemPrompt: sections.join("\n"),
    directiveCount: mgrDirArr.length + empDirArr.length,
    kbCount: mgrKBArr.length + empKBArr.length,
  };
}

/**
 * سجّل نشاط الموظف في org_activity_log
 */
export async function logEmployeeActivity(opts: {
  tenantId: string;
  employeeId: string;
  action: string;
  targetKind?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await admin.from("org_activity_log").insert({
    tenant_id: opts.tenantId,
    actor_kind: "employee",
    actor_id: opts.employeeId,
    action: opts.action,
    target_kind: opts.targetKind,
    target_id: opts.targetId,
    details: opts.details || {},
  });
}

/**
 * صعّد قراراً للـ CEO
 */
export async function escalateToCEO(opts: {
  tenantId: string;
  raisedByKind: "manager" | "employee";
  raisedById: string;
  severity: "info" | "warning" | "critical";
  type: string;
  title: string;
  description: string;
  payload?: Record<string, unknown>;
  actionRequired?: string;
}): Promise<void> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await admin.from("org_escalations").insert({
    tenant_id: opts.tenantId,
    raised_by_kind: opts.raisedByKind,
    raised_by_id: opts.raisedById,
    severity: opts.severity,
    type: opts.type,
    title: opts.title,
    description: opts.description,
    payload: opts.payload || {},
    action_required: opts.actionRequired,
    status: "pending",
  });
}
