"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { Palette, Check, RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";
import ThemeSwitcher from "@/app/components/ThemeSwitcher";

const PRESET_THEMES = [
  { name: "ذهبي كلاسيكي", accent: "var(--gold-2)", bg: "var(--bg-page)", card: "var(--bg-surface-1)" },
  { name: "أزرق ملكي",    accent: "#3B82F6", bg: "var(--bg-page)", card: "var(--bg-surface-1)" },
  { name: "أخضر زمردي",   accent: "var(--success-3)", bg: "var(--bg-page)", card: "var(--bg-surface-1)" },
  { name: "بنفسجي فاخر",   accent: "#8B5CF6", bg: "var(--bg-page)", card: "var(--bg-surface-1)" },
  { name: "أحمر عصري",    accent: "#EF4444", bg: "var(--bg-page)", card: "var(--bg-surface-1)" },
  { name: "وردي ناعم",    accent: "#EC4899", bg: "var(--bg-page)", card: "var(--bg-surface-1)" },
];

const FONT_OPTIONS = [
  { name: "Tajawal (افتراضي)", value: "Tajawal" },
  { name: "Cairo", value: "Cairo" },
  { name: "IBM Plex Sans Arabic", value: "IBM Plex Sans Arabic" },
  { name: "Noto Sans Arabic", value: "Noto Sans Arabic" },
];

const inp = "w-full bg-[var(--bg-surface-2)] border border-[var(--gold-bg-hover)] rounded-xl px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--border-1)] focus:outline-none focus:border-[var(--gold-2)] transition";
const lbl = "block text-xs font-semibold text-[var(--text-soft)] mb-2 tracking-wide";

export default function ThemePage() {
  const [accent, setAccent]   = useState("var(--gold-2)");
  const [font, setFont]       = useState("Tajawal");
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    // Load saved theme
    supabase.from("site_settings").select("accent_color, font_family").limit(1).single()
      .then(({ data }) => {
        if (data?.accent_color) setAccent(data.accent_color);
        if (data?.font_family) setFont(data.font_family);
      });
  }, []);

  async function saveTheme() {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({
      accent_color: accent,
      font_family: font,
    }, { onConflict: "id" });
    setSaving(false);
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تم حفظ الثيم بنجاح!");
    // Apply to CSS variables immediately
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--font", font);
  }

  function resetTheme() {
    setAccent("var(--gold-2)");
    setFont("Tajawal");
    toast.info("تم إعادة الثيم للافتراضي — اضغط حفظ للتطبيق");
  }

  return (
    <div dir="rtl" className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">مركز التخصيص</h2>
        <p style={{ color: "var(--text-faint)", fontSize: 13 }}>خصّص مظهر المنصة ليناسب هويتك البصرية</p>
      </div>

      {/* Theme Switcher (dark/cream) */}
      <ThemeSwitcher />

      {/* Color presets */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 1.5, marginBottom: 16 }}>
          <Palette size={14} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }} />
          اللون الرئيسي
        </h3>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {PRESET_THEMES.map(theme => (
            <button key={theme.accent} onClick={() => setAccent(theme.accent)}
              className="rounded-xl p-3 text-center transition group"
              style={{
                background: accent === theme.accent ? theme.accent + "15" : "var(--bg-surface-2)",
                border: "2px solid " + (accent === theme.accent ? theme.accent : "rgba(90,90,98,0.15)"),
                cursor: "pointer",
              }}>
              <div className="mx-auto mb-2 rounded-full" style={{ width: 32, height: 32, background: theme.accent }} />
              <p style={{ fontSize: 11, color: accent === theme.accent ? theme.accent : "var(--text-soft)", fontWeight: 600 }}>{theme.name}</p>
            </button>
          ))}
        </div>

        {/* Custom color */}
        <div className="flex items-center gap-4">
          <label className={lbl} style={{ marginBottom: 0 }}>لون مخصص</label>
          <div className="flex items-center gap-2">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)}
              style={{ width: 40, height: 40, borderRadius: 10, border: "2px solid var(--gold-bg-hover)", cursor: "pointer", background: "none" }} />
            <input value={accent} onChange={e => setAccent(e.target.value)}
              className={inp} style={{ width: 120 }} dir="ltr" />
          </div>
        </div>
      </div>

      {/* Font */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 1.5, marginBottom: 16 }}>الخط</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FONT_OPTIONS.map(f => (
            <button key={f.value} onClick={() => setFont(f.value)}
              className="rounded-xl p-4 text-center transition"
              style={{
                background: font === f.value ? accent + "12" : "var(--bg-surface-2)",
                border: "2px solid " + (font === f.value ? accent : "rgba(90,90,98,0.15)"),
                cursor: "pointer",
              }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-on-dark)", fontFamily: f.value + ", sans-serif", marginBottom: 4 }}>أ ب ت</p>
              <p style={{ fontSize: 11, color: font === f.value ? accent : "var(--text-faint)", fontWeight: 600 }}>{f.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Card */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 1.5, marginBottom: 16 }}>
          <Eye size={14} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }} />
          معاينة
        </h3>
        <div className="rounded-xl p-5" style={{ background: "var(--bg-page)", border: "1px solid " + accent + "20" }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bg-page)", fontWeight: 900, fontFamily: font + ", sans-serif", fontSize: 16 }}>و</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)", fontFamily: font + ", sans-serif" }}>وسيط برو</p>
              <p style={{ fontSize: 11, color: accent }}>منصتك العقارية</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: accent, color: "var(--bg-page)" }}>زر رئيسي</span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: accent + "15", color: accent, border: "1px solid " + accent + "30" }}>زر ثانوي</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={saveTheme} disabled={saving}
          className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold transition disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)`, color: "var(--bg-page)", fontSize: 14, cursor: "pointer", border: "none" }}>
          <Check size={16} /> {saving ? "جاري الحفظ..." : "حفظ الثيم"}
        </button>
        <button onClick={resetTheme}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition"
          style={{ background: "var(--bg-surface-2)", color: "var(--text-soft)", border: "1px solid var(--gold-bg)", cursor: "pointer" }}>
          <RotateCcw size={14} /> إعادة تعيين
        </button>
      </div>
    </div>
  );
}
