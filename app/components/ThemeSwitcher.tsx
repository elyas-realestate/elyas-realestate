"use client";
import { useState, useEffect } from "react";
import { Moon, Sun, Check } from "lucide-react";
import { toast } from "sonner";

type ThemeMode = "dark" | "cream";

const THEMES: Array<{
  id: ThemeMode;
  name: string;
  description: string;
  preview: { bg: string; surface: string; text: string; accent: string };
  Icon: typeof Moon;
}> = [
  {
    id: "dark",
    name: "الثيم الداكن",
    description: "أسود فخم بلمسات ذهبية — هوية المنصّة الأصلية",
    preview: { bg: "#0A0A0C", surface: "#16161A", text: "#F4F4F5", accent: "#E8B86D" },
    Icon: Moon,
  },
  {
    id: "cream",
    name: "الثيم الكريمي العقاري",
    description: "كريمي ناعم بنبرة عقارية فخمة — مستوحى من العلامات العقارية الراقية",
    preview: { bg: "#FAF7F2", surface: "#FFFFFF", text: "#1A1206", accent: "#E8B86D" },
    Icon: Sun,
  },
];

export default function ThemeSwitcher() {
  const [active, setActive] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // قراءة الثيم الحالي من document أو localStorage
    const html = document.documentElement;
    const current = (html.getAttribute("data-theme") || localStorage.getItem("wasit_theme") || "dark") as ThemeMode;
    setActive(current);
    setMounted(true);
  }, []);

  function applyTheme(mode: ThemeMode) {
    if (mode === active) return;
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("wasit_theme", mode);
    setActive(mode);
    toast.success(`تم تطبيق ${mode === "dark" ? "الثيم الداكن" : "الثيم الكريمي"}`);
  }

  if (!mounted) return null;

  return (
    <div style={{
      background: "var(--bg-surface-1)",
      border: "1px solid var(--border-1)",
      borderRadius: 14,
      padding: 20,
      marginBottom: 20,
    }}>
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: "var(--text-primary)",
        marginBottom: 6, display: "flex", alignItems: "center", gap: 8,
      }}>
        🎨 اختيار الثيم العام
      </h2>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
        تفضيلك يُحفظ تلقائياً ويبقى محفوظاً بين الجلسات على هذا الجهاز.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 12,
      }}>
        {THEMES.map(theme => {
          const Icon = theme.Icon;
          const isActive = active === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              style={{
                background: "transparent",
                border: `2px solid ${isActive ? "var(--gold-1)" : "var(--border-1)"}`,
                borderRadius: 12,
                padding: 14,
                cursor: "pointer",
                textAlign: "right",
                transition: "all 0.2s",
                position: "relative",
                fontFamily: "inherit",
              }}
            >
              {isActive && (
                <div style={{
                  position: "absolute",
                  top: 10, left: 10,
                  width: 24, height: 24, borderRadius: "50%",
                  background: "var(--gold-1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={14} color="#0A0A0C" strokeWidth={3} />
                </div>
              )}

              {/* Preview swatch */}
              <div style={{
                background: theme.preview.bg,
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                border: `1px solid ${theme.preview.bg === "#0A0A0C" ? "#2A2A32" : "#E5DFD0"}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{
                  background: theme.preview.surface,
                  borderRadius: 5,
                  padding: "8px 10px",
                  fontSize: 11,
                  color: theme.preview.text,
                  fontWeight: 600,
                  flex: 1,
                }}>
                  وسيط برو
                </div>
                <div style={{
                  background: theme.preview.accent,
                  borderRadius: 5,
                  padding: "6px 10px",
                  fontSize: 10,
                  color: theme.preview.bg,
                  fontWeight: 700,
                }}>
                  زر
                </div>
              </div>

              {/* Title + description */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Icon size={16} style={{ color: "var(--gold-1)" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {theme.name}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                {theme.description}
              </p>
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 14,
        padding: 10,
        background: "var(--info-bg)",
        border: "1px solid var(--info-bg)",
        borderRadius: 8,
        fontSize: 11,
        color: "var(--info)",
      }}>
        💡 ملاحظة: الثيم يطبَّق على كل صفحات الداشبورد فوراً. الصفحة التسويقية الرئيسية لها تصميم مستقل.
      </div>
    </div>
  );
}
