"use client";

import { useState, useMemo } from "react";
import { X, Check, Palette, Sparkles } from "lucide-react";
import { CARD_THEMES, type CardTheme } from "@/lib/card-themes";

// ══════════════════════════════════════════════════════════════════
// CardThemePicker — منتقي ٢٠ ثيم احترافي للبطاقة (profile_cards)
// مودال يعرض الثيمات مصنّفة + زرار "تطبيق"
// ══════════════════════════════════════════════════════════════════

const CATEGORY_LABELS: Record<CardTheme["category"], { label: string; emoji: string }> = {
  luxury: { label: "فاخر", emoji: "👑" },
  modern: { label: "عصري", emoji: "🎨" },
  classic: { label: "كلاسيك", emoji: "🏛️" },
  minimal: { label: "مينيمال", emoji: "◇" },
  bold: { label: "جريء", emoji: "⚡" },
  specialty: { label: "متخصص", emoji: "✨" },
};

interface Props {
  currentBg?: string | null;
  currentText?: string | null;
  currentAccent?: string | null;
  onApply: (theme: {
    bg_color: string;
    text_color: string;
    accent_color: string;
    theme_id: string;
  }) => void;
  onClose: () => void;
}

export default function CardThemePicker({
  currentBg,
  currentText: _currentText,
  currentAccent,
  onApply,
  onClose,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<CardTheme["category"] | "all">("all");

  const filteredThemes = useMemo(() => {
    if (activeCategory === "all") return CARD_THEMES;
    return CARD_THEMES.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const isCurrent = (t: CardTheme) =>
    t.bg_color.toLowerCase() === (currentBg || "").toLowerCase() &&
    t.accent_color.toLowerCase() === (currentAccent || "").toLowerCase();

  const categories: ("all" | CardTheme["category"])[] = [
    "all",
    "luxury",
    "modern",
    "classic",
    "minimal",
    "bold",
    "specialty",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-page, #fff)",
          borderRadius: 20,
          maxWidth: 720,
          width: "100%",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: "1px solid var(--gold-bg, #ddd)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--gold-bg-soft, #eee)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-surface-1, #fafafa)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--gold-bg, rgba(198,145,76,0.1))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold-2, #C6914C)",
              }}
            >
              <Palette size={18} />
            </span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-strong)", margin: 0 }}>
                ثيمات البطاقة
              </h2>
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: 0, marginTop: 2 }}>
                {CARD_THEMES.length} ثيم احترافي — اختر الذي يعكس هويّتك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-faint)",
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--gold-bg-soft, #eee)",
            display: "flex",
            gap: 6,
            overflowX: "auto",
            background: "var(--bg-surface-2, #f5f5f5)",
            flexShrink: 0,
          }}
        >
          {categories.map((c) => {
            const isActive = activeCategory === c;
            const label = c === "all" ? "الكل" : CATEGORY_LABELS[c].label;
            const emoji = c === "all" ? "🎨" : CATEGORY_LABELS[c].emoji;
            const count =
              c === "all" ? CARD_THEMES.length : CARD_THEMES.filter((t) => t.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  background: isActive ? "var(--gold-2, #C6914C)" : "var(--bg-surface-1, #fff)",
                  color: isActive ? "var(--bg-page, #fff)" : "var(--text-soft)",
                  fontSize: 12,
                  fontWeight: 700,
                  border: `1px solid ${isActive ? "var(--gold-2, #C6914C)" : "var(--gold-bg, #ddd)"}`,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>{emoji}</span>
                <span>{label}</span>
                <span style={{ opacity: 0.7, fontSize: 10 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Themes Grid */}
        <div
          style={{
            padding: 18,
            overflowY: "auto",
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            alignContent: "start",
          }}
        >
          {filteredThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isCurrent={isCurrent(theme)}
              onSelect={() => {
                onApply({
                  bg_color: theme.bg_color,
                  text_color: theme.text_color,
                  accent_color: theme.accent_color,
                  theme_id: theme.id,
                });
              }}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--gold-bg-soft, #eee)",
            background: "var(--bg-surface-1, #fafafa)",
            fontSize: 11.5,
            color: "var(--text-faint)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Sparkles size={12} style={{ color: "var(--gold-2)" }} />
          التغيير يؤثر على البطاقة فقط — لا يغيّر ثيم لوحة التحكم.
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isCurrent,
  onSelect,
}: {
  theme: CardTheme;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "right",
        position: "relative",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.18s ease",
      }}
    >
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: `2px solid ${isCurrent ? theme.accent_color : "var(--gold-bg, #ddd)"}`,
          transition: "all 0.2s",
          boxShadow: isCurrent
            ? `0 0 0 3px ${theme.accent_color}30`
            : hover
              ? `0 8px 24px ${theme.accent_color}25`
              : "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Preview — مصغّر للبطاقة الفعلية */}
        <div
          style={{
            background: theme.preview_gradient || theme.bg_color,
            height: 140,
            position: "relative",
            padding: "12px 10px",
          }}
        >
          {/* Mini avatar */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: theme.accent_color,
              border: `2px solid ${theme.bg_color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              color: theme.bg_color,
              flexShrink: 0,
              margin: "0 auto 6px",
            }}
          >
            {theme.emoji}
          </div>

          {/* Mini name */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: theme.text_color,
              textAlign: "center",
              marginBottom: 4,
              opacity: 0.9,
            }}
          >
            وسيط عقاري
          </div>

          {/* Mini bio bar */}
          <div
            style={{
              width: "60%",
              height: 4,
              background: theme.text_color,
              opacity: 0.2,
              borderRadius: 2,
              margin: "0 auto 8px",
            }}
          />

          {/* Mini links (3 boxes) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 6px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 9,
                  background: theme.accent_color,
                  opacity: 0.85 - i * 0.18,
                  borderRadius: 3,
                }}
              />
            ))}
          </div>

          {isCurrent && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: theme.accent_color,
                color: theme.bg_color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={13} strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Name + accent dot */}
        <div
          style={{
            background: theme.bg_color,
            color: theme.text_color,
            padding: "10px 12px",
            fontSize: 12.5,
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{theme.name}</span>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: theme.accent_color,
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </button>
  );
}
