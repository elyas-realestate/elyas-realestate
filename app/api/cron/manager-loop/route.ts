import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateJSON, type AIProvider } from "@/lib/ai-call";

// ══════════════════════════════════════════════════════════════
// /api/cron/manager-loop — التعلّم التنظيمي اليومي (K-8)
//
// لكل مستأجر مفعَّل:
//   لكل مدير من الـ ٥:
//     1. اقرأ نشاط موظفيه آخر ٢٤ ساعة من org_activity_log
//     2. اقرأ التصعيدات الجديدة من فريقه
//     3. اقرأ توجيهاته الحالية
//     4. ولِّد مراجعة يومية:
//        - summary (٣-٥ جمل)
//        - highlights (إنجازات)
//        - concerns (مخاوف، severity)
//        - suggestions (توجيهات جديدة لموظفيه — تُحفظ بـ status='pending')
//     5. احفظ في manager_reviews
//     6. لو severity='critical' في concerns → escalate للـ CEO
// ══════════════════════════════════════════════════════════════

interface ManagerRow {
  id: string;
  code: string;
  name: string;
  description: string;
  default_ai_provider: string;
  default_ai_model: string;
}

interface EmployeeRow {
  id: string;
  code: string;
  name: string;
}

interface TenantRow {
  id: string;
  is_active: boolean;
}

interface ReviewOutput {
  summary: string;
  highlights?: { title: string; detail: string }[];
  concerns?: { title: string; severity: "info" | "warning" | "critical"; detail: string }[];
  suggestions?: { employee_code: string; title: string; content: string }[];
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

  // 1) كل المستأجرين النشطين
  const { data: tenants, error: tErr } = await admin
    .from("tenants")
    .select("id, is_active")
    .eq("is_active", true);
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const activeTenants = (tenants || []) as TenantRow[];
  const results: Array<{ tenant_id: string; managers_processed: number; reviews_created: number; suggestions_created: number; errors: string[] }> = [];

  // 2) كل المدراء النشطين
  const { data: mgrList } = await admin
    .from("ai_managers")
    .select("id, code, name, description, default_ai_provider, default_ai_model")
    .eq("is_active", true)
    .order("display_order");
  const managers = (mgrList || []) as ManagerRow[];

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 3600_000);
  const periodStart = dayAgo.toISOString();
  const periodEnd = now.toISOString();

  for (const t of activeTenants) {
    let managersProcessed = 0;
    let reviewsCreated = 0;
    let suggestionsCreated = 0;
    const errors: string[] = [];

    for (const mgr of managers) {
      try {
        // tenant override للمدير (provider/model)
        const { data: mgrCfg } = await admin
          .from("tenant_ai_config")
          .select("ai_provider_override, ai_model_override, is_enabled")
          .eq("tenant_id", t.id).eq("target_kind", "manager").eq("target_id", mgr.id)
          .maybeSingle();

        if (mgrCfg && mgrCfg.is_enabled === false) continue;

        const provider = (mgrCfg?.ai_provider_override || mgr.default_ai_provider) as AIProvider;
        const model = mgrCfg?.ai_model_override || mgr.default_ai_model;

        // موظفو هذا المدير
        const { data: empList } = await admin
          .from("ai_employees")
          .select("id, code, name")
          .eq("manager_id", mgr.id)
          .eq("is_active", true);
        const employees = (empList || []) as EmployeeRow[];
        if (employees.length === 0) continue;

        const empIds = employees.map(e => e.id);
        const empById = new Map(employees.map(e => [e.id, e]));
        const empByCode = new Map(employees.map(e => [e.code, e]));

        // نشاط الفريق آخر ٢٤ ساعة
        const { data: actsRaw } = await admin
          .from("org_activity_log")
          .select("actor_id, action, details, created_at")
          .eq("tenant_id", t.id)
          .eq("actor_kind", "employee")
          .in("actor_id", empIds)
          .gte("created_at", periodStart)
          .order("created_at", { ascending: false })
          .limit(200);
        const activities = actsRaw || [];

        // التصعيدات من الفريق آخر ٢٤ ساعة
        const { data: escsRaw } = await admin
          .from("org_escalations")
          .select("severity, type, title, description, status, raised_by_id, created_at")
          .eq("tenant_id", t.id)
          .eq("raised_by_kind", "employee")
          .in("raised_by_id", empIds)
          .gte("created_at", periodStart)
          .order("created_at", { ascending: false });
        const escalations = escsRaw || [];

        // توجيهات المدير + توجيهات الموظفين النشطة (للسياق)
        const { data: mgrDirRaw } = await admin
          .from("directives")
          .select("title, content")
          .eq("tenant_id", t.id)
          .eq("target_kind", "manager")
          .eq("target_id", mgr.id)
          .eq("status", "active")
          .order("display_order");
        const mgrDirectives = mgrDirRaw || [];

        const { data: empDirRaw } = await admin
          .from("directives")
          .select("title, content, target_id")
          .eq("tenant_id", t.id)
          .eq("target_kind", "employee")
          .in("target_id", empIds)
          .eq("status", "active")
          .order("display_order");
        const empDirectives = empDirRaw || [];

        // ملخّص الإحصاءات للحقن في الـ prompt
        const actionCounts: Record<string, number> = {};
        const perEmployee: Record<string, { name: string; activity: number; risky: number }> = {};
        for (const e of employees) {
          perEmployee[e.id] = { name: e.name, activity: 0, risky: 0 };
        }
        for (const a of activities) {
          actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
          if (perEmployee[a.actor_id]) {
            perEmployee[a.actor_id].activity++;
            if (a.action === "approval_required_whatsapp" || a.action.includes("approval_required")) {
              perEmployee[a.actor_id].risky++;
            }
          }
        }
        const escSeverity: { info: number; warning: number; critical: number } = { info: 0, warning: 0, critical: 0 };
        for (const e of escalations) {
          const sev = e.severity as "info" | "warning" | "critical" | string;
          if (sev === "info" || sev === "warning" || sev === "critical") {
            escSeverity[sev]++;
          }
        }

        const metrics = {
          activities_count: activities.length,
          escalations_count: escalations.length,
          escalations_by_severity: escSeverity,
          actions_breakdown: actionCounts,
          employees_summary: Object.fromEntries(Object.entries(perEmployee).map(([, v]) => [v.name, v])),
        };

        // إذا ما في نشاط، نحفظ مراجعة فاضية مختصرة
        if (activities.length === 0 && escalations.length === 0) {
          await admin.from("manager_reviews").insert({
            tenant_id: t.id,
            manager_id: mgr.id,
            period_start: periodStart,
            period_end: periodEnd,
            summary: "لا يوجد نشاط مسجَّل للفريق خلال آخر ٢٤ ساعة.",
            highlights: [],
            concerns: [],
            metrics,
            suggestions_count: 0,
            generated_by_model: `${provider}:${model}`,
          });
          reviewsCreated++;
          managersProcessed++;
          continue;
        }

        // بناء userPrompt للمدير
        const empListText = employees.map(e => `- ${e.name} (${e.code})`).join("\n");

        const activitiesSnippet = activities.slice(0, 30).map(a => {
          const empName = empById.get(a.actor_id)?.name || a.actor_id;
          return `- [${empName}] ${a.action}${a.details ? ` :: ${JSON.stringify(a.details).slice(0, 200)}` : ""}`;
        }).join("\n");

        const escSnippet = escalations.slice(0, 15).map(e => {
          const empName = empById.get(e.raised_by_id)?.name || "?";
          return `- [${e.severity}] ${empName}: ${e.title} (${e.status})`;
        }).join("\n") || "(لا توجد تصعيدات)";

        const mgrDirText = mgrDirectives.length > 0
          ? mgrDirectives.map((d, i) => `${i + 1}. ${d.title}: ${d.content.slice(0, 200)}`).join("\n")
          : "(لا توجد توجيهات حالية)";

        const empDirCount = empDirectives.length;

        const systemPrompt = `أنت ${mgr.name} في شركة عقارية سعودية.
${mgr.description}

دورك الآن: مراجعة يومية لفريقك. حلّل النشاط، اكتشف الأنماط، اقترح تحسينات.
كن دقيقاً، عملياً، ومركزاً على ما يجعل الفريق أفضل غداً.`;

        const userPrompt = `=== فريقك ===
${empListText}

=== توجيهاتك الاستراتيجية الحالية ===
${mgrDirText}

=== توجيهات تشغيلية نشطة على الفريق ===
عدد التوجيهات: ${empDirCount}

=== نشاط الفريق آخر ٢٤ ساعة (${activities.length} حدث) ===
${activitiesSnippet}

=== تصعيدات (${escalations.length}) ===
${escSnippet}

=== إحصاءات ===
- إجراءات حسب النوع: ${JSON.stringify(actionCounts)}
- تصعيدات حسب الخطورة: ${JSON.stringify(escSeverity)}

=== المطلوب ===
أعطني JSON بالشكل التالي بالضبط:
{
  "summary": "ملخّص ٣-٥ جمل عربية فصيحة عن أداء الفريق اليوم",
  "highlights": [
    {"title": "عنوان قصير", "detail": "تفاصيل في جملة"}
  ],
  "concerns": [
    {"title": "عنوان", "severity": "info|warning|critical", "detail": "تفاصيل"}
  ],
  "suggestions": [
    {"employee_code": "code من قائمة الفريق أعلاه", "title": "عنوان توجيه جديد مقترح", "content": "محتوى التوجيه — ٢-٤ جمل عملية تخبر الموظف ماذا يفعل أو يتجنّب"}
  ]
}

قواعد:
- summary إلزامي، باقي الحقول قد تكون فارغة [].
- highlights: ٠-٣ عناصر للأمور الإيجابية المهمة.
- concerns: ٠-٣ عناصر — استخدم "critical" فقط للأنماط التي تهدد الأعمال أو تحتاج تدخّل CEO فوراً.
- suggestions: ٠-٤ توجيهات تشغيلية ملموسة. لا تكرر توجيهات موجودة. employee_code يجب أن يكون من القائمة أعلاه.
- لا تخترع أرقاماً أو حقائق. اعتمد فقط على ما أُعطي لك.`;

        let review: ReviewOutput | null = null;
        try {
          review = await generateJSON<ReviewOutput>({
            provider,
            model,
            systemPrompt,
            userPrompt,
            temperature: 0.5,
            maxTokens: 1500,
          });
        } catch (e) {
          errors.push(`${mgr.code}: ${e instanceof Error ? e.message : "AI failed"}`);
          continue;
        }

        if (!review || !review.summary) {
          errors.push(`${mgr.code}: invalid AI output`);
          continue;
        }

        // حفظ المراجعة
        const validSuggestions = (review.suggestions || []).filter(s =>
          s.employee_code && empByCode.has(s.employee_code) && s.title && s.content
        );

        const { data: revRow, error: revErr } = await admin
          .from("manager_reviews")
          .insert({
            tenant_id: t.id,
            manager_id: mgr.id,
            period_start: periodStart,
            period_end: periodEnd,
            summary: review.summary,
            highlights: review.highlights || [],
            concerns: review.concerns || [],
            metrics,
            suggestions_count: validSuggestions.length,
            generated_by_model: `${provider}:${model}`,
          })
          .select("id")
          .single();

        if (revErr) {
          errors.push(`${mgr.code}: insert review failed: ${revErr.message}`);
          continue;
        }
        reviewsCreated++;

        // حفظ الاقتراحات كـ directives بحالة pending
        for (const sug of validSuggestions) {
          const targetEmp = empByCode.get(sug.employee_code)!;
          await admin.from("directives").insert({
            tenant_id: t.id,
            target_kind: "employee",
            target_id: targetEmp.id,
            title: sug.title,
            content: sug.content,
            // check constraint: 'custom' | 'inherited' | 'suggested'
            source: "suggested",
            parent_directive_id: null,
            status: "pending",
            display_order: 1000,
          });
          suggestionsCreated++;
        }

        // تصعيد للـ CEO عند concerns حرجة
        const criticalConcerns = (review.concerns || []).filter(c => c.severity === "critical");
        if (criticalConcerns.length > 0) {
          for (const c of criticalConcerns) {
            await admin.from("org_escalations").insert({
              tenant_id: t.id,
              raised_by_kind: "manager",
              raised_by_id: mgr.id,
              severity: "critical",
              type: "manager_review_concern",
              title: c.title,
              description: c.detail,
              payload: { manager_review_id: revRow.id, manager_code: mgr.code },
              action_required: "مراجعة وقرار CEO",
              approval_kind: "info_only",
              status: "pending",
            });
          }
        }

        // تسجيل نشاط المدير
        await admin.from("org_activity_log").insert({
          tenant_id: t.id,
          actor_kind: "manager",
          actor_id: mgr.id,
          action: "manager_review_completed",
          details: {
            review_id: revRow.id,
            activities_analyzed: activities.length,
            escalations_analyzed: escalations.length,
            highlights_count: (review.highlights || []).length,
            concerns_count: (review.concerns || []).length,
            critical_concerns: criticalConcerns.length,
            suggestions_created: validSuggestions.length,
          },
        });

        managersProcessed++;
      } catch (e) {
        errors.push(`${mgr.code}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    } // end managers

    results.push({
      tenant_id: t.id,
      managers_processed: managersProcessed,
      reviews_created: reviewsCreated,
      suggestions_created: suggestionsCreated,
      errors,
    });
  } // end tenants

  return NextResponse.json({
    ran_at: new Date().toISOString(),
    period_start: periodStart,
    period_end: periodEnd,
    tenants_processed: activeTenants.length,
    managers_count: managers.length,
    results,
  });
}
