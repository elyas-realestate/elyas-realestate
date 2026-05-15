// ══════════════════════════════════════════════════════════════
// DesignTab — تبويب الألوان والخطوط + Live Preview
// ══════════════════════════════════════════════════════════════
// أكبر tab من حيث الـ JSX. يحسب الـ derived values داخلياً
// لتقليل عدد props من ~20 إلى ~12.
// ══════════════════════════════════════════════════════════════

import {
  RotateCcw,
  Monitor,
  Smartphone,
  Palette,
  Type,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ThemeSwitcher from "@/app/components/ThemeSwitcher";
import {
  COLOR_DEFAULTS,
  COLOR_GROUPS,
  QUICK_THEMES_DARK,
  QUICK_THEMES_CREAM,
  type QuickTheme,
} from "../_constants";
import { SaveBtn } from "../_components/SaveBtn";

interface DesignTabProps {
  s: any; // settings alias
  sc: (field: string, value: any) => void;
  designTab: "colors" | "fonts";
  setDesignTab: (tab: "colors" | "fonts") => void;
  mobilePreview: boolean;
  setMobilePreview: (b: boolean) => void;
  activeTheme: "dark" | "cream";
  collapsed: Record<string, boolean>;
  toggleCollapse: (id: string) => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  onReset: () => void;
  applyTheme: (theme: QuickTheme) => void;
  parsePx: (val: string | undefined, def: number) => number;
}

export function DesignTab({
  s,
  sc,
  designTab,
  setDesignTab,
  mobilePreview,
  setMobilePreview,
  activeTheme,
  collapsed,
  toggleCollapse,
  saving,
  saved,
  onSave,
  onReset,
  applyTheme,
  parsePx,
}: DesignTabProps) {
  // ─── Derived design values (محسوبة محلياً من s) ──────────────────
  const accent = s.color_accent || COLOR_DEFAULTS.color_accent;
  const accentDark = s.color_accent_dark || COLOR_DEFAULTS.color_accent_dark;
  const bgPrimary = s.color_bg_primary || COLOR_DEFAULTS.color_bg_primary;
  const bgSecondary = s.color_bg_secondary || COLOR_DEFAULTS.color_bg_secondary;
  const bgCard = s.color_bg_card || COLOR_DEFAULTS.color_bg_card;
  const textPrimary = s.color_text_primary || COLOR_DEFAULTS.color_text_primary;
  const textSec = s.color_text_secondary || COLOR_DEFAULTS.color_text_secondary;
  const textMuted = s.color_text_muted || COLOR_DEFAULTS.color_text_muted;
  const heroSize = s.font_size_hero || COLOR_DEFAULTS.font_size_hero;
  const sectionSize = s.font_size_section_title || COLOR_DEFAULTS.font_size_section_title;
  const bodySize = s.font_size_body || COLOR_DEFAULTS.font_size_body;
  const smallSize = s.font_size_small || COLOR_DEFAULTS.font_size_small;

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;700;900&family=Noto+Kufi+Arabic:wght@700;900&display=swap');`}</style>

      {/* Theme Switcher (Dark/Cream) — يُطبَّق فوراً على كل المنصّة */}
      <ThemeSwitcher />

      {/* Header row */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-faint)]">
          غيّر الألوان والخطوط وشاهد النتيجة مباشرة
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm transition"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)",
            }}
          >
            <RotateCcw size={13} /> إعادة الضبط
          </button>
          <SaveBtn onClick={onSave} saving={saving} saved={saved} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Live Preview */}
        <div className="order-2 lg:order-1">
          <div
            className="sticky top-20 overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--gold-bg-hover)" }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                background: "var(--bg-surface-2)",
                borderBottom: "1px solid var(--gold-bg-soft)",
              }}
            >
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ background: "var(--danger)" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "var(--warning-2)" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "var(--success)" }} />
              </div>
              <span className="text-xs font-bold" style={{ color: "var(--gold-2)" }}>
                معاينة مباشرة
              </span>
              <div className="flex overflow-hidden rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-page)]">
                <button
                  onClick={() => setMobilePreview(false)}
                  className={
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs transition " +
                    (!mobilePreview ? "text-[var(--gold-2)]" : "text-[var(--text-faint)]")
                  }
                  style={{ background: !mobilePreview ? "var(--gold-bg)" : "transparent" }}
                >
                  <Monitor size={12} /> ديسكتوب
                </button>
                <button
                  onClick={() => setMobilePreview(true)}
                  className={
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs transition " +
                    (mobilePreview ? "text-[var(--gold-2)]" : "text-[var(--text-faint)]")
                  }
                  style={{ background: mobilePreview ? "var(--gold-bg)" : "transparent" }}
                >
                  <Smartphone size={12} /> موبايل
                </button>
              </div>
            </div>
            <div
              style={{
                background: "var(--bg-surface-2)",
                padding: mobilePreview ? "16px" : "0",
                minHeight: 500,
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  background: bgPrimary,
                  fontFamily: "'Tajawal', sans-serif",
                  width: mobilePreview ? 375 : "100%",
                  margin: mobilePreview ? "0 auto" : "0",
                  borderRadius: mobilePreview ? 16 : 0,
                  overflow: "hidden",
                  border: mobilePreview ? "1px solid var(--gold-bg-hover)" : "none",
                }}
                dir="rtl"
              >
                {/* Navbar */}
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: "12px 20px",
                    background: bgCard,
                    borderBottom: `1px solid ${accent}20`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        background: `linear-gradient(135deg,${accent},${accentDark})`,
                        color: bgPrimary,
                        fontSize: 10,
                        fontFamily: "'Noto Kufi Arabic',serif",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      إ
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>
                      {s.site_name || "إلياس الدخيل"}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span style={{ fontSize: 10, color: textSec }}>الرئيسية</span>
                    <span style={{ fontSize: 10, color: textSec }}>العقارات</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: bgPrimary,
                        background: `linear-gradient(135deg,${accent},${accentDark})`,
                        padding: "3px 10px",
                        borderRadius: 6,
                      }}
                    >
                      تواصل
                    </span>
                  </div>
                </div>
                {/* Hero */}
                <div className="text-center" style={{ padding: "36px 20px 24px" }}>
                  <div
                    style={{
                      display: "inline-block",
                      fontSize: 9,
                      color: accent,
                      background: `${accent}15`,
                      border: `1px solid ${accent}30`,
                      borderRadius: 50,
                      padding: "4px 12px",
                      marginBottom: 10,
                    }}
                  >
                    وسيط عقاري مرخّص
                  </div>
                  <h1
                    style={{
                      fontFamily: "'Noto Kufi Arabic',serif",
                      fontSize: heroSize,
                      fontWeight: 900,
                      lineHeight: 1.25,
                      color: textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    نختصر عليك <span style={{ color: accent }}>الطريق</span>
                  </h1>
                  <p
                    style={{
                      fontSize: bodySize,
                      color: textSec,
                      lineHeight: 1.8,
                      maxWidth: 340,
                      margin: "0 auto 18px",
                    }}
                  >
                    {s.hero_subtitle || "من البحث إلى التملّك، خبرة عملية في سوق الرياض"}
                  </p>
                  <div className="flex justify-center gap-2">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: bgPrimary,
                        background: `linear-gradient(135deg,${accent},${accentDark})`,
                        padding: "7px 18px",
                        borderRadius: 8,
                      }}
                    >
                      واتساب
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: textPrimary,
                        border: `1px solid ${accent}25`,
                        padding: "7px 18px",
                        borderRadius: 8,
                      }}
                    >
                      اتصال
                    </span>
                  </div>
                </div>
                {/* Section */}
                <div style={{ padding: "26px 20px", background: bgSecondary }}>
                  <div className="text-center" style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 9, color: accent, letterSpacing: 1 }}>
                      — القيمة المضافة —
                    </span>
                    <h2
                      style={{
                        fontFamily: "'Noto Kufi Arabic',serif",
                        fontSize: sectionSize,
                        fontWeight: 800,
                        color: textPrimary,
                        lineHeight: 1.3,
                        marginTop: 4,
                      }}
                    >
                      لماذا تختار إلياس؟
                    </h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { icon: "🎯", title: "معرفة بالسوق" },
                      { icon: "⚡", title: "سرعة التنفيذ" },
                    ].map((card, i) => (
                      <div
                        key={i}
                        style={{
                          background: bgCard,
                          border: `1px solid ${accent}15`,
                          borderRadius: 10,
                          padding: "12px 10px",
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{card.icon}</span>
                        <h3
                          style={{
                            fontFamily: "'Noto Kufi Arabic',serif",
                            fontSize: bodySize,
                            fontWeight: 700,
                            color: textPrimary,
                            marginTop: 6,
                            marginBottom: 4,
                          }}
                        >
                          {card.title}
                        </h3>
                        <p style={{ fontSize: smallSize, color: textSec, lineHeight: 1.6 }}>
                          خبرة ميدانية في الرياض
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Footer */}
                <div
                  style={{
                    padding: "12px 20px",
                    background: bgSecondary,
                    borderTop: `1px solid ${accent}12`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 10, color: textMuted }}>
                      © {s.site_name || "إلياس الدخيل"}
                    </span>
                    <span style={{ fontSize: 10, color: textMuted }}>رخصة فال</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="order-1 space-y-4 lg:order-2">
          <div className="flex gap-2">
            {[
              { id: "colors" as const, label: "الألوان", icon: <Palette size={14} /> },
              { id: "fonts" as const, label: "الخطوط", icon: <Type size={14} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDesignTab(t.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition"
                style={{
                  background:
                    designTab === t.id ? "var(--gold-bg-hover)" : "var(--bg-surface-1)",
                  color: designTab === t.id ? "var(--gold-2)" : "var(--text-faint)",
                  border:
                    "1px solid " +
                    (designTab === t.id ? "var(--gold-bg-strong)" : "var(--gold-bg)"),
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {designTab === "colors" && (
            <div className="space-y-3">
              {/* ملاحظة توضيحية */}
              <div
                className="rounded-xl p-3 text-[11px] leading-relaxed"
                style={{
                  background: "var(--gold-bg-soft)",
                  border: "1px solid var(--gold-bg)",
                  color: "var(--text-soft)",
                }}
              >
                <span className="font-bold" style={{ color: "var(--gold-2)" }}>
                  ملاحظة:
                </span>{" "}
                هذه الألوان تخص{" "}
                <span className="font-bold" style={{ color: "var(--text-strong)" }}>
                  صفحتك العامة
                </span>{" "}
                (الموقع الذي يراه عملاؤك). أما ثيم لوحة التحكم (داكن/كريمي) فيُحفظ تلقائياً من{" "}
                <span className="font-bold" style={{ color: "var(--gold-2)" }}>
                  المظهر
                </span>{" "}
                أعلى الصفحة. اضغط{" "}
                <span className="font-bold" style={{ color: "var(--gold-2)" }}>
                  «حفظ التغييرات»
                </span>{" "}
                بعد تعديل الألوان لتطبيقها على الموقع.
              </div>

              {/* Quick themes */}
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-bold" style={{ color: "var(--gold-2)" }}>
                    ثيمات سريعة {activeTheme === "cream" ? "(فاتحة)" : "(داكنة)"}
                  </h4>
                  <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                    {activeTheme === "cream"
                      ? "متوافقة مع الثيم الكريمي"
                      : "متوافقة مع الثيم الداكن"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(activeTheme === "cream" ? QUICK_THEMES_CREAM : QUICK_THEMES_DARK).map(
                    (theme) => (
                      <button
                        key={theme.name}
                        onClick={() => applyTheme(theme)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                        style={{
                          background: theme.colors.color_bg_card,
                          border: `1px solid ${theme.colors.color_accent}30`,
                          color: theme.colors.color_text_primary,
                        }}
                      >
                        <span>{theme.emoji}</span>
                        <span style={{ color: theme.colors.color_accent }}>{theme.name}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
              {/* Color groups */}
              {COLOR_GROUPS.map((group) => (
                <div
                  key={group.id}
                  className="overflow-hidden rounded-xl"
                  style={{
                    background: "var(--bg-surface-1)",
                    border: "1px solid var(--gold-bg)",
                  }}
                >
                  <button
                    onClick={() => toggleCollapse(group.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold transition hover:bg-[rgba(198,145,76,0.04)]"
                    style={{ color: "var(--gold-2)" }}
                  >
                    <span>{group.label}</span>
                    {collapsed[group.id] ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                  </button>
                  {!collapsed[group.id] && (
                    <div className="space-y-2 px-4 pb-4">
                      {group.fields.map((field) => {
                        const val = s[field.key] || (COLOR_DEFAULTS as any)[field.key];
                        return (
                          <div
                            key={field.key}
                            className="flex items-center gap-3 rounded-lg p-3"
                            style={{ background: "var(--bg-surface-2)" }}
                          >
                            <label className="relative flex-shrink-0 cursor-pointer">
                              <input
                                type="color"
                                value={val}
                                onChange={(e) => sc(field.key, e.target.value)}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              />
                              <div
                                className="h-9 w-9 rounded-lg border-2 transition"
                                style={{ background: val, borderColor: "var(--gold-bg-strong)" }}
                              />
                            </label>
                            <div className="min-w-0 flex-1">
                              <div
                                className="truncate text-xs font-medium"
                                style={{ color: "var(--text-strong)" }}
                              >
                                {field.label}
                              </div>
                              <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                                {field.desc}
                              </div>
                            </div>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => sc(field.key, e.target.value)}
                              maxLength={9}
                              className="w-20 rounded-lg px-2 py-1.5 text-center font-mono text-xs focus:outline-none"
                              style={{
                                background: "var(--bg-page)",
                                border: "1px solid var(--gold-bg)",
                                color: "var(--text-soft)",
                              }}
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

          {designTab === "fonts" && (
            <div className="space-y-3">
              {/* Sliders */}
              <div
                className="space-y-5 rounded-xl p-4"
                style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold" style={{ color: "var(--gold-2)" }}>
                    أحجام النصوص
                  </h4>
                  <button
                    onClick={() => {
                      sc("font_size_body", COLOR_DEFAULTS.font_size_body);
                      sc("font_size_small", COLOR_DEFAULTS.font_size_small);
                    }}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <RotateCcw size={10} /> استعادة
                  </button>
                </div>
                {[
                  {
                    key: "font_size_body",
                    label: "حجم النص العادي",
                    desc: "الأوصاف والفقرات",
                    min: 12,
                    max: 20,
                    def: 15,
                  },
                  {
                    key: "font_size_small",
                    label: "حجم النص الصغير",
                    desc: "التواريخ والتفاصيل",
                    min: 10,
                    max: 18,
                    def: 13,
                  },
                ].map((field) => {
                  const val = parsePx(s[field.key], field.def);
                  return (
                    <div key={field.key}>
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-strong)" }}
                          >
                            {field.label}
                          </span>
                          <span
                            className="mr-2 text-xs"
                            style={{ color: "var(--text-faint)" }}
                          >
                            {field.desc}
                          </span>
                        </div>
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--gold-2)" }}
                        >
                          {val}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={1}
                        value={val}
                        onChange={(e) => sc(field.key, e.target.value + "px")}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
                        style={{ accentColor: "var(--gold-2)" }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* Heading presets */}
              <div
                className="space-y-4 rounded-xl p-4"
                style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold" style={{ color: "var(--gold-2)" }}>
                    أحجام العناوين
                  </h4>
                  <button
                    onClick={() => {
                      sc("font_size_hero", COLOR_DEFAULTS.font_size_hero);
                      sc("font_size_section_title", COLOR_DEFAULTS.font_size_section_title);
                    }}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <RotateCcw size={10} /> استعادة
                  </button>
                </div>
                {[
                  {
                    key: "font_size_hero",
                    label: "العنوان الرئيسي (Hero)",
                    desc: "العنوان الكبير في أعلى الصفحة",
                    presets: [
                      { l: "صغير", v: "clamp(2rem,4vw,3rem)" },
                      { l: "متوسط", v: "clamp(2.4rem,5.5vw,4.2rem)" },
                      { l: "كبير", v: "clamp(3rem,6vw,5rem)" },
                    ],
                  },
                  {
                    key: "font_size_section_title",
                    label: "عناوين الأقسام",
                    desc: "لماذا تختارنا، الخدمات...",
                    presets: [
                      { l: "صغير", v: "clamp(1.4rem,2.5vw,2rem)" },
                      { l: "متوسط", v: "clamp(1.8rem,3.5vw,2.6rem)" },
                      { l: "كبير", v: "clamp(2.2rem,4vw,3.2rem)" },
                    ],
                  },
                ].map((field) => (
                  <div
                    key={field.key}
                    className="space-y-2 rounded-lg p-3"
                    style={{ background: "var(--bg-surface-2)" }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
                        {field.label}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                        {field.desc}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {field.presets.map((p) => {
                        const active =
                          (s[field.key] || (COLOR_DEFAULTS as any)[field.key]) === p.v;
                        return (
                          <button
                            key={p.v}
                            onClick={() => sc(field.key, p.v)}
                            className="flex-1 rounded-lg py-2 text-xs font-medium transition"
                            style={{
                              background: active ? "var(--gold-bg-hover)" : "var(--bg-page)",
                              color: active ? "var(--gold-2)" : "var(--text-faint)",
                              border:
                                "1px solid " +
                                (active ? "var(--gold-bg-strong)" : "var(--gold-bg-soft)"),
                            }}
                          >
                            {p.l}
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
