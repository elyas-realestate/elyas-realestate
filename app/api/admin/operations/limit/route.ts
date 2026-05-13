import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/operations/limit
 * body: { daily_call_limit: number }
 * يحدّث الحد اليومي للاستدعاءات.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = Number(body.daily_call_limit);

    if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
      return NextResponse.json({ error: "الحد يجب أن يكون بين 1 و 10000" }, { status: 400 });
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

    const { error: upErr } = await admin
      .from("tenants")
      .update({ daily_call_limit: limit })
      .eq("id", tenant.id);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    await admin.from("org_activity_log").insert({
      tenant_id: tenant.id,
      actor_kind: "system",
      action: "daily_limit_updated",
      details: { new_limit: limit, actor_user_id: user.id },
    });

    return NextResponse.json({ ok: true, daily_call_limit: limit });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ" }, { status: 500 });
  }
}
