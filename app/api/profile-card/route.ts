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
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();
  return tenant ? { tenant, admin } : null;
}

// GET — جلب البطاقة + الروابط
export async function GET() {
  try {
    const ctx = await getOwnerTenant();
    if (!ctx) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

    const [cardRes, linksRes] = await Promise.all([
      ctx.admin.from("profile_cards").select("*").eq("tenant_id", ctx.tenant.id).maybeSingle(),
      ctx.admin
        .from("profile_links")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .order("display_order"),
    ]);

    return NextResponse.json({
      ok: true,
      card: cardRes.data,
      links: linksRes.data || [],
      slug: ctx.tenant.slug,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ" }, { status: 500 });
  }
}

// PUT — تحديث البطاقة
export async function PUT(req: Request) {
  try {
    const ctx = await getOwnerTenant();
    if (!ctx) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });

    const body = await req.json();
    const allowed: Record<string, any> = {};
    const fields = [
      "card_style",
      "bg_color",
      "text_color",
      "accent_color",
      "avatar_url",
      "display_name",
      "bio",
      "show_direct_contact",
      "show_social",
      "show_licenses",
      "show_hours",
      "show_share_button",
      "show_qr_button",
      "show_powered_by",
      "is_published",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) allowed[f] = body[f];
    }

    const { error } = await ctx.admin
      .from("profile_cards")
      .update(allowed)
      .eq("tenant_id", ctx.tenant.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ" }, { status: 500 });
  }
}
