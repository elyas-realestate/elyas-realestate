import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";

// ── GET /api/admin/audit?limit=100 ──
export async function GET(req: NextRequest) {
  const check = await requireSuperAdmin(req);
  if (check instanceof NextResponse) return check;
  const { supabase } = check;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 500);

  const { data, error } = await supabase.rpc("admin_audit_recent", { limit_n: limit });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data || [] });
}
