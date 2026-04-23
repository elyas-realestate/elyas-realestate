import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";

// ── GET: نظرة عامة KPIs للمنصّة كاملة ──
export async function GET(req: NextRequest) {
  const check = await requireSuperAdmin(req);
  if (check instanceof NextResponse) return check;
  const { supabase } = check;

  const { data, error } = await supabase.rpc("admin_platform_overview");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // الدالة تُعيد صفاً واحداً في مصفوفة
  const stats = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!stats) return NextResponse.json({ error: "لا توجد بيانات" }, { status: 500 });

  return NextResponse.json({ stats });
}
