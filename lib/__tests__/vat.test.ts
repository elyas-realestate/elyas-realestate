// ══════════════════════════════════════════════════════════════
// vat.test.ts — حساب VAT 15% السعودية + ZATCA compliance
// ══════════════════════════════════════════════════════════════
import { describe, it, expect } from "vitest";
import { VAT_RATE, calculateVAT, reverseVAT, formatSAR, formatBreakdown } from "../vat";

describe("VAT_RATE — ثابت", () => {
  it("النسبة 15% بالضبط", () => {
    expect(VAT_RATE).toBe(0.15);
  });
});

describe("calculateVAT — من net إلى gross", () => {
  it("100 ريال صافي → 15 ضريبة + 115 إجمالي", () => {
    const r = calculateVAT(100);

    expect(r.net).toBe(100);
    expect(r.vat).toBe(15);
    expect(r.gross).toBe(115);
  });

  it("249 ريال (خطة Premium مثالاً)", () => {
    const r = calculateVAT(249);

    expect(r.net).toBe(249);
    expect(r.vat).toBe(37.35);
    expect(r.gross).toBe(286.35);
  });

  it("يُنتج halalas صحيحة للـ Moyasar (×100)", () => {
    const r = calculateVAT(99);

    expect(r.netHalalas).toBe(9900); // 99 × 100
    expect(r.vatHalalas).toBe(1485); // 14.85 × 100
    expect(r.grossHalalas).toBe(11385); // 113.85 × 100
  });

  it("يتعامل مع الأرقام الكسرية بدقّة (يقرّب لـ هللتين)", () => {
    const r = calculateVAT(33.33);

    expect(r.vat).toBeCloseTo(5.0, 2); // 33.33 × 0.15 = 4.9995 → 5.00
    expect(r.gross).toBeCloseTo(38.33, 2);
  });

  it("صفر → كل القيم صفر", () => {
    const r = calculateVAT(0);

    expect(r.net).toBe(0);
    expect(r.vat).toBe(0);
    expect(r.gross).toBe(0);
    expect(r.grossHalalas).toBe(0);
  });
});

describe("reverseVAT — من gross إلى net", () => {
  it("115 إجمالي → 100 صافي + 15 ضريبة", () => {
    const r = reverseVAT(115);

    expect(r.gross).toBe(115);
    expect(r.net).toBe(100);
    expect(r.vat).toBe(15);
  });

  it("286.35 إجمالي → 249 صافي + 37.35 ضريبة", () => {
    const r = reverseVAT(286.35);

    expect(r.net).toBeCloseTo(249, 2);
    expect(r.vat).toBeCloseTo(37.35, 2);
  });

  it("calculateVAT + reverseVAT متطابقان (round-trip)", () => {
    const original = 99;
    const forward = calculateVAT(original);
    const backward = reverseVAT(forward.gross);

    expect(backward.net).toBeCloseTo(original, 2);
  });
});

describe("formatSAR — عرض المبلغ", () => {
  it("يُضيف رمز 'ر.س' + رقمين بعد العشرة", () => {
    expect(formatSAR(100)).toBe("100.00 ر.س");
    expect(formatSAR(249.5)).toBe("249.50 ر.س");
    expect(formatSAR(0)).toBe("0.00 ر.س");
  });

  it("يُضيف فواصل آلاف", () => {
    expect(formatSAR(1234.56)).toContain("1,234.56");
    expect(formatSAR(1_000_000)).toContain("1,000,000");
  });
});

describe("formatBreakdown — عرض UI كامل", () => {
  it("يُعطي ٤ حقول جاهزة للعرض", () => {
    const breakdown = calculateVAT(100);
    const formatted = formatBreakdown(breakdown);

    expect(formatted.net).toBe("100.00 ر.س");
    expect(formatted.vat).toBe("15.00 ر.س");
    expect(formatted.gross).toBe("115.00 ر.س");
    expect(formatted.vatLabel).toBe("ضريبة القيمة المضافة (15%)");
  });
});
