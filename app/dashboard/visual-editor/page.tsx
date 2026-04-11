"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Save, Check, RotateCcw, Palette, Type, Monitor, Smartphone, ChevronDown, ChevronUp } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const defaults = {
  color_accent:         "#C6914C",
  color_accent_dark:    "#A6743A",
  color_bg_primary:     "#0A0A0C",
  color_bg_secondary:   "#111114",
  color_bg_card:        "#16161A",
  color_text_primary:   "#F5F5F5",
  color_text_secondary: "#9A9AA0",
  color_text_muted:     "#5A5A62",
  font_size_hero:        "clamp(2.4rem, 5.5vw, 4.2rem)",
  font_size_section_title: "clamp(1.8rem, 3.5vw, 2.6rem)",
  font_size_body:        "15px",
  font_size_small:       "13px",
};

const colorGroups = [
  {
    id: "accent",
    label: "اللون الذهبي",
    fields: [
      { key: "color_accent",      label: "الذهبي الرئيسي",  desc: "الأزرار والعناوين" },
      { key: "color_accent_dark", label: "الذهبي الداكن",   desc: "تدرج الأزرار والهوفر" },
    ],
  },
  {
    id: "bg",
    label: "الخلفيات",
    fields: [
      { key: "color_bg_primary",   label: "الخلفية الرئيسية", desc: "لون الخلفية الأساسي" },
      { key: "color_bg_secondary", label: "الخلفية الفرعية",  desc: "أقسام متناوبة" },
      { key: "color_bg_card",      label: "خلفية البطاقات",   desc: "الكروت والصناديق" },
    ],
  },
  {
    id: "text",
    label: "النصوص",
    fields: [
      { key: "color_text_primary",   label: "النص الرئيسي", desc: "العناوين والنصوص" },
      { key: "color_text_secondary", label: "النص الثانوي", desc: "الأوصاف والفقرات" },
      { key: "color_text_muted",     label: "النص الخافت",  desc: "التواريخ والتفاصيل" },
    ],
  },
];

const quickThemes = [
  {
    name: "الذهبي الداكن",
    emoji: "🟤",
    colors: { color_accent: "#C6914C", color_accent_dark: "#A6743A", color_bg_primary: "#0A0A0C", color_bg_secondary: "#111114", color_bg_card: "#16161A", color_text_primary: "#F5F5F5", color_text_secondary: "#9A9AA0", color_text_muted: "#5A5A62" },
  },
  {
    name: "الأزرق الملكي",
    emoji: "🔵",
    colors: { color_accent: "#5B8DEF", color_accent_dark: "#3B6DCF", color_bg_primary: "#08090F", color_bg_secondary: "#0E1020", color_bg_card: "#131526", color_text_primary: "#F0F4FF", color_text_secondary: "#8A95B0", color_text_muted: "#525870" },
  },
  {
    name: "الأخضر الفاخر",
    emoji: "🟢",
    colors: { color_accent: "#4ADE80", color_accent_dark: "#2AB860", color_bg_primary: "#060C0A", color_bg_secondary: "#0A1510", color_bg_card: "#101A14", color_text_primary: "#F0FFF4", color_text_secondary: "#7AA886", color_text_muted: "#4A6854" },
  },
  {
    name: "البنفسجي",
    emoji: "🟣",
    colors: { color_accent: "#A78BFA", color_accent_dark: "#7C5FD4", color_bg_primary: "#080810", color_bg_secondary: "#0F0F1A", color_bg_card: "#141420", color_text_primary: "#F5F0FF", color_text_secondary: "#9590A8", color_text_muted: "#555068" },
  },
];

const fontPresets = [
  {
    key: "font_size_hero",
    label: "العنوان الرئيسي (Hero)",
    desc: "العنوان الكبير في أعلى الصفحة",
    presets: [
      { label: "صغير",   value: "clamp(2rem, 4vw, 3rem)" },
      { label: "متوسط",  value: "clamp(2.4rem, 5.5vw, 4.2rem)" },
      { label: "كبير",   value: "clamp(3rem, 6vw, 5rem)" },
    ],
  },
  {
    key: "font_size_section_title",
    label: "عناوين الأقسام",
    desc: "لماذا تختارنا، الخدمات...",
    presets: [
      { label: "صغير",   value: "clamp(1.4rem, 2.5vw, 2rem)" },
      { label: "متوسط",  value: "clamp(1.8rem, 3.5vw, 2.6rem)" },
      { label: "كبير",   value: "clamp(2.2rem, 4vw, 3.2rem)" },
    ],
  },
];

const fontSliders = [
  { key: "font_size_body",  label: "حجم النص العادي",  desc: "الأوصاف والفقرات", min: 12, max: 20, defaultVal: 15 },
  { key: "font_size_small", label: "حجم النص الصغير", desc: "التواريخ والتفاصيل", min: 10, max: 18, defaultVal: 13 },
];

function parsePx(val: string | undefined, def: number): number {
  if (!val) return def;
  const n = parseInt(val);
  return isNaN(n) ? def : n;
}

export default function VisualEditorPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [activeTab, setActiveTab] = useState<"colors" | "fonts">("colors");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from("site_settings").select("*").limit(1).single();
    if (data) setSettings(data);
    setLoading(false);
  }

  function handleChange(key: string, value: string) {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  }

  function applyTheme(theme: (typeof quickThemes)[0]) {
    setSettings((prev: any) => ({ ...prev, ...theme.colors }));
  }

  function resetAll() {
    setSettings((prev: any) => ({ ...prev, ...defaults }));
  }

  async function handleSave() {
    setSaving(true);
    const { id, created_at, ...updateData } = settings;
    await supabase.from("site_settings").update(updateData).eq("id", settings.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function toggleCollapse(id: string) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) return (
    <div dir="rtl" className="p-4 space-y-4">
      <div className="skeleton h-8 rounded w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        <div className="skeleton rounded-xl h-[500px]" />
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="skeleton h-16 rounded-xl"/>)}</div>
      </div>
    </div>
  );
  if (!settings) return <div className="text-red-400 text-center py-20">لم يتم العثور على الإعدادات</div>;

  const s = settings;
  const accent       = s.color_accent        || defaults.color_accent;
  const accentDark   = s.color_accent_dark   || defaults.color_accent_dark;
  const bgPrimary    = s.color_bg_primary    || defaults.color_bg_primary;
  const bgSecondary  = s.color_bg_secondary  || defaults.color_bg_secondary;
  const bgCard       = s.color_bg_card       || defaults.color_bg_card;
  const textPrimary  = s.color_text_primary  || defaults.color_text_primary;
  const textSec      = s.color_text_secondary|| defaults.color_text_secondary;
  const textMuted    = s.color_text_muted    || defaults.color_text_muted;
  const heroSize     = s.font_size_hero      || defaults.font_size_hero;
  const sectionSize  = s.font_size_section_title || defaults.font_size_section_title;
  const bodySize     = s.font_size_body      || defaults.font_size_body;
  const smallSize    = s.font_size_small     || defaults.font_size_small;

  return (
    <div dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-1">المحرر البصري</h2>
          <p style={{ color: "#5A5A62", fontSize: 14 }}>غيّر الألوان والخطوط وشاهد النتيجة مباشرة</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition"
            style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", color: "#9A9AA0" }}
          >
            <RotateCcw size={14} /> إعادة ضبط المصنع
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition"
            style={{ background: saved ? "#22C55E" : "linear-gradient(135deg, #C6914C, #A6743A)", color: "#0A0A0C" }}
          >
            {saved ? <><Check size={16} /> تم الحفظ</> : saving ? <><Save size={16} className="animate-spin" /> جاري...</> : <><Save size={16} /> حفظ التغييرات</>}
          </button>
        </div>
      </div>

      {/* ═══ Main Grid: Preview LEFT (60%), Controls RIGHT (40%) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

        {/* ══ LEFT: Live Preview ══ */}
        <div className="order-2 lg:order-1">
          <div className="rounded-xl overflow-hidden sticky top-20" style={{ border: "1px solid rgba(198,145,76,0.15)" }}>
            {/* Browser chrome */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#1C1C22", borderBottom: "1px solid rgba(198,145,76,0.08)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "#F87171" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#FBBF24" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#4ADE80" }} />
              </div>
              <span className="text-xs font-bold" style={{ color: "#C6914C" }}>معاينة مباشرة</span>
              {/* Device Toggle */}
              <div className="flex bg-[#0A0A0C] rounded-lg overflow-hidden border border-[rgba(198,145,76,0.12)]">
                <button
                  onClick={() => setMobilePreview(false)}
                  className={"flex items-center gap-1 px-2.5 py-1.5 text-xs transition " + (!mobilePreview ? "text-[#C6914C]" : "text-[#5A5A62]")}
                  style={{ background: !mobilePreview ? "rgba(198,145,76,0.12)" : "transparent" }}
                >
                  <Monitor size={13} /> ديسكتوب
                </button>
                <button
                  onClick={() => setMobilePreview(true)}
                  className={"flex items-center gap-1 px-2.5 py-1.5 text-xs transition " + (mobilePreview ? "text-[#C6914C]" : "text-[#5A5A62]")}
                  style={{ background: mobilePreview ? "rgba(198,145,76,0.12)" : "transparent" }}
                >
                  <Smartphone size={13} /> موبايل
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div style={{ background: "#1C1C22", padding: mobilePreview ? "16px" : "0", minHeight: 520, overflowY: "auto" }}>
              <div
                style={{
                  background: bgPrimary,
                  fontFamily: "'Tajawal', sans-serif",
                  width: mobilePreview ? 375 : "100%",
                  margin: mobilePreview ? "0 auto" : "0",
                  borderRadius: mobilePreview ? 16 : 0,
                  overflow: "hidden",
                  border: mobilePreview ? "1px solid rgba(198,145,76,0.2)" : "none",
                }}
                dir="rtl"
              >
                {/* Navbar */}
                <div className="flex items-center justify-between" style={{ padding: "12px 20px", background: bgCard, borderBottom: `1px solid ${accent}20` }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${accent}, ${accentDark})`, color: bgPrimary, fontSize: 11, fontFamily: "'Noto Kufi Arabic', serif", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>إ</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>{s.site_name || "إلياس الدخيل"}</span>
                  </div>
                  <div className="flex gap-3">
                    <span style={{ fontSize: 10, color: textSec }}>الرئيسية</span>
                    <span style={{ fontSize: 10, color: textSec }}>العقارات</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: bgPrimary, background: `linear-gradient(135deg, ${accent}, ${accentDark})`, padding: "3px 10px", borderRadius: 6 }}>تواصل</span>
                  </div>
                </div>

                {/* Hero */}
                <div className="text-center" style={{ padding: "40px 20px 30px" }}>
                  <div style={{ display: "inline-block", fontSize: 9, color: accent, background: `${accent}15`, border: `1px solid ${accent}30`, borderRadius: 50, padding: "4px 12px", marginBottom: 12 }}>وسيط عقاري مرخّص</div>
                  <h1 style={{ fontFamily: "'Noto Kufi Arabic', serif", fontSize: heroSize, fontWeight: 900, lineHeight: 1.25, color: textPrimary, marginBottom: 10 }}>
                    نختصر عليك <span style={{ color: accent }}>الطريق</span>
                  </h1>
                  <p style={{ fontSize: bodySize, color: textSec, lineHeight: 1.8, maxWidth: 360, margin: "0 auto 20px" }}>{s.hero_subtitle || "من البحث إلى التملّك، خبرة عملية في سوق الرياض"}</p>
                  <div className="flex justify-center gap-2">
                    <span style={{ fontSize: 11, fontWeight: 700, color: bgPrimary, background: `linear-gradient(135deg, ${accent}, ${accentDark})`, padding: "7px 18px", borderRadius: 8 }}>واتساب</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: textPrimary, border: `1px solid ${accent}25`, padding: "7px 18px", borderRadius: 8 }}>اتصال</span>
                  </div>
                </div>

                {/* Section */}
                <div style={{ padding: "30px 20px", background: bgSecondary }}>
                  <div className="text-center" style={{ marginBottom: 18 }}>
                    <span style={{ fontSize: 9, color: accent, letterSpacing: 1 }}>— القيمة المضافة —</span>
                    <h2 style={{ fontFamily: "'Noto Kufi Arabic', serif", fontSize: sectionSize, fontWeight: 800, color: textPrimary, lineHeight: 1.3, marginTop: 4 }}>لماذا تختار إلياس؟</h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[{ icon: "🎯", title: "معرفة بالسوق" }, { icon: "⚡", title: "سرعة التنفيذ" }].map((card, i) => (
                      <div key={i} style={{ background: bgCard, border: `1px solid ${accent}15`, borderRadius: 12, padding: "14px 12px" }}>
                        <span style={{ fontSize: 18 }}>{card.icon}</span>
                        <h3 style={{ fontFamily: "'Noto Kufi Arabic', serif", fontSize: bodySize, fontWeight: 700, color: textPrimary, marginTop: 6, marginBottom: 4 }}>{card.title}</h3>
                        <p style={{ fontSize: smallSize, color: textSec, lineHeight: 1.6 }}>خبرة ميدانية في أحياء الرياض</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center" style={{ padding: "28px 20px", background: bgPrimary }}>
                  <div style={{ background: bgCard, border: `1px solid ${accent}15`, borderRadius: 14, padding: "22px 16px" }}>
                    <h3 style={{ fontFamily: "'Noto Kufi Arabic', serif", fontSize: bodySize, fontWeight: 800, color: textPrimary, marginBottom: 6 }}>عندك عقار؟</h3>
                    <p style={{ fontSize: smallSize, color: textSec, marginBottom: 14 }}>تواصل معي مباشرة</p>
                    <div className="flex justify-center gap-2">
                      <span style={{ fontSize: 11, fontWeight: 700, color: bgPrimary, background: `linear-gradient(135deg, ${accent}, ${accentDark})`, padding: "6px 16px", borderRadius: 8 }}>واتساب</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: textPrimary, border: `1px solid ${accent}20`, padding: "6px 16px", borderRadius: 8 }}>اتصال</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "14px 20px", background: bgSecondary, borderTop: `1px solid ${accent}12` }}>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: 10, color: textMuted }}>© {s.site_name || "إلياس الدخيل"}</span>
                    <span style={{ fontSize: 10, color: textMuted }}>رخصة فال</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Controls ══ */}
        <div className="order-1 lg:order-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {[{ id: "colors", label: "الألوان", icon: <Palette size={15}/> }, { id: "fonts", label: "الخطوط", icon: <Type size={15}/> }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "colors" | "fonts")}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition flex-1 justify-center"
                style={{
                  background: activeTab === tab.id ? "rgba(198,145,76,0.15)" : "#16161A",
                  color: activeTab === tab.id ? "#C6914C" : "#5A5A62",
                  border: "1px solid " + (activeTab === tab.id ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.12)"),
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── COLORS TAB ── */}
          {activeTab === "colors" && (
            <div className="space-y-3">
              {/* Quick Themes */}
              <div className="rounded-xl p-4" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
                <h4 className="text-xs font-bold mb-3" style={{ color: "#C6914C" }}>ثيمات سريعة</h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickThemes.map(theme => (
                    <button
                      key={theme.name}
                      onClick={() => applyTheme(theme)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
                      style={{ background: theme.colors.color_bg_card, border: `1px solid ${theme.colors.color_accent}30`, color: theme.colors.color_text_primary }}
                    >
                      <span>{theme.emoji}</span>
                      <span style={{ color: theme.colors.color_accent }}>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible Color Groups */}
              {colorGroups.map(group => (
                <div key={group.id} className="rounded-xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
                  <button
                    onClick={() => toggleCollapse(group.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition hover:bg-[rgba(198,145,76,0.04)]"
                    style={{ color: "#C6914C" }}
                  >
                    <span>{group.label}</span>
                    {collapsed[group.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                  {!collapsed[group.id] && (
                    <div className="px-4 pb-4 space-y-2">
                      {group.fields.map(field => {
                        const val = s[field.key] || (defaults as any)[field.key];
                        return (
                          <div key={field.key} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#1C1C22" }}>
                            <label className="relative cursor-pointer flex-shrink-0">
                              <input
                                type="color"
                                value={val}
                                onChange={e => handleChange(field.key, e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              />
                              <div className="w-9 h-9 rounded-lg border-2 transition" style={{ background: val, borderColor: "rgba(198,145,76,0.3)" }} />
                            </label>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate" style={{ color: "#F5F5F5" }}>{field.label}</div>
                              <div className="text-xs" style={{ color: "#5A5A62" }}>{field.desc}</div>
                            </div>
                            <input
                              type="text"
                              value={val}
                              onChange={e => handleChange(field.key, e.target.value)}
                              maxLength={9}
                              className="w-20 text-center text-xs rounded-lg px-2 py-1.5 focus:outline-none font-mono"
                              style={{ background: "#0A0A0C", border: "1px solid rgba(198,145,76,0.12)", color: "#9A9AA0" }}
                              dir="ltr"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── FONTS TAB ── */}
          {activeTab === "fonts" && (
            <div className="space-y-3">
              {/* Sliders for px values */}
              <div className="rounded-xl p-4 space-y-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold" style={{ color: "#C6914C" }}>أحجام النصوص</h4>
                  <button
                    onClick={() => { handleChange("font_size_body", defaults.font_size_body); handleChange("font_size_small", defaults.font_size_small); }}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "#5A5A62" }}
                  >
                    <RotateCcw size={11} /> استعادة
                  </button>
                </div>
                {fontSliders.map(field => {
                  const val = parsePx(s[field.key], field.defaultVal);
                  return (
                    <div key={field.key}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-sm font-medium" style={{ color: "#F5F5F5" }}>{field.label}</span>
                          <span className="text-xs mr-2" style={{ color: "#5A5A62" }}>{field.desc}</span>
                        </div>
                        <span className="text-sm font-bold font-mono" style={{ color: "#C6914C" }}>{val}px</span>
                      </div>
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={1}
                        value={val}
                        onChange={e => handleChange(field.key, e.target.value + "px")}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "#C6914C", background: `linear-gradient(to left, rgba(198,145,76,0.15) ${((val - field.min) / (field.max - field.min)) * 100}%, rgba(198,145,76,0.15) 100%)` }}
                      />
                      <div className="flex justify-between text-xs mt-1" style={{ color: "#3A3A42" }}>
                        <span>{field.min}px</span>
                        <span>{field.max}px</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Presets for clamp values */}
              <div className="rounded-xl p-4 space-y-4" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold" style={{ color: "#C6914C" }}>أحجام العناوين</h4>
                  <button
                    onClick={() => { handleChange("font_size_hero", defaults.font_size_hero); handleChange("font_size_section_title", defaults.font_size_section_title); }}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "#5A5A62" }}
                  >
                    <RotateCcw size={11} /> استعادة
                  </button>
                </div>
                {fontPresets.map(field => (
                  <div key={field.key} className="p-3 rounded-lg space-y-2" style={{ background: "#1C1C22" }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#F5F5F5" }}>{field.label}</div>
                      <div className="text-xs" style={{ color: "#5A5A62" }}>{field.desc}</div>
                    </div>
                    <div className="flex gap-2">
                      {field.presets.map(preset => {
                        const active = (s[field.key] || (defaults as any)[field.key]) === preset.value;
                        return (
                          <button
                            key={preset.value}
                            onClick={() => handleChange(field.key, preset.value)}
                            className="flex-1 py-2 rounded-lg text-xs font-medium transition"
                            style={{
                              background: active ? "rgba(198,145,76,0.15)" : "#0A0A0C",
                              color: active ? "#C6914C" : "#5A5A62",
                              border: "1px solid " + (active ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.08)"),
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
