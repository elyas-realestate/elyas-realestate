import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit, AI_RATE_LIMIT, getClientKey } from "@/lib/rate-limit";
import { safeDecrypt } from "@/lib/crypto";

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

// ── بناء خريطة المفاتيح مع فك التشفير ──
async function buildKeys(dbKeys: any[]): Promise<Record<string, string>> {
  const resolve = async (prov: string): Promise<string> => {
    const dbKey = (dbKeys || []).find((k: any) => k.provider === prov)?.api_key_encrypted;
    if (dbKey) return await safeDecrypt(dbKey);
    if (prov === "anthropic") return process.env.ANTHROPIC_API_KEY || "";
    if (prov === "google")    return process.env.GOOGLE_API_KEY    || "";
    if (prov === "openai")    return process.env.OPENAI_API_KEY    || "";
    if (prov === "groq")      return process.env.GROQ_API_KEY      || "";
    if (prov === "deepseek")  return process.env.DEEPSEEK_API_KEY  || "";
    return "";
  };
  return {
    anthropic: await resolve("anthropic"),
    google:    await resolve("google"),
    openai:    await resolve("openai"),
    groq:      await resolve("groq"),
    deepseek:  await resolve("deepseek"),
  };
}

// ── Try all providers — Fallback Chain للنصوص ──
async function callTextAI(content: string, keys: Record<string, string>): Promise<string> {
  const prompt = `حلل المحتوى التالي واستخرج بيانات العقار:\n\n${content}`;

  // Anthropic — الأفضل للاستخراج الدقيق
  if (keys.anthropic) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": keys.anthropic, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: EXTRACT_PROMPT, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    if (!data.error) return data.content?.[0]?.text || "";
  }

  // Google Gemini
  if (keys.google) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.google}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: EXTRACT_PROMPT + "\n\n" + prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 2000 } }),
      }
    );
    const data = await response.json();
    if (!data.error) return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  // OpenAI
  if (keys.openai) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + keys.openai },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: EXTRACT_PROMPT }, { role: "user", content: prompt }], temperature: 0.3, max_tokens: 2000 }),
    });
    const data = await response.json();
    if (!data.error) return data.choices?.[0]?.message?.content || "";
  }

  // Groq — مجاني وسريع
  if (keys.groq) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + keys.groq },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: EXTRACT_PROMPT }, { role: "user", content: prompt }], temperature: 0.3, max_tokens: 2000 }),
    });
    const data = await response.json();
    if (!data.error) return data.choices?.[0]?.message?.content || "";
  }

  // DeepSeek
  if (keys.deepseek) {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + keys.deepseek },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: EXTRACT_PROMPT }, { role: "user", content: prompt }], temperature: 0.3, max_tokens: 2000 }),
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
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll(_cookiesToSet) {}, } }
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
    const limitCheck = await checkLimit(supabase, "ai_requests");
    if (!limitCheck.allowed) return NextResponse.json({ error: limitCheck.reason }, { status: 403 });

    // ── Fetch Config ──
    const { data: dbKeysRaw } = await supabase.from("ai_config").select("provider, api_key_encrypted").eq("is_active", true);
    const keys = await buildKeys(dbKeysRaw || []);

    // ── Parse input ──
    const body = await request.json();
    const { content, images } = body;
    if (!content && (!images || images.length === 0)) return NextResponse.json({ error: "يجب إرسال محتوى نصي أو صور" }, { status: 400 });

    let extracted: any = null;

    if (images && images.length > 0 && keys.anthropic) {
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
        headers: { "Content-Type": "application/json", "x-api-key": keys.anthropic, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: EXTRACT_PROMPT, messages: [{ role: "user", content: [...imageContent, ...textPart] }] }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      extracted = parseJSON(data.content?.[0]?.text || "");
    } else if (content) {
      const result = await callTextAI(content, keys);
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
