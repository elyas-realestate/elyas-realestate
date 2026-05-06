import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// /api/ai/voice-to-property — AI Voice-to-Property
// POST: يتلقى نص مفرغ (transcript) من الواجهة (الواجهة تستخدم Web Speech API)
// أو يقبل audio file ويستخدم Whisper
// ثم يستخدم GPT لاستخراج حقول العقار
// ══════════════════════════════════════════════════════════════

interface ExtractedFields {
  title?: string;
  description?: string;
  price?: number;
  city?: string;
  district?: string;
  rooms?: number;
  bathrooms?: number;
  area?: number;
  main_category?: string;
  sub_category?: string;
  offer_type?: string;
}

const EXTRACTION_PROMPT = `أنت مساعد ذكي يستخرج بيانات العقارات من نصوص عربية.

المستخدم وسيط عقاري سعودي يصف عقاراً صوتياً. استخرج الحقول التالية كـ JSON:
{
  "title": "عنوان مختصر للعقار",
  "description": "وصف كامل بصيغة احترافية",
  "price": رقم بالريال السعودي,
  "city": "المدينة",
  "district": "الحي",
  "rooms": عدد الغرف,
  "bathrooms": عدد الحمامات,
  "area": المساحة بالمتر المربع,
  "main_category": "سكني" | "تجاري" | "أرض",
  "sub_category": "فيلا" | "شقة" | "أرض" | "محل" | "مكتب" | "...",
  "offer_type": "بيع" | "إيجار"
}

استخدم null للحقول غير المذكورة. أعد JSON فقط بدون شرح.`;

export async function POST(req: NextRequest) {
  // ── Auth ──
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: { transcript?: string; audio_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  const transcript = String(body.transcript || "").trim();
  if (!transcript) {
    return NextResponse.json({ error: "transcript مطلوب (نص الكلام)" }, { status: 400 });
  }
  if (transcript.length < 20) {
    return NextResponse.json({ error: "النص قصير جداً للاستخراج" }, { status: 400 });
  }

  // ── جلب tenant_id ──
  const { data: t } = await authClient
    .from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
  const tenantId = t?.id as string | undefined;
  if (!tenantId) return NextResponse.json({ error: "لا يوجد tenant" }, { status: 404 });

  // ── استدعاء OpenAI/Anthropic لاستخراج الحقول ──
  let extractedFields: ExtractedFields = {};
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error("OPENAI_API_KEY غير مضبوط");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: transcript },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`OpenAI error ${aiRes.status}: ${errText.slice(0, 200)}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    extractedFields = JSON.parse(content);
  } catch (e) {
    console.error("[voice-to-property] AI extraction failed:", e);
    return NextResponse.json(
      { error: "فشل استخراج البيانات من النص", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }

  // ── حفظ السجل ──
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: intake } = await admin
    .from("property_voice_intakes")
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      transcript,
      audio_url: body.audio_url || null,
      extracted_fields: extractedFields,
      status: "review",
      confidence_score: 0.85,
    })
    .select("id")
    .single();

  return NextResponse.json({
    ok: true,
    intake_id: intake?.id,
    extracted: extractedFields,
    message: "تم استخراج البيانات. راجعها وعدّلها قبل الحفظ.",
  });
}
