import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/operations/employee-toggle
 * body: { kind: "employee"|"manager", code: string, enabled: boolean }
 *
 * يستخدم tenant_ai_config (target_kind + target_id + is_enabled) كـ override.
 * عشان ما نلمس ai_employees.is_active العام.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { kind, code, enabled } = body;

    if (!["employee", "manager"].includes(kind) || !code || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "kind/code/enabled مطلوبة" }, { status: 400 });
    }

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

    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (!tenant) return NextResponse.json({ error: "لا يوجد tenant" }, { status: 404 });

    // اعثر على target_id من ai_employees أو ai_managers
    const tableName = kind === "employee" ? "ai_employees" : "ai_managers";
    const { data: target } = await admin
      .from(tableName)
      .select("id, name")
      .eq("code", code)
      .single();

    if (!target) return NextResponse.json({ error: `${kind} ${code} غير موجود` }, { status: 404 });

    // upsert إلى tenant_ai_config
    const { error: upErr } = await admin.from("tenant_ai_config").upsert(
      {
        tenant_id: tenant.id,
        target_kind: kind,
        target_id: target.id,
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,target_kind,target_id" }
    );

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // سجّل
    await admin.from("org_activity_log").insert({
      tenant_id: tenant.id,
      actor_kind: "system",
      actor_id: null,
      action: enabled ? `${kind}_enabled` : `${kind}_disabled`,
      target_kind: kind,
      target_id: target.id,
      details: { code, name: target.name, actor_user_id: user.id },
    });

    return NextResponse.json({
      ok: true,
      target: { kind, code, name: target.name },
      is_enabled: enabled,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ غير متوقّع" }, { status: 500 });
  }
}
