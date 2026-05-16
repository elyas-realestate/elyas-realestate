import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ══════════════════════════════════════════════════════════════
// /api/invite-code/validate — التحقق من صلاحية كود دعوة
// POST { code: "WASIT-BETA-1" }
// ══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "JSON غير صالح" }, { status: 400 });
  }

  const code = String(body.code || "")
    .trim()
    .toUpperCase()
    .slice(0, 50);
  if (!code) {
    return NextResponse.json({ valid: false, error: "الكود مطلوب" }, { status: 400 });
  }

  // service_role لتجاوز RLS (admin only يقرأ، لكن نحتاج فحص للعموم)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin.rpc("validate_invite_code", { p_code: code });

  if (error) {
    logger.error("[invite/validate] RPC failed", error, { route: "/api/invite-code/validate" });
    return NextResponse.json({ valid: false, error: "خطأ في التحقق" }, { status: 500 });
  }

  // ── توحيد صياغة الرسائل (يغطّي كل حالات الفشل برسالة موحَّدة) ──
  // SQL function ترجع: "الكود غير موجود" / "الكود منتهي الصلاحية" / "تم استخدام الكود سابقاً" / "الكود غير نشط"
  if (data && typeof data === "object" && "valid" in data && data.valid === false) {
    return NextResponse.json({
      ...data,
      error: "كود الدعوة غير صالح أو منتهي الصلاحية",
      // نحتفظ بالسبب التقني للـ logs (بدون عرضه للمستخدم)
      _technical: data.error,
    });
  }

  return NextResponse.json(data);
}
