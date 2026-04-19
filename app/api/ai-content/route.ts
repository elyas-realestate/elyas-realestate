import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkLimit } from "@/lib/plan-limits";
import { safeDecrypt } from "@/lib/crypto";
import {
  checkRateLimit,
  AI_RATE_LIMIT,
  getClientKey,
} from "@/lib/rate-limit";

// ── الحد الأقصى لطول الرسالة (حرف) ──
const MAX_MESSAGE_LENGTH = 8000;
const MAX_MESSAGES_COUNT = 50;
const MAX_SYSTEM_PROMPT_LENGTH = 4000;

// ── المزودات والنماذج المسموحة ──
const ALLOWED_PROVIDERS = ["openai", "anthropic", "google", "manus"] as const;
const ALLOWED_MODES = ["single", "chain", "compare"] as const;

// ── التحقق من صحة المدخلات ──
function validateInput(body: any): { valid: true } | { valid: false; error: string } {
  // التحقق من المزود
  if (body.provider && !ALLOWED_PROVIDERS.includes(body.provider)) {
    return { valid: false, error: "مزود غير مدعوم" };
  }

  // التحقق من الوضع
  if (body.mode && !ALLOWED_MODES.includes(body.mode)) {
    return { valid: false, error: "وضع غير معروف" };
  }

  // التحقق من System Prompt
  if (body.systemPrompt && typeof body.systemPrompt === "string") {
    if (body.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
      return { valid: false, error: `System prompt طويل جداً (الحد: ${MAX_SYSTEM_PROMPT_LENGTH} حرف)` };
    }
  }

  // التحقق من الرسائل
  if (body.messages) {
    if (!Array.isArray(body.messages)) {
      return { valid: false, error: "messages يجب أن يكون مصفوفة" };
    }
    if (body.messages.length > MAX_MESSAGES_COUNT) {
      return { valid: false, error: `عدد الرسائل كبير جداً (الحد: ${MAX_MESSAGES_COUNT})` };
    }
    for (const msg of body.messages) {
      if (!msg.role || !["user", "assistant"].includes(msg.role)) {
        return { valid: false, error: "كل رسالة يجب أن تحتوي على role صالح (user/assistant)" };
      }
      if (typeof msg.content !== "string") {
        return { valid: false, error: "محتوى الرسالة يجب أن يكون نصاً" };
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return { valid: false, error: `رسالة طويلة جداً (الحد: ${MAX_MESSAGE_LENGTH} حرف)` };
      }
    }
  }

  // التحقق من userPrompt
  if (body.userPrompt && typeof body.userPrompt === "string") {
    if (body.userPrompt.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `الطلب طويل جداً (الحد: ${MAX_MESSAGE_LENGTH} حرف)` };
    }
  }

  // يجب وجود messages أو userPrompt
  if (!body.messages?.length && !body.userPrompt) {
    return { valid: false, error: "يجب إرسال رسالة أو طلب" };
  }

  return { valid: true };
}

// ── تنقية رسائل الخطأ — عدم كشف تفاصيل داخلية ──
function sanitizeError(err: any): string {
  const msg = err?.message || "";

  // رسائل معروفة وآمنة — أعدها كما هي
  if (msg.includes("API key")) return "مفتاح API غير صالح أو منتهي الصلاحية";
  if (msg.includes("rate limit") || msg.includes("429")) return "عدد الطلبات كبير — انتظر قليلاً ثم حاول مجدداً";
  if (msg.includes("timeout") || msg.includes("ECONNREFUSED")) return "تعذّر الاتصال بخدمة AI — حاول لاحقاً";
  if (msg.includes("content_policy") || msg.includes("safety")) return "المحتوى مرفوض بسبب سياسة الأمان";
  if (msg.includes("model")) return "النموذج المحدد غير متاح حالياً";
  if (msg.includes("insufficient_quota")) return "رصيد API منتهي — تواصل مع مدير المنصة";

  // رسائل غير معروفة — أعد رسالة عامة
  return "حدث خطأ أثناء المعالجة — حاول مجدداً";
}

async function callOpenAI(model: string, systemPrompt: string, messages: any[], apiKey: string) {
  if (!apiKey) throw new Error("مفتاح OpenAI منسني أو غير متاح في الإعدادات");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.8, max_tokens: 4000 }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(model: string, systemPrompt: string, messages: any[], apiKey: string) {
  if (!apiKey) throw new Error("مفتاح Anthropic منسني أو غير متاح في الإعدادات");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 4000, system: systemPrompt, messages }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "";
}

async function callGoogle(model: string, systemPrompt: string, messages: any[], apiKey: string) {
  if (!apiKey) throw new Error("مفتاح Google منسني أو غير متاح في الإعدادات");
  const fullPrompt = systemPrompt + "\n\n" + messages.map((m: any) => (m.role === "user" ? "المستخدم: " : "المساعد: ") + m.content).join("\n");
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 4000 } }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callManus(model: string, systemPrompt: string, messages: any[], apiKey: string) {
  if (!apiKey) throw new Error("مفتاح Manus منسني أو غير متاح في الإعدادات");
  const response = await fetch("https://api.manus.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ model: model || "manus-1", messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.8, max_tokens: 4000 }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || "";
}

// OpenAI-compatible endpoint helper (Groq, DeepSeek, xAI all use same schema)
async function callOpenAICompat(baseUrl: string, model: string, systemPrompt: string, messages: any[], apiKey: string, providerName: string) {
  if (!apiKey) throw new Error(`مفتاح ${providerName} غير متاح في الإعدادات`);
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.8, max_tokens: 4000 }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || "";
}

async function callModel(provider: string, model: string, systemPrompt: string, messages: any[], apiKey: string) {
  if (provider === "openai")    return callOpenAI(model, systemPrompt, messages, apiKey);
  if (provider === "anthropic") return callAnthropic(model, systemPrompt, messages, apiKey);
  if (provider === "google")    return callGoogle(model, systemPrompt, messages, apiKey);
  if (provider === "manus")     return callManus(model, systemPrompt, messages, apiKey);
  if (provider === "groq")      return callOpenAICompat("https://api.groq.com/openai/v1", model || "llama-3.3-70b-versatile", systemPrompt, messages, apiKey, "Groq");
  if (provider === "deepseek")  return callOpenAICompat("https://api.deepseek.com/v1", model || "deepseek-chat", systemPrompt, messages, apiKey, "DeepSeek");
  if (provider === "xai")       return callOpenAICompat("https://api.x.ai/v1", model || "grok-3", systemPrompt, messages, apiKey, "xAI");
  throw new Error("مزود غير معروف: " + provider);
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientKey = getClientKey(req);
    const rateLimitResult = checkRateLimit(`ai:${clientKey}`, AI_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `عدد الطلبات كبير — انتظر ${rateLimitResult.retryAfterSeconds} ثانية` },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfterSeconds),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetAt),
          },
        }
      );
    }

    // ── التحقق من جلسة المستخدم ──
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(_cookiesToSet) {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح — يرجى تسجيل الدخول أولاً" }, { status: 401 });

    // ── التحقق من حد AI حسب الخطة ──
    const limitCheck = await checkLimit(supabase, "ai_requests");
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 403 });
    }

    // ── قراءة والتحقق من المدخلات ──
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "البيانات المرسلة غير صالحة (JSON)" }, { status: 400 });
    }

    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { systemPrompt, userPrompt, messages, provider, model, mode, provider2, model2 } = body;
    const p = provider || "openai";
    const m = model || "gpt-3.5-turbo";

    // ── Fetch AI Configuration Keys Dynamically ──
    const { data: dbKeys } = await supabase
      .from("ai_config")
      .select("provider, api_key_encrypted")
      .eq("is_active", true);
      
    // Helper: يقرأ المفتاح من DB (مع فك التشفير) ثم يرجع لمتغيرات البيئة
    const getProviderKey = async (prov: string): Promise<string> => {
      const dbKey = (dbKeys || []).find(k => k.provider === prov)?.api_key_encrypted;
      if (dbKey) return await safeDecrypt(dbKey);
      if (prov === "openai")    return process.env.OPENAI_API_KEY    || "";
      if (prov === "anthropic") return process.env.ANTHROPIC_API_KEY || "";
      if (prov === "google")    return process.env.GOOGLE_API_KEY    || "";
      if (prov === "manus")     return process.env.MANUS_API_KEY     || "";
      if (prov === "groq")      return process.env.GROQ_API_KEY      || "";
      if (prov === "deepseek")  return process.env.DEEPSEEK_API_KEY  || "";
      if (prov === "xai")       return process.env.XAI_API_KEY       || "";
      return "";
    };

    const apiKey1 = await getProviderKey(p);
    if (!apiKey1) return NextResponse.json({ error: `مفتاح ${p} غير موجود — يرجى ربطه في مركز الذكاء الاصطناعي` }, { status: 400 });

    const chatMessages = messages && messages.length > 0 ? messages : [{ role: "user", content: userPrompt }];

    // ── وضع نموذج واحد ──
    if (!mode || mode === "single") {
      const result = await callModel(p, m, systemPrompt, chatMessages, apiKey1);
      return NextResponse.json(
        { result },
        { headers: { "X-RateLimit-Remaining": String(rateLimitResult.remaining) } }
      );
    }

    // ── وضع الدمج (تتابع) ──
    if (mode === "chain") {
      const p2 = provider2 || "openai";
      const m2 = model2 || "gpt-4o";
      const apiKey2 = await getProviderKey(p2);
      if (!apiKey2) return NextResponse.json({ error: `مفتاح ${p2} غير موجود للنموذج المراجع` }, { status: 400 });

      const draft = await callModel(p, m, systemPrompt, chatMessages, apiKey1);
      const reviewPrompt = "أنت مراجع محتوى عقاري محترف. راجع المحتوى التالي وحسّنه مع الحفاظ على نفس الفكرة والأسلوب. أعد كتابة المحتوى المحسّن فقط بدون شرح:\n\n" + draft;
      const reviewed = await callModel(p2, m2, systemPrompt, [{ role: "user", content: reviewPrompt }], apiKey2);
      return NextResponse.json({ result: reviewed, draft });
    }

    // ── وضع المقارنة ──
    if (mode === "compare") {
      const p2 = provider2 || "openai";
      const m2 = model2 || "gpt-4o";
      const apiKey2 = await getProviderKey(p2);
      if (!apiKey2) return NextResponse.json({ error: `مفتاح ${p2} غير موجود للنموذج الثاني` }, { status: 400 });

      const [result1, result2] = await Promise.all([
        callModel(p, m, systemPrompt, chatMessages, apiKey1),
        callModel(p2, m2, systemPrompt, chatMessages, apiKey2),
      ]);
      return NextResponse.json({ result: result1, result2 });
    }

    return NextResponse.json({ error: "وضع غير معروف" }, { status: 400 });
  } catch (err: any) {
    // ── تنقية رسائل الخطأ — لا نكشف تفاصيل داخلية ──
    console.error("[AI API Error]", err?.message);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}


