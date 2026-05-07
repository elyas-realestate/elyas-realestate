import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════════
// /api/pdpl/delete — طلب حذف كل بيانات المستخدم (PDPL right)
// POST { confirm: "DELETE_MY_ACCOUNT" }
// لا يحذف فوراً — ينشئ طلب حذف يُراجَع خلال 30 يوماً
// ══════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }

  let body: { confirm?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON غير صالح" }, { status: 400 });
  }

  if (body.confirm !== "DELETE_MY_ACCOUNT") {
    return NextResponse.json(
      { ok: false, error: "كلمة التأكيد غير صحيحة" },
      { status: 400 }
    );
  }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData } = await supabaseAuth.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ننشئ طلب حذف في support_requests (موجود من Migration 044)
  // ليتم مراجعته يدوياً وحذف البيانات خلال 30 يوماً (وفق PDPL)
  const { error } = await admin.from("support_requests").insert([
    {
      user_id: userData.user.id,
      type: "data_deletion",
      subject: "طلب حذف بيانات (PDPL)",
      message: `طلب حذف كامل للحساب وكل البيانات المرتبطة.\nالسبب: ${body.reason || "—"}\nالبريد: ${userData.user.email}`,
      status: "open",
      priority: "high",
    },
  ]);

  if (error) {
    console.error("[pdpl/delete] insert error:", error);
    // fallback: لو ما فيه جدول support_requests، نحفظ في beta_feedback
    await admin.from("beta_feedback").insert([
      {
        user_email: userData.user.email,
        category: "other",
        severity: "high",
        message: `طلب حذف بيانات (PDPL)\nالسبب: ${body.reason || "—"}`,
        status: "new",
      },
    ]);
  }

  return NextResponse.json({
    ok: true,
    message:
      "تم استلام طلب الحذف. ستتم مراجعته وتنفيذه خلال ٣٠ يوماً وفقاً للنظام السعودي لحماية البيانات الشخصية (PDPL). سنرسل تأكيداً للبريد المسجّل.",
  });
}
