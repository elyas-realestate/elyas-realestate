"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  Bot, MessageCircle, Megaphone, Phone, BarChart3,
  Power, Save, RefreshCw, AlertCircle, Sparkles, Loader2,
} from "lucide-react";

type Settings = {
  tenant_id: string;
  receiver_enabled: boolean;
  marketer_enabled: boolean;
  followup_enabled: boolean;
  analyst_enabled: boolean;
  voice_style: string;
  language: string;
  ai_provider: string;
  ai_model: string;
  followup_cold_days: number;
  analyst_report_email: string | null;
};

type QueueCounts = {
  marketing_pending: number;
  followup_pending: number;
  conversations_count: number;
  insights_count: number;
};

const EMPLOYEES = [
  {
    id: "receiver",
    flag: "receiver_enabled",
    name: "موظف الاستقبال",
    desc: "يرد تلقائياً على رسائل واتساب العملاء ويقترح عقارات مطابقة",
    icon: Phone,
    color: "#60A5FA",
    schedule: "فوري (webhook)",
    note: "يتطلب ربط WhatsApp Business API يدوياً عبر Meta (قريباً)",
  },
  {
    id: "marketer",
    flag: "marketer_enabled",
    name: "موظف التسويق",
    desc: "يولِّد يومياً 3 منشورات لكل عقار جديد (تويتر/إنستجرام/واتساب)",
    icon: Megaphone,
    color: "#C6914C",
    schedule: "يومياً 10ص",
    note: "تراجع المنشورات في قائمة الانتظار وتوافق عليها قبل النشر",
  },
  {
    id: "followup",
    flag: "followup_enabled",
    name: "موظف المتابعة",
    desc: "يرصد العملاء الباردين ويولِّد لهم رسائل تواصل مخصَّصة",
    icon: MessageCircle,
    color: "#34D399",
    schedule: "يومياً 6م",
    note: "أنت تراجع وتضغط \"إرسال\" — ما يُرسل شيء تلقائياً",
  },
  {
    id: "analyst",
    flag: "analyst_enabled",
    name: "محلّل البيانات",
    desc: "يحلّل أداءك أسبوعياً ويقدم توصيات عملية للأسبوع القادم",
    icon: BarChart3,
    color: "#A78BFA",
    schedule: "أسبوعياً — الأحد 9ص",
    note: "التقارير تُعرض في هذه الصفحة",
  },
] as const;

const AI_PROVIDERS = [
  { value: "openai",    label: "OpenAI (GPT)",      models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"] },
  { value: "anthropic", label: "Anthropic (Claude)", models: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-6"] },
  { value: "google",    label: "Google (Gemini)",   models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"] },
  { value: "groq",      label: "Groq",              models: ["llama-3.3-70b-versatile"] },
  { value: "deepseek",  label: "DeepSeek",          models: ["deepseek-chat"] },
  { value: "xai",       label: "xAI (Grok)",        models: ["grok-3"] },
];

export default function AIEmployeesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [counts, setCounts] = useState<QueueCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const { data: s, error: sErr } = await supabase.rpc("ensure_ai_employee_settings");
      if (sErr) throw new Error(sErr.message);
      setSettings(s as Settings);

      // العدادات
      const tenantId = (s as Settings).tenant_id;
      const [mkt, fup, conv, ins] = await Promise.all([
        supabase.from("marketing_queue").select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId).eq("status", "pending"),
        supabase.from("followup_queue").select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId).eq("status", "pending"),
        supabase.from("ai_conversations").select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase.from("weekly_insights").select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
      ]);
      setCounts({
        marketing_pending:    mkt.count   || 0,
        followup_pending:     fup.count   || 0,
        conversations_count:  conv.count  || 0,
        insights_count:       ins.count   || 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التحميل");
    }
    setLoading(false);
  }

  async function saveToggle(field: keyof Settings, value: boolean | string | number) {
    if (!settings) return;
    setSaving(true);
    try {
      const { error: upErr } = await supabase
        .from("ai_employee_settings")
        .update({ [field]: value })
        .eq("tenant_id", settings.tenant_id);
      if (upErr) throw new Error(upErr.message);
      setSettings({ ...settings, [field]: value });
      toast.success("تم الحفظ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <Loader2 size={28} style={{ color: "#C6914C", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <AlertCircle size={16} style={{ color: "#F87171", display: "inline", marginInlineEnd: 8 }} />
        <span style={{ fontSize: 14, color: "#F87171" }}>{error || "لم نتمكن من تحميل الإعدادات"}</span>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Header */}
      <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Bot size={20} style={{ color: "#C6914C" }} /> موظفو الذكاء الاصطناعي
          </h1>
          <p style={{ fontSize: 13, color: "#71717A" }}>4 موظفين يعملون خلف الكواليس — تفعّل اللي تريده فقط</p>
        </div>
        <button onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", fontSize: 13, cursor: "pointer" }}>
          <RefreshCw size={13} /> تحديث
        </button>
      </div>

      {/* KPI strip */}
      {counts && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "منشورات بانتظار الموافقة", value: counts.marketing_pending, icon: Megaphone, color: "#C6914C" },
            { label: "رسائل متابعة جاهزة",       value: counts.followup_pending,  icon: MessageCircle, color: "#34D399" },
            { label: "محادثات مستقبَلة",          value: counts.conversations_count, icon: Phone, color: "#60A5FA" },
            { label: "تقارير أسبوعية",            value: counts.insights_count,    icon: BarChart3, color: "#A78BFA" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: "12px 14px" }}>
              <Icon size={14} style={{ color, marginBottom: 6 }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: "#52525B", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Employees */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14, marginBottom: 22 }}>
        {EMPLOYEES.map(emp => {
          const enabled = settings[emp.flag as keyof Settings] as boolean;
          const Icon = emp.icon;
          return (
            <div key={emp.id} style={{ background: "#0F0F12", border: `1px solid ${enabled ? emp.color + "33" : "rgba(255,255,255,0.05)"}`, borderRadius: 13, padding: 16, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${emp.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} style={{ color: emp.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7" }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: "#52525B", marginTop: 2 }}>{emp.schedule}</div>
                  </div>
                </div>
                <button
                  onClick={() => saveToggle(emp.flag as keyof Settings, !enabled)}
                  disabled={saving}
                  style={{
                    width: 42, height: 24, borderRadius: 12,
                    background: enabled ? emp.color : "#27272A",
                    border: "none", cursor: saving ? "not-allowed" : "pointer",
                    position: "relative", transition: "background 0.2s",
                  }}
                  aria-label={enabled ? "تعطيل" : "تفعيل"}
                >
                  <span style={{
                    position: "absolute", top: 2, insetInlineStart: enabled ? 20 : 2,
                    width: 20, height: 20, borderRadius: "50%", background: "#fff",
                    transition: "inset-inline-start 0.2s",
                  }} />
                </button>
              </div>
              <p style={{ fontSize: 12.5, color: "#A1A1AA", lineHeight: 1.6, marginBottom: 10 }}>{emp.desc}</p>
              <div style={{ fontSize: 11, color: "#71717A", padding: "8px 10px", background: "#18181B", borderRadius: 7, borderInlineStart: `3px solid ${emp.color}` }}>
                {emp.note}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared AI settings */}
      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} style={{ color: "#C6914C" }} /> إعدادات الذكاء الاصطناعي
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          <Field label="مزوِّد AI">
            <select
              value={settings.ai_provider}
              onChange={e => saveToggle("ai_provider", e.target.value)}
              style={selectStyle}>
              {AI_PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>

          <Field label="النموذج">
            <select
              value={settings.ai_model}
              onChange={e => saveToggle("ai_model", e.target.value)}
              style={selectStyle}>
              {(AI_PROVIDERS.find(p => p.value === settings.ai_provider)?.models || []).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="نبرة الكتابة">
            <select
              value={settings.voice_style}
              onChange={e => saveToggle("voice_style", e.target.value)}
              style={selectStyle}>
              <option value="professional">محترفة</option>
              <option value="friendly">ودّية</option>
              <option value="formal">رسمية</option>
            </select>
          </Field>

          <Field label="اللغة">
            <select
              value={settings.language}
              onChange={e => saveToggle("language", e.target.value)}
              style={selectStyle}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </Field>

          <Field label="أيام العميل البارد (لموظف المتابعة)">
            <input
              type="number" min={3} max={90}
              value={settings.followup_cold_days}
              onChange={e => saveToggle("followup_cold_days", Number(e.target.value))}
              style={inputStyle} />
          </Field>

          <Field label="بريد استلام تقرير المحلل">
            <input
              type="email"
              placeholder="اتركه فارغاً للاستخدام الافتراضي"
              value={settings.analyst_report_email || ""}
              onBlur={e => saveToggle("analyst_report_email", e.target.value || "")}
              onChange={e => setSettings({ ...settings, analyst_report_email: e.target.value })}
              style={inputStyle} />
          </Field>
        </div>

        <p style={{ fontSize: 11, color: "#52525B", marginTop: 14 }}>
          التغييرات تُحفظ تلقائياً.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#A1A1AA" }}>{label}</span>
      {children}
    </label>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "9px 12px", background: "#18181B", border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif",
  outline: "none", cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", background: "#18181B", border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif",
  outline: "none",
};
