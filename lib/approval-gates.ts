// ══════════════════════════════════════════════════════════════
// lib/approval-gates.ts — بوّابات الموافقة على القرارات الحرجة
//
// الفلسفة:
//   كل موظف AI عنده قواعد موافقة (approval_rules) تحدد:
//     - block_actions[]: إجراءات ممنوعة كلياً (يجب موافقة CEO)
//     - require_approval_for[]: تصنيفات تتطلب موافقة
//     - max_amount_sar: حد أقصى للقيمة المالية بدون موافقة
//
//   كل cron/webhook قبل تنفيذ إجراء:
//     1. evaluateApproval(employeeCode, action, context) → verdict
//     2. لو needs_approval → submitForApproval() → ينتظر CEO
//     3. لو allowed → ينفّذ مباشرة
//
//   CEO من /dashboard/ceo/approvals يقرر:
//     - approved → ينفّذ الإجراء
//     - rejected → يُلغى
//     - modified → CEO يكتب تعديل ويُنفّذ
// ══════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

// ───────── أنواع البيانات ─────────

export interface ApprovalRules {
  max_amount_sar?: number;
  block_actions?: string[];
  require_approval_for?: string[];
}

export interface ApprovalContext {
  /** نوع الإجراء (مثال: "send_message", "publish_post", "issue_invoice") */
  action_kind: string;
  /** قيمة مالية مرتبطة بالإجراء (لمقارنتها بـ max_amount_sar) */
  amount_sar?: number;
  /** تصنيفات الإجراء (لمقارنتها بـ require_approval_for / block_actions) */
  tags?: string[];
  /** ملخّص قصير للعرض على CEO */
  summary?: string;
  /** الحمولة الكاملة للإجراء — تُحفظ في pending_action لاسترجاعها بعد الموافقة */
  payload?: Record<string, unknown>;
}

export type ApprovalVerdict =
  | { decision: "allowed"; reason?: string }
  | { decision: "needs_approval"; reason: string; severity: "info" | "warning" | "critical" }
  | { decision: "blocked"; reason: string };

// ───────── دمج القواعد ─────────

/**
 * يدمج قواعد افتراضية للموظف مع overrides المستأجر.
 * tenant overrides تتفوّق دائماً.
 */
export function mergeRules(
  defaults: ApprovalRules | null | undefined,
  overrides: ApprovalRules | null | undefined
): ApprovalRules {
  const d = defaults || {};
  const o = overrides || {};
  return {
    max_amount_sar: o.max_amount_sar !== undefined ? o.max_amount_sar : d.max_amount_sar,
    block_actions: Array.from(new Set([...(d.block_actions || []), ...(o.block_actions || [])])),
    require_approval_for: Array.from(
      new Set([...(d.require_approval_for || []), ...(o.require_approval_for || [])])
    ),
  };
}

// ───────── منطق التقييم ─────────

/**
 * يفحص هل الإجراء يحتاج موافقة قبل التنفيذ
 */
export function evaluate(rules: ApprovalRules, ctx: ApprovalContext): ApprovalVerdict {
  const blockActions = rules.block_actions || [];
  const requireApproval = rules.require_approval_for || [];
  const tags = ctx.tags || [];

  // ١) blocked: action_kind في block_actions أو أحد tags في block_actions
  if (blockActions.includes(ctx.action_kind)) {
    return {
      decision: "needs_approval",
      reason: `الإجراء "${ctx.action_kind}" محجوب بقواعد الموظف، يحتاج إذن CEO`,
      severity: "critical",
    };
  }
  for (const tag of tags) {
    if (blockActions.includes(tag)) {
      return {
        decision: "needs_approval",
        reason: `الإجراء يحتوي تصنيفاً محجوباً: "${tag}"`,
        severity: "critical",
      };
    }
  }

  // ٢) require_approval_for
  for (const tag of tags) {
    if (requireApproval.includes(tag)) {
      return {
        decision: "needs_approval",
        reason: `هذا التصنيف يتطلب موافقة CEO: "${tag}"`,
        severity: "warning",
      };
    }
  }

  // ٣) قيمة مالية تتجاوز الحد
  if (typeof rules.max_amount_sar === "number" && typeof ctx.amount_sar === "number") {
    if (ctx.amount_sar > rules.max_amount_sar) {
      return {
        decision: "needs_approval",
        reason: `القيمة ${ctx.amount_sar.toLocaleString("ar-SA")} ر.س تتجاوز الحد المسموح ${rules.max_amount_sar.toLocaleString("ar-SA")} ر.س`,
        severity: "warning",
      };
    }
  }

  return { decision: "allowed" };
}

// ───────── خوادم Supabase ─────────

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * يجلب القواعد المدمجة (افتراضي + override) لموظف معيَّن
 */
export async function getRulesForEmployee(
  tenantId: string,
  employeeCode: string
): Promise<{ employeeId: string | null; rules: ApprovalRules }> {
  const sb = admin();
  const { data: emp } = await sb
    .from("ai_employees")
    .select("id, code, approval_rules")
    .eq("code", employeeCode)
    .eq("is_active", true)
    .maybeSingle();

  if (!emp) return { employeeId: null, rules: {} };

  const { data: cfg } = await sb
    .from("tenant_ai_config")
    .select("approval_overrides")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "employee")
    .eq("target_id", emp.id)
    .maybeSingle();

  const overrides = (cfg?.approval_overrides || {})[employeeCode] as ApprovalRules | undefined;
  return {
    employeeId: emp.id,
    rules: mergeRules(emp.approval_rules as ApprovalRules, overrides),
  };
}

// ───────── API عالٍ المستوى ─────────

export interface CheckResult {
  allowed: boolean;
  /** إن لم يُسمح: id الـ escalation الذي رُفِع */
  escalationId?: string;
  verdict: ApprovalVerdict;
  rulesApplied: ApprovalRules;
}

/**
 * الواجهة الرئيسية: يفحص + إن احتاج، يقدّم للموافقة تلقائياً
 *
 * مثال:
 *   const r = await checkAndMaybeSubmit({
 *     tenantId, employeeCode: "whatsapp_qualifier",
 *     ctx: { action_kind: "send_message", tags: ["price_quote"], summary: "...", payload: {...} },
 *     escalationTitle: "رد واتساب يحتوي عرض سعر",
 *     escalationDescription: "...",
 *   });
 *   if (!r.allowed) { /* أوقف الإجراء، انتظر القرار *​/ }
 */
export async function checkAndMaybeSubmit(opts: {
  tenantId: string;
  employeeCode: string;
  ctx: ApprovalContext;
  escalationTitle: string;
  escalationDescription: string;
  expiresInMinutes?: number;
}): Promise<CheckResult> {
  const { tenantId, employeeCode, ctx } = opts;
  const { employeeId, rules } = await getRulesForEmployee(tenantId, employeeCode);
  const verdict = evaluate(rules, ctx);

  if (verdict.decision === "allowed") {
    return { allowed: true, verdict, rulesApplied: rules };
  }

  // needs_approval — قدّم للـ CEO
  if (!employeeId) {
    return { allowed: false, verdict, rulesApplied: rules };
  }

  const sb = admin();
  const { data: rpc, error } = await sb.rpc("submit_for_approval", {
    p_tenant_id: tenantId,
    p_employee_id: employeeId,
    p_severity: verdict.decision === "needs_approval" ? verdict.severity : "warning",
    p_type: ctx.action_kind,
    p_title: opts.escalationTitle,
    p_description: opts.escalationDescription,
    p_pending_action: {
      action_kind: ctx.action_kind,
      tags: ctx.tags || [],
      amount_sar: ctx.amount_sar ?? null,
      summary: ctx.summary || "",
      payload: ctx.payload || {},
      verdict_reason: verdict.decision === "needs_approval" ? verdict.reason : undefined,
    },
    p_expires_in_minutes: opts.expiresInMinutes ?? 1440,
  });

  if (error) {
    console.warn("[approval-gates] submit_for_approval failed:", error.message);
    return { allowed: false, verdict, rulesApplied: rules };
  }

  return {
    allowed: false,
    escalationId: typeof rpc === "string" ? rpc : undefined,
    verdict,
    rulesApplied: rules,
  };
}

/**
 * قرار CEO على escalation
 */
export async function decideApproval(opts: {
  escalationId: string;
  decision: "approved" | "rejected" | "modified";
  ceoNote: string;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const sb = admin();
  const { error } = await sb.rpc("decide_approval", {
    p_escalation_id: opts.escalationId,
    p_decision: opts.decision,
    p_ceo_decision: opts.ceoNote,
    p_user_id: opts.userId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * يبني نص يصف قواعد الموافقة — يُحقن في system prompt للموظف
 * حتى يعرف AI الإجراءات التي يجب أن يتجنّبها أو يصعّدها بنفسه.
 */
export function rulesToPromptText(rules: ApprovalRules): string {
  if (
    !rules ||
    (!rules.max_amount_sar &&
      !(rules.block_actions || []).length &&
      !(rules.require_approval_for || []).length)
  ) {
    return "";
  }
  const lines: string[] = ["=== حدود الصلاحية والموافقات ==="];
  if (rules.max_amount_sar !== undefined) {
    lines.push(`- الحد المالي بدون موافقة: ${rules.max_amount_sar.toLocaleString("ar-SA")} ر.س`);
  }
  if ((rules.block_actions || []).length) {
    lines.push(`- إجراءات محجوبة (تتطلب موافقة CEO): ${rules.block_actions!.join("، ")}`);
  }
  if ((rules.require_approval_for || []).length) {
    lines.push(`- مواضيع تتطلب موافقة قبل المتابعة: ${rules.require_approval_for!.join("، ")}`);
  }
  lines.push(
    "- إذا واجهت أي حالة أعلاه: لا تنفّذ الإجراء، رد بأنه قيد المراجعة، وسيُصعَّد للـ CEO تلقائياً."
  );
  return lines.join("\n");
}
