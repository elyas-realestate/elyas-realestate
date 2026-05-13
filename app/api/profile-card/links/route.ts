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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  return tenant ? { tenantId: tenant.id, admin } : null;
}

// POST — إضافة رابط جديد
export async function POST(req: Request) {
  try {
    const ctx = await getOwnerTenant();
    if (!ctx) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

    const body = await req.json();
    const {
      element_type,
      link_type,
      label,
      value,
      subtitle,
      icon,
      bg_color,
      text_color,
      display_order,
      metadata,
    } = body;
    if (!element_type && !label)
      return NextResponse.json({ error: "element_type أو label مطلوب" }, { status: 400 });

    // احصل على display_order تلقائياً (آخر +1)
    let order = display_order;
    if (order === undefined || order === null) {
      const { data: maxRow } = await ctx.admin
        .from("profile_links")
        .select("display_order")
        .eq("tenant_id", ctx.tenantId)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      order = (maxRow?.display_order ?? -1) + 1;
    }

    const { data, error } = await ctx.admin
      .from("profile_links")
      .insert({
        tenant_id: ctx.tenantId,
        element_type: element_type || link_type || "custom",
        link_type: link_type || "custom",
        label: label || "",
        value: value || null,
        subtitle: subtitle || null,
        metadata: metadata || {},
        icon: icon || null,
        bg_color: bg_color || null,
        text_color: text_color || null,
        display_order: order,
        is_active: true,
      })
      .select()
      .single();

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

    // طبّع الحقول المسموح تحديثها
    const allowed: Record<string, any> = {};
    const fields = [
      "element_type",
      "link_type",
      "label",
      "value",
      "subtitle",
      "metadata",
      "bg_color",
      "text_color",
      "display_order",
      "is_active",
      "icon",
    ];
    for (const f of fields) {
      if (updates[f] !== undefined) allowed[f] = updates[f];
    }

    const { error } = await ctx.admin
      .from("profile_links")
      .update(allowed)
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
