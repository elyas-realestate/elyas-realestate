import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";

// ── GET /api/admin/tenants/[id] — تفاصيل كاملة ──
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireSuperAdmin(req);
  if (check instanceof NextResponse) return check;
  const { supabase } = check;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

  const { data, error } = await supabase.rpc("admin_tenant_detail", { tid: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ detail: data });
}
