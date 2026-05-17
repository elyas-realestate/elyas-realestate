import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/operations/status
 * يرجع كل البيانات اللازمة لصفحة Operations Center في طلب واحد:
 * - حالة الـ master switch + counter + limit
 * - قائمة المدراء + الموظفين مع overrides لكل واحد
 * - آخر 50 نشاط من org_activity_log
 * - آخر 10 reviews من manager_reviews
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) tenant + status
    const { data: tenant } = await admin
      .from("tenants")
      .select(
        "id, slug, system_master_active, daily_call_limit, daily_call_count, last_count_reset, master_paused_reason, master_paused_at"
      )
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (!tenant) return NextResponse.json({ error: "لا يوجد tenant" }, { status: 404 });

    // تصفير العدّاد لو مر اليوم
    const today = new Date().toISOString().slice(0, 10);
    let count = tenant.daily_call_count;
    if (tenant.last_count_reset && tenant.last_count_reset < today) {
      count = 0;
    }

    // 2) المدراء + الموظفون
    const [managersRes, employeesRes, configRes] = await Promise.all([
      admin
        .from("ai_managers")
        .select(
          "id, code, name, department, default_ai_provider, default_ai_model, is_active, display_order"
        )
        .order("display_order", { ascending: true }),
      admin
        .from("ai_employees")
        .select(
          "id, code, name, manager_id, default_ai_provider, default_ai_model, is_active, display_order"
        )
        .order("display_order", { ascending: true }),
      admin
        .from("tenant_ai_config")
        .select("target_kind, target_id, is_enabled")
        .eq("tenant_id", tenant.id),
    ]);

    const overrideMap = new Map<string, boolean>();
    for (const c of configRes.data || []) {
      overrideMap.set(`${c.target_kind}:${c.target_id}`, c.is_enabled);
    }

    const managers = (managersRes.data || []).map(
      (m: { id: string; name?: string; manager_id?: string | null }) => ({
        ...m,
        tenant_enabled: overrideMap.get(`manager:${m.id}`) ?? false, // افتراضي OFF
      })
    );

    const employees = (employeesRes.data || []).map(
      (e: { id: string; name?: string; manager_id?: string | null }) => ({
        ...e,
        tenant_enabled: overrideMap.get(`employee:${e.id}`) ?? false, // افتراضي OFF
        manager_name: managers.find((m) => m.id === e.manager_id)?.name || null,
      })
    );

    // 3) آخر 50 نشاط
    const { data: activity } = await admin
      .from("org_activity_log")
      .select("id, actor_kind, actor_id, action, target_kind, details, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // 4) آخر 10 reviews
    const { data: reviews } = await admin
      .from("manager_reviews")
      .select("id, manager_id, summary, concerns, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // 5) عدّاد المخرجات (منشورات + متابعات pending)
    const [marketingPending, followupPending] = await Promise.all([
      admin
        .from("marketing_queue")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("status", "pending"),
      admin
        .from("followup_queue")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("status", "pending"),
    ]);
    const outputs_count = (marketingPending.count || 0) + (followupPending.count || 0);

    return NextResponse.json({
      ok: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        system_master_active: tenant.system_master_active,
        daily_call_limit: tenant.daily_call_limit,
        daily_call_count: count,
        master_paused_reason: tenant.master_paused_reason,
        master_paused_at: tenant.master_paused_at,
      },
      managers,
      employees,
      activity: activity || [],
      reviews: reviews || [],
      outputs_count,
      schedule: [
        { time: "كل ساعة", cron: "0 * * * *", task: "التذكيرات", endpoint: "/api/cron/reminders" },
        {
          time: "٧:٠٠ ص (الرياض)",
          cron: "0 4 * * *",
          task: "موظف التسويق",
          endpoint: "/api/cron/ai-marketing",
        },
        {
          time: "٨:٠٠ ص (الرياض)",
          cron: "0 5 * * *",
          task: "موظف المتابعة",
          endpoint: "/api/cron/ai-followup",
        },
        {
          time: "٩:٠٠ ص (الرياض)",
          cron: "0 6 * * *",
          task: "المحلل المالي",
          endpoint: "/api/cron/ai-analyst",
        },
        {
          time: "١٠:٠٠ ص (الرياض)",
          cron: "0 7 * * *",
          task: "حلقة المدراء",
          endpoint: "/api/cron/manager-loop",
        },
      ],
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "خطأ" }, { status: 500 });
  }
}
