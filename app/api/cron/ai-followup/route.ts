import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "@/lib/ai-call";
import { buildEmployeeContext, logEmployeeActivity } from "@/lib/ai-org-context";

// ══════════════════════════════════════════════════════════════
// /api/cron/ai-followup — موظف المتابعة
// يعمل يومياً الساعة 6 مساءً
// لكل مستأجر مفعِّل الميزة:
//   1. يبحث عن عملاء sentiment='cold' لم يُلمَسوا منذ N يوم
//      (N = followup_cold_days, default 14)
//   2. يولِّد رسالة WhatsApp مخصَّصة لكل عميل
//   3. يحفظها في followup_queue (حالة pending) لمراجعة الوسيط
// ══════════════════════════════════════════════════════════════

interface TenantSettings {
  tenant_id: string;
  followup_enabled: boolean;
  voice_style: string;
  language: string;
  ai_provider: string;
  ai_model: string;
  followup_cold_days: number;
}

interface Client {
  id: string;
  tenant_id: string;
  full_name: string;
  phone?: string | null;
  category?: string | null;
  city?: string | null;
  district?: string | null;
  notes?: string | null;
  sentiment?: string | null;
  created_at: string;
}

function authOK(req: NextRequest): boolean {
  const hdr = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  return process.env.CRON_SECRET ? hdr === expected : true;
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
    .select("tenant_id, followup_enabled, voice_style, language, ai_provider, ai_model, followup_cold_days")
    .eq("followup_enabled", true);

  if (settingsErr) return NextResponse.json({ error: settingsErr.message }, { status: 500 });

  const tenants = (settingsList || []) as TenantSettings[];
  const results: Array<{ tenant_id: string; ok: boolean; inserted: number; candidates: number; error?: string }> = [];

  for (const t of tenants) {
    try {
      // نشاط المستأجر
      const { data: tenantRow } = await admin
        .from("tenants").select("is_active").eq("id", t.tenant_id).single();
      if (!tenantRow?.is_active) continue;

      // هوية الوسيط
      const { data: identity } = await admin
        .from("broker_identity")
        .select("broker_name, writing_tone, specialization")
        .eq("tenant_id", t.tenant_id)
        .maybeSingle();

      const coldDays = t.followup_cold_days || 14;
      const cutoff = new Date(Date.now() - coldDays * 86400_000).toISOString();

      // العملاء الباردون
      const { data: clients } = await admin
        .from("clients")
        .select("id, tenant_id, full_name, phone, category, city, district, notes, sentiment, created_at")
        .eq("tenant_id", t.tenant_id)
        .eq("sentiment", "cold")
        .lte("created_at", cutoff)
        .limit(30);

      const coldClients = (clients || []) as Client[];

      // تجنّب العملاء الذين لديهم نشاط حديث
      const { data: recentActivity } = await admin
        .from("client_activities")
        .select("client_id")
        .eq("tenant_id", t.tenant_id)
        .gte("created_at", cutoff);

      const recentIds = new Set((recentActivity || []).map((a: { client_id: string }) => a.client_id));
      const candidates = coldClients.filter(c => !recentIds.has(c.id));

      // تجنب التكرار — إذا عنده رسالة pending في آخر 48 ساعة، تخطاه
      const recent48 = new Date(Date.now() - 2 * 86400_000).toISOString();
      const { data: existingQueue } = await admin
        .from("followup_queue")
        .select("client_id")
        .eq("tenant_id", t.tenant_id)
        .gte("created_at", recent48)
        .in("status", ["pending", "sent"]);

      const queuedRecently = new Set((existingQueue || []).map((q: { client_id: string }) => q.client_id));
      const finalList = candidates.filter(c => !queuedRecently.has(c.id));

      if (finalList.length === 0) {
        results.push({ tenant_id: t.tenant_id, ok: true, candidates: candidates.length, inserted: 0 });
        continue;
      }

      // ✨ بناء context الموظف من التوجيهات + KB
      const ctx = await buildEmployeeContext(t.tenant_id, "leasing_agent");
      if (!ctx) continue;

      let insertedForTenant = 0;

      for (const c of finalList.slice(0, 10)) {
        const clientBrief = [
          `العميل: ${c.full_name}`,
          c.category && `التصنيف: ${c.category}`,
          (c.city || c.district) && `الموقع: ${[c.district, c.city].filter(Boolean).join(", ")}`,
          c.notes && `ملاحظات سابقة: ${c.notes.slice(0, 300)}`,
        ].filter(Boolean).join("\n");

        const userPrompt = `${clientBrief}

هذا العميل لم يتواصل معه أحد منذ ${coldDays} يوم. اكتب له رسالة واتساب لفتح باب التواصل.
اعرض عليه إما متابعة بحثه السابق، أو أي عقارات جديدة تناسب نوعه.
ابدأ بالسلام، اختم بدعوة مفتوحة للرد.
أرسل النص النهائي فقط بدون شروحات.`;

        let message: string;
        try {
          message = await generateText({
            provider: ctx.employee.ai_provider,
            model: ctx.employee.ai_model,
            systemPrompt: ctx.systemPrompt,
            userPrompt,
            temperature: 0.8,
            maxTokens: 400,
          });
        } catch (e) {
          console.warn(`[ai-followup] generate failed tenant=${t.tenant_id} client=${c.id}:`, e);
          continue;
        }

        if (!message || message.length < 20) continue;

        const { error: insErr } = await admin.from("followup_queue").insert({
          tenant_id: t.tenant_id,
          client_id: c.id,
          channel: "whatsapp",
          message,
          reason: `عميل بارد منذ ${coldDays} يومًا دون نشاط`,
          status: "pending",
          generated_by_model: `${ctx.employee.ai_provider}:${ctx.employee.ai_model}`,
        });

        if (!insErr) insertedForTenant++;
      }

      // ✨ تسجيل النشاط
      await logEmployeeActivity({
        tenantId: t.tenant_id,
        employeeId: ctx.employee.id,
        action: "generated_followup_messages",
        details: {
          candidates: candidates.length,
          inserted: insertedForTenant,
          directives_applied: ctx.directiveCount,
          kb_items_loaded: ctx.kbCount,
        },
      });

      results.push({ tenant_id: t.tenant_id, ok: true, candidates: candidates.length, inserted: insertedForTenant });
    } catch (e) {
      results.push({
        tenant_id: t.tenant_id, ok: false, candidates: 0, inserted: 0,
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
