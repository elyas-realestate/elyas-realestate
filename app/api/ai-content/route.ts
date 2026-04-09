import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

async function callOpenAI(model: string, systemPrompt: string, messages: any[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.OPENAI_API_KEY },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.8, max_tokens: 4000 }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(model: string, systemPrompt: string, messages: any[]) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 4000, system: systemPrompt, messages }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "";
}

async function callGoogle(model: string, systemPrompt: string, messages: any[]) {
  const lastMsg = messages[messages.length - 1]?.content || "";
  const fullPrompt = systemPrompt + "\n\n" + messages.map((m: any) => (m.role === "user" ? "المستخدم: " : "المساعد: ") + m.content).join("\n");
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + process.env.GOOGLE_API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 4000 } }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callModel(provider: string, model: string, systemPrompt: string, messages: any[]) {
  if (provider === "openai") return callOpenAI(model, systemPrompt, messages);
  if (provider === "anthropic") return callAnthropic(model, systemPrompt, messages);
  if (provider === "google") return callGoogle(model, systemPrompt, messages);
  throw new Error("مزود غير معروف: " + provider);
}

export async function POST(req: NextRequest) {
  try {
    // التحقق من جلسة المستخدم
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح — يرجى تسجيل الدخول أولاً" }, { status: 401 });

    const body = await req.json();
    const { systemPrompt, userPrompt, messages, provider, model, mode, provider2, model2 } = body;

    const p = provider || "openai";
    const m = model || "gpt-4o";

    // التحقق من وجود مفتاح API
    if (p === "openai" && !process.env.OPENAI_API_KEY) return NextResponse.json({ error: "مفتاح OpenAI API غير موجود — أضفه في الإعدادات" }, { status: 400 });
    if (p === "anthropic" && !process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "مفتاح Anthropic API غير موجود — أضفه في الإعدادات" }, { status: 400 });
    if (p === "google" && !process.env.GOOGLE_API_KEY) return NextResponse.json({ error: "مفتاح Google API غير موجود — أضفه في الإعدادات" }, { status: 400 });

    const chatMessages = messages && messages.length > 0 ? messages : [{ role: "user", content: userPrompt }];

    // وضع نموذج واحد أو بدون تحديد
    if (!mode || mode === "single") {
      const result = await callModel(p, m, systemPrompt, chatMessages);
      return NextResponse.json({ result });
    }

    // وضع الدمج (تتابع)
    if (mode === "chain") {
      const p2 = provider2 || "openai";
      const m2 = model2 || "gpt-4o";
      if (p2 === "anthropic" && !process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "مفتاح Anthropic API غير موجود للنموذج المراجع" }, { status: 400 });
      if (p2 === "google" && !process.env.GOOGLE_API_KEY) return NextResponse.json({ error: "مفتاح Google API غير موجود للنموذج المراجع" }, { status: 400 });

      const draft = await callModel(p, m, systemPrompt, chatMessages);
      const reviewPrompt = "أنت مراجع محتوى عقاري محترف. راجع المحتوى التالي وحسّنه مع الحفاظ على نفس الفكرة والأسلوب. أعد كتابة المحتوى المحسّن فقط بدون شرح:\n\n" + draft;
      const reviewed = await callModel(p2, m2, systemPrompt, [{ role: "user", content: reviewPrompt }]);
      return NextResponse.json({ result: reviewed, draft });
    }

    // وضع المقارنة
    if (mode === "compare") {
      const p2 = provider2 || "openai";
      const m2 = model2 || "gpt-4o";
      if (p2 === "anthropic" && !process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "مفتاح Anthropic API غير موجود للنموذج الثاني" }, { status: 400 });
      if (p2 === "google" && !process.env.GOOGLE_API_KEY) return NextResponse.json({ error: "مفتاح Google API غير موجود للنموذج الثاني" }, { status: 400 });

      const [result1, result2] = await Promise.all([
        callModel(p, m, systemPrompt, chatMessages),
        callModel(p2, m2, systemPrompt, chatMessages),
      ]);
      return NextResponse.json({ result: result1, result2 });
    }

    return NextResponse.json({ error: "وضع غير معروف" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
