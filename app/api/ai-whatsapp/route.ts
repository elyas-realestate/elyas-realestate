import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkLimit } from "@/lib/plan-limits";
import { checkRateLimit, AI_RATE_LIMIT, getClientKey } from "@/lib/rate-limit";
import { safeDecrypt } from "@/lib/crypto";

const SYSTEM_PROMPT = `
أنت محلل بيانات عقاري خبير.
المطلوب منك هو تحليل التاريخ المرفق (Export Chat من تطبيق الواتساب) واستخراج بيانات العملاء (Leads) أو الوسطاء أو عروض العقارات التي طُرحت في المحادثة.
مخرجاتك يجب أن تكون بصيغة JSON حصراً، بدون أي نصوص إضافية أو علامات Markdown.

التنسيق المطلوب للـ JSON:
{
  "leads": [
    {
      "name": "اسم الشخص أو المرسل",
      "phone": "رقم الهاتف المستخرج من المحادثة",
      "category": "مشتري / مالك / وسيط / مستأجر",
      "budget": "الميزانية المتوقعة (إن وجدت)",
      "notes": "ملخص طلب العميل أو عرضه بأقل من 20 كلمة"
    }
  ]
}

- إذا لم تجد بيانات واضحة لعملاء، أرجع مصفوفة "leads" فارغة [].
- اقتصر التحليل على أبرز 10 جهات اتصال في الملف (لتجنب الحجم الزائد).
- تجاهل المحادثات الجانبية وركز على العروض والطلبات والأسماء.
`;

// ── محاولة استدعاء مزود بعد مزود (Fallback Chain) ──
async function extractWithFallback(text: string, keys: Record<string, string>): Promise<string> {
  const userMessage = "قم بتحليل المحادثة التالية:\n" + text;

  // OpenAI — يدعم json_object مباشرة
  if (keys.openai) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + keys.openai },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userMessage }],
        temperature: 0.1,
      }),
    });
    const data = await res.json();
    if (!data.error) return data.choices?.[0]?.message?.content || "{}";
  }

  // Groq — llama يدعم json_object
  if (keys.groq) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + keys.groq },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userMessage }],
        temperature: 0.1,
      }),
    });
    const data = await res.json();
    if (!data.error) return data.choices?.[0]?.message?.content || "{}";
  }

  // DeepSeek — يدعم json_object
  if (keys.deepseek) {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + keys.deepseek },
      body: JSON.stringify({
        model: "deepseek-chat",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userMessage }],
        temperature: 0.1,
      }),
    });
    const data = await res.json();
    if (!data.error) return data.choices?.[0]?.message?.content || "{}";
  }

  // Anthropic — لا يدعم json_object لكن يُرجع JSON إذا طلبنا صراحةً
  if (keys.anthropic) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": keys.anthropic, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    const data = await res.json();
    if (!data.error) return data.content?.[0]?.text || "{}";
  }

  // Google Gemini
  if (keys.google) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.google}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + userMessage }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
        }),
      }
    );
    const data = await res.json();
    if (!data.error) return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  }

  throw new Error("لا يوجد مزود AI متاح — يرجى إضافة مفتاح API في مركز الذكاء الاصطناعي");
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientKey = getClientKey(req);
    const rateLimitRes = checkRateLimit(clientKey, AI_RATE_LIMIT);
    if (!rateLimitRes.allowed) {
      return NextResponse.json({ error: "تم تجاوز الحد المسموح للطلبات. يرجى المحاولة لاحقاً." }, { status: 429 });
    }

    // ── Auth ──
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return req.cookies.getAll(); }, setAll(_cookiesToSet) {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    // ── Plan Limits ──
    const limitCheck = await checkLimit(supabase, "ai_requests");
    if (!limitCheck.allowed) return NextResponse.json({ error: limitCheck.reason }, { status: 403 });

    // ── Input Validation ──
    const body = await req.json();
    const { chatText } = body;
    if (!chatText || typeof chatText !== "string") {
      return NextResponse.json({ error: "النص المرفوع غير صالح" }, { status: 400 });
    }
    if (chatText.length < 10) {
      return NextResponse.json({ error: "النص المرفوع قصير جداً لفحصه" }, { status: 400 });
    }
    if (chatText.length > 200_000) {
      return NextResponse.json({ error: "النص كبير جداً — الحد الأقصى 200,000 حرف" }, { status: 413 });
    }

    // ── جلب مفاتيح AI من DB (مع فك التشفير) ثم env fallback ──
    const { data: dbKeys } = await supabase
      .from("ai_config")
      .select("provider, api_key_encrypted")
      .eq("is_active", true);

    const resolveKey = async (prov: string): Promise<string> => {
      const dbKey = (dbKeys || []).find(k => k.provider === prov)?.api_key_encrypted;
      if (dbKey) return await safeDecrypt(dbKey);
      if (prov === "openai")    return process.env.OPENAI_API_KEY    || "";
      if (prov === "anthropic") return process.env.ANTHROPIC_API_KEY || "";
      if (prov === "google")    return process.env.GOOGLE_API_KEY    || "";
      if (prov === "groq")      return process.env.GROQ_API_KEY      || "";
      if (prov === "deepseek")  return process.env.DEEPSEEK_API_KEY  || "";
      if (prov === "xai")       return process.env.XAI_API_KEY       || "";
      return "";
    };

    const keys = {
      openai:    await resolveKey("openai"),
      groq:      await resolveKey("groq"),
      deepseek:  await resolveKey("deepseek"),
      anthropic: await resolveKey("anthropic"),
      google:    await resolveKey("google"),
    };

    // ── تقليص النص إذا كان كبيراً جداً ──
    const truncatedText = chatText.substring(0, 15000);

    // ── استدعاء AI مع Fallback ──
    const jsonText = await extractWithFallback(truncatedText, keys);
    const extractedData = JSON.parse(jsonText);

    return NextResponse.json({ extracted: extractedData });

  } catch (error: any) {
    console.error("[WhatsApp Parse Error]", error.message);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة المحادثة بـ AI" }, { status: 500 });
  }
}
