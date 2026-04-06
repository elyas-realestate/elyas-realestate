"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Save, Check, RotateCcw, Palette, Type } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const defaultColors = {
  color_accent: "#C6914C",
  color_accent_dark: "#A6743A",
  color_bg_primary: "#0A0A0C",
  color_bg_secondary: "#111114",
  color_bg_card: "#16161A",
  color_text_primary: "#F5F5F5",
  color_text_secondary: "#9A9AA0",
  color_text_muted: "#5A5A62",
};

const defaultFonts = {
  font_size_hero: "clamp(2.4rem, 5.5vw, 4.2rem)",
  font_size_section_title: "clamp(1.8rem, 3.5vw, 2.6rem)",
  font_size_body: "15px",
  font_size_small: "13px",
};

const colorFields = [
  { key: "color_accent", label: "اللون الذهبي الرئيسي", desc: "الأزرار والعناوين المميزة" },
  { key: "color_accent_dark", label: "اللون الذهبي الداكن", desc: "تدرج الأزرار والهوفر" },
  { key: "color_bg_primary", label: "خلفية الموقع الرئيسية", desc: "لون الخلفية الأساسي" },
  { key: "color_bg_secondary", label: "خلفية الأقسام الفرعية", desc: "خلفية الأقسام المتناوبة" },
  { key: "color_bg_card", label: "خلفية البطاقات", desc: "لون خلفية الكروت والصناديق" },
  { key: "color_text_primary", label: "لون النص الرئيسي", desc: "العناوين والنصوص الأساسية" },
  { key: "color_text_secondary", label: "لون النص الثانوي", desc: "الوصف والنصوص الفرعية" },
  { key: "color_text_muted", label: "لون النص الخافت", desc: "التواريخ والتفاصيل الصغيرة" },
];

const fontFields = [
  { key: "font_size_hero", label: "حجم العنوان الرئيسي (Hero)", desc: "العنوان الكبير في أعلى الصفحة", presets: ["clamp(2rem, 4vw, 3rem)", "clamp(2.4rem, 5.5vw, 4.2rem)", "clamp(3rem, 6vw, 5rem)"], presetLabels: ["صغير", "متوسط (افتراضي)", "كبير"] },
  { key: "font_size_section_title", label: "حجم عناوين الأقسام", desc: "عناوين مثل لماذا تختارنا والخدمات", presets: ["clamp(1.4rem, 2.5vw, 2rem)", "clamp(1.8rem, 3.5vw, 2.6rem)", "clamp(2.2rem, 4vw, 3.2rem)"], presetLabels: ["صغير", "متوسط (افتراضي)", "كبير"] },
  { key: "font_size_body", label: "حجم النص العادي", desc: "نصوص الوصف والفقرات", presets: ["13px", "15px", "17px"], presetLabels: ["صغير", "متوسط (افتراضي)", "كبير"] },
  { key: "font_size_small", label: "حجم النص الصغير", desc: "التفاصيل والتواريخ", presets: ["11px", "13px", "15px"], presetLabels: ["صغير", "متوسط (افتراضي)", "كبير"] },
];

export default function VisualEditorPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"colors" | "fonts">("colors");

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from("site_settings").select("*").limit(1).single();
    if (data) setSettings(data);
    setLoading(false);
  }

  function handleChange(key: string, value: string) {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  }

  function resetColors() {
    setSettings((prev: any) => ({ ...prev, ...defaultColors }));
  }

  function resetFonts() {
    setSettings((prev: any) => ({ ...prev, ...defaultFonts }));
  }

  async function handleSave() {
    setSaving(true);
    const { id, created_at, ...updateData } = settings;
    await supabase.from("site_settings").update(updateData).eq("id", settings.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div style={{ color:'#C6914C' }} className="text-center py-20">جاري التحميل...</div>;
  if (!settings) return <div className="text-red-400 text-center py-20">لم يتم العثور على الإعدادات</div>;

  const s = settings;
  const accent = s.color_accent || defaultColors.color_accent;
  const accentDark = s.color_accent_dark || defaultColors.color_accent_dark;
  const bgPrimary = s.color_bg_primary || defaultColors.color_bg_primary;
  const bgSecondary = s.color_bg_secondary || defaultColors.color_bg_secondary;
  const bgCard = s.color_bg_card || defaultColors.color_bg_card;
  const textPrimary = s.color_text_primary || defaultColors.color_text_primary;
  const textSecondary = s.color_text_secondary || defaultColors.color_text_secondary;
  const textMuted = s.color_text_muted || defaultColors.color_text_muted;
  const heroSize = s.font_size_hero || defaultFonts.font_size_hero;
  const sectionSize = s.font_size_section_title || defaultFonts.font_size_section_title;
  const bodySize = s.font_size_body || defaultFonts.font_size_body;
  const smallSize = s.font_size_small || defaultFonts.font_size_small;

  return (
    <div dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">المحرر البصري</h2>
          <p style={{ color:'#5A5A62', fontSize:14 }}>غيّر الألوان وأحجام الخطوط وشاهد النتيجة مباشرة</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition text-[#0A0A0C]" style={{ background: saved ? '#4ADE80' : 'linear-gradient(135deg, #C6914C, #A6743A)' }}>
          {saved ? <><Check size={20} /> تم الحفظ</> : saving ? <><Save size={20} className="animate-spin" /> جاري الحفظ...</> : <><Save size={20} /> حفظ</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("colors")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition" style={{ background: activeTab === "colors" ? 'rgba(198,145,76,0.15)' : '#16161A', color: activeTab === "colors" ? '#C6914C' : '#5A5A62', border: '1px solid ' + (activeTab === "colors" ? 'rgba(198,145,76,0.3)' : 'rgba(198,145,76,0.12)') }}>
          <Palette size={16} /> الألوان
        </button>
        <button onClick={() => setActiveTab("fonts")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition" style={{ background: activeTab === "fonts" ? 'rgba(198,145,76,0.15)' : '#16161A', color: activeTab === "fonts" ? '#C6914C' : '#5A5A62', border: '1px solid ' + (activeTab === "fonts" ? 'rgba(198,145,76,0.3)' : 'rgba(198,145,76,0.12)') }}>
          <Type size={16} /> الخطوط
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ LEFT: Controls ═══ */}
        <div>
          {activeTab === "colors" && (
            <div className="rounded-xl p-5 space-y-4" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold" style={{ color:'#C6914C' }}>الألوان</h3>
                <button onClick={resetColors} className="flex items-center gap-1 text-xs transition" style={{ color:'#5A5A62' }}><RotateCcw size={12} /> استعادة الافتراضي</button>
              </div>
              {colorFields.map(field => (
                <div key={field.key} className="flex items-center gap-3 p-3 rounded-lg" style={{ background:'#1C1C22' }}>
                  <input type="color" value={s[field.key] || (defaultColors as any)[field.key]} onChange={e => handleChange(field.key, e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer" style={{ background:'transparent' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color:'#F5F5F5' }}>{field.label}</div>
                    <div className="text-xs" style={{ color:'#5A5A62' }}>{field.desc}</div>
                  </div>
                  <input type="text" value={s[field.key] || (defaultColors as any)[field.key]} onChange={e => handleChange(field.key, e.target.value)} className="w-24 text-center text-xs rounded-lg px-2 py-1.5 focus:outline-none" style={{ background:'#0A0A0C', border:'1px solid rgba(198,145,76,0.12)', color:'#9A9AA0' }} dir="ltr" />
                </div>
              ))}
            </div>
          )}

          {activeTab === "fonts" && (
            <div className="rounded-xl p-5 space-y-4" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold" style={{ color:'#C6914C' }}>أحجام الخطوط</h3>
                <button onClick={resetFonts} className="flex items-center gap-1 text-xs transition" style={{ color:'#5A5A62' }}><RotateCcw size={12} /> استعادة الافتراضي</button>
              </div>
              {fontFields.map(field => (
                <div key={field.key} className="p-3 rounded-lg space-y-2" style={{ background:'#1C1C22' }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color:'#F5F5F5' }}>{field.label}</div>
                    <div className="text-xs" style={{ color:'#5A5A62' }}>{field.desc}</div>
                  </div>
                  <div className="flex gap-2">
                    {field.presets.map((preset, i) => (
                      <button key={i} onClick={() => handleChange(field.key, preset)} className="flex-1 py-2 rounded-lg text-xs font-medium transition" style={{ background: (s[field.key] || (defaultFonts as any)[field.key]) === preset ? 'rgba(198,145,76,0.15)' : '#0A0A0C', color: (s[field.key] || (defaultFonts as any)[field.key]) === preset ? '#C6914C' : '#5A5A62', border: '1px solid ' + ((s[field.key] || (defaultFonts as any)[field.key]) === preset ? 'rgba(198,145,76,0.3)' : 'rgba(198,145,76,0.08)') }}>
                        {field.presetLabels[i]}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={s[field.key] || (defaultFonts as any)[field.key]} onChange={e => handleChange(field.key, e.target.value)} className="w-full text-xs rounded-lg px-3 py-2 focus:outline-none" style={{ background:'#0A0A0C', border:'1px solid rgba(198,145,76,0.12)', color:'#9A9AA0' }} dir="ltr" placeholder="أو اكتب قيمة مخصصة..." />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Live Preview ═══ */}
        <div>
          <div className="rounded-xl overflow-hidden sticky top-20" style={{ border:'1px solid rgba(198,145,76,0.12)' }}>
            <div className="px-4 py-2 flex items-center justify-between" style={{ background:'#1C1C22', borderBottom:'1px solid rgba(198,145,76,0.08)' }}>
              <span className="text-xs font-bold" style={{ color:'#C6914C' }}>معاينة مباشرة</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background:'#F87171' }}></div>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background:'#FBBF24' }}></div>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background:'#4ADE80' }}></div>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{ background: bgPrimary, padding:0, fontFamily:"'Tajawal', sans-serif", minHeight:500 }} dir="rtl">
              {/* Navbar Preview */}
              <div className="flex items-center justify-between" style={{ padding:'12px 20px', background: bgCard, borderBottom: '1px solid ' + accent + '15' }}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center font-bold" style={{ width:28, height:28, borderRadius:8, background: 'linear-gradient(135deg, ' + accent + ', ' + accentDark + ')', color: bgPrimary, fontSize:12, fontFamily:"'Noto Kufi Arabic', serif" }}>إ</div>
                  <span className="font-bold" style={{ fontSize:12, color: textPrimary }}>{s.site_name || "إلياس الدخيل"}</span>
                </div>
                <div className="flex gap-3">
                  <span style={{ fontSize:10, color: textSecondary }}>الرئيسية</span>
                  <span style={{ fontSize:10, color: textSecondary }}>العقارات</span>
                  <span style={{ fontSize:10, color: bgPrimary, background: 'linear-gradient(135deg, ' + accent + ', ' + accentDark + ')', padding:'3px 10px', borderRadius:6, fontWeight:700 }}>تواصل</span>
                </div>
              </div>

              {/* Hero Preview */}
              <div className="text-center" style={{ padding:'40px 20px', background: 'linear-gradient(180deg, ' + bgPrimary + '80, ' + bgPrimary + ')' }}>
                <div style={{ display:'inline-block', fontSize:9, color: accent, background: accent + '15', border: '1px solid ' + accent + '30', borderRadius:50, padding:'4px 12px', marginBottom:12 }}>وسيط عقاري مرخّص</div>
                <h1 style={{ fontFamily:"'Noto Kufi Arabic', serif", fontSize: heroSize, fontWeight:900, lineHeight:1.25, color: textPrimary, marginBottom:8 }}>
                  نختصر عليك <span style={{ background: 'linear-gradient(135deg, ' + accent + ', ' + accentDark + ')', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>الطريق</span>
                </h1>
                <p style={{ fontSize: bodySize, color: textSecondary, lineHeight:1.8, maxWidth:400, margin:'0 auto' }}>{s.hero_subtitle || "من البحث إلى التملّك، خبرة عملية في سوق الرياض"}</p>
              </div>

              {/* Section Title Preview */}
              <div style={{ padding:'30px 20px', background: bgSecondary }}>
                <div className="text-center" style={{ marginBottom:20 }}>
                  <span style={{ fontSize:9, color: accent, letterSpacing:1 }}>— القيمة المضافة —</span>
                  <h2 style={{ fontFamily:"'Noto Kufi Arabic', serif", fontSize: sectionSize, fontWeight:800, color: textPrimary, lineHeight:1.3, marginTop:4 }}>لماذا تختار إلياس؟</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "🎯", title: "معرفة بالسوق" },
                    { icon: "⚡", title: "سرعة التنفيذ" },
                  ].map((card, i) => (
                    <div key={i} className="rounded-xl" style={{ background: bgCard, border: '1px solid ' + accent + '15', padding:'16px 12px' }}>
                      <span style={{ fontSize:18 }}>{card.icon}</span>
                      <h3 style={{ fontFamily:"'Noto Kufi Arabic', serif", fontSize: bodySize, fontWeight:700, color: textPrimary, marginTop:6, marginBottom:4 }}>{card.title}</h3>
                      <p style={{ fontSize: smallSize, color: textSecondary, lineHeight:1.6 }}>خبرة ميدانية في أحياء الرياض</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Preview */}
              <div className="text-center" style={{ padding:'30px 20px', background: bgPrimary }}>
                <div className="rounded-xl" style={{ background: bgCard, border: '1px solid ' + accent + '15', padding:'24px 16px' }}>
                  <h3 style={{ fontFamily:"'Noto Kufi Arabic', serif", fontSize: bodySize, fontWeight:800, color: textPrimary, marginBottom:6 }}>عندك عقار؟</h3>
                  <p style={{ fontSize: smallSize, color: textSecondary, marginBottom:12 }}>تواصل معي مباشرة</p>
                  <div className="flex justify-center gap-2">
                    <span style={{ fontSize:11, fontWeight:700, color: bgPrimary, background: 'linear-gradient(135deg, ' + accent + ', ' + accentDark + ')', padding:'6px 16px', borderRadius:8 }}>واتساب</span>
                    <span style={{ fontSize:11, fontWeight:600, color: textPrimary, border: '1px solid ' + accent + '20', padding:'6px 16px', borderRadius:8 }}>اتصال</span>
                  </div>
                </div>
              </div>

              {/* Footer Preview */}
              <div style={{ padding:'16px 20px', background: bgSecondary, borderTop: '1px solid ' + accent + '15' }}>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize:10, color: textMuted }}>© إلياس الدخيل</span>
                  <span style={{ fontSize:10, color: textMuted }}>رخصة فال</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
