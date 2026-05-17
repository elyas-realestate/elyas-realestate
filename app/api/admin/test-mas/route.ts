import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "@/lib/ai-call";
import { buildEmployeeContext } from "@/lib/ai-org-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/test-mas
 * body: { employee_code: string, test_input?: string }
 * يشغّل موظفاً واحداً في وضع dry-run (لا يحفظ في DB) ويعرض ردّه.
 *
 * مثال body:
 *  { "employee_code": "content_creator", "test_input": "اكتب منشور تويتر عن شقة في النرجس بـ 700 ألف" }
 *  { "employee_code": "lead_scorer",     "test_input": "عميل: محمد، اتصل أمس، يريد فيلا 2 مليون شمال الرياض" }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { employee_code, test_input } = body;

    if (!employee_code) {
      return NextResponse.json({ error: "employee_code مطلوب" }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // اختر أول tenant للاختبار
    const { data: tenant } = await admin
      .from("tenants")
      .select("id, slug")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!tenant) return NextResponse.json({ error: "لا يوجد tenant نشط" }, { status: 404 });

    // ابنِ context الموظف
    const ctx = await buildEmployeeContext(tenant.id, employee_code);
    if (!ctx) {
      return NextResponse.json(
        {
          error: `الموظف ${employee_code} غير موجود أو معطّل`,
          hint: "تحقق من /dashboard/organization",
        },
        { status: 404 }
      );
    }

    const userPrompt =
      test_input || "اعرض قدراتك الأساسية في جملتين فقط، ثم اقترح مهمة تستطيع تنفيذها الآن.";

    // استدعاء AI مع timer
    const startTime = Date.now();
    let reply = "";
    let error: string | null = null;
    const provider = ctx.employee.ai_provider;
    const model = ctx.employee.ai_model;

    try {
      reply = await generateText({
        provider: ctx.employee.ai_provider,
        model: ctx.employee.ai_model,
        systemPrompt: ctx.systemPrompt,
        userPrompt,
        maxTokens: 600,
        temperature: 0.6,
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "فشل توليد الرد";
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      ok: !error,
      employee: {
        code: employee_code,
        name: ctx.employee.name,
        manager: ctx.manager?.name || "بدون مدير",
        provider,
        model,
        directives_count: ctx.directiveCount,
        kb_count: ctx.kbCount,
      },
      input: userPrompt,
      output: reply,
      duration_ms: duration,
      error,
      system_prompt_preview: ctx.systemPrompt.slice(0, 500) + "...",
      system_prompt_length: ctx.systemPrompt.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "خطأ غير متوقّع" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/test-mas — يرجع قائمة الموظفين المتاحين للاختبار
 */
export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: employees, error: empErr } = await admin
    .from("ai_employees")
    .select("code, name, default_ai_provider, default_ai_model, is_active, manager_id")
    .order("display_order", { ascending: true });

  if (empErr) {
    return NextResponse.json(
      { error: empErr.message, employees: [], total: 0, active: 0 },
      { status: 500 }
    );
  }

  const { data: managers } = await admin.from("ai_managers").select("id, code, name, department");

  const enriched = (employees || []).map(
    (e: {
      code: string;
      name?: string;
      is_active?: boolean;
      manager_id?: string | null;
      default_ai_provider?: string;
      default_ai_model?: string;
    }) => ({
      code: e.code,
      name: e.name,
      is_active: e.is_active,
      manager_id: e.manager_id,
      ai_provider: e.default_ai_provider,
      ai_model: e.default_ai_model,
      manager_name:
        managers?.find((m: { id: string; name?: string }) => m.id === e.manager_id)?.name || null,
    })
  );

  return NextResponse.json({
    employees: enriched,
    total: enriched.length,
    active: enriched.filter((e) => e.is_active).length,
  });
}
