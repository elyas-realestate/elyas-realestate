// ── Moyasar Payment Gateway Helper ───────────────────────────────────────
// Docs: https://moyasar.com/docs

export const MOYASAR_BASE = "https://api.moyasar.com/v1";

export interface MoyasarPaymentRequest {
  amount: number;        // in halalas (1 SAR = 100)
  currency: "SAR";
  description: string;
  callback_url: string;
  source: {
    type: "creditcard";
    name: string;
    number: string;
    cvc: string;
    month: string;
    year: string;
  } | { type: "applepay"; token: string } | { type: "stcpay"; mobile: string };
  metadata?: Record<string, string>;
}

export interface MoyasarPayment {
  id: string;
  status: "initiated" | "paid" | "failed" | "authorized" | "captured" | "refunded";
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  source: { type: string; company?: string; name?: string; number?: string };
}

// Server-side: create a payment
export async function createPayment(payload: MoyasarPaymentRequest): Promise<MoyasarPayment> {
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) throw new Error("MOYASAR_SECRET_KEY not configured");

  const res = await fetch(`${MOYASAR_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(key + ":").toString("base64"),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || `Moyasar error ${res.status}`);
  }
  return res.json();
}

// Server-side: fetch a payment by ID
export async function getPayment(id: string): Promise<MoyasarPayment> {
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) throw new Error("MOYASAR_SECRET_KEY not configured");

  const res = await fetch(`${MOYASAR_BASE}/payments/${id}`, {
    headers: { Authorization: "Basic " + Buffer.from(key + ":").toString("base64") },
  });
  if (!res.ok) throw new Error(`Moyasar fetch error ${res.status}`);
  return res.json();
}

// ══════════════════════════════════════════════════════════════
// Plan pricing in SAR — كل الأسعار "صافي قبل الضريبة" (net).
// ZATCA السعودية: VAT 15% يُضاف على الفاتورة الفعلية.
// استخدم calculateVAT() من lib/vat.ts للحصول على breakdown.
// ══════════════════════════════════════════════════════════════
export const PLAN_PRICES: Record<string, { monthly: number; yearly: number; label: string }> = {
  basic: { monthly: 99,  yearly: 899,  label: "الأساسي"   },
  pro:   { monthly: 249, yearly: 2249, label: "الاحترافي" },
};

import { calculateVAT, type PriceBreakdown } from "./vat";

/**
 * يعطي breakdown كامل (net + VAT + gross) لخطة معيّنة بدورة فوترة معيّنة.
 * هذا هو المصدر الموحَّد لأي حساب فوترة في النظام.
 */
export function getPlanBreakdown(
  plan: string,
  billing: "monthly" | "yearly"
): PriceBreakdown | null {
  const info = PLAN_PRICES[plan];
  if (!info) return null;
  const netSAR = billing === "monthly" ? info.monthly : info.yearly;
  return calculateVAT(netSAR);
}
