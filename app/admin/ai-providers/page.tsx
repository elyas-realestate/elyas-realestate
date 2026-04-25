"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Cpu, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Key,
  Wifi, Zap, Wallet, Loader2, Clock, ExternalLink, Activity, Users,
} from "lucide-react";

type ProviderStatus = "ok" | "invalid_key" | "rate_limited" | "network" | "unknown" | "no_key";

type ProviderResult = {
  provider: string;
  label: string;
  has_key: boolean;
  status: ProviderStatus;
  latency_ms?: number;
  error?: string;
  balance_usd?: number;
  test_model?: string;
  rate_limit_remaining?: number;
  rate_limit_reset?: string;
  team_status?: string;
  billing_url?: string;
  tested_at: string;
};

type Summary = { total: number; working: number; failing: number; no_key: number };

const STATUS_META: Record<ProviderStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  ok:           { label: "يعمل",            color: "#4ADE80", bg: "rgba(74,222,128,0.10)",  icon: CheckCircle2 },
  invalid_key:  { label: "مفتاح غير صالح",  color: "#F87171", bg: "rgba(239,68,68,0.10)",   icon: Key          },
  rate_limited: { label: "تجاوز الحد",      color: "#E8B86D", bg: "rgba(232,184,109,0.10)", icon: AlertTriangle },
  network:      { label: "خطأ شبكة",        color: "#A78BFA", bg: "rgba(124,58,237,0.10)",  icon: Wifi         },
  unknown:      { label: "خطأ غير معروف",   color: "#F87171", bg: "rgba(239,68,68,0.10)",   icon: XCircle      },
  no_key:       { label: "لا يوجد مفتاح",    color: "#71717A", bg: "rgba(113,113,122,0.10)", icon: Key          },
};

const PRICING_HINTS: Record<string, string> = {
  openai:    "$0.15/M tokens (gpt-4o-mini)",
  anthropic: "$1/M tokens (Claude Haiku) — $3/M (Sonnet)",
  google:    "$0.075/M tokens (Gemini 2.5 Flash)",
  groq:      "مجاني تجريبياً + $0.59/M tokens",
  deepseek:  "$0.14/M tokens (deepseek-chat) — أرخص خيار",
  xai:       "$3/M tokens (Grok-3)",
  manus:     "حسب الحساب",
};

export default function AIProvidersPage() {
  const [results, setResults] = useState<ProviderResult[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState("");
  const [lastRun, setLastRun] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/ai-providers/test", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setResults(json.providers || []);
      setSummary(json.summary);
      setLastRun(json.tested_at);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 60_000); // كل دقيقة
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Cpu size={20} style={{ color: "#A78BFA" }} /> صحة مزوّدي الذكاء الاصطناعي
          </h1>
          <p style={{ fontSize: 13, color: "#71717A" }}>
            اختبار حيّ لكل المفاتيح — تأكد قبل أن تشحن أي حساب
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9,
            background: autoRefresh ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${autoRefresh ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
            color: autoRefresh ? "#4ADE80" : "#A1A1AA", fontSize: 12, cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
          }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} style={{ accentColor: "#4ADE80", margin: 0 }} />
            تحديث تلقائي (كل دقيقة)
          </label>
          <button onClick={load} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
              background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
              color: "#0A0A0C", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Tajawal', sans-serif", opacity: loading ? 0.6 : 1,
            }}>
            {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />}
            اختبار الآن
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 18 }}>
          <SummaryCard label="إجمالي" value={summary.total} color="#A1A1AA" icon={Cpu} />
          <SummaryCard label="يعمل"   value={summary.working} color="#4ADE80" icon={CheckCircle2} />
          <SummaryCard label="معطّل"  value={summary.failing} color="#F87171" icon={XCircle} />
          <SummaryCard label="بدون مفتاح" value={summary.no_key} color="#71717A" icon={Key} />
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
        </div>
      )}

      {lastRun && (
        <div style={{ fontSize: 11, color: "#52525B", marginBottom: 14, display: "flex", alignItems: "center", gap: 5 }}>
          <Clock size={11} /> آخر اختبار: {new Date(lastRun).toLocaleString("ar-SA")}
        </div>
      )}

      {/* Provider cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
        {(loading && results.length === 0 ? [...Array(7)] : results).map((r, i) => {
          if (loading && !r) {
            return (
              <div key={i} style={skeletonStyle}>
                <div style={{ height: 100, background: "#1C1C1E", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
              </div>
            );
          }
          const result = r as ProviderResult;
          const meta = STATUS_META[result.status];
          const Icon = meta.icon;
          return (
            <div key={result.provider} style={{
              background: "#0F0F12", border: `1px solid ${meta.color}22`,
              borderRadius: 13, padding: 16, position: "relative",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7", marginBottom: 4 }}>{result.label}</div>
                  <div style={{ fontSize: 10, color: "#52525B", direction: "ltr" }}>{result.provider}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg,
                  padding: "4px 10px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  <Icon size={11} /> {meta.label}
                </span>
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                {result.test_model && (
                  <Row icon={Zap} label="النموذج المُختبَر" value={result.test_model} mono />
                )}
                {typeof result.latency_ms === "number" && (
                  <Row icon={Wifi} label="زمن الاستجابة"
                    value={`${result.latency_ms} ms`}
                    valueColor={result.latency_ms < 1000 ? "#4ADE80" : result.latency_ms < 3000 ? "#E8B86D" : "#F87171"} />
                )}
                {typeof result.balance_usd === "number" && (
                  <Row icon={Wallet} label="الرصيد"
                    value={`$${result.balance_usd.toFixed(2)}`}
                    valueColor={result.balance_usd < 1 ? "#F87171" : result.balance_usd < 5 ? "#E8B86D" : "#4ADE80"} />
                )}
                {typeof result.rate_limit_remaining === "number" && (
                  <Row icon={Activity} label="متبقي (هذه الدقيقة)"
                    value={result.rate_limit_remaining.toLocaleString("en-US") + " tokens"}
                    valueColor="#4ADE80" small />
                )}
                {result.team_status && (
                  <Row icon={Users} label="حالة الفريق"
                    value={result.team_status}
                    valueColor={result.team_status === "نشط" ? "#4ADE80" : "#F87171"} />
                )}
                <Row icon={Cpu} label="التكلفة التقريبية" value={PRICING_HINTS[result.provider] || "—"} small />
                {result.error && (
                  <div style={{
                    fontSize: 11, color: "#F87171", padding: "7px 10px",
                    background: "rgba(239,68,68,0.06)", borderRadius: 6,
                    direction: "ltr", textAlign: "left", maxHeight: 80, overflow: "auto",
                  }}>
                    {result.error}
                  </div>
                )}
                {result.status === "no_key" && (
                  <div style={{
                    fontSize: 11, color: "#A1A1AA", padding: "7px 10px",
                    background: "rgba(113,113,122,0.06)", borderRadius: 6, lineHeight: 1.6,
                  }}>
                    أضف <code style={{ color: "#E8B86D", direction: "ltr", display: "inline-block" }}>{envVarName(result.provider)}</code> في Vercel Environment Variables
                  </div>
                )}

                {/* Billing dashboard link */}
                {result.billing_url && (
                  <a href={result.billing_url} target="_blank" rel="noreferrer"
                    style={{
                      marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 12px", borderRadius: 8,
                      background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.18)",
                      color: "#60A5FA", fontSize: 12, fontWeight: 600, textDecoration: "none",
                    }}>
                    <ExternalLink size={12} /> افتح Dashboard المزوّد
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* تنبيه: لماذا بعض الأرصدة لا تظهر */}
      <div style={{ marginTop: 22, padding: 14, background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 10, fontSize: 12, color: "#A1A1AA", lineHeight: 1.8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA", marginBottom: 6 }}>
          ℹ️ لماذا لا يظهر الرصيد لكل المزوّدين؟
        </div>
        عرض الرصيد رقمياً يعتمد على المزوّد نفسه:
        <br />• <strong>DeepSeek</strong> فقط يدعم API عام للرصيد ✓
        <br />• <strong>OpenAI</strong> ألغى endpoint الرصيد (أحياناً يعمل للحسابات الترايل)
        <br />• <strong>Anthropic + Google + Groq + xAI</strong>: لا يوفّرون API للرصيد — استخدم زر "افتح Dashboard" لمراجعة الرصيد عند المزوّد مباشرة
      </div>

      {/* Recommendations */}
      {summary && (summary.failing > 0 || summary.no_key > 0) && !loading && (
        <div style={{ marginTop: 22, padding: 16, background: "rgba(232,184,109,0.06)", border: "1px solid rgba(232,184,109,0.2)", borderRadius: 11 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#E8B86D", marginBottom: 8 }}>
            🔧 توصيات فورية
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#A1A1AA" }}>
            {results.filter(r => r.status === "invalid_key").map(r => (
              <li key={r.provider}>• <strong style={{ color: "#F87171" }}>{r.label}</strong>: المفتاح غير صالح — جدّده في dashboard المزوّد ثم حدّث Vercel</li>
            ))}
            {results.filter(r => r.status === "rate_limited").map(r => (
              <li key={r.provider}>• <strong style={{ color: "#E8B86D" }}>{r.label}</strong>: تجاوز الحد — زِد الرصيد أو ارفع خطة الاشتراك</li>
            ))}
            {results.filter(r => r.status === "no_key").map(r => (
              <li key={r.provider}>• <strong style={{ color: "#71717A" }}>{r.label}</strong>: لا يوجد مفتاح في البيئة (اختياري)</li>
            ))}
            {results.filter(r => r.balance_usd !== undefined && r.balance_usd < 5).map(r => (
              <li key={r.provider}>• <strong style={{ color: "#E8B86D" }}>{r.label}</strong>: رصيدك منخفض (${r.balance_usd?.toFixed(2)}) — اشحن قبل النفاد</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: typeof Cpu }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: "14px 16px" }}>
      <Icon size={14} style={{ color, marginBottom: 6 }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#52525B", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value, valueColor, mono, small }: {
  icon: typeof Cpu; label: string; value: string;
  valueColor?: string; mono?: boolean; small?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#71717A", fontSize: small ? 10 : 11 }}>
        <Icon size={11} /> {label}
      </span>
      <span style={{
        color: valueColor || "#E4E4E7",
        fontSize: small ? 10 : 12,
        fontWeight: 600,
        fontFamily: mono ? "monospace" : "'Tajawal', sans-serif",
        direction: mono ? "ltr" : "rtl",
      }}>
        {value}
      </span>
    </div>
  );
}

function envVarName(provider: string): string {
  const map: Record<string, string> = {
    openai:    "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google:    "GOOGLE_API_KEY",
    groq:      "GROQ_API_KEY",
    deepseek:  "DEEPSEEK_API_KEY",
    xai:       "XAI_API_KEY",
    manus:     "MANUS_API_KEY",
  };
  return map[provider] || provider.toUpperCase() + "_API_KEY";
}

const skeletonStyle: React.CSSProperties = {
  background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 13, padding: 16,
};
