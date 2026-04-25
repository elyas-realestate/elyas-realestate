import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";

// ══════════════════════════════════════════════════════════════
// /api/admin/ai-providers/test — اختبار صحة مفاتيح كل المزوّدين
// يرسل طلب صغير لكل مزوّد ويرجع:
//   - status: ok | invalid_key | rate_limited | network | unknown
//   - latency_ms
//   - error message (إن وُجد)
//   - balance_usd (لـ DeepSeek فقط)
//   - models_available (للمتاحين)
// ══════════════════════════════════════════════════════════════

interface ProviderResult {
  provider: string;
  label: string;
  has_key: boolean;
  status: "ok" | "invalid_key" | "rate_limited" | "network" | "unknown" | "no_key";
  latency_ms?: number;
  error?: string;
  balance_usd?: number;
  test_model?: string;
  rate_limit_remaining?: number;
  rate_limit_reset?: string;
  team_status?: string;
  billing_url?: string;
  tested_at: string;
}

// روابط مباشرة لصفحات الفواتير لكل مزوّد
const BILLING_URLS: Record<string, string> = {
  openai:    "https://platform.openai.com/settings/organization/billing/overview",
  anthropic: "https://console.anthropic.com/settings/billing",
  google:    "https://console.cloud.google.com/billing",
  groq:      "https://console.groq.com/settings/billing",
  deepseek:  "https://platform.deepseek.com/usage",
  xai:       "https://console.x.ai",
  manus:     "https://manus.ai",
};

const TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, init: RequestInit, timeout = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function classifyError(status: number, text: string): ProviderResult["status"] {
  if (status === 401 || status === 403) return "invalid_key";
  if (status === 429) return "rate_limited";
  if (status === 0) return "network";
  if (/api key|invalid.*key|unauthorized/i.test(text)) return "invalid_key";
  return "unknown";
}

// ─────────────────────────────────────────────────────────────
// OpenAI
// ─────────────────────────────────────────────────────────────
async function testOpenAI(apiKey: string): Promise<Partial<ProviderResult>> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });
    const latency_ms = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { status: classifyError(res.status, body), latency_ms, error: body.slice(0, 200) };
    }

    // محاولة جلب رصيد عبر endpoint قديم — يعمل لبعض الحسابات الترايل
    let balance_usd: number | undefined;
    try {
      const balRes = await fetchWithTimeout("https://api.openai.com/dashboard/billing/credit_grants", {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      }, 4000);
      if (balRes.ok) {
        const balData = await balRes.json();
        if (typeof balData.total_available === "number") balance_usd = balData.total_available;
      }
    } catch { /* ignore */ }

    // rate limit headers
    const rateLimitRemaining = res.headers.get("x-ratelimit-remaining-tokens");
    return {
      status: "ok",
      latency_ms,
      test_model: "gpt-4o-mini",
      balance_usd,
      rate_limit_remaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
    };
  } catch (e) {
    return { status: "network", error: e instanceof Error ? e.message : "unknown" };
  }
}

// ─────────────────────────────────────────────────────────────
// Anthropic
// ─────────────────────────────────────────────────────────────
async function testAnthropic(apiKey: string): Promise<Partial<ProviderResult>> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    const latency_ms = Date.now() - start;
    if (res.ok) return { status: "ok", latency_ms, test_model: "claude-haiku-4-5" };
    const body = await res.text().catch(() => "");
    return { status: classifyError(res.status, body), latency_ms, error: body.slice(0, 200) };
  } catch (e) {
    return { status: "network", error: e instanceof Error ? e.message : "unknown" };
  }
}

// ─────────────────────────────────────────────────────────────
// Google Gemini
// ─────────────────────────────────────────────────────────────
async function testGoogle(apiKey: string): Promise<Partial<ProviderResult>> {
  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "hi" }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });
    const latency_ms = Date.now() - start;
    if (res.ok) return { status: "ok", latency_ms, test_model: "gemini-2.5-flash" };
    const body = await res.text().catch(() => "");
    return { status: classifyError(res.status, body), latency_ms, error: body.slice(0, 200) };
  } catch (e) {
    return { status: "network", error: e instanceof Error ? e.message : "unknown" };
  }
}

// ─────────────────────────────────────────────────────────────
// Groq (OpenAI-compatible)
// ─────────────────────────────────────────────────────────────
async function testGroq(apiKey: string): Promise<Partial<ProviderResult>> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });
    const latency_ms = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { status: classifyError(res.status, body), latency_ms, error: body.slice(0, 200) };
    }
    // Groq يدعم rate limit headers
    const remaining = res.headers.get("x-ratelimit-remaining-tokens");
    const reset = res.headers.get("x-ratelimit-reset-tokens");
    return {
      status: "ok",
      latency_ms,
      test_model: "llama-3.3-70b",
      rate_limit_remaining: remaining ? parseInt(remaining, 10) : undefined,
      rate_limit_reset: reset || undefined,
    };
  } catch (e) {
    return { status: "network", error: e instanceof Error ? e.message : "unknown" };
  }
}

// ─────────────────────────────────────────────────────────────
// DeepSeek (يدعم balance API)
// ─────────────────────────────────────────────────────────────
async function testDeepSeek(apiKey: string): Promise<Partial<ProviderResult>> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });
    const latency_ms = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { status: classifyError(res.status, body), latency_ms, error: body.slice(0, 200) };
    }

    // اجلب الرصيد إذا متاح
    let balance_usd: number | undefined;
    try {
      const balRes = await fetchWithTimeout("https://api.deepseek.com/user/balance", {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      }, 5000);
      if (balRes.ok) {
        const balData = await balRes.json();
        // قد يحتوي على balance_infos[0].total_balance بدولار
        const usdInfo = balData.balance_infos?.find((b: { currency?: string }) => b.currency === "USD");
        if (usdInfo?.total_balance) balance_usd = Number(usdInfo.total_balance);
      }
    } catch { /* ignore balance failures */ }

    return { status: "ok", latency_ms, test_model: "deepseek-chat", balance_usd };
  } catch (e) {
    return { status: "network", error: e instanceof Error ? e.message : "unknown" };
  }
}

// ─────────────────────────────────────────────────────────────
// xAI (Grok)
// ─────────────────────────────────────────────────────────────
async function testXAI(apiKey: string): Promise<Partial<ProviderResult>> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-3",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });
    const latency_ms = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // إذا فيه team بدون credits، نعرف من الـ error نفسه
      const status = classifyError(res.status, body);
      return { status, latency_ms, error: body.slice(0, 200) };
    }

    // اجلب معلومات key
    let team_status: string | undefined;
    try {
      const keyRes = await fetchWithTimeout("https://api.x.ai/v1/api-key", {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      }, 4000);
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        team_status = keyData.team_blocked ? "محظور" : keyData.api_key_blocked ? "مفتاح محظور" : "نشط";
      }
    } catch { /* ignore */ }

    return { status: "ok", latency_ms, test_model: "grok-3", team_status };
  } catch (e) {
    return { status: "network", error: e instanceof Error ? e.message : "unknown" };
  }
}

// ─────────────────────────────────────────────────────────────
// Manus
// ─────────────────────────────────────────────────────────────
async function testManus(apiKey: string): Promise<Partial<ProviderResult>> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("https://api.manus.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "manus-1",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });
    const latency_ms = Date.now() - start;
    if (res.ok) return { status: "ok", latency_ms, test_model: "manus-1" };
    const body = await res.text().catch(() => "");
    return { status: classifyError(res.status, body), latency_ms, error: body.slice(0, 200) };
  } catch (e) {
    return { status: "network", error: e instanceof Error ? e.message : "unknown" };
  }
}

// ─────────────────────────────────────────────────────────────
// Main GET handler
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const check = await requireSuperAdmin(req);
  if (check instanceof NextResponse) return check;

  const tested_at = new Date().toISOString();

  const providers: Array<{
    provider: string;
    label: string;
    apiKey: string;
    test: (k: string) => Promise<Partial<ProviderResult>>;
  }> = [
    { provider: "openai",    label: "OpenAI (GPT)",        apiKey: process.env.OPENAI_API_KEY    || "", test: testOpenAI    },
    { provider: "anthropic", label: "Anthropic (Claude)",   apiKey: process.env.ANTHROPIC_API_KEY || "", test: testAnthropic },
    { provider: "google",    label: "Google (Gemini)",      apiKey: process.env.GOOGLE_API_KEY    || "", test: testGoogle    },
    { provider: "groq",      label: "Groq",                 apiKey: process.env.GROQ_API_KEY      || "", test: testGroq      },
    { provider: "deepseek",  label: "DeepSeek",             apiKey: process.env.DEEPSEEK_API_KEY  || "", test: testDeepSeek  },
    { provider: "xai",       label: "xAI (Grok)",           apiKey: process.env.XAI_API_KEY       || "", test: testXAI       },
    { provider: "manus",     label: "Manus",                apiKey: process.env.MANUS_API_KEY     || "", test: testManus     },
  ];

  const results: ProviderResult[] = await Promise.all(
    providers.map(async (p) => {
      const has_key = !!p.apiKey;
      const billing_url = BILLING_URLS[p.provider];
      if (!has_key) {
        return {
          provider: p.provider,
          label: p.label,
          has_key,
          status: "no_key" as const,
          billing_url,
          tested_at,
        };
      }
      const r = await p.test(p.apiKey);
      return {
        provider: p.provider,
        label: p.label,
        has_key,
        status: (r.status as ProviderResult["status"]) || "unknown",
        latency_ms: r.latency_ms,
        error: r.error,
        balance_usd: r.balance_usd,
        test_model: r.test_model,
        rate_limit_remaining: r.rate_limit_remaining,
        rate_limit_reset: r.rate_limit_reset,
        team_status: r.team_status,
        billing_url,
        tested_at,
      };
    })
  );

  const summary = {
    total: results.length,
    working: results.filter((r) => r.status === "ok").length,
    failing: results.filter((r) => r.status !== "ok" && r.status !== "no_key").length,
    no_key: results.filter((r) => r.status === "no_key").length,
  };

  return NextResponse.json({
    tested_at,
    summary,
    providers: results,
  });
}
