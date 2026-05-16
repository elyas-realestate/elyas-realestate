import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/with-auth";
import { logger } from "@/lib/logger";

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
  // Rate limit: 3 طلبات بالساعة لكل IP (تجنّب spam)
  const rl = checkRateLimit(getClientKey(req), {
    maxRequests: 3,
    windowSeconds: 60 * 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "تم استلام طلبك سابقاً. حاول بعد ساعة." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds || 60) } }
    );
  }

  let body: WaitlistPayload;
  try {
    body = (await req.json()) as WaitlistPayload;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  // ── تنظيف وتحقق ──
  const email = String(body.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 200);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "صيغة البريد غير صحيحة" }, { status: 400 });
  }

  const full_name = body.full_name ? String(body.full_name).trim().slice(0, 120) : null;
  const phone = body.phone ? String(body.phone).trim().slice(0, 30) : null;
  const city = body.city ? String(body.city).trim().slice(0, 80) : null;
  const notes = body.notes ? String(body.notes).trim().slice(0, 1000) : null;
  const source = body.source ? String(body.source).trim().slice(0, 80) : null;

  const admin = getSupabaseAdmin();

  // upsert: لو ضغط مرتين بنفس البريد، ما نطلع خطأ
  const { error } = await admin.from("beta_waitlist").upsert(
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
    logger.error("[waitlist] insert failed", error, { route: "/api/waitlist" });
    return NextResponse.json({ error: "تعذّر التسجيل، حاول لاحقاً" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "تم تسجيلك في قائمة انتظار Beta. سنتواصل معك عند فتح المرحلة التالية.",
  });
}
