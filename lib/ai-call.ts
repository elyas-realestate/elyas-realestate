// ══════════════════════════════════════════════════════════════
// lib/ai-call.ts — مُوحِّد لطلبات AI من بيئة الخادم (Cron, Edge)
// يستخدم متغيرات البيئة (لا جلسة مستخدم).
// ══════════════════════════════════════════════════════════════

export type AIProvider = "openai" | "anthropic" | "google" | "groq" | "deepseek" | "xai";

export interface AICallOptions {
  provider?: AIProvider;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * استدعاء بسيط لنموذج AI من بيئة الخادم.
 * يستخدم المفاتيح من process.env.
 */
export async function generateText(opts: AICallOptions): Promise<string> {
  const provider = opts.provider || "openai";
  const temperature = opts.temperature ?? 0.8;
  const maxTokens = opts.maxTokens ?? 2000;
  const key = providerKey(provider);
  if (!key) throw new Error(`مفتاح ${provider} غير مضبوط في البيئة`);

  if (provider === "openai") {
    const model = opts.model || "gpt-4o-mini";
    return callOpenAIStyle(
      "https://api.openai.com/v1/chat/completions",
      model, opts.systemPrompt, opts.userPrompt, key, temperature, maxTokens
    );
  }
  if (provider === "anthropic") {
    const model = opts.model || "claude-haiku-4-5-20251001";
    return callAnthropic(model, opts.systemPrompt, opts.userPrompt, key, temperature, maxTokens);
  }
  if (provider === "google") {
    const model = opts.model || "gemini-2.5-flash";
    return callGoogle(model, opts.systemPrompt, opts.userPrompt, key, temperature, maxTokens);
  }
  if (provider === "groq") {
    const model = opts.model || "llama-3.3-70b-versatile";
    return callOpenAIStyle(
      "https://api.groq.com/openai/v1/chat/completions",
      model, opts.systemPrompt, opts.userPrompt, key, temperature, maxTokens
    );
  }
  if (provider === "deepseek") {
    const model = opts.model || "deepseek-chat";
    return callOpenAIStyle(
      "https://api.deepseek.com/v1/chat/completions",
      model, opts.systemPrompt, opts.userPrompt, key, temperature, maxTokens
    );
  }
  if (provider === "xai") {
    const model = opts.model || "grok-3";
    return callOpenAIStyle(
      "https://api.x.ai/v1/chat/completions",
      model, opts.systemPrompt, opts.userPrompt, key, temperature, maxTokens
    );
  }
  throw new Error(`مزود AI غير مدعوم: ${provider}`);
}

function providerKey(p: AIProvider): string {
  switch (p) {
    case "openai":    return process.env.OPENAI_API_KEY    || "";
    case "anthropic": return process.env.ANTHROPIC_API_KEY || "";
    case "google":    return process.env.GOOGLE_API_KEY    || "";
    case "groq":      return process.env.GROQ_API_KEY      || "";
    case "deepseek":  return process.env.DEEPSEEK_API_KEY  || "";
    case "xai":       return process.env.XAI_API_KEY       || "";
  }
}

async function callOpenAIStyle(
  url: string, model: string, systemPrompt: string, userPrompt: string,
  apiKey: string, temperature: number, maxTokens: number
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callAnthropic(
  model: string, systemPrompt: string, userPrompt: string,
  apiKey: string, temperature: number, maxTokens: number
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.content?.[0]?.text?.trim() || "";
}

async function callGoogle(
  model: string, systemPrompt: string, userPrompt: string,
  apiKey: string, temperature: number, maxTokens: number
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// ─────────────────────────────────────────────────────────────
// JSON output helper — أحياناً نريد JSON strict من النموذج
// ─────────────────────────────────────────────────────────────
export async function generateJSON<T = unknown>(opts: AICallOptions): Promise<T | null> {
  const raw = await generateText({
    ...opts,
    systemPrompt: opts.systemPrompt + "\n\nأجب بـ JSON صالح فقط بدون أي نص إضافي أو markdown.",
    temperature: opts.temperature ?? 0.5,
  });
  // حاول استخراج JSON من نص قد يحتوي ```json ... ```
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
