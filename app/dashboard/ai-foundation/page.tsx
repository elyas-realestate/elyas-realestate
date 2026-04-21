"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import {
  Brain, Settings, BookOpen, Plus, X, Check, Trash2,
  Cpu, Key, Thermometer, Save, MessageSquare, RefreshCw,
  CheckCircle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#3A3A42] focus:outline-none focus:border-[#C6914C] transition";
const lbl = "block text-xs font-semibold text-[#9A9AA0] mb-2 tracking-wide";

const PROVIDERS = [
  { id: "openai",    name: "OpenAI (ChatGPT)",    envKey: "OPENAI_API_KEY",    color: "#4ADE80", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"] },
  { id: "anthropic", name: "Anthropic (Claude)",   envKey: "ANTHROPIC_API_KEY", color: "#A78BFA", models: ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5-20251001"] },
  { id: "google",    name: "Google (Gemini)",      envKey: "GOOGLE_API_KEY",    color: "#60A5FA", models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"] },
  { id: "groq",      name: "Groq (سريع مجاناً)",  envKey: "GROQ_API_KEY",      color: "#F97316", models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"] },
  { id: "deepseek",  name: "DeepSeek",             envKey: "DEEPSEEK_API_KEY",  color: "#38BDF8", models: ["deepseek-chat", "deepseek-reasoner"] },
  { id: "xai",       name: "xAI (Grok)",           envKey: "XAI_API_KEY",       color: "#EC4899", models: ["grok-3", "grok-3-mini"] },
  { id: "manus",     name: "Manus",                envKey: "MANUS_API_KEY",     color: "#FACC15", models: ["manus-1"] },
];

const PERSONALITIES = [
  { id: "professional", label: "احترافي", desc: "لغة رسمية ومهنية" },
  { id: "casual", label: "عفوي", desc: "أسلوب سهل وودي" },
  { id: "friendly", label: "ودود", desc: "قريب من العميل" },
];

const KNOWLEDGE_CATS = ["عام", "عقارات", "عملاء", "سوق", "قانوني", "تسويق"];

type Tab = "prompts" | "providers" | "knowledge";

export default function AIFoundationPage() {
  const [tab, setTab] = useState<Tab>("prompts");
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [saving, setSaving] = useState(false);

  // Config state
  const [config, setConfig] = useState({
    system_prompt: "",
    personality: "professional",
    response_language: "ar",
    default_provider: "openai",
    default_model: "gpt-4o",
    temperature: 0.8,
    max_tokens: 4000,
  });

  // Knowledge state
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [showAddKB, setShowAddKB] = useState(false);
  const [kbForm, setKbForm] = useState({ title: "", content: "", category: "عام" });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    // Load config
    const { data: cfg, error } = await supabase.from("ai_config").select("*").limit(1).single();
    if (error?.message?.includes("does not exist")) { setMissingTable(true); setLoading(false); return; }
    if (cfg) {
      setConfig({
        system_prompt: cfg.system_prompt || "",
        personality: cfg.personality || "professional",
        response_language: cfg.response_language || "ar",
        default_provider: cfg.default_provider || "openai",
        default_model: cfg.default_model || "gpt-4o",
        temperature: cfg.temperature ?? 0.8,
        max_tokens: cfg.max_tokens ?? 4000,
      });
    }
    // Load knowledge
    const { data: kb } = await supabase.from("ai_knowledge").select("*").eq("is_active", true).order("created_at", { ascending: false });
    setKnowledge(kb || []);
    setLoading(false);
  }

  async function saveConfig() {
    setSaving(true);
    // Upsert config
    const { data: existing } = await supabase.from("ai_config").select("id").limit(1).single();
    if (existing?.id) {
      await supabase.from("ai_config").update(config).eq("id", existing.id);
    } else {
      await supabase.from("ai_config").insert([config]);
    }
    setSaving(false);
    toast.success("تم حفظ إعدادات الذكاء الاصطناعي");
  }

  async function addKnowledge() {
    if (!kbForm.title.trim() || !kbForm.content.trim()) { toast.error("أدخل العنوان والمحتوى"); return; }
    await supabase.from("ai_knowledge").insert([kbForm]);
    toast.success("تمت إضافة المعرفة");
    setKbForm({ title: "", content: "", category: "عام" });
    setShowAddKB(false);
    loadAll();
  }

  async function deleteKnowledge(id: string) {
    if (!confirm("حذف هذا العنصر؟")) return;
    await supabase.from("ai_knowledge").delete().eq("id", id);
    toast.success("تم الحذف");
    loadAll();
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "prompts", label: "التوجيهات", icon: MessageSquare },
    { id: "providers", label: "التكاملات", icon: Cpu },
    { id: "knowledge", label: "قاعدة المعرفة", icon: BookOpen },
  ];

  if (loading) return (
    <div dir="rtl" className="space-y-4">
      <div className="skeleton h-8 rounded w-64 mb-6" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  if (missingTable) return (
    <div dir="rtl" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Brain size={28} style={{ color: "#C6914C" }} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 12 }}>يلزم تفعيل مركز الذكاء الاصطناعي</h2>
      <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8 }}>
        شغّل <code style={{ background: "#1C1C22", padding: "2px 8px", borderRadius: 6, color: "#C6914C" }}>supabase/012_ai_config.sql</code> في Supabase → SQL Editor
      </p>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain size={22} style={{ color: "#C6914C" }} />
          <h2 className="text-2xl font-bold">مركز تأسيس الذكاء الاصطناعي</h2>
        </div>
        <p style={{ color: "#5A5A62", fontSize: 13 }}>خصّص توجيهات AI وربط المزودين وبناء قاعدة المعرفة</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{
              background: tab === t.id ? "rgba(198,145,76,0.12)" : "#16161A",
              border: "1px solid " + (tab === t.id ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.09)"),
              color: tab === t.id ? "#C6914C" : "#5A5A62",
              cursor: "pointer",
            }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab: التوجيهات ═══ */}
      {tab === "prompts" && (
        <div className="space-y-5">
          <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
            <h3 className="font-bold mb-4" style={{ fontSize: 14, color: "#C6914C" }}>
              <MessageSquare size={14} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }} />
              التوجيه الرئيسي (System Prompt)
            </h3>
            <p style={{ fontSize: 12, color: "#5A5A62", marginBottom: 12, lineHeight: 1.7 }}>
              هذا التوجيه سيُطبق على <strong style={{ color: "#C6914C" }}>جميع</strong> نماذج الـ AI (ChatGPT, Claude, Gemini, Manus). اكتب شخصية وأسلوب المساعد المطلوب.
            </p>
            <textarea value={config.system_prompt}
              onChange={e => setConfig(c => ({ ...c, system_prompt: e.target.value }))}
              rows={6} className={inp}
              placeholder="مثال: أنت مساعد عقاري لشركة إلياس الدخيل العقارية. متخصص في سوق الرياض..." />
            <p style={{ fontSize: 10, color: "#3A3A42", marginTop: 6 }}>
              {config.system_prompt.length}/4000 حرف
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Personality */}
            <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <h3 className="font-bold mb-4" style={{ fontSize: 14, color: "#C6914C" }}>الشخصية</h3>
              <div className="space-y-2">
                {PERSONALITIES.map(p => (
                  <button key={p.id} onClick={() => setConfig(c => ({ ...c, personality: p.id }))}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm transition"
                    style={{
                      background: config.personality === p.id ? "rgba(198,145,76,0.08)" : "#1C1C22",
                      border: "1px solid " + (config.personality === p.id ? "rgba(198,145,76,0.25)" : "rgba(90,90,98,0.15)"),
                      color: config.personality === p.id ? "#C6914C" : "#9A9AA0",
                      cursor: "pointer", textAlign: "right",
                    }}>
                    <span className="font-semibold">{p.label}</span>
                    <span style={{ fontSize: 11, color: "#5A5A62" }}>{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language + Advanced */}
            <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <h3 className="font-bold mb-4" style={{ fontSize: 14, color: "#C6914C" }}>إعدادات متقدمة</h3>
              <div className="space-y-4">
                <div>
                  <label className={lbl}>لغة الرد</label>
                  <select value={config.response_language} onChange={e => setConfig(c => ({ ...c, response_language: e.target.value }))} className={inp}>
                    <option value="ar">العربية فقط</option>
                    <option value="en">الإنجليزية فقط</option>
                    <option value="ar+en">عربي + إنجليزي</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>الإبداعية (Temperature): {config.temperature}</label>
                  <input type="range" min="0" max="1" step="0.1" value={config.temperature}
                    onChange={e => setConfig(c => ({ ...c, temperature: parseFloat(e.target.value) }))}
                    style={{ width: "100%", accentColor: "#C6914C" }} />
                  <div className="flex justify-between" style={{ fontSize: 10, color: "#5A5A62" }}>
                    <span>دقيق</span><span>إبداعي</span>
                  </div>
                </div>
                <div>
                  <label className={lbl}>حد الكلمات (Max Tokens)</label>
                  <input type="number" value={config.max_tokens} onChange={e => setConfig(c => ({ ...c, max_tokens: parseInt(e.target.value) || 4000 }))} className={inp} dir="ltr" />
                </div>
              </div>
            </div>
          </div>

          <button onClick={saveConfig} disabled={saving}
            className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 14, cursor: "pointer", border: "none" }}>
            <Save size={16} /> {saving ? "جاري الحفظ..." : "حفظ التوجيهات"}
          </button>
        </div>
      )}

      {/* ═══ Tab: التكاملات ═══ */}
      {tab === "providers" && (
        <div className="space-y-5">
          <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
            <h3 className="font-bold mb-2" style={{ fontSize: 14, color: "#C6914C" }}>
              <Key size={14} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }} />
              المزود الافتراضي
            </h3>
            <p style={{ fontSize: 12, color: "#5A5A62", marginBottom: 16 }}>اختر المزود الافتراضي لجميع عمليات AI</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => setConfig(c => ({ ...c, default_provider: p.id }))}
                  className="rounded-xl p-4 text-center transition"
                  style={{
                    background: config.default_provider === p.id ? p.color + "12" : "#1C1C22",
                    border: "2px solid " + (config.default_provider === p.id ? p.color : "rgba(90,90,98,0.15)"),
                    cursor: "pointer",
                  }}>
                  <div className="mx-auto mb-2 rounded-full" style={{ width: 36, height: 36, background: p.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Cpu size={16} style={{ color: p.color }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: config.default_provider === p.id ? p.color : "#9A9AA0" }}>{p.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROVIDERS.map(p => (
              <div key={p.id} className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg" style={{ width: 32, height: 32, background: p.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Cpu size={14} style={{ color: p.color }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#E5E5E5" }}>{p.name}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#FACC15" }}>
                    <AlertCircle size={12} /> يلزم مفتاح
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#5A5A62", lineHeight: 1.7 }}>
                  أضف <code style={{ background: "#1C1C22", padding: "1px 6px", borderRadius: 4, color: p.color, fontSize: 11 }}>{p.envKey}</code> في ملف <code style={{ background: "#1C1C22", padding: "1px 6px", borderRadius: 4, color: "#C6914C", fontSize: 11 }}>.env.local</code>
                </p>
              </div>
            ))}
          </div>

          <button onClick={saveConfig} disabled={saving}
            className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 14, cursor: "pointer", border: "none" }}>
            <Save size={16} /> حفظ الإعدادات
          </button>
        </div>
      )}

      {/* ═══ Tab: قاعدة المعرفة ═══ */}
      {tab === "knowledge" && (
        <div className="space-y-5">
          <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold" style={{ fontSize: 14, color: "#C6914C" }}>
                  <BookOpen size={14} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }} />
                  قاعدة المعرفة ({knowledge.length})
                </h3>
                <p style={{ fontSize: 12, color: "#5A5A62" }}>المعلومات التي يتعلمها AI ويستخدمها في ردوده</p>
              </div>
              <button onClick={() => setShowAddKB(v => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition"
                style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", cursor: "pointer", border: "none" }}>
                <Plus size={14} /> إضافة معرفة
              </button>
            </div>

            {/* Add KB Form */}
            {showAddKB && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#1C1C22", border: "1px solid rgba(198,145,76,0.15)" }}>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className={lbl}>العنوان *</label>
                      <input value={kbForm.title} onChange={e => setKbForm(f => ({ ...f, title: e.target.value }))} className={inp} placeholder="مثال: أحياء الرياض الشمالية" />
                    </div>
                    <div>
                      <label className={lbl}>التصنيف</label>
                      <select value={kbForm.category} onChange={e => setKbForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                        {KNOWLEDGE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>المحتوى *</label>
                    <textarea value={kbForm.content} onChange={e => setKbForm(f => ({ ...f, content: e.target.value }))} rows={4} className={inp}
                      placeholder="اكتب المعلومات التي تريد أن يعرفها AI. مثال: أسعار الفلل في حي النرجس تتراوح بين..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addKnowledge} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(74,222,128,0.08)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)", cursor: "pointer" }}>
                      <Check size={12} /> إضافة
                    </button>
                    <button onClick={() => setShowAddKB(false)} style={{ padding: "10px 16px", borderRadius: 12, background: "#1C1C22", color: "#9A9AA0", fontSize: 12, border: "1px solid rgba(198,145,76,0.1)", cursor: "pointer" }}>
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Knowledge List */}
            {knowledge.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen size={32} style={{ color: "#3A3A42", margin: "0 auto 10px" }} />
                <p style={{ color: "#5A5A62", fontSize: 13 }}>لا توجد معرفة مضافة بعد</p>
                <p style={{ color: "#3A3A42", fontSize: 11, marginTop: 4 }}>أضف معلومات عن السوق والأحياء والأسعار ليستخدمها AI</p>
              </div>
            ) : (
              <div className="space-y-2">
                {knowledge.map(kb => (
                  <div key={kb.id} className="flex items-start gap-3 p-4 rounded-xl transition"
                    style={{ background: "#1C1C22", border: "1px solid rgba(90,90,98,0.1)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E5" }}>{kb.title}</h4>
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(198,145,76,0.08)", color: "#C6914C" }}>{kb.category}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#5A5A62", lineHeight: 1.6 }} className="line-clamp-2">{kb.content}</p>
                    </div>
                    <button onClick={() => deleteKnowledge(kb.id)} style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", flexShrink: 0, padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
