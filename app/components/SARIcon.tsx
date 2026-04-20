import React from "react";

/**
 * أيقونة أو نص رمز الريال السعودي برمجياً بدل الصورة
 * لتلافي مشاكل الاختفاء وخاصية mixBlendMode
 * 
 * الاستخدام:
 *   <SARIcon />
 *   <SARIcon color="accent" />
 *   <SARIcon color="#FF5500" />
 */
export default function SARIcon({
  size = 14,
  color = "muted",
  style = {},
}: {
  size?: number;
  /** "accent" = ذهبي | "secondary" = ثانوي | "muted" = خافت | أو لون مباشر */
  color?: "accent" | "secondary" | "muted" | string;
  style?: React.CSSProperties;
}) {
  const colorMap: Record<string, string> = {
    accent: "#C6914C",
    secondary: "#A1A1AA",
    muted: "#71717A",
  };

  const textColor = colorMap[color] || color;

  return (
    <span
      lang="ar"
      dir="rtl"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontFamily: "'Cairo', sans-serif",
        fontSize: size,
        color: textColor,
        lineHeight: 1,
        userSelect: "none",
        ...style,
      }}
      aria-label="ر.س"
    >
      ر.س
    </span>
  );
}
