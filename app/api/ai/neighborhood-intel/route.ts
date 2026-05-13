import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// /api/ai/neighborhood-intel — معلومات الحي
// GET ?city=X&district=Y
// يرجع معلومات الحي (cached) أو يولّدها بالـ AI
// ══════════════════════════════════════════════════════════════

const NEIGHBORHOOD_PROMPT = (city: string, district: string) => `
أنت خبير بالأحياء السعودية. اعطني معلومات موجزة عن حي "${district}" في "${city}":

أرجع JSON بهذا الشكل بالضبط:
{
  "description_ar": "وصف عام في 2-3 جمل",
  "highlights": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "schools_count": رقم تقديري,
  "mosques_count": رقم تقديري,
  "hospitals_count": رقم تقديري,
  "restaurants_count": رقم تقديري
}

استخدم معرفتك العامة. إذا لم تعرف الحي بدقة، قدّر بناءً على الموقع داخل المدينة.
أعد JSON فقط بدون شرح.`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const city = (url.searchParams.get("city") || "").trim();
  const district = (url.searchParams.get("district") || "").trim();

  if (!city || !district) {
    return NextResponse.json({ error: "city + district مطلوبان" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── جلب من الكاش ──
  const { data: cached } = await admin
    .from("neighborhood_intel")
    .select("*")
    .eq("city", city)
    .eq("district", district)
    .maybeSingle();

  // إذا موجود ومحدّث (أقل من 30 يوم)، نرجعه
  if (cached) {
    const lastUpdated = new Date(cached.last_updated_at);
    const ageDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 30) {
      return NextResponse.json({ ok: true, data: cached, cached: true });
    }
  }

  // ── توليد بالـ AI ──
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI service غير متاح",
        data: cached || null,
      },
      { status: 503 }
    );
  }

  let aiData: Record<string, unknown> = {};
  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "أنت مساعد ذكي في بيانات الأحياء السعودية. أعد JSON فقط." },
          { role: "user", content: NEIGHBORHOOD_PROMPT(city, district) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });
    if (!aiRes.ok) throw new Error(`OpenAI ${aiRes.status}`);
    const result = await aiRes.json();
    const content = result.choices?.[0]?.message?.content || "{}";
    aiData = JSON.parse(content);
  } catch (e) {
    console.error("[neighborhood-intel] AI error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "فشل توليد المعلومات",
        data: cached || null,
      },
      { status: 500 }
    );
  }

  // ── حفظ في الكاش ──
  const { data: saved } = await admin
    .from("neighborhood_intel")
    .upsert(
      {
        city,
        district,
        description_ar: aiData.description_ar || null,
        highlights: aiData.highlights || [],
        schools_count: aiData.schools_count || null,
        mosques_count: aiData.mosques_count || null,
        hospitals_count: aiData.hospitals_count || null,
        restaurants_count: aiData.restaurants_count || null,
        ai_generated: true,
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: "city,district" }
    )
    .select()
    .single();

  return NextResponse.json({ ok: true, data: saved, cached: false });
}
