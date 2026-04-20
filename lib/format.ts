/**
 * تنسيق الأسعار بالريال السعودي — يُستخدم في كل أنحاء المنصة
 * مثال: formatSAR(1500000) → "1,500,000 ر.س"
 */
export function formatSAR(amount: number | string | null | undefined, opts?: { short?: boolean }): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = Number(amount);
  if (isNaN(num)) return "—";

  if (opts?.short && num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}م ر.س`;
  }
  if (opts?.short && num >= 1_000) {
    return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1)}ك ر.س`;
  }

  return `${num.toLocaleString("ar-SA")} ر.س`;
}

/** نفس formatSAR لكن بدون الرمز — للـ inputs والـ placeholders */
export function formatNumber(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const num = Number(amount);
  if (isNaN(num)) return "";
  return num.toLocaleString("ar-SA");
}
