import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";

// ── GET: قائمة المستأجرين الكاملة مع إحصائيات (لمالك المنصّة فقط) ──
export async function GET(req: NextRequest) {
  const check = await requireSuperAdmin(req);
  if (check instanceof NextResponse) return check;
  const { supabase } = check;

  const { data: rows, error } = await supabase.rpc("admin_list_tenants");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tenants = (rows || []) as Array<{
    id: string;
    slug: string;
    owner_id: string;
    owner_email: string | null;
    broker_name: string | null;
    plan: string;
    is_active: boolean;
    created_at: string;
    property_count: number;
    client_count: number;
    deal_count: number;
    last_activity: string | null;
  }>;

  const planCounts: Record<string, number> = { free: 0, basic: 0, pro: 0 };
  tenants.forEach((t) => {
    const p = t.plan || "free";
    planCounts[p] = (planCounts[p] || 0) + 1;
  });

  return NextResponse.json({
    tenants,
    total: tenants.length,
    planCounts,
  });
}

// ── PATCH: تعديل plan أو is_active لمستأجر معيّن ──
export async function PATCH(req: NextRequest) {
  const check = await requireSuperAdmin(req);
  if (check instanceof NextResponse) return check;
  const { supabase } = check;

  const body = await req.json();
  const { tenantId, updates } = body as {
    tenantId: string;
    updates: Record<string, unknown>;
  };

  if (!tenantId || !updates) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  // ── حقول آمنة فقط ──
  if ("is_active" in updates) {
    const suspend = !updates.is_active;
    const { error } = await supabase.rpc("admin_suspend_tenant", {
      tid: tenantId,
      suspend,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if ("plan" in updates) {
    const newPlan = String(updates.plan);
    if (!["free", "basic", "pro"].includes(newPlan)) {
      return NextResponse.json({ error: "خطة غير صالحة" }, { status: 400 });
    }
    const { error } = await supabase.rpc("admin_set_tenant_plan", {
      tid: tenantId,
      new_plan: newPlan,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
