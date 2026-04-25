"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  ArrowRight, Save, ExternalLink, Settings as SettingsIcon, Eye, EyeOff,
  CheckCircle2, AlertCircle, Bot, Phone, Webhook, Loader2, BookOpen,
} from "lucide-react";

type Config = {
  tenant_id: string;
  phone_number_id: string | null;
  business_account_id: string | null;
  access_token_enc: string | null;
  webhook_verify_token: string | null;
  display_phone: string | null;
  display_name: string | null;
  is_active: boolean;
  auto_reply_enabled: boolean;
  ai_provider: string;
  ai_model: string;
};

export default function WhatsAppSettings() {
  const [config, setConfig] = useState<Partial<Config>>({});
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [accessToken, setAccessToken] = useState(""); // plain — يُشفَّر قبل الحفظ
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`);
    }
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: t } = await supabase
        .from("tenants").select("id").eq("owner_id", userData.user.id).maybeSingle();
      let tid = t?.id;
      if (!tid) {
        const { data: m } = await supabase
          .from("tenant_members").select("tenant_id").eq("user_id", userData.user.id).eq("status", "active").maybeSingle();
        tid = m?.tenant_id;
      }
      if (!tid) return;
      setTenantId(tid);

      const { data: cfg } = await supabase
        .from("whatsapp_config").select("*").eq("tenant_id", tid).maybeSingle();
      if (cfg) setConfig(cfg);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function save() {
    if (!tenantId) return;
    setSaving(true);
    try {
      // إذا أدخل المستخدم access_token جديد، نشفّره عبر API endpoint
      let accessTokenEnc = config.access_token_enc;
      if (accessToken.trim()) {
        const encRes = await fetch("/api/whatsapp/encrypt-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: accessToken.trim() }),
        });
        const encJson = await encRes.json();
        if (!encRes.ok) throw new Error(encJson.error || "تشفير التوكن فشل");
        accessTokenEnc = encJson.encrypted;
      }

      const payload = {
        tenant_id: tenantId,
        phone_number_id: config.phone_number_id || null,
        business_account_id: config.business_account_id || null,
        access_token_enc: accessTokenEnc || null,
        webhook_verify_token: config.webhook_verify_token || null,
        display_phone: config.display_phone || null,
        display_name: config.display_name || null,
        is_active: !!config.is_active,
        auto_reply_enabled: config.auto_reply_enabled !== false,
        ai_provider: config.ai_provider || "openai",
        ai_model: config.ai_model || "gpt-4o-mini",
      };

      const { error } = await supabase
        .from("whatsapp_config")
        .upsert(payload, { onConflict: "tenant_id" });

      if (error) throw new Error(error.message);
      setAccessToken(""); // امسح الـ plaintext
      toast.success("تم الحفظ");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
    }
    setSaving(false);
  }

  function copy(value: string, label: string) {
    navigator.clipboard.writeText(value);
    toast.success(`${label} نُسخ`);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <Loader2 size={28} style={{ color: "#34D399", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const configured = !!(config.phone_number_id && config.access_token_enc);

  return (
    <div>
      <Link href="/dashboard/whatsapp/inbox"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 12 }}>
        <ArrowRight size={12} /> WhatsApp
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <SettingsIcon size={20} style={{ color: "#34D399" }} /> إعدادات WhatsApp Business API
      </h1>
      <p style={{ fontSize: 13, color: "#71717A", marginBottom: 22 }}>
        ربط رقم WhatsApp Business عبر Meta Cloud API لتفعيل الإرسال الفعلي والرد التلقائي
      </p>

      {/* Status banner */}
      <div style={{
        marginBottom: 18, padding: 14, borderRadius: 11,
        background: configured ? "rgba(74,222,128,0.06)" : "rgba(232,184,109,0.06)",
        border: `1px solid ${configured ? "rgba(74,222,128,0.2)" : "rgba(232,184,109,0.2)"}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {configured ? <CheckCircle2 size={18} style={{ color: "#4ADE80" }} /> : <AlertCircle size={18} style={{ color: "#E8B86D" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: configured ? "#4ADE80" : "#E8B86D" }}>
            {configured && config.is_active ? "WhatsApp Business مفعَّل ويرسل عبر Meta" : configured ? "الإعدادات محفوظة — فعّل الخدمة لبدء الإرسال" : "الإعدادات غير مكتملة"}
          </div>
          <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 3 }}>
            {configured
              ? "الرسائل تُرسل عبر Meta API. لما تختفي الإعدادات أو تُعطَّل، يرجع النظام لـ wa.me كبديل."
              : "حالياً النظام يستخدم wa.me لكل رسائل WhatsApp (يفتح المحادثة في جوّالك يدوياً)."
            }
          </div>
        </div>
      </div>

      {/* Setup guide link */}
      <Link
        href="https://github.com/elyas-realestate/elyas-realestate/blob/master/META_SETUP.md"
        target="_blank"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
          background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)",
          color: "#60A5FA", fontSize: 12, marginBottom: 18, textDecoration: "none",
        }}>
        <BookOpen size={13} /> دليل إعداد Meta خطوة بخطوة <ExternalLink size={11} />
      </Link>

      {/* Form sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Section 1: مفاتيح Meta */}
        <Card title="مفاتيح Meta Business API" icon={Phone}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            <Field label="Phone Number ID" hint="من Meta Business Manager → WhatsApp → API Setup">
              <input value={config.phone_number_id || ""} onChange={e => setConfig(c => ({ ...c, phone_number_id: e.target.value }))} style={inputStyle} placeholder="123456789012345" />
            </Field>
            <Field label="Business Account ID" hint="WhatsApp Business Account ID">
              <input value={config.business_account_id || ""} onChange={e => setConfig(c => ({ ...c, business_account_id: e.target.value }))} style={inputStyle} placeholder="987654321098765" />
            </Field>
            <Field label="Access Token (دائم)" hint="System User Access Token من Meta">
              <div style={{ position: "relative" }}>
                <input
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  style={{ ...inputStyle, paddingInlineStart: 36 }}
                  placeholder={config.access_token_enc ? "•••••••• (محفوظ، اتركه فارغاً للإبقاء)" : "EAAGm..."}
                />
                <button type="button" onClick={() => setShowToken(s => !s)}
                  style={{ position: "absolute", insetInlineStart: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#71717A", cursor: "pointer", padding: 4 }}>
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
            <Field label="رقم WhatsApp المعروض للعملاء" hint="بصيغة دولية">
              <input value={config.display_phone || ""} onChange={e => setConfig(c => ({ ...c, display_phone: e.target.value }))} style={inputStyle} placeholder="+9665xxxxxxxx" />
            </Field>
          </div>
        </Card>

        {/* Section 2: Webhook */}
        <Card title="Webhook (لاستقبال الرسائل والردود التلقائية)" icon={Webhook}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <Field label="رابط الـ Webhook (انسخه إلى Meta)" hint="ضعه في Meta Business Manager → Webhooks → Callback URL">
              <div style={{ display: "flex", gap: 8 }}>
                <input value={webhookUrl} readOnly style={{ ...inputStyle, flex: 1, color: "#34D399", direction: "ltr", textAlign: "left" }} />
                <button onClick={() => copy(webhookUrl, "الرابط")} style={btnInline}>نسخ</button>
              </div>
            </Field>
            <Field label="Verify Token" hint="نص عشوائي تختاره أنت — يجب أن يطابق نفس القيمة في Meta + متغير البيئة META_WEBHOOK_VERIFY_TOKEN">
              <div style={{ display: "flex", gap: 8 }}>
                <input value={config.webhook_verify_token || ""} onChange={e => setConfig(c => ({ ...c, webhook_verify_token: e.target.value }))} style={inputStyle} placeholder="my-secret-verify-token" />
                <button type="button" onClick={() => {
                  const random = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("");
                  setConfig(c => ({ ...c, webhook_verify_token: random }));
                  toast.success("تم توليد توكن عشوائي");
                }} style={btnInline}>توليد</button>
              </div>
            </Field>
            <div style={{ padding: 12, background: "rgba(232,184,109,0.05)", border: "1px solid rgba(232,184,109,0.15)", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "#E8B86D", fontWeight: 600, marginBottom: 4 }}>⚠ تذكير</div>
              <div style={{ fontSize: 11, color: "#A1A1AA", lineHeight: 1.7 }}>
                نفس قيمة Verify Token يجب إضافتها كمتغير بيئة في Vercel:
                <br />
                <code style={{ background: "#0A0A0C", padding: "1px 6px", borderRadius: 4, fontSize: 10, direction: "ltr", display: "inline-block", marginTop: 4 }}>META_WEBHOOK_VERIFY_TOKEN</code>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: الرد التلقائي */}
        <Card title="الرد التلقائي بالذكاء الاصطناعي" icon={Bot}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 8, marginBottom: 12 }}>
            <input
              type="checkbox" id="auto_reply"
              checked={config.auto_reply_enabled !== false}
              onChange={e => setConfig(c => ({ ...c, auto_reply_enabled: e.target.checked }))}
              style={{ marginTop: 2, accentColor: "#A78BFA", width: 16, height: 16 }} />
            <label htmlFor="auto_reply" style={{ flex: 1, fontSize: 13, color: "#E4E4E7", lineHeight: 1.7, cursor: "pointer" }}>
              تفعيل الرد التلقائي — يُرد على رسائل العملاء الواردة باستخدام AI، ويبحث في عقاراتك المنشورة لاقتراح ٣ مطابقات.
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            <Field label="مزوِّد AI">
              <select value={config.ai_provider || "openai"} onChange={e => setConfig(c => ({ ...c, ai_provider: e.target.value }))} style={inputStyle}>
                <option value="openai">OpenAI (GPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
                <option value="groq">Groq</option>
              </select>
            </Field>
            <Field label="النموذج">
              <input value={config.ai_model || ""} onChange={e => setConfig(c => ({ ...c, ai_model: e.target.value }))} style={inputStyle} placeholder="gpt-4o-mini" />
            </Field>
          </div>
        </Card>

        {/* Section 4: تفعيل */}
        <Card title="حالة التفعيل" icon={CheckCircle2}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "10px 12px", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8 }}>
            <input
              type="checkbox"
              checked={!!config.is_active}
              onChange={e => setConfig(c => ({ ...c, is_active: e.target.checked }))}
              style={{ marginTop: 2, accentColor: "#4ADE80", width: 16, height: 16 }} />
            <span style={{ flex: 1, fontSize: 13, color: "#E4E4E7", lineHeight: 1.7 }}>
              تفعيل WhatsApp Business — كل الرسائل تُرسل عبر Meta API. عند التعطيل، يستخدم النظام wa.me كبديل.
            </span>
          </label>
        </Card>

        {/* Save */}
        <button onClick={save} disabled={saving}
          style={{
            padding: "13px", borderRadius: 10,
            background: "linear-gradient(135deg, #34D399, #10B981)",
            color: "#0A0A0C", border: "none",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Tajawal', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Bot; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 18 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={15} style={{ color: "#34D399" }} /> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 12, color: "#A1A1AA" }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 10, color: "#52525B", lineHeight: 1.6 }}>{hint}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", background: "#18181B", border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif",
  outline: "none", width: "100%",
};

const btnInline: React.CSSProperties = {
  padding: "9px 14px", borderRadius: 8,
  background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
  color: "#34D399", fontSize: 12, cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
  whiteSpace: "nowrap",
};
