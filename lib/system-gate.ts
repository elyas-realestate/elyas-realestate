// ══════════════════════════════════════════════════════════════
// lib/system-gate.ts — البوّاب التشغيلي
// يُستدعى من كل cron + webhook + AI tool قبل أي استدعاء AI.
// لو المفتاح الرئيسي مطفّى، أو وصلنا الحد اليومي → يرجع تنبيه ويوقف.
// ══════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { createLogger } from "@/lib/logger";

const log = createLogger({ route: "lib/system-gate" });
export type GateResult =
  | { ok: true; count: number; limit: number }
  | {
      ok: false;
      reason: "tenant_not_found" | "system_paused" | "daily_limit_reached";
      count?: number;
      limit?: number;
    };

let _admin: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _admin;
}

/**
 * يتحقق من حالة النظام قبل أي استدعاء AI.
 * يرجع ok=false مع سبب واضح لو ممنوع.
 */
export async function assertSystemActive(tenantId: string): Promise<GateResult> {
  const { data, error } = await admin().rpc("assert_system_active", { p_tenant_id: tenantId });
  if (error) {
    log.error("[system-gate] assert_system_active error:", error);
    return { ok: false, reason: "tenant_not_found" };
  }
  return data as GateResult;
}

/**
 * يزيد عدّاد الاستدعاءات بعد كل استدعاء AI ناجح.
 * لو وصل الحد، النظام يطفّي نفسه تلقائياً.
 */
export async function incrementCallCount(tenantId: string): Promise<number> {
  const { data, error } = await admin().rpc("increment_ai_call_count", { p_tenant_id: tenantId });
  if (error) {
    log.error("[system-gate] increment_ai_call_count error:", error);
    return -1;
  }
  return Number(data) || 0;
}

/**
 * Helper موحَّد: تحقّق + سجّل + ارجع.
 * - لو ok=false → سجّل skip في org_activity_log وارجع false.
 * - لو ok=true → ارجع true (المتصل يستدعي AI ثم incrementCallCount يدوياً).
 */
export async function gateAndLog(
  tenantId: string,
  actorKind: "manager" | "employee" | "system",
  actorId: string | null,
  action: string
): Promise<GateResult> {
  const gate = await assertSystemActive(tenantId);
  if (!gate.ok) {
    try {
      await admin()
        .from("org_activity_log")
        .insert({
          tenant_id: tenantId,
          actor_kind: actorKind,
          actor_id: actorId,
          action: `${action}_skipped`,
          details: { reason: gate.reason, gated: true },
        });
    } catch (e) {
      log.warn("[system-gate] failed to log skip:", e);
    }
  }
  return gate;
}

/**
 * تقدير تكلفة استدعاء AI (تقريبي بالدولار).
 * يستخدم لعرض cost meter في الـ UI.
 */
export function estimateCallCost(
  provider: string,
  model: string,
  tokensIn = 1000,
  tokensOut = 500
): number {
  // أسعار تقريبية ($/1M tokens) — حدّثها لو تغيّرت
  const rates: Record<string, { in: number; out: number }> = {
    "openai/gpt-4o-mini": { in: 0.15, out: 0.6 },
    "openai/gpt-4o": { in: 2.5, out: 10.0 },
    "anthropic/claude-haiku-4-5-20251001": { in: 1.0, out: 5.0 },
    "anthropic/claude-sonnet-4-5": { in: 3.0, out: 15.0 },
    "google/gemini-2.5-flash": { in: 0.0, out: 0.0 }, // ضمن الـ free tier
    "google/gemini-2.5-pro": { in: 1.25, out: 5.0 },
    "deepseek/deepseek-chat": { in: 0.27, out: 1.1 },
    "groq/llama-3.3-70b-versatile": { in: 0.59, out: 0.79 },
    "xai/grok-3": { in: 5.0, out: 15.0 },
  };
  const key = `${provider}/${model}`;
  const r = rates[key] ||
    rates[`${provider}/${model.split("-").slice(0, 3).join("-")}`] || { in: 0.5, out: 2.0 };
  return (tokensIn * r.in + tokensOut * r.out) / 1_000_000;
}
