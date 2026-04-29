import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// GET /api/org/approvals
// قائمة الـ escalations المُعلَّقة + المؤرشَفة، مع تفاصيل الموظف الذي رفعها
//
// Query params:
//   status=pending|approved|rejected|all (default: pending)
//   limit=N (default: 50)
// ══════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    return await handleGet(req);
  } catch (e) {
    console.error("[approvals/route] uncaught:", e);
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع في تحميل الموافقات";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function handleGet(req: NextRequest) {
  // Auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // tenant_id
  const { data: t } = await supabase.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
  let tenantId = t?.id;
  if (!tenantId) {
    const { data: m } = await supabase
      .from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("status", "active").maybeSingle();
    tenantId = m?.tenant_id;
  }
  if (!tenantId) return NextResponse.json({ error: "لم يُعثر على المستأجر" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const limitNum = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let q = admin
    .from("org_escalations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limitNum);

  if (status !== "all") q = q.eq("status", status);

  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // إثراء بمعلومات الموظف
  const empIds = Array.from(new Set((rows || [])
    .filter(r => r.raised_by_kind === "employee" && r.raised_by_id)
    .map(r => r.raised_by_id)));

  let empMap: Record<string, { code: string; name: string; department: string }> = {};
  if (empIds.length > 0) {
    const { data: emps } = await admin
      .from("ai_employees")
      .select("id, code, name, department")
      .in("id", empIds);
    empMap = Object.fromEntries((emps || []).map(e => [e.id, { code: e.code, name: e.name, department: e.department }]));
  }

  const enriched = (rows || []).map(r => ({
    ...r,
    employee: r.raised_by_kind === "employee" && r.raised_by_id ? empMap[r.raised_by_id] || null : null,
    is_expired: r.expires_at && r.status === "pending" ? new Date(r.expires_at) < new Date() : false,
  }));

  return NextResponse.json({
    items: enriched,
    counts: {
      pending: enriched.filter(r => r.status === "pending").length,
      total: enriched.length,
    },
  });
}
