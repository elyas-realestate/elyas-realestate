import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/operations/master-toggle
 * body: { active: boolean, reason?: string }
 * يقلب system_master_active للـ tenant الحالي + يسجّل في org_activity_log
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { active, reason } = body;

    if (typeof active !== "boolean") {
      return NextResponse.json({ error: "active (boolean) مطلوب" }, { status: 400 });
    }

    // Auth: جلسة المستخدم الحالي
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

    // اعثر على tenant المستخدم
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tenant } = await admin
      .from("tenants")
      .select("id, slug, system_master_active")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (!tenant)
      return NextResponse.json({ error: "لا يوجد tenant مرتبط بحسابك" }, { status: 404 });

    // حدّث الحالة
    const updates: Record<string, unknown> = {
      system_master_active: active,
      master_paused_at: active ? null : new Date().toISOString(),
      master_paused_reason: active ? null : reason || "إيقاف يدوي من المالك",
    };

    const { error: upErr } = await admin.from("tenants").update(updates).eq("id", tenant.id);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // سجّل في activity log
    await admin.from("org_activity_log").insert({
      tenant_id: tenant.id,
      actor_kind: "system",
      actor_id: null,
      action: active ? "system_master_activated" : "system_master_paused",
      details: {
        actor_user_id: user.id,
        previous_state: tenant.system_master_active,
        reason: reason || null,
      },
    });

    return NextResponse.json({
      ok: true,
      system_master_active: active,
      message: active ? "تم تشغيل النظام" : "تم إيقاف النظام",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "خطأ غير متوقّع" },
      { status: 500 }
    );
  }
}
