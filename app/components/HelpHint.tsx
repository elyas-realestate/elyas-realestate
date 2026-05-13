"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// HelpHint — زر '?' بجانب أي قسم رئيسي يفتح tooltip بشرح + رابط مساعدة
// مكوّن خفيف بدون مكتبات إضافية
// ══════════════════════════════════════════════════════════════════

interface Props {
  title?: string; // عنوان قصير في الأعلى
  body: string; // النص الرئيسي للشرح
  helpUrl?: string; // رابط (اختياري) لقسم في /dashboard/help
  helpLabel?: string; // اسم الرابط (default: "اقرأ المزيد")
  size?: "sm" | "md"; // حجم الأيقونة
  position?: "left" | "right" | "top" | "bottom";
}

export default function HelpHint({
  title,
  body,
  helpUrl,
  helpLabel = "تفاصيل أكثر ←",
  size = "md",
  position = "bottom",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // إغلاق عند الضغط خارجاً
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const iconSize = size === "sm" ? 13 : 15;
  const buttonSize = size === "sm" ? 22 : 26;

  // تموضع الـ tooltip
  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 1000,
    width: 280,
    background: "var(--bg-surface-1, #fff)",
    color: "var(--text-strong, #1a1206)",
    border: "1px solid var(--gold-bg-hover, rgba(198,145,76,0.25))",
    borderRadius: 12,
    boxShadow: "0 12px 30px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.06)",
    padding: "14px 16px",
    fontSize: 13,
    lineHeight: 1.7,
    fontWeight: 400,
    fontFamily: "inherit",
    direction: "rtl",
    textAlign: "right",
  };

  if (position === "bottom") {
    tooltipStyle.top = `calc(100% + 8px)`;
    tooltipStyle.right = 0;
  } else if (position === "top") {
    tooltipStyle.bottom = `calc(100% + 8px)`;
    tooltipStyle.right = 0;
  } else if (position === "left") {
    tooltipStyle.right = `calc(100% + 8px)`;
    tooltipStyle.top = 0;
  } else {
    tooltipStyle.left = `calc(100% + 8px)`;
    tooltipStyle.top = 0;
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-label={title || "مساعدة"}
        title={title || "مساعدة"}
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: "50%",
          background: open ? "var(--gold-2, #C6914C)" : "var(--gold-bg-soft, rgba(198,145,76,0.1))",
          color: open ? "var(--bg-page, #fff)" : "var(--gold-2, #C6914C)",
          border: `1px solid ${open ? "var(--gold-2, #C6914C)" : "var(--gold-bg, rgba(198,145,76,0.18))"}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          transition: "all 0.15s ease",
          flexShrink: 0,
          verticalAlign: "middle",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = "var(--gold-bg, rgba(198,145,76,0.18))";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "var(--gold-bg-soft, rgba(198,145,76,0.1))";
          }
        }}
      >
        <HelpCircle size={iconSize} />
      </button>

      {open && (
        <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "transparent",
              border: "none",
              color: "var(--text-faint, #777)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={13} />
          </button>

          {title && (
            <div
              className="font-kufi"
              style={{
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 6,
                color: "var(--text-strong, #1a1206)",
                paddingLeft: 22,
              }}
            >
              {title}
            </div>
          )}
          <div style={{ color: "var(--text-soft, #555)" }}>{body}</div>

          {helpUrl && (
            <a
              href={helpUrl}
              style={{
                display: "inline-block",
                marginTop: 10,
                fontSize: 12,
                color: "var(--gold-2, #C6914C)",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {helpLabel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
