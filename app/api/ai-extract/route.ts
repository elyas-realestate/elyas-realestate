import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit, AI_RATE_LIMIT, getClientKey } from "@/lib/rate-limit";

// ── Extraction System Prompt ──
const EXTRACT_PROMPT = `أنت خبير عقاري سعودي محترف. مهمتك تحليل المحتوى المُرسل (نص أو وصف صورة أو بيانات PDF) واستخراج بيانات العقار منه بدقة.

أعد النتيجة كـ JSON فقط بدون أي نص إضافي، بالتنسيق التالي:
{
  "title": "عنوان مناسب للعقار",
  "offer_type": "بيع" أو "إيجار" أو "استثمار",
  "main_category": "سكني" أو "تجاري" أو "أرض" أو "زراعي" أو "صناعي",
  "sub_category": "فيلا" أو "شقة" أو "أرض سكنية" إلخ,
  "city": "المدينة",
  "district": "الحي",
  "land_area": رقم أو null,
  "built_area": رقم أو null,
  "rooms": رقم أو null,
  "bathrooms": رقم أو null,
  "floors": رقم أو null,
  "price": رقم أو null,
  "description": "وصف تسويقي احترافي من 3-4 جمل",
  "confidence": 0.0 إلى 1.0
}

قواعد:
- إذا لم تجد بيانة محددة، اتركها null
- الأسعار بالريال السعودي (حوّل من أي عملة أخرى)
- "confidence" = درجة ثقتك في دقة الاستخراج (0.0 = غير متأكد، 1.0 = متأكد تماماً)
- لا تخترع بيانات غير موجودة في المحتوى
- أعد JSON فقط بدون markdown أو backticks`;

// ── Try all providers text extracting ──
async function callTextAI(content: string, dbKeys: any[]): Promise<string> {
  const prompt = `حلل المحتوى التالي واستخرج بيانات العقار:\n\n${content}`;
  const getProviderKey = (prov: string) => {
    return (dbKeys || []).find(k => k.provider === prov)?.api_key_encrypted ||
      (prov === "anthropic" ? process.env.ANTHROPIC_API_KEY : 
       prov === "google" ? process.env.GOOGLE_API_KEY : 
       prov === "openai" ? process.env.OPENAI_API_KEY : "");
  };

  const anthropicKey = getProviderKey("anthropic");
  if (anthropicKey) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: EXTRACT_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    if (!data.error) return data.content?.[0]?.text || "";
  }

  const googleKey = getProviderKey("google");
  if (googleKey) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: EXTRACT_PROMPT + "\n\n" + prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
        }),
      }
    );
    const data = await response.json();
    if (!data.error) return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  const openaiKey = getProviderKey("openai");
  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + openaiKey,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EXTRACT_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });
    const data = await response.json();
    if (!data.error) return data.choices?.[0]?.message?.content || "";
  }

  throw new Error("لا يوجد مزود AI متاح أو المفاتيح غير صالحة");
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {}, } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    // ── Rate limit ──
    const clientKey = getClientKey(request);
    const rateCheck = checkRateLimit(clientKey, AI_RATE_LIMIT);
    if (!rateCheck.allowed) return NextResponse.json({ error: `عدد الطلبات كبير — انتظر ${rateCheck.retryAfterSeconds} ثانية` }, { status: 429 });
    
    // ── Plan limits protection ──
    const { data: tData } = await supabase.from("tenants").select("id").eq("owner_id", user.id).limit(1).single();
    if (!tData) return NextResponse.json({ error: "لم يتم العثور على حساب المستأجر" }, { status: 403 });
    
    const { checkLimit } = await import("@/lib/plan-limits");
    const limitCheck = await checkLimit(tData.id, "ai_requests");
    if (!limitCheck.allowed) return NextResponse.json({ error: limitCheck.error }, { status: 403 });

    // ── Fetch Config ──
    const { data: dbKeys } = await supabase.from("ai_config").select("provider, api_key_encrypted").eq("is_active", true);

    // ── Parse input ──
    const body = await request.json();
    const { content, images } = body;
    if (!content && (!images || images.length === 0)) return NextResponse.json({ error: "يجب إرسال محتوى نصي أو صور" }, { status: 400 });

    let extracted: any = null;
    const anthropicKey = (dbKeys || []).find(k => k.provider === "anthropic")?.api_key_encrypted || process.env.ANTHROPIC_API_KEY;

    if (images && images.length > 0 && anthropicKey) {
      const imageContent = images.map((img: string) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: img.startsWith("data:image/png") ? "image/png" : "image/jpeg",
          data: img.replace(/^data:image\/\w+;base64,/, ""),
        },
      }));
      const textPart = content ? [{ type: "text", text: `هذه بيانات إضافية عن العقار:\n${content}` }] : [{ type: "text", text: "حلل هذه الصورة واستخرج بيانات العقار منها" }];
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: EXTRACT_PROMPT, messages: [{ role: "user", content: [...imageContent, ...textPart] }] }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      extracted = parseJSON(data.content?.[0]?.text || "");
    } else if (content) {
      const result = await callTextAI(content, dbKeys || []);
      extracted = parseJSON(result);
    }

    if (!extracted) return NextResponse.json({ error: "تعذّر تحليل المحتوى — حاول بصيغة مختلفة" }, { status: 422 });
    return NextResponse.json({ success: true, data: extracted });
  } catch (err: any) {
    console.error("AI Extract Error:", err);
    const msg = err?.message || "";
    if (msg.includes("API key")) return NextResponse.json({ error: "مفتاح API غير صالح" }, { status: 500 });
    if (msg.includes("rate limit") || msg.includes("429")) return NextResponse.json({ error: "انتظر قليلاً ثم حاول مجدداً" }, { status: 429 });
    return NextResponse.json({ error: "حدث خطأ أثناء التحليل — حاول مجدداً" }, { status: 500 });
  }
}


// ── Parse JSON from AI response ──
function parseJSON(raw: string): any | null {
  try {
    // Remove markdown code fences if present
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from text
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* skip */ }
    }
    return null;
  }
}
