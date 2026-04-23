import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";

interface SubscriptionRow {
  tenant_id: string;
  slug: string;
  broker_name: string | null;
  plan: string;
  is_active: boolean;
  monthly_value: number;
  started_at: string;
}

// ── GET /api/admin/subscriptions ──
export async function GET(req: NextRequest) {
  const check = await requireSuperAdmin(req);
  if (check instanceof NextResponse) return check;
  const { supabase } = check;

  const { data, error } = await supabase.rpc("admin_list_subscriptions");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data || []) as SubscriptionRow[];

  const paying = rows.filter((r) => r.plan !== "free" && r.is_active);
  const mrr = paying.reduce((sum, r) => sum + Number(r.monthly_value || 0), 0);

  return NextResponse.json({
    subscriptions: rows,
    summary: {
      total: rows.length,
      paying: paying.length,
      mrr,
      arr: mrr * 12,
    },
  });
}
