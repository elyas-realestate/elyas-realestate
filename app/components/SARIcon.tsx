import React from "react";

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  أيقونة رمز الريال السعودي الرسمي (SAMA — البنك المركزي)   ║
 * ║                                                                ║
 * ║  الصورة الرسمية في public/sar.png                             ║
 * ║  تستخدم تقنية CSS Mask لأخذ لون النص الحالي تلقائياً          ║
 * ║  → تعمل في كل الثيمات (كريمي، داكن) بدون مشاكل mixBlendMode  ║
 * ║                                                                ║
 * ║  الاستخدام:                                                    ║
 * ║    <SARIcon />                       — لون خافت                ║
 * ║    <SARIcon color="accent" />        — ذهبي                   ║
 * ║    <SARIcon color="#FF5500" />       — لون مخصص               ║
 * ║    <SARIcon size={20} />             — حجم مخصص               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
export default function SARIcon({
  size = 14,
  color = "muted",
  style = {},
  className = "",
}: {
  size?: number;
  /** "accent" = ذهبي | "strong" = نص قوي | "secondary" = ثانوي | "muted" = خافت | أو لون CSS مباشر */
  color?: "accent" | "strong" | "secondary" | "muted" | string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const colorMap: Record<string, string> = {
    accent: "var(--gold-2)",
    strong: "var(--text-strong)",
    secondary: "var(--text-soft)",
    muted: "var(--text-faint)",
  };

  const tint = colorMap[color] || color;

  return (
    <span
      role="img"
      aria-label="ريال سعودي"
      title="ريال سعودي"
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: Math.round(size * 1.12),
        backgroundColor: tint,
        WebkitMaskImage: "url(/sar.png)",
        maskImage: "url(/sar.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        verticalAlign: "middle",
        flexShrink: 0,
        userSelect: "none",
        ...style,
      }}
    />
  );
}
