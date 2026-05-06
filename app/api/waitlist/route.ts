import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// /api/waitlist — تسجيل في قائمة انتظار Beta
// POST { email, full_name?, phone?, city?, notes?, source? }
// ══════════════════════════════════════════════════════════════

interface WaitlistPayload {
  email: string;
  full_name?: string;
  phone?: string;
  city?: string;
  notes?: string;
  source?: string;
}

export async function POST(req: NextRequest) {
  let body: WaitlistPayload;
  try {
    body = (await req.json()) as WaitlistPayload;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  // ── تنظيف وتحقق ──
  const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "صيغة البريد غير صحيحة" }, { status: 400 });
  }

  const full_name = body.full_name ? String(body.full_name).trim().slice(0, 120) : null;
  const phone = body.phone ? String(body.phone).trim().slice(0, 30) : null;
  const city = body.city ? String(body.city).trim().slice(0, 80) : null;
  const notes = body.notes ? String(body.notes).trim().slice(0, 1000) : null;
  const source = body.source ? String(body.source).trim().slice(0, 80) : null;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // upsert: لو ضغط مرتين بنفس البريد، ما نطلع خطأ
  const { error } = await admin
    .from("beta_waitlist")
    .upsert(
      {
        email,
        full_name,
        phone,
        city,
        notes,
        source,
      },
      { onConflict: "email" }
    );

  if (error) {
    console.error("[waitlist] insert error:", error);
    return NextResponse.json({ error: "تعذّر التسجيل، حاول لاحقاً" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "تم تسجيلك في قائمة انتظار Beta. سنتواصل معك عند فتح المرحلة التالية.",
  });
}
