import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export async function GET(req: NextRequest) {
  // ── Auth: only admin ──
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // ── Service role: bypass RLS ──
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, slug, plan, is_active, created_at, owner_id")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── جلب broker_name لكل tenant ──
  const tenantIds = (tenants || []).map(t => t.id);
  let nameMap: Record<string, string> = {};

  if (tenantIds.length > 0) {
    const { data: settings } = await supabase
      .from("site_settings")
      .select("tenant_id, broker_name")
      .in("tenant_id", tenantIds);

    (settings || []).forEach(s => {
      if (s.tenant_id) nameMap[s.tenant_id] = s.broker_name || "";
    });
  }

  const enriched = (tenants || []).map(t => ({
    ...t,
    broker_name: nameMap[t.id] || "",
  }));

  // ── إحصائيات الخطط ──
  const planCounts = { free: 0, basic: 0, pro: 0 } as Record<string, number>;
  enriched.forEach(t => {
    const p = t.plan || "free";
    planCounts[p] = (planCounts[p] || 0) + 1;
  });

  return NextResponse.json({
    tenants: enriched,
    total: enriched.length,
    planCounts,
  });
}

export async function PATCH(req: NextRequest) {
  // ── Auth: only admin ──
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await req.json();
  const { tenantId, updates } = body as { tenantId: string; updates: Record<string, unknown> };

  if (!tenantId || !updates) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  // Allow only safe fields
  const allowed = ["plan", "is_active"];
  const safe: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in updates) safe[k] = updates[k];
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("tenants").update(safe).eq("id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
