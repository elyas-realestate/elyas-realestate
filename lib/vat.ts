// ══════════════════════════════════════════════════════════════
// lib/vat.ts — احتساب ضريبة القيمة المضافة (VAT 15%) السعودية
//
// كل الأسعار في PLAN_PRICES تُعتبر "صافي قبل الضريبة" (net).
// عند الفوترة الفعلية، نضيف 15% VAT للحصول على السعر الإجمالي (gross).
//
// ZATCA يتطلب عرض breakdown: subtotal + VAT + total على الفواتير.
// ══════════════════════════════════════════════════════════════

export const VAT_RATE = 0.15; // 15% — السعودية

export interface PriceBreakdown {
  /** السعر الصافي قبل الضريبة (ريال سعودي) */
  net: number;
  /** قيمة ضريبة القيمة المضافة 15% */
  vat: number;
  /** السعر الإجمالي شامل الضريبة */
  gross: number;
  /** السعر الصافي بالهللة (لـ Moyasar) */
  netHalalas: number;
  /** قيمة الضريبة بالهللة */
  vatHalalas: number;
  /** السعر الإجمالي بالهللة (المبلغ الفعلي للخصم) */
  grossHalalas: number;
}

/**
 * يحسب breakdown VAT لمبلغ صافي معطى.
 * @param netSAR — المبلغ قبل الضريبة بالريال السعودي
 */
export function calculateVAT(netSAR: number): PriceBreakdown {
  const net = Math.round(netSAR * 100) / 100;
  const vat = Math.round(net * VAT_RATE * 100) / 100;
  const gross = Math.round((net + vat) * 100) / 100;

  return {
    net,
    vat,
    gross,
    netHalalas: Math.round(net * 100),
    vatHalalas: Math.round(vat * 100),
    grossHalalas: Math.round(gross * 100),
  };
}

/**
 * يستخرج breakdown من مبلغ إجمالي شامل الضريبة (reverse calculation).
 * مفيد لفواتير قديمة أو مبالغ تأتي gross من البداية.
 * @param grossSAR — المبلغ الإجمالي شامل الضريبة بالريال
 */
export function reverseVAT(grossSAR: number): PriceBreakdown {
  const gross = Math.round(grossSAR * 100) / 100;
  const net = Math.round((gross / (1 + VAT_RATE)) * 100) / 100;
  const vat = Math.round((gross - net) * 100) / 100;

  return {
    net,
    vat,
    gross,
    netHalalas: Math.round(net * 100),
    vatHalalas: Math.round(vat * 100),
    grossHalalas: Math.round(gross * 100),
  };
}

/**
 * تنسيق رقم بالريال السعودي مع رمز العملة.
 */
export function formatSAR(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " ر.س";
}

/**
 * تنسيق breakdown كامل للعرض في UI.
 * يعطي ٣ أسطر: subtotal + VAT + total
 */
export function formatBreakdown(breakdown: PriceBreakdown): {
  net: string;
  vat: string;
  gross: string;
  vatLabel: string;
} {
  return {
    net: formatSAR(breakdown.net),
    vat: formatSAR(breakdown.vat),
    gross: formatSAR(breakdown.gross),
    vatLabel: `ضريبة القيمة المضافة (${(VAT_RATE * 100).toFixed(0)}%)`,
  };
}
