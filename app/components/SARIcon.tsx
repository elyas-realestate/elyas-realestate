import React from "react";

/**
 * أيقونة رمز الريال السعودي الرسمي
 * ضع صورة الأيقونة في: public/sar.png
 *
 * الاستخدام:
 *   <SARIcon />              — اللون الخافت (مثل نص "ريال")
 *   <SARIcon color="accent" />  — اللون الذهبي (مثل السعر)
 *   <SARIcon size={18} />    — حجم مخصص
 */
export default function SARIcon({
  size = 13,
  color = "muted",
  style = {},
}: {
  size?: number;
  /** "accent" = ذهبي | "secondary" = ثانوي | "muted" = خافت | أو لون مباشر مثل "#9A9AA0" */
  color?: "accent" | "secondary" | "muted" | string;
  style?: React.CSSProperties;
}) {
  const filterMap: Record<string, string> = {
    accent:    "invert(1) sepia(1) saturate(4) hue-rotate(325deg) brightness(0.88)",
    secondary: "invert(1) brightness(0.65)",
    muted:     "invert(1) brightness(0.42)",
  };

  const filterValue = filterMap[color] ?? `invert(1) brightness(0.65)`;

  return (
    <img
      src="/sar.png"
      alt=""
      aria-label="ريال سعودي"
      width={size}
      height={Math.round(size * 1.12)}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        objectFit: "contain",
        filter: filterValue,
        mixBlendMode: "screen",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
