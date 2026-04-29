import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateJSON, type AIProvider } from "@/lib/ai-call";
import { getAdminClient, MissingServerEnvError, checkServerEnv } from "@/lib/supabase-admin";

// لا نريد timeout قصير — هذا cold AI invocation × N employees
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════
// /api/org/suggest-directives
// محرّك الاقتراحات: يحوّل استراتيجية المدير إلى توجيهات تشغيلية للموظفين
//
// Body: { manager_id: uuid, employee_ids?: uuid[], replace_existing?: boolean }
// ══════════════════════════════════════════════════════════════

interface SuggestionItem {
  title: string;
  content: string;
}

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
  description: string;
  manager_id: string;
}

export async function POST(req: NextRequest) {
  try {
    return await handleSuggest(req);
  } catch (e) {
    if (e instanceof MissingServerEnvError) {
      console.error("[suggest-directives] env missing:", e.message);
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع في توليد الاقتراحات";
    console.error("[suggest-directives] uncaught:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function handleSuggest(req: NextRequest) {
  // ── فحص env vars مبكراً ──
  const envCheck = checkServerEnv();
  if (!envCheck.ok) {
    return NextResponse.json({
      error: `متغيرات بيئة الخادم ناقصة: ${envCheck.missing.join(", ")}. أضفها في إعدادات Vercel ثم أعد المحاولة.`,
    }, { status: 503 });
  }

  // ── Auth ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // ── tenant_id ──
  const { data: t } = await supabase.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
  let tenantId = t?.id;
  if (!tenantId) {
    const { data: m } = await supabase
      .from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("status", "active").maybeSingle();
    tenantId = m?.tenant_id;
  }
  if (!tenantId) return NextResponse.json({ error: "لم يُعثر على المستأجر" }, { status: 400 });

  // ── body ──
  let body: { manager_id?: string; employee_ids?: string[]; replace_existing?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }
  const managerId = body.manager_id;
  if (!managerId) return NextResponse.json({ error: "manager_id مطلوب" }, { status: 400 });

  // ── service-role client للقراءة الواسعة ──
  const admin = getAdminClient();

  // ── معلومات المدير ──
  const { data: managerData, error: mErr } = await admin
    .from("ai_managers").select("*").eq("id", managerId).single();
  if (mErr || !managerData) return NextResponse.json({ error: "المدير غير موجود" }, { status: 404 });
  const manager = managerData as ManagerRow;

  // ── توجيهات المدير النشطة ──
  const { data: mgrDirectives } = await admin
    .from("directives")
    .select("title, content")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "manager")
    .eq("target_id", managerId)
    .eq("status", "active")
    .order("display_order");

  if (!mgrDirectives || mgrDirectives.length === 0) {
    return NextResponse.json({
      error: "لا توجد توجيهات للمدير. أضف توجيهات أولاً قبل توليد الاقتراحات."
    }, { status: 400 });
  }

  // ── KB المدير ──
  const { data: mgrKB } = await admin
    .from("knowledge_base")
    .select("title, content, category")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "manager")
    .eq("target_id", managerId)
    .eq("is_active", true);

  // ── هوية الوسيط ──
  const { data: identity } = await admin
    .from("broker_identity")
    .select("broker_name, specialization, writing_tone, coverage_areas")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  // ── الموظفون المستهدفون ──
  let employeesQuery = admin
    .from("ai_employees")
    .select("id, code, name, description, manager_id")
    .eq("manager_id", managerId)
    .eq("is_active", true);
  if (body.employee_ids && body.employee_ids.length > 0) {
    employeesQuery = employeesQuery.in("id", body.employee_ids);
  }
  const { data: employees } = await employeesQuery;
  if (!employees || employees.length === 0) {
    return NextResponse.json({ error: "لا يوجد موظفون تحت هذا المدير" }, { status: 400 });
  }

  // ── إعدادات provider للمدير ──
  const { data: tenantConfig } = await admin
    .from("tenant_ai_config")
    .select("ai_provider_override, ai_model_override")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "manager")
    .eq("target_id", managerId)
    .maybeSingle();

  const provider = (tenantConfig?.ai_provider_override || manager.default_ai_provider) as AIProvider;
  const model = tenantConfig?.ai_model_override || manager.default_ai_model;

  // ─────────────────────────────────────────────────────────────
  // Generate suggestions per employee
  // ─────────────────────────────────────────────────────────────
  const results: Array<{
    employee_id: string;
    employee_name: string;
    inserted: number;
    error?: string;
  }> = [];

  const directivesText = (mgrDirectives as Array<{ title: string; content: string }>)
    .map((d, i: number) => `${i + 1}. ${d.title}\n   ${d.content}`)
    .join("\n\n");

  const kbText = mgrKB && mgrKB.length > 0
    ? (mgrKB as Array<{ title: string; content: string; category: string }>)
        .map((k) => `[${k.category}] ${k.title}: ${k.content}`).join("\n")
    : "(لا توجد قاعدة معرفة بعد)";

  const brandContext = [
    identity?.broker_name && `اسم الوسيط: ${identity.broker_name}`,
    identity?.specialization && `التخصص: ${identity.specialization}`,
    identity?.writing_tone && `نبرة الكتابة: ${identity.writing_tone}`,
    identity?.coverage_areas && `نطاق التغطية: ${Array.isArray(identity.coverage_areas) ? identity.coverage_areas.join(", ") : identity.coverage_areas}`,
  ].filter(Boolean).join("\n") || "(لا توجد معلومات هوية)";

  // ── Process employees serially to respect provider rate limits (Gemini free tier = 5 RPM) ──
  // Vercel maxDuration=300 يكفي. كل استدعاء ~10-15s، فـ 5 موظفين = 50-75s.
  for (const emp of (employees as EmployeeRow[])) {
    try {
      // إذا replace_existing — احذف الـ pending السابقة
      if (body.replace_existing !== false) {  // default = true (replace by default)
        await admin
          .from("directives")
          .delete()
          .eq("tenant_id", tenantId)
          .eq("target_kind", "employee")
          .eq("target_id", emp.id)
          .eq("source", "suggested")
          .eq("status", "pending");
      }

      const systemPrompt = `أنت مدير القسم في شركة عقارية سعودية. مهمّتك تحويل توجيهاتك الاستراتيجية إلى توجيهات تشغيلية محدّدة لموظف معيَّن في فريقك.

دورك كمدير: ${manager.name}
${manager.description}

سياق العلامة:
${brandContext}

توجيهاتك الاستراتيجية الحالية:
${directivesText}

قاعدة معرفتك:
${kbText}

اكتب توجيهات تشغيلية محدّدة للموظف بأسلوب:
- صياغة مباشرة قابلة للتنفيذ ("افعل/لا تفعل")
- مرتبطة بدور الموظف (لا توجيهات عامة)
- تترجم استراتيجيتك إلى خطوات يومية
- لا تكرّر نص توجيه آخر`;

      const userPrompt = `اسم الموظف: ${emp.name}
دوره: ${emp.description}

ولّد ٣-٥ توجيهات تشغيلية لهذا الموظف تحديداً، بناءً على توجيهاتك الاستراتيجية وقاعدة معرفتك.

أرجع JSON فقط بالشكل:
{
  "suggestions": [
    {"title": "عنوان قصير", "content": "نص التوجيه التفصيلي"},
    ...
  ]
}`;

      let result: { suggestions: SuggestionItem[] } | null = null;
      try {
        result = await generateJSON<{ suggestions: SuggestionItem[] }>({
          provider,
          model,
          systemPrompt,
          userPrompt,
          maxTokens: 3000,
          temperature: 0.6,
        });
      } catch (aiErr) {
        const msg = aiErr instanceof Error ? aiErr.message : "AI invocation failed";
        console.warn(`[suggest-directives] AI failed for ${emp.code}:`, msg);
        results.push({ employee_id: emp.id, employee_name: emp.name, inserted: 0, error: `AI: ${msg}` });
        continue;
      }

      console.log(`[suggest-directives] ${emp.code}: AI returned suggestions count =`,
        Array.isArray(result?.suggestions) ? result!.suggestions.length : "not-array",
        "raw keys:", result ? Object.keys(result).slice(0, 5) : "null");

      if (!result?.suggestions || !Array.isArray(result.suggestions)) {
        results.push({
          employee_id: emp.id,
          employee_name: emp.name,
          inserted: 0,
          error: `فشل تحليل JSON. الإخراج: ${JSON.stringify(result || {}).slice(0, 200)}`,
        });
        continue;
      }

      const rows = result.suggestions
        .filter(s => s && typeof s.title === "string" && typeof s.content === "string")
        .slice(0, 5)
        .map((s, idx) => ({
          tenant_id: tenantId,
          target_kind: "employee",
          target_id: emp.id,
          title: s.title.slice(0, 200),
          content: s.content.slice(0, 4000),
          source: "suggested",
          status: "pending",
          display_order: idx,
          created_by: user.id,
        }));

      if (rows.length === 0) {
        results.push({ employee_id: emp.id, employee_name: emp.name, inserted: 0, error: "اقتراحات فارغة" });
        continue;
      }

      const { error: insErr } = await admin.from("directives").insert(rows);
      if (insErr) {
        results.push({ employee_id: emp.id, employee_name: emp.name, inserted: 0, error: insErr.message });
      } else {
        results.push({ employee_id: emp.id, employee_name: emp.name, inserted: rows.length });
      }
    } catch (e) {
      console.error(`[suggest-directives] employee ${emp.code} failed:`, e);
      results.push({
        employee_id: emp.id,
        employee_name: emp.name,
        inserted: 0,
        error: e instanceof Error ? e.message : "خطأ غير معروف",
      });
    }
    // Delay قصير بين الاستدعاءات لتفادي rate limit (Gemini free 5 RPM)
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // ── سجّل النشاط ──
  await admin.from("org_activity_log").insert({
    tenant_id: tenantId,
    actor_kind: "ceo",
    actor_id: null,
    action: "triggered_suggestions",
    target_kind: "manager",
    target_id: managerId,
    details: { results, employee_count: employees.length },
  });

  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  return NextResponse.json({
    ok: true,
    manager: manager.name,
    employees_processed: employees.length,
    total_suggestions: totalInserted,
    results,
  });
}
