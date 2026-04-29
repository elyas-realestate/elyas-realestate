import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { decideApproval } from "@/lib/approval-gates";

// ══════════════════════════════════════════════════════════════
// POST /api/org/approvals/[id]/decide
// قرار CEO على escalation معلَّقة
//
// Body: { decision: "approved" | "rejected" | "modified", note: string }
// ══════════════════════════════════════════════════════════════

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

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

  // تحقق أن المستخدم ينتمي لـ tenant الـ escalation
  const { data: t } = await supabase.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
  let tenantId = t?.id;
  if (!tenantId) {
    const { data: m } = await supabase
      .from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("status", "active").maybeSingle();
    tenantId = m?.tenant_id;
  }
  if (!tenantId) return NextResponse.json({ error: "لم يُعثر على المستأجر" }, { status: 400 });

  // أمسك الـ escalation وتأكد أنها لـ نفس tenant
  const { data: esc } = await supabase
    .from("org_escalations")
    .select("id, tenant_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!esc) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (esc.tenant_id !== tenantId) {
    return NextResponse.json({ error: "هذا الطلب لا يخص حسابك" }, { status: 403 });
  }
  if (esc.status !== "pending") {
    return NextResponse.json({ error: `الحالة الحالية: ${esc.status} — لا يمكن تغييرها` }, { status: 400 });
  }

  // Body
  let body: { decision?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }
  const decision = body.decision;
  const note = (body.note || "").toString().trim();
  if (!decision || !["approved", "rejected", "modified"].includes(decision)) {
    return NextResponse.json({ error: "decision يجب أن يكون: approved | rejected | modified" }, { status: 400 });
  }

  const result = await decideApproval({
    escalationId: id,
    decision: decision as "approved" | "rejected" | "modified",
    ceoNote: note || (decision === "approved" ? "موافَق" : decision === "rejected" ? "مرفوض" : "تعديل"),
    userId: user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "تعذّر تنفيذ القرار" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, decision, escalation_id: id });
}
