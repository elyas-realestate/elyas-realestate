"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Calculator,
  Home,
  Percent,
  Calendar,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import SARIcon from "../components/SARIcon";

// ── الصيغة الرياضية للقسط الشهري ────────────────────────────────────────────
function calcMonthly(loan: number, annualRate: number, years: number): number {
  if (!loan || !years) return 0;
  if (annualRate === 0) return loan / (years * 12);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return (loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
}

// نستعمل الأرقام الإنجليزية بفواصل آلاف لتسهيل القراءة المالية وتجنّب اختلاط الـ glyphs
function fmtFull(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

// ── البنوك السعودية ──────────────────────────────────────────────────────────
const BANKS = [
  { name: "البنك الأهلي السعودي", rate: 4.5, color: "#22C55E" },
  { name: "بنك الرياض", rate: 4.75, color: "#3B82F6" },
  { name: "بنك البلاد", rate: 5.0, color: "#A855F7" },
  { name: "بنك الجزيرة", rate: 4.85, color: "#F59E0B" },
  { name: "بنك سامبا", rate: 5.25, color: "#EF4444" },
];

const TERMS = [5, 10, 15, 20, 25, 30];

const inp =
  "w-full bg-[var(--bg-surface-2)] border border-[var(--gold-bg-hover)] rounded-xl px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--border-1)] focus:outline-none focus:border-[var(--gold-2)] transition";

// ── جدول التسديد (سنة واحدة) ─────────────────────────────────────────────────
function AmortizationTable({
  loan,
  annualRate,
  years,
}: {
  loan: number;
  annualRate: number;
  years: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const monthly = calcMonthly(loan, annualRate, years);
  const r = annualRate / 100 / 12;
  const rows: {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[] = [];
  let balance = loan;
  const limit = expanded ? Math.min(years * 12, 60) : 12;
  for (let i = 1; i <= limit && balance > 0; i++) {
    const interest = balance * r;
    const principal = monthly - interest;
    balance = Math.max(0, balance - principal);
    rows.push({ month: i, payment: monthly, principal, interest, balance });
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--gold-bg)" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-5"
        style={{ background: "var(--bg-surface-1)", cursor: "pointer", border: "none" }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-on-dark)" }}>
          جدول التسديد الشهري
        </span>
        <div className="flex items-center gap-2" style={{ color: "var(--gold-2)", fontSize: 12 }}>
          {expanded ? "عرض أقل" : "عرض جدول السنة الأولى"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="overflow-x-auto" style={{ background: "var(--bg-surface-1)" }}>
          <table className="w-full" style={{ minWidth: 500 }}>
            <thead>
              <tr style={{ borderTop: "1px solid var(--gold-bg-soft)" }}>
                {["الشهر", "القسط", "أصل الدين", "الفائدة", "الرصيد المتبقي"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-right text-xs font-semibold"
                    style={{
                      color: "var(--text-faint)",
                      borderBottom: "1px solid var(--gold-bg-soft)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} style={{ borderBottom: "1px solid rgba(198,145,76,0.04)" }}>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "var(--text-soft)" }}>
                    {r.month}
                  </td>
                  <td
                    className="px-4 py-2.5"
                    style={{ fontSize: 12, color: "var(--text-on-dark)", fontWeight: 600 }}
                  >
                    {fmtFull(r.payment)} ر.س
                  </td>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "var(--success)" }}>
                    {fmtFull(r.principal)} ر.س
                  </td>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "var(--danger)" }}>
                    {fmtFull(r.interest)} ر.س
                  </td>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "var(--gold-2)" }}>
                    {fmtFull(r.balance)} ر.س
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {years * 12 > 60 && (
            <p className="py-3 text-center" style={{ fontSize: 11, color: "var(--text-faint)" }}>
              يُعرض أول 60 شهراً فقط
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function MortgagePage() {
  const [price, setPrice] = useState("1000000");
  const [downPct, setDownPct] = useState(20);
  const [downAmt, setDownAmt] = useState(200000);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(4.5);
  const [rateInput, setRateInput] = useState("4.5");
  const [copied, setCopied] = useState(false);

  const priceNum = parseFloat(price.replace(/,/g, "")) || 0;

  // Keep downPct ↔ downAmt in sync
  function onDownPctChange(v: number) {
    setDownPct(v);
    setDownAmt(Math.round((priceNum * v) / 100));
  }
  function onDownAmtChange(v: number) {
    setDownAmt(v);
    if (priceNum > 0) setDownPct(Math.round((v / priceNum) * 100));
  }
  useEffect(() => {
    setDownAmt(Math.round((priceNum * downPct) / 100));
  }, [priceNum]);

  const loan = Math.max(0, priceNum - downAmt);
  const monthly = calcMonthly(loan, rate, years);
  const total = monthly * years * 12;
  const totalInt = total - loan;
  const intRatio = loan > 0 ? (totalInt / loan) * 100 : 0;

  // Copy summary
  function copySummary() {
    const text = [
      "ملخص التمويل العقاري — وسيط برو",
      `قيمة العقار: ${fmtFull(priceNum)} ريال`,
      `الدفعة الأولى: ${fmtFull(downAmt)} ريال (${downPct}%)`,
      `مبلغ التمويل: ${fmtFull(loan)} ريال`,
      `مدة التمويل: ${years} سنة`,
      `نسبة الفائدة: ${rate}%`,
      `القسط الشهري: ${fmtFull(monthly)} ريال`,
      `إجمالي الدفعات: ${fmtFull(total)} ريال`,
      `إجمالي الفوائد: ${fmtFull(totalInt)} ريال`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      dir="rtl"
      style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-strong)" }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--gold-bg)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg,var(--gold-2),var(--gold-4))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Cairo, sans-serif",
              fontWeight: 900,
              fontSize: 16,
              color: "var(--bg-page)",
            }}
          >
            و
          </div>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-strong)",
                lineHeight: 1.2,
              }}
            >
              وسيط برو
            </p>
            <p style={{ fontSize: 10, color: "var(--gold-2)" }}>حاسبة التمويل العقاري</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowRight size={14} /> لوحة التحكم
        </Link>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* ── Hero ── */}
        <div className="text-center" style={{ marginBottom: 40 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "linear-gradient(135deg,var(--gold-bg-hover),var(--gold-bg-soft))",
              border: "1px solid rgba(198,145,76,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Calculator size={26} style={{ color: "var(--gold-2)" }} />
          </div>
          <h1 className="font-cairo font-bold" style={{ fontSize: 28, marginBottom: 8 }}>
            حاسبة التمويل العقاري
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-faint)", maxWidth: 420, margin: "0 auto" }}>
            احسب قسطك الشهري واستكشف خيارات التمويل المناسبة لك — مجاناً وفورياً
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* ── Inputs ── */}
          <div className="space-y-5 lg:col-span-2">
            {/* قيمة العقار */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Home size={15} style={{ color: "var(--gold-2)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>قيمة العقار</h3>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={price ? Number(price.replace(/,/g, "")).toLocaleString("en-US") : ""}
                onChange={(e) => setPrice(e.target.value.replace(/,/g, "").replace(/[^\d]/g, ""))}
                placeholder="1,000,000"
                className={inp}
                dir="ltr"
              />
              <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>ر.س</p>
            </div>

            {/* الدفعة الأولى */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Percent size={15} style={{ color: "var(--gold-2)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>الدفعة الأولى</h3>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--text-faint)",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    النسبة %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={downPct}
                    onChange={(e) => onDownPctChange(Number(e.target.value))}
                    className={inp}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: "var(--text-faint)",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    المبلغ ر.س
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={downAmt}
                    onChange={(e) => onDownAmtChange(Number(e.target.value))}
                    className={inp}
                    dir="ltr"
                  />
                </div>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={downPct}
                onChange={(e) => onDownPctChange(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--gold-2)" }}
              />
              <div
                className="mt-1 flex justify-between"
                style={{ fontSize: 10, color: "var(--text-faint)" }}
              >
                {[5, 10, 20, 30, 40, 50].map((v) => (
                  <span key={v}>{v}%</span>
                ))}
              </div>
            </div>

            {/* مدة التمويل */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Calendar size={15} style={{ color: "var(--gold-2)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>مدة التمويل</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setYears(t)}
                    className="rounded-xl py-2 text-sm font-semibold transition"
                    style={{
                      background: years === t ? "var(--gold-bg-hover)" : "var(--bg-surface-2)",
                      border:
                        "1px solid " +
                        (years === t ? "rgba(198,145,76,0.4)" : "var(--gold-bg-soft)"),
                      color: years === t ? "var(--gold-2)" : "var(--text-faint)",
                    }}
                  >
                    {t} سنة
                  </button>
                ))}
              </div>
            </div>

            {/* نسبة الفائدة */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <TrendingDown size={15} style={{ color: "var(--gold-2)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>نسبة الفائدة السنوية</h3>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={rateInput}
                  onChange={(e) => {
                    setRateInput(e.target.value);
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v > 0 && v <= 30) setRate(v);
                  }}
                  onBlur={() => {
                    const v = parseFloat(rateInput);
                    if (isNaN(v) || v <= 0) {
                      setRate(4.5);
                      setRateInput("4.5");
                    }
                  }}
                  style={{
                    width: 70,
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--gold-bg-strong)",
                    borderRadius: 10,
                    padding: "8px 10px",
                    color: "var(--gold-2)",
                    outline: "none",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                  dir="ltr"
                />
                <span style={{ color: "var(--gold-2)", fontWeight: 700, fontSize: 16 }}>%</span>
                <span style={{ fontSize: 11, color: "var(--text-faint)", marginRight: 4 }}>
                  سنوياً
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={0.25}
                value={rate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setRate(v);
                  setRateInput(String(v));
                }}
                className="w-full"
                style={{ accentColor: "var(--gold-2)" }}
              />
              <div
                className="mt-1 flex justify-between"
                style={{ fontSize: 10, color: "var(--text-faint)" }}
              >
                <span>1%</span>
                <span>5%</span>
                <span>10%</span>
                <span>15%</span>
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div className="space-y-5 lg:col-span-3">
            {/* القسط الشهري */}
            <div
              className="rounded-2xl p-6"
              style={{
                background:
                  "linear-gradient(135deg, #1A1208 0%, #0F0D0A 60%, var(--bg-surface-1) 100%)",
                border: "1px solid var(--gold-bg-hover)",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text-soft)", marginBottom: 8 }}>
                القسط الشهري
              </p>
              <div className="mb-2 flex items-center gap-3">
                <p
                  className="font-cairo font-black"
                  style={{ fontSize: 42, color: "var(--gold-2)", lineHeight: 1 }}
                >
                  {fmtFull(monthly)}
                </p>
                <span style={{ fontSize: 20, color: "var(--gold-4)", fontWeight: 700 }}>ر.س</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-faint)" }}>
                لمدة {years} سنة ({years * 12} شهراً)
              </p>

              <div style={{ height: 1, background: "var(--gold-bg)", margin: "20px 0" }} />

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "مبلغ التمويل", val: fmtFull(loan), color: "var(--text-on-dark)" },
                  { label: "الدفعة الأولى", val: fmtFull(downAmt), color: "var(--success)" },
                  { label: "إجمالي الدفعات", val: fmtFull(total), color: "var(--gold-2)" },
                  { label: "إجمالي الفوائد", val: fmtFull(totalInt), color: "var(--danger)" },
                ].map((r, i) => (
                  <div key={i}>
                    <p style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 3 }}>
                      {r.label}
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: r.color }}>
                      {r.val} <span style={{ fontSize: 12 }}>ر.س</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Progress bar: أصل vs فوائد */}
              {loan > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div
                    className="mb-1.5 flex justify-between"
                    style={{ fontSize: 11, color: "var(--text-faint)" }}
                  >
                    <span>أصل الدين {(100 - intRatio).toFixed(0)}%</span>
                    <span>فوائد {intRatio.toFixed(0)}%</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: "var(--bg-surface-3)",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: 100 - intRatio + "%",
                        background: "linear-gradient(90deg,var(--success),#22C55E)",
                        transition: "width 0.5s",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        background: "linear-gradient(90deg,var(--danger),#EF4444)",
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={copySummary}
                className="mt-5 flex items-center gap-2 rounded-xl px-4 py-2 transition"
                style={{
                  background: "var(--gold-bg-soft)",
                  border: "1px solid var(--gold-bg-hover)",
                  color: "var(--gold-2)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {copied ? (
                  <>
                    <Check size={13} /> تم النسخ!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> نسخ الملخص
                  </>
                )}
              </button>
            </div>

            {/* مقارنة البنوك */}
            <div
              className="overflow-hidden rounded-2xl"
              style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
            >
              <div className="p-5" style={{ borderBottom: "1px solid var(--gold-bg-soft)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>مقارنة البنوك السعودية</h3>
                <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>
                  بناءً على نفس المبلغ والمدة — نسب تقريبية
                </p>
              </div>
              <div className="space-y-0">
                {[...BANKS]
                  .sort((a, b) => a.rate - b.rate)
                  .map((bank, i) => {
                    const m = calcMonthly(loan, bank.rate, years);
                    const isSelected = bank.rate === rate;
                    const diff = m - monthly;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setRate(bank.rate);
                          setRateInput(String(bank.rate));
                        }}
                        className="flex cursor-pointer items-center justify-between px-5 py-4 transition"
                        style={{
                          borderBottom: "1px solid var(--gold-bg-soft)",
                          background: isSelected ? "var(--gold-bg-soft)" : "transparent",
                          borderRight: isSelected
                            ? "3px solid var(--gold-2)"
                            : "3px solid transparent",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: isSelected ? "var(--gold-2)" : "var(--text-on-dark)",
                            }}
                          >
                            {bank.name}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-faint)" }}>
                            {bank.rate}% سنوياً
                          </p>
                        </div>
                        <div className="text-left">
                          <p style={{ fontSize: 16, fontWeight: 700, color: bank.color }}>
                            {fmtFull(m)} <span style={{ fontSize: 11 }}>ر.س/شهر</span>
                          </p>
                          {!isSelected && diff !== 0 && (
                            <p
                              style={{
                                fontSize: 11,
                                color: diff > 0 ? "var(--danger)" : "var(--success)",
                              }}
                            >
                              {diff > 0 ? "+" : ""}
                              {fmtFull(diff)} ر.س
                            </p>
                          )}
                          {isSelected && (
                            <p style={{ fontSize: 10, color: "var(--gold-2)" }}>✓ محدد</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* جدول التسديد */}
            {loan > 0 && <AmortizationTable loan={loan} annualRate={rate} years={years} />}
          </div>
        </div>

        {/* Disclaimer — إخلاء مسؤولية + إشارة لساما */}
        <div
          className="mt-8 rounded-xl px-5 py-4"
          style={{ background: "var(--gold-bg-soft)", border: "1px solid var(--gold-bg)" }}
        >
          <p style={{ fontSize: 11.5, color: "var(--text-soft)", lineHeight: 1.9 }}>
            ⚠ <strong style={{ color: "var(--text-strong)" }}>إخلاء مسؤولية:</strong> هذه أرقام
            إرشادية فقط ولا تُعدّ عرضاً تمويلياً رسمياً. الأرقام الفعلية تعتمد على سياسات البنك،
            تاريخك الائتماني، ونوع التمويل (ثابت/متغير). كذلك يخضع التمويل العقاري لضوابط{" "}
            <strong>البنك المركزي السعودي (ساما)</strong> ونسبة عبء الدين (DTI) المحدّدة، وقد لا
            يتطابق القسط الفعلي مع المحسوب هنا.
            <br />
            للحصول على عرض رسمي، تواصل مباشرة مع البنك أو شركة التمويل المرخّصة.
          </p>
        </div>
      </div>
    </div>
  );
}
