"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Calculator, Home, Percent, Calendar, TrendingDown,
  ChevronDown, ChevronUp, Copy, Check, ArrowRight,
} from "lucide-react";
import SARIcon from "../components/SARIcon";

// ── الصيغة الرياضية للقسط الشهري ────────────────────────────────────────────
function calcMonthly(loan: number, annualRate: number, years: number): number {
  if (!loan || !years) return 0;
  if (annualRate === 0) return loan / (years * 12);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function fmtFull(n: number) {
  return Math.round(n).toLocaleString("ar-SA");
}

// ── البنوك السعودية ──────────────────────────────────────────────────────────
const BANKS = [
  { name: "البنك الأهلي السعودي",  rate: 4.5,  color: "#22C55E" },
  { name: "بنك الرياض",            rate: 4.75, color: "#3B82F6" },
  { name: "بنك البلاد",            rate: 5.0,  color: "#A855F7" },
  { name: "بنك الجزيرة",           rate: 4.85, color: "#F59E0B" },
  { name: "بنك سامبا",             rate: 5.25, color: "#EF4444" },
];

const TERMS = [5, 10, 15, 20, 25, 30];

const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#3A3A42] focus:outline-none focus:border-[#C6914C] transition";

// ── جدول التسديد (سنة واحدة) ─────────────────────────────────────────────────
function AmortizationTable({ loan, annualRate, years }: { loan: number; annualRate: number; years: number }) {
  const [expanded, setExpanded] = useState(false);
  const monthly = calcMonthly(loan, annualRate, years);
  const r = annualRate / 100 / 12;
  const rows: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
  let balance = loan;
  const limit = expanded ? Math.min(years * 12, 60) : 12;
  for (let i = 1; i <= limit && balance > 0; i++) {
    const interest  = balance * r;
    const principal = monthly - interest;
    balance         = Math.max(0, balance - principal);
    rows.push({ month: i, payment: monthly, principal, interest, balance });
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(198,145,76,0.12)" }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-5"
        style={{ background: "#16161A", cursor: "pointer", border: "none" }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E5" }}>جدول التسديد الشهري</span>
        <div className="flex items-center gap-2" style={{ color: "#C6914C", fontSize: 12 }}>
          {expanded ? "عرض أقل" : "عرض جدول السنة الأولى"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="overflow-x-auto" style={{ background: "#16161A" }}>
          <table className="w-full" style={{ minWidth: 500 }}>
            <thead>
              <tr style={{ borderTop: "1px solid rgba(198,145,76,0.08)" }}>
                {["الشهر","القسط","أصل الدين","الفائدة","الرصيد المتبقي"].map(h => (
                  <th key={h} className="text-right px-4 py-2.5 text-xs font-semibold"
                    style={{ color: "#5A5A62", borderBottom: "1px solid rgba(198,145,76,0.08)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.month} style={{ borderBottom: "1px solid rgba(198,145,76,0.04)" }}>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "#9A9AA0" }}>{r.month}</td>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "#E5E5E5", fontWeight: 600 }}>{fmtFull(r.payment)} ر.س</td>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "#4ADE80" }}>{fmtFull(r.principal)} ر.س</td>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "#F87171" }}>{fmtFull(r.interest)} ر.س</td>
                  <td className="px-4 py-2.5" style={{ fontSize: 12, color: "#C6914C" }}>{fmtFull(r.balance)} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
          {years * 12 > 60 && (
            <p className="text-center py-3" style={{ fontSize: 11, color: "#5A5A62" }}>يُعرض أول 60 شهراً فقط</p>
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
  const [price,    setPrice]    = useState("1000000");
  const [downPct,  setDownPct]  = useState(20);
  const [downAmt,  setDownAmt]  = useState(200000);
  const [years,    setYears]    = useState(20);
  const [rate,     setRate]     = useState(4.5);
  const [rateInput, setRateInput] = useState("4.5");
  const [copied,   setCopied]   = useState(false);

  const priceNum = parseFloat(price.replace(/,/g, "")) || 0;

  // Keep downPct ↔ downAmt in sync
  function onDownPctChange(v: number) {
    setDownPct(v);
    setDownAmt(Math.round(priceNum * v / 100));
  }
  function onDownAmtChange(v: number) {
    setDownAmt(v);
    if (priceNum > 0) setDownPct(Math.round((v / priceNum) * 100));
  }
  useEffect(() => { setDownAmt(Math.round(priceNum * downPct / 100)); }, [priceNum]);

  const loan     = Math.max(0, priceNum - downAmt);
  const monthly  = calcMonthly(loan, rate, years);
  const total    = monthly * years * 12;
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
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0A0A0C", color: "#F5F5F5" }}>

      {/* ── Header ── */}
      <header style={{
        background: "rgba(10,10,12,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(198,145,76,0.1)",
        position: "sticky", top: 0, zIndex: 40,
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#C6914C,#8A5F2E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Cairo, sans-serif", fontWeight: 900, fontSize: 16, color: "#0A0A0C",
          }}>و</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F5", lineHeight: 1.2 }}>وسيط برو</p>
            <p style={{ fontSize: 10, color: "#C6914C" }}>حاسبة التمويل العقاري</p>
          </div>
        </div>
        <Link href="/dashboard" style={{ fontSize: 12, color: "#5A5A62", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowRight size={14} /> لوحة التحكم
        </Link>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* ── Hero ── */}
        <div className="text-center" style={{ marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: "linear-gradient(135deg,rgba(198,145,76,0.2),rgba(198,145,76,0.06))",
            border: "1px solid rgba(198,145,76,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Calculator size={26} style={{ color: "#C6914C" }} />
          </div>
          <h1 className="font-cairo font-bold" style={{ fontSize: 28, marginBottom: 8 }}>حاسبة التمويل العقاري</h1>
          <p style={{ fontSize: 14, color: "#5A5A62", maxWidth: 420, margin: "0 auto" }}>
            احسب قسطك الشهري واستكشف خيارات التمويل المناسبة لك — مجاناً وفورياً
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Inputs ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* قيمة العقار */}
            <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Home size={15} style={{ color: "#C6914C" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>قيمة العقار</h3>
              </div>
              <input
                type="text" inputMode="numeric"
                value={price ? Number(price.replace(/,/g,"")).toLocaleString("en-US") : ""}
                onChange={e => setPrice(e.target.value.replace(/,/g,"").replace(/[^\d]/g,""))}
                placeholder="1,000,000" className={inp} dir="ltr"
              />
              <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 6 }}>ر.س</p>
            </div>

            {/* الدفعة الأولى */}
            <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Percent size={15} style={{ color: "#C6914C" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>الدفعة الأولى</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label style={{ fontSize: 11, color: "#5A5A62", display: "block", marginBottom: 5 }}>النسبة %</label>
                  <input
                    type="number" min={0} max={100} value={downPct}
                    onChange={e => onDownPctChange(Number(e.target.value))}
                    className={inp} dir="ltr"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#5A5A62", display: "block", marginBottom: 5 }}>المبلغ ر.س</label>
                  <input
                    type="number" min={0} value={downAmt}
                    onChange={e => onDownAmtChange(Number(e.target.value))}
                    className={inp} dir="ltr"
                  />
                </div>
              </div>
              <input type="range" min={5} max={50} step={5} value={downPct}
                onChange={e => onDownPctChange(Number(e.target.value))}
                className="w-full" style={{ accentColor: "#C6914C" }} />
              <div className="flex justify-between mt-1" style={{ fontSize: 10, color: "#5A5A62" }}>
                {[5,10,20,30,40,50].map(v => <span key={v}>{v}%</span>)}
              </div>
            </div>

            {/* مدة التمويل */}
            <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={15} style={{ color: "#C6914C" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>مدة التمويل</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TERMS.map(t => (
                  <button key={t} onClick={() => setYears(t)}
                    className="py-2 rounded-xl text-sm font-semibold transition"
                    style={{
                      background: years === t ? "rgba(198,145,76,0.15)" : "#1C1C22",
                      border: "1px solid " + (years === t ? "rgba(198,145,76,0.4)" : "rgba(198,145,76,0.08)"),
                      color: years === t ? "#C6914C" : "#5A5A62",
                    }}>
                    {t} سنة
                  </button>
                ))}
              </div>
            </div>

            {/* نسبة الفائدة */}
            <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={15} style={{ color: "#C6914C" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>نسبة الفائدة السنوية</h3>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text" inputMode="decimal" value={rateInput}
                  onChange={e => { setRateInput(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0 && v <= 30) setRate(v); }}
                  onBlur={() => { const v = parseFloat(rateInput); if (isNaN(v) || v <= 0) { setRate(4.5); setRateInput("4.5"); } }}
                  style={{ width: 70, background: "#1C1C22", border: "1px solid rgba(198,145,76,0.3)", borderRadius: 10, padding: "8px 10px", color: "#C6914C", outline: "none", textAlign: "center", fontSize: 16, fontWeight: 700 }}
                  dir="ltr"
                />
                <span style={{ color: "#C6914C", fontWeight: 700, fontSize: 16 }}>%</span>
                <span style={{ fontSize: 11, color: "#5A5A62", marginRight: 4 }}>سنوياً</span>
              </div>
              <input type="range" min={1} max={15} step={0.25} value={rate}
                onChange={e => { const v = parseFloat(e.target.value); setRate(v); setRateInput(String(v)); }}
                className="w-full" style={{ accentColor: "#C6914C" }} />
              <div className="flex justify-between mt-1" style={{ fontSize: 10, color: "#5A5A62" }}>
                <span>1%</span><span>5%</span><span>10%</span><span>15%</span>
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* القسط الشهري */}
            <div className="rounded-2xl p-6" style={{
              background: "linear-gradient(135deg, #1A1208 0%, #0F0D0A 60%, #16161A 100%)",
              border: "1px solid rgba(198,145,76,0.2)",
            }}>
              <p style={{ fontSize: 12, color: "#9A9AA0", marginBottom: 8 }}>القسط الشهري</p>
              <div className="flex items-center gap-3 mb-2">
                <p className="font-cairo font-black" style={{ fontSize: 42, color: "#C6914C", lineHeight: 1 }}>
                  {fmtFull(monthly)}
                </p>
                <span style={{ fontSize: 20, color: "#8A5F2E", fontWeight: 700 }}>ر.س</span>
              </div>
              <p style={{ fontSize: 12, color: "#5A5A62" }}>لمدة {years} سنة ({years * 12} شهراً)</p>

              <div style={{ height: 1, background: "rgba(198,145,76,0.1)", margin: "20px 0" }} />

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "مبلغ التمويل",    val: fmtFull(loan),     color: "#E5E5E5" },
                  { label: "الدفعة الأولى",    val: fmtFull(downAmt),  color: "#4ADE80" },
                  { label: "إجمالي الدفعات",  val: fmtFull(total),    color: "#C6914C" },
                  { label: "إجمالي الفوائد",  val: fmtFull(totalInt), color: "#F87171" },
                ].map((r, i) => (
                  <div key={i}>
                    <p style={{ fontSize: 10, color: "#5A5A62", marginBottom: 3 }}>{r.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: r.color }}>{r.val} <span style={{ fontSize: 12 }}>ر.س</span></p>
                  </div>
                ))}
              </div>

              {/* Progress bar: أصل vs فوائد */}
              {loan > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div className="flex justify-between mb-1.5" style={{ fontSize: 11, color: "#5A5A62" }}>
                    <span>أصل الدين {(100 - intRatio).toFixed(0)}%</span>
                    <span>فوائد {intRatio.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "#2A2A32", overflow: "hidden", display: "flex" }}>
                    <div style={{ width: (100 - intRatio) + "%", background: "linear-gradient(90deg,#4ADE80,#22C55E)", transition: "width 0.5s" }} />
                    <div style={{ flex: 1, background: "linear-gradient(90deg,#F87171,#EF4444)" }} />
                  </div>
                </div>
              )}

              <button onClick={copySummary}
                className="flex items-center gap-2 mt-5 px-4 py-2 rounded-xl transition"
                style={{ background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", fontSize: 12, fontWeight: 600 }}>
                {copied ? <><Check size={13} /> تم النسخ!</> : <><Copy size={13} /> نسخ الملخص</>}
              </button>
            </div>

            {/* مقارنة البنوك */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <div className="p-5" style={{ borderBottom: "1px solid rgba(198,145,76,0.08)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>مقارنة البنوك السعودية</h3>
                <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 3 }}>بناءً على نفس المبلغ والمدة — نسب تقريبية</p>
              </div>
              <div className="space-y-0">
                {[...BANKS].sort((a, b) => a.rate - b.rate).map((bank, i) => {
                  const m = calcMonthly(loan, bank.rate, years);
                  const isSelected = bank.rate === rate;
                  const diff = m - monthly;
                  return (
                    <div key={i}
                      onClick={() => { setRate(bank.rate); setRateInput(String(bank.rate)); }}
                      className="flex items-center justify-between px-5 py-4 transition cursor-pointer"
                      style={{
                        borderBottom: "1px solid rgba(198,145,76,0.06)",
                        background: isSelected ? "rgba(198,145,76,0.06)" : "transparent",
                        borderRight: isSelected ? "3px solid #C6914C" : "3px solid transparent",
                      }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#C6914C" : "#E5E5E5" }}>{bank.name}</p>
                        <p style={{ fontSize: 11, color: "#5A5A62" }}>{bank.rate}% سنوياً</p>
                      </div>
                      <div className="text-left">
                        <p style={{ fontSize: 16, fontWeight: 700, color: bank.color }}>{fmtFull(m)} <span style={{ fontSize: 11 }}>ر.س/شهر</span></p>
                        {!isSelected && diff !== 0 && (
                          <p style={{ fontSize: 11, color: diff > 0 ? "#F87171" : "#4ADE80" }}>
                            {diff > 0 ? "+" : ""}{fmtFull(diff)} ر.س
                          </p>
                        )}
                        {isSelected && <p style={{ fontSize: 10, color: "#C6914C" }}>✓ محدد</p>}
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

        {/* Disclaimer */}
        <div className="rounded-xl px-5 py-4 mt-8" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.1)" }}>
          <p style={{ fontSize: 11, color: "#5A5A62", lineHeight: 1.8 }}>
            ⚠ <strong style={{ color: "#9A9AA0" }}>تنبيه:</strong> هذه الحاسبة للاستئناس فقط. الأرقام الفعلية تختلف حسب سياسات البنك، التاريخ الائتماني، ونوع التمويل (ثابت/متغير). تواصل مع البنك المختص للحصول على عرض رسمي.
          </p>
        </div>
      </div>
    </div>
  );
}
