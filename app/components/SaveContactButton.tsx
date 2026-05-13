"use client";

import { useState } from "react";

// ══════════════════════════════════════════════════════════════════
// SaveContactButton — زر "احفظ في جهات اتصالك" المميّز
// يعمل مع iPhone / Android / Huawei عبر تنزيل ملف .vcf قياسي
//
// آلية العمل:
//   - iPhone (Safari): ينزّل .vcf ثم يفتح ورقة "إضافة جهة اتصال" تلقائياً.
//   - Android (Chrome/Samsung): ينزّل .vcf، ضغطة على الملف تفتح "جهات الاتصال".
//   - Huawei (Petal/Browser): نفس Android — vCard 3.0 معيار قياسي.
//
// التصميم:
//   - زر هيرو بارز مع تدرّج، أيقونة، وحركة hover/active.
//   - يعرض حالة "تم التنزيل" بعد النقر مع تنبيه قصير للزائر.
// ══════════════════════════════════════════════════════════════════

interface Props {
  slug: string;
  brokerName?: string | null;
  accent?: string;
  bgColor?: string;
  textColor?: string;
  variant?: "hero" | "compact";
  fullWidth?: boolean;
  className?: string;
}

export default function SaveContactButton({
  slug,
  brokerName,
  accent = "#C6914C",
  bgColor = "#FAF7F2",
  textColor = "#1A1206",
  variant = "hero",
  fullWidth = true,
  className,
}: Props) {
  const [downloaded, setDownloaded] = useState(false);
  const [hover, setHover] = useState(false);

  function handleClick(e: React.MouseEvent) {
    // نسمح بالسلوك الطبيعي للوسم <a> ولكن نعرض حالة "تم"
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 4000);
    // analytics ping (best-effort, لا يوقف التحميل)
    try {
      const img = new Image();
      img.src = `/api/event?type=vcard_download&slug=${encodeURIComponent(slug)}`;
    } catch {}
  }

  // ── النسخة المختصرة (للـ navbars) ──
  if (variant === "compact") {
    return (
      <a
        href={`/api/vcard/${slug}`}
        download={`${brokerName || slug}.vcf`}
        onClick={handleClick}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          borderRadius: 999,
          background: accent,
          color: bgColor,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          border: `1px solid ${accent}`,
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
      >
        <ContactIcon size={16} />
        <span>{downloaded ? "تم التحميل ✓" : "احفظ بياناتي"}</span>
      </a>
    );
  }

  // ── النسخة البارزة (Hero) ──
  return (
    <a
      href={`/api/vcard/${slug}`}
      download={`${brokerName || slug}.vcf`}
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        width: fullWidth ? "100%" : "auto",
        padding: "16px 22px",
        borderRadius: 16,
        background: `linear-gradient(135deg, ${accent} 0%, ${shadeColor(accent, -12)} 100%)`,
        color: pickContrastColor(accent),
        fontSize: 16,
        fontWeight: 800,
        textDecoration: "none",
        border: `1.5px solid ${shadeColor(accent, -18)}`,
        boxShadow: hover
          ? `0 12px 28px ${accent}55, 0 4px 12px rgba(0,0,0,0.12)`
          : `0 6px 18px ${accent}33, 0 2px 6px rgba(0,0,0,0.08)`,
        transform: hover ? "translateY(-2px) scale(1.01)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        letterSpacing: "0.2px",
      }}
    >
      {/* نبضة لطيفة على الخلفية */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
          backgroundSize: "200% 200%",
          animation: hover ? "saveContactShine 1.6s ease-in-out infinite" : "none",
          pointerEvents: "none",
        }}
      />

      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "rgba(255,255,255,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          backdropFilter: "blur(4px)",
        }}
      >
        {downloaded ? <CheckIcon size={22} /> : <ContactIcon size={22} />}
      </span>

      <span
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "right",
          flex: 1,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25 }}>
          {downloaded ? "تم التنزيل ✓" : "اضغط لحفظ في جهات اتصالك"}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.85, marginTop: 2 }}>
          {downloaded
            ? "افتح الملف لإضافته إلى جهات الاتصال"
            : "iPhone · Android · Huawei — بضغطة واحدة"}
        </span>
      </span>

      <span
        style={{
          fontSize: 18,
          fontWeight: 900,
          opacity: 0.9,
          transform: hover ? "translateX(-4px)" : "translateX(0)",
          transition: "transform 0.2s ease",
        }}
      >
        ←
      </span>

      <style>{`
        @keyframes saveContactShine {
          0% { background-position: 200% 50%; }
          100% { background-position: -100% 50%; }
        }
      `}</style>
    </a>
  );
}

// ── أيقونات SVG inline (لا اعتماد خارجي) ──
function ContactIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
    </svg>
  );
}

// ── Helpers لونية ──
function shadeColor(hex: string, percent: number): string {
  try {
    const c = hex.replace("#", "");
    const num = parseInt(
      c.length === 3
        ? c
            .split("")
            .map((x) => x + x)
            .join("")
        : c,
      16
    );
    let r = (num >> 16) + Math.round((percent / 100) * 255);
    let g = ((num >> 8) & 0x00ff) + Math.round((percent / 100) * 255);
    let b = (num & 0x0000ff) + Math.round((percent / 100) * 255);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  } catch {
    return hex;
  }
}

function pickContrastColor(hex: string): string {
  try {
    const c = hex.replace("#", "");
    const num = parseInt(
      c.length === 3
        ? c
            .split("")
            .map((x) => x + x)
            .join("")
        : c,
      16
    );
    const r = num >> 16;
    const g = (num >> 8) & 0x00ff;
    const b = num & 0x0000ff;
    // luminance (perceived)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? "#1a1206" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}
