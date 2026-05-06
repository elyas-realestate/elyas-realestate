import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const code = String(body.code || "").trim().toUpperCase().slice(0, 50);
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
    console.error("[invite/validate] RPC error:", error);
    return NextResponse.json({ valid: false, error: "خطأ في التحقق" }, { status: 500 });
  }

  return NextResponse.json(data);
}
