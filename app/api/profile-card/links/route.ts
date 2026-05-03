import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getOwnerTenant() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: tenant } = await admin.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
  return tenant ? { tenantId: tenant.id, admin } : null;
}

// POST — إضافة رابط جديد
export async function POST(req: Request) {
  try {
    const ctx = await getOwnerTenant();
    if (!ctx) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

    const body = await req.json();
    const { link_type, label, value, icon, bg_color, text_color, display_order } = body;
    if (!label) return NextResponse.json({ error: "label مطلوب" }, { status: 400 });

    const { data, error } = await ctx.admin.from("profile_links").insert({
      tenant_id: ctx.tenantId,
      link_type: link_type || "custom",
      label,
      value: value || null,
      icon: icon || null,
      bg_color: bg_color || null,
      text_color: text_color || null,
      display_order: display_order ?? 999,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, link: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ" }, { status: 500 });
  }
}

// PATCH — تحديث رابط (للترتيب أو التعديل)
export async function PATCH(req: Request) {
  try {
    const ctx = await getOwnerTenant();
    if (!ctx) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

    const { error } = await ctx.admin
      .from("profile_links")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ" }, { status: 500 });
  }
}

// DELETE — حذف رابط
export async function DELETE(req: Request) {
  try {
    const ctx = await getOwnerTenant();
    if (!ctx) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

    const { error } = await ctx.admin
      .from("profile_links")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ" }, { status: 500 });
  }
}
