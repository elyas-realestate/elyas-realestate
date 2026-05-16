import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/with-auth";

// ══════════════════════════════════════════════════════════════
// /api/lead-capture — استقبال بيانات الزائر قبل عرض العقار/البطاقة
// POST { tenant_slug, context_type, context_id?, full_name, phone, email?, intent? }
// ══════════════════════════════════════════════════════════════

interface Payload {
  tenant_slug: string;
  context_type: "property" | "card" | "pdf" | "video" | "phone";
  context_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  intent?: string;
  utm_source?: string;
  utm_campaign?: string;
}

function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/\D/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("05")) p = "966" + p.slice(1);
  return p;
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 طلبات بالساعة لكل IP (عقار معيّن قد يحتاج retry)
  const rl = checkRateLimit(getClientKey(req), {
    maxRequests: 10,
    windowSeconds: 60 * 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "كثير من المحاولات. حاول لاحقاً." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds || 60) } }
    );
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  // ── Validation ──
  const tenant_slug = String(body.tenant_slug || "")
    .trim()
    .slice(0, 80);
  const full_name = String(body.full_name || "")
    .trim()
    .slice(0, 120);
  const phone_raw = String(body.phone || "").trim();
  const phone = normalizePhone(phone_raw);
  const email = body.email ? String(body.email).trim().toLowerCase().slice(0, 200) : null;
  const intent = body.intent ? String(body.intent).trim().slice(0, 80) : null;

  if (!tenant_slug) return NextResponse.json({ error: "معرّف الوسيط مطلوب" }, { status: 400 });
  if (!full_name || full_name.length < 2)
    return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
  if (!phone || phone.length < 9)
    return NextResponse.json({ error: "رقم الجوّال غير صحيح" }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "صيغة البريد غير صحيحة" }, { status: 400 });
  }

  const validContexts = ["property", "card", "pdf", "video", "phone"];
  if (!validContexts.includes(body.context_type)) {
    return NextResponse.json({ error: "context_type غير صالح" }, { status: 400 });
  }

  // ── Service client (تجاوز RLS لكتابة Public) ──
  const admin = getSupabaseAdmin();

  // ── جلب tenant_id ──
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", tenant_slug)
    .maybeSingle();

  if (!tenant?.id) {
    return NextResponse.json({ error: "الوسيط غير موجود" }, { status: 404 });
  }

  // ── ميتاداتا التتبّع ──
  const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const user_agent = req.headers.get("user-agent")?.slice(0, 500) || null;
  const referer = req.headers.get("referer")?.slice(0, 500) || null;

  // ── إدراج الـ lead ──
  const { data: lead, error } = await admin
    .from("lead_captures")
    .insert({
      tenant_id: tenant.id,
      context_type: body.context_type,
      context_id: body.context_id?.slice(0, 200) || null,
      full_name,
      phone,
      email,
      intent,
      ip_address,
      user_agent,
      referer,
      utm_source: body.utm_source?.slice(0, 80) || null,
      utm_campaign: body.utm_campaign?.slice(0, 80) || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[lead-capture] insert error:", error);
    return NextResponse.json({ error: "تعذّر التسجيل" }, { status: 500 });
  }

  // ── إعادة لكوكي عشان الزائر ما يعيد التعبئة على نفس الجهاز ──
  const res = NextResponse.json({
    ok: true,
    lead_id: lead.id,
    message: "شكراً، سيتواصل معك الوسيط قريباً.",
  });
  res.cookies.set(`lc_${tenant_slug}`, lead.id, {
    httpOnly: false, // الواجهة تقدر تشوفه
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // ٣٠ يوم
  });

  return res;
}
