"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, DollarSign, Calculator, Award, BarChart3,
  Plus, Trash2, Check, X, Download, Receipt, PieChart,
  ArrowUpCircle, ArrowDownCircle, Percent,
} from "lucide-react";
import { toast } from "sonner";
import SARIcon from "../../components/SARIcon";


// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "م";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "ألف";
  return n.toLocaleString();
}
function fmtFull(n: number) {
  return (n || 0).toLocaleString("ar-SA");
}
function toMonthKey(iso: string) {
  return iso ? iso.slice(0, 7) : "";
}
function arabicMonth(iso: string) {
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو",
                  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const d = new Date(iso + "-01");
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
function last6Months() {
  const now   = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

const stageColors: Record<string, string> = {
  "تواصل أولي": "#9A9AA0", "معاينة": "#C18D4A", "عرض سعر": "#FACC15",
  "تفاوض": "#FB923C", "توثيق": "#A78BFA", "مكتملة": "#4ADE80", "ملغية": "#F87171",
};

const EXPENSE_CATS = ["إيجار مكتب","رواتب","تسويق","مواصلات","اتصالات","صيانة","رسوم قانونية","أخرى"];
const CAT_COLORS: Record<string, string> = {
  "إيجار مكتب": "#C6914C", "رواتب": "#A78BFA", "تسويق": "#34D399",
  "مواصلات": "#FACC15", "اتصالات": "#60A5FA", "صيانة": "#FB923C",
  "رسوم قانونية": "#F87171", "أخرى": "#9A9AA0",
};

const VAT_RATE = 0.15;

const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#3A3A42] focus:outline-none focus:border-[#C6914C] transition";
const lbl = "block text-xs font-semibold text-[#9A9AA0] mb-2 tracking-wide";

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — نظرة عامة
// ══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ deals }: { deals: any[] }) {
  const [commRate, setCommRate] = useState(2.5);
  const [commInput, setCommInput] = useState("2.5");
  const [calcVal, setCalcVal]   = useState("");

  const active    = deals.filter(d => d.current_stage !== "مكتملة" && d.current_stage !== "ملغية");
  const completed = deals.filter(d => d.current_stage === "مكتملة");
  const totalValue    = deals.reduce((s, d) => s + (Number(d.target_value) || 0), 0);
  const completedVal  = completed.reduce((s, d) => s + (Number(d.target_value) || 0), 0);
  const totalComm     = deals.reduce((s, d) => s + (Number(d.expected_commission) || 0), 0);
  const completedComm = completed.reduce((s, d) => s + (Number(d.expected_commission) || 0), 0);
  const calcResult    = calcVal ? (parseFloat(calcVal.replace(/,/g, "")) * commRate) / 100 : 0;

  const stageMap: Record<string, { count: number; value: number }> = {};
  deals.forEach(d => {
    const s = d.current_stage || "غير محدد";
    if (!stageMap[s]) stageMap[s] = { count: 0, value: 0 };
    stageMap[s].count++;
    stageMap[s].value += Number(d.target_value) || 0;
  });

  const topDeal = deals.reduce((max, d) => (Number(d.target_value) || 0) > (Number(max?.target_value) || 0) ? d : max, deals[0]);

  const kpi = [
    { label: "إجمالي قيمة الصفقات", value: fmt(totalValue),    sub: fmtFull(totalValue),  sar: true, color: "#C18D4A", icon: TrendingUp  },
    { label: "العمولات المتوقعة",    value: fmt(totalComm),     sub: fmtFull(totalComm),   sar: true, color: "#4ADE80", icon: DollarSign  },
    { label: "قيمة الصفقات المكتملة", value: fmt(completedVal), sub: completed.length + " صفقة",      color: "#A78BFA", icon: Award       },
    { label: "متوسط قيمة الصفقة",   value: fmt(deals.length ? totalValue / deals.length : 0), sub: deals.length + " صفقة", color: "#FB923C", icon: BarChart3 },
  ];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpi.map((k, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 11, color: "#5A5A62" }}>{k.label}</p>
              <div className="rounded-xl flex items-center justify-center" style={{ width: 34, height: 34, background: k.color + "18" }}>
                <k.icon size={16} style={{ color: k.color }} />
              </div>
            </div>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: "#F5F5F5" }}>{k.value}</p>
            <p className="flex items-center gap-1 mt-1" style={{ fontSize: 11, color: "#5A5A62" }}>
              {k.sub} {k.sar && <SARIcon color="muted" size={10} />}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* حاسبة العمولة */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Calculator size={16} style={{ color: "#C6914C" }} />
            <h3 className="font-bold text-sm">حاسبة العمولة</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className={lbl}>قيمة الصفقة</label>
              <input type="text" inputMode="numeric"
                value={calcVal ? Number(calcVal).toLocaleString("en-US") : ""}
                onChange={e => setCalcVal(e.target.value.replace(/,/g, "").replace(/[^\d]/g, ""))}
                placeholder="1,500,000" className={inp} dir="ltr" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={lbl} style={{ marginBottom: 0 }}>نسبة العمولة</label>
                <div className="flex items-center gap-1">
                  <input type="text" inputMode="decimal" value={commInput}
                    onChange={e => { setCommInput(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0.1 && v <= 100) setCommRate(v); }}
                    onBlur={() => { const v = parseFloat(commInput); if (isNaN(v) || v < 0.1) { setCommRate(0.5); setCommInput("0.5"); } else { setCommRate(v); setCommInput(String(v)); } }}
                    style={{ width: 52, background: "#1C1C22", border: "1px solid rgba(198,145,76,0.3)", borderRadius: 8, padding: "3px 8px", color: "#C6914C", outline: "none", textAlign: "center", fontSize: 13, fontWeight: 700 }}
                    dir="ltr" />
                  <span style={{ color: "#C6914C", fontWeight: 700 }}>%</span>
                </div>
              </div>
              <input type="range" min={0.5} max={10} step={0.5} value={commRate}
                onChange={e => { const v = parseFloat(e.target.value); setCommRate(v); setCommInput(String(v)); }}
                className="w-full" style={{ accentColor: "#C6914C" }} />
            </div>
            {calcResult > 0 && (
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)" }}>
                <p style={{ fontSize: 11, color: "#9A9AA0", marginBottom: 4 }}>العمولة</p>
                <p className="font-cairo font-bold flex items-center justify-center gap-1.5" style={{ fontSize: 22, color: "#C6914C" }}>
                  {fmtFull(Math.round(calcResult))} <SARIcon color="accent" size={18} />
                </p>
                <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 4 }}>شامل ضريبة القيمة المضافة: {fmtFull(Math.round(calcResult * 1.15))} ﷼</p>
              </div>
            )}
          </div>
        </div>

        {/* توزيع المراحل */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} style={{ color: "#C6914C" }} />
            <h3 className="font-bold text-sm">توزيع مراحل الصفقات</h3>
          </div>
          {Object.keys(stageMap).length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "#5A5A62" }}>لا توجد صفقات</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stageMap).sort((a, b) => b[1].value - a[1].value).map(([stage, info]) => {
                const pct = totalValue > 0 ? Math.round((info.value / totalValue) * 100) : 0;
                const col = stageColors[stage] || "#9A9AA0";
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#F5F5F5" }}>{stage}</span>
                      <span style={{ color: "#9A9AA0" }}>{info.count} · {pct}%</span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.05)" }}>
                      <div style={{ width: pct + "%", height: "100%", borderRadius: 999, background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ملخص الأداء */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Award size={16} style={{ color: "#C6914C" }} />
            <h3 className="font-bold text-sm">ملخص الأداء</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "قيمة الصفقات النشطة",   val: active.reduce((s, d) => s + (Number(d.target_value) || 0), 0),          color: "#C6914C" },
              { label: "قيمة الصفقات المكتملة", val: completedVal,                                                              color: "#4ADE80" },
              { label: "عمولات محققة",           val: completedComm,                                                             color: "#A78BFA" },
              { label: "عمولات معلقة (نشطة)",   val: active.reduce((s, d) => s + (Number(d.expected_commission) || 0), 0),     color: "#FB923C" },
              { label: "أعلى صفقة",              val: topDeal ? Number(topDeal.target_value) || 0 : 0,                          color: "#FACC15" },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(198,145,76,0.06)" }}>
                <span style={{ fontSize: 12, color: "#9A9AA0" }}>{r.label}</span>
                <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 700, color: r.color }}>
                  {fmtFull(r.val)} <SARIcon size={12} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* جدول الصفقات */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <div className="flex items-center gap-2 p-5" style={{ borderBottom: "1px solid rgba(198,145,76,0.08)" }}>
          <TrendingUp size={16} style={{ color: "#C6914C" }} />
          <h3 className="font-bold text-sm">تفاصيل الصفقات</h3>
          <span className="mr-auto text-xs px-2 py-1 rounded-full" style={{ background: "rgba(198,145,76,0.1)", color: "#C6914C" }}>{deals.length} صفقة</span>
        </div>
        {deals.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#5A5A62", fontSize: 14 }}>لا توجد صفقات مسجّلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  {["الصفقة","المرحلة","قيمة الصفقة","العمولة","ض.ق.م 15%","الإجمالي"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: "#5A5A62", borderBottom: "1px solid rgba(198,145,76,0.08)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map(d => {
                  const val  = Number(d.target_value) || 0;
                  const comm = Number(d.expected_commission) || 0;
                  const vat  = Math.round(comm * VAT_RATE);
                  const col  = stageColors[d.current_stage] || "#9A9AA0";
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid rgba(198,145,76,0.04)" }}>
                      <td className="px-4 py-3">
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F5" }}>{d.title || "—"}</p>
                        <p style={{ fontSize: 11, color: "#5A5A62" }}>{d.deal_type || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: col + "18", color: col, fontWeight: 600 }}>{d.current_stage || "—"}</span>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F5" }}>
                        {val ? fmtFull(val) + " ﷼" : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>
                        {comm ? fmtFull(comm) + " ﷼" : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13, color: "#FACC15" }}>
                        {comm ? fmtFull(vat) + " ﷼" : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#C6914C" }}>
                        {comm ? fmtFull(comm + vat) + " ﷼" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — الإيرادات والمصروفات (P&L)
// ══════════════════════════════════════════════════════════════════════════════
function PnLTab({ deals }: { deals: any[] }) {
  const [expenses, setExpenses]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [form, setForm] = useState({ category: "أخرى", amount: "", note: "", expense_date: new Date().toISOString().slice(0, 10) });

  useEffect(() => { loadExpenses(); }, []);

  async function loadExpenses() {
    const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    if (error?.message?.includes("does not exist")) { setMissingTable(true); setLoading(false); return; }
    setExpenses(data || []);
    setLoading(false);
  }

  async function addExpense() {
    if (!form.amount) { toast.error("أدخل المبلغ"); return; }
    setSaving(true);
    const { error } = await supabase.from("expenses").insert([{ category: form.category, amount: Number(form.amount), note: form.note, expense_date: form.expense_date }]);
    setSaving(false);
    if (error) { toast.error("فشل الحفظ: " + error.message); return; }
    toast.success("تمت إضافة المصروف");
    setForm({ category: "أخرى", amount: "", note: "", expense_date: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
    loadExpenses();
  }

  async function deleteExpense(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success("تم حذف المصروف");
  }

  // Build monthly P&L
  const months = last6Months();
  const pnlRows = useMemo(() => {
    return months.map(m => {
      const income = deals
        .filter(d => d.current_stage === "مكتملة" && toMonthKey(d.created_at) === m)
        .reduce((s, d) => s + (Number(d.expected_commission) || 0), 0);
      const exp = expenses
        .filter(e => toMonthKey(e.expense_date) === m)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      return { month: m, income, expenses: exp, profit: income - exp };
    });
  }, [deals, expenses, months]);

  const totalIncome   = pnlRows.reduce((s, r) => s + r.income, 0);
  const totalExpenses = pnlRows.reduce((s, r) => s + r.expenses, 0);
  const totalProfit   = totalIncome - totalExpenses;
  const maxBar        = Math.max(...pnlRows.map(r => Math.max(r.income, r.expenses)), 1);

  function exportCSV() {
    const header = ["الشهر","الإيرادات","المصروفات","صافي الربح"];
    const rows = pnlRows.map(r => [arabicMonth(r.month), r.income, r.expenses, r.profit]);
    const csv  = [header, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "pnl.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  if (missingTable) return (
    <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
      <Receipt size={40} style={{ color: "rgba(198,145,76,0.3)", margin: "0 auto 16px" }} />
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F5", marginBottom: 10 }}>يلزم تفعيل جدول المصروفات</h3>
      <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8 }}>
        شغّل <code style={{ background: "#1C1C22", padding: "2px 8px", borderRadius: 6, color: "#C6914C" }}>supabase/005_expenses.sql</code> في Supabase → SQL Editor
      </p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الإيرادات",  val: totalIncome,   color: "#4ADE80", icon: ArrowUpCircle   },
          { label: "إجمالي المصروفات",  val: totalExpenses, color: "#F87171", icon: ArrowDownCircle },
          { label: "صافي الربح",        val: totalProfit,   color: totalProfit >= 0 ? "#4ADE80" : "#F87171", icon: TrendingUp },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={15} style={{ color: k.color }} />
              <p style={{ fontSize: 11, color: "#5A5A62" }}>{k.label}</p>
            </div>
            <p className="font-cairo font-bold" style={{ fontSize: 20, color: k.color }}>{fmtFull(k.val)} <span style={{ fontSize: 13 }}>﷼</span></p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E5" }}>الإيرادات والمصروفات — آخر 6 أشهر</h3>
          <div className="flex items-center gap-4" style={{ fontSize: 11 }}>
            <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 2, background: "#4ADE80", display: "inline-block" }} /> إيرادات</span>
            <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 2, background: "#F87171", display: "inline-block" }} /> مصروفات</span>
          </div>
        </div>
        <div className="flex items-end gap-2" style={{ height: 130 }}>
          {pnlRows.map((r, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 3, width: "100%" }}>
                <div style={{ flex: 1, height: r.income > 0 ? `${Math.max((r.income / maxBar) * 100, 5)}%` : "4px", borderRadius: "4px 4px 2px 2px", background: "linear-gradient(180deg,#4ADE80,#22C55E)", transition: "height 0.5s" }} />
                <div style={{ flex: 1, height: r.expenses > 0 ? `${Math.max((r.expenses / maxBar) * 100, 5)}%` : "4px", borderRadius: "4px 4px 2px 2px", background: "linear-gradient(180deg,#F87171,#EF4444)", transition: "height 0.5s" }} />
              </div>
              <p style={{ fontSize: 10, color: "#5A5A62" }}>{arabicMonth(r.month).slice(0, 3)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* P&L Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(198,145,76,0.08)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E5" }}>جدول الأرباح والخسائر</h3>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition"
            style={{ background: "rgba(198,145,76,0.06)", border: "1px solid rgba(198,145,76,0.15)", color: "#C6914C", fontSize: 12 }}>
            <Download size={13} /> تصدير
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["الشهر","الإيرادات","المصروفات","صافي الربح","الهامش"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: "#5A5A62", borderBottom: "1px solid rgba(198,145,76,0.08)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pnlRows.map((r, i) => {
                const margin = r.income > 0 ? ((r.profit / r.income) * 100).toFixed(0) : "—";
                const profitColor = r.profit >= 0 ? "#4ADE80" : "#F87171";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(198,145,76,0.04)" }}>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#E5E5E5", fontWeight: 600 }}>{arabicMonth(r.month)}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700 }}>{r.income ? fmtFull(r.income) + " ﷼" : "—"}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#F87171", fontWeight: 700 }}>{r.expenses ? fmtFull(r.expenses) + " ﷼" : "—"}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: profitColor, fontWeight: 700 }}>{(r.income || r.expenses) ? fmtFull(r.profit) + " ﷼" : "—"}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#C6914C" }}>{margin !== "—" ? margin + "%" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E5" }}>المصروفات</h3>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition"
            style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 13, fontWeight: 700 }}>
            <Plus size={14} /> إضافة مصروف
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.15)" }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>التصنيف</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                  {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>المبلغ (ريال)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inp} placeholder="0" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>التاريخ</label>
                <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className={inp} dir="ltr" />
              </div>
              <div>
                <label className={lbl}>ملاحظة</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className={inp} placeholder="وصف المصروف..." />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addExpense} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 13, fontWeight: 700 }}>
                <Check size={14} /> {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl transition"
                style={{ background: "#1C1C22", color: "#9A9AA0", fontSize: 13 }}>
                إلغاء
              </button>
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <p className="text-center py-8" style={{ color: "#5A5A62", fontSize: 13 }}>لا توجد مصروفات مسجّلة</p>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 20).map(e => (
              <div key={e.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(198,145,76,0.06)" }}>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                    style={{ background: (CAT_COLORS[e.category] || "#9A9AA0") + "18", color: CAT_COLORS[e.category] || "#9A9AA0" }}>
                    {e.category}
                  </span>
                  <span style={{ fontSize: 12, color: "#5A5A62" }}>{e.note || ""}</span>
                  <span style={{ fontSize: 11, color: "#3A3A44" }}>{new Date(e.expense_date).toLocaleDateString("ar-SA")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#F87171" }}>{fmtFull(e.amount)} ﷼</span>
                  <button onClick={() => deleteExpense(e.id)}
                    style={{ background: "none", border: "none", color: "#3A3A44", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — ضريبة القيمة المضافة
// ══════════════════════════════════════════════════════════════════════════════
function VATTab({ deals }: { deals: any[] }) {
  const [calcAmt, setCalcAmt] = useState("");
  const [mode, setMode]       = useState<"excl"|"incl">("excl");

  const calcNum = parseFloat(calcAmt.replace(/,/g, "")) || 0;
  const vatAmount    = mode === "excl" ? calcNum * VAT_RATE : calcNum - (calcNum / 1.15);
  const totalWithVAT = mode === "excl" ? calcNum + vatAmount : calcNum;
  const netAmount    = mode === "incl" ? calcNum / 1.15 : calcNum;

  const dealsWithComm = deals.filter(d => d.expected_commission);
  const totalComm     = dealsWithComm.reduce((s, d) => s + (Number(d.expected_commission) || 0), 0);
  const totalVAT      = totalComm * VAT_RATE;

  const completedDeals    = deals.filter(d => d.current_stage === "مكتملة" && d.expected_commission);
  const completedComm     = completedDeals.reduce((s, d) => s + (Number(d.expected_commission) || 0), 0);
  const completedVAT      = completedComm * VAT_RATE;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "إجمالي العمولات (بدون ضريبة)", val: fmtFull(Math.round(totalComm)),      color: "#C6914C" },
          { label: "ضريبة 15% المتوقعة",            val: fmtFull(Math.round(totalVAT)),       color: "#FACC15" },
          { label: "إجمالي شامل الضريبة",           val: fmtFull(Math.round(totalComm + totalVAT)), color: "#4ADE80" },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 8 }}>{k.label}</p>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: k.color }}>{k.val} <span style={{ fontSize: 14 }}>﷼</span></p>
          </div>
        ))}
      </div>

      {/* حاسبة الضريبة */}
      <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Percent size={16} style={{ color: "#C6914C" }} />
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>حاسبة ضريبة القيمة المضافة (15%)</h3>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "excl", label: "المبلغ بدون ضريبة" },
            { id: "incl", label: "المبلغ شامل الضريبة" },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id as any)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition"
              style={{
                background: mode === m.id ? "rgba(198,145,76,0.12)" : "#1C1C22",
                border: "1px solid " + (mode === m.id ? "rgba(198,145,76,0.35)" : "rgba(198,145,76,0.08)"),
                color: mode === m.id ? "#C6914C" : "#5A5A62",
              }}>
              {m.label}
            </button>
          ))}
        </div>

        <input
          type="text" inputMode="numeric"
          value={calcAmt ? Number(calcAmt.replace(/,/g,"")).toLocaleString("en-US") : ""}
          onChange={e => setCalcAmt(e.target.value.replace(/,/g,"").replace(/[^\d]/g,""))}
          placeholder="أدخل المبلغ..." className={inp} dir="ltr"
        />

        {calcNum > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "المبلغ الصافي",      val: fmtFull(Math.round(netAmount)),    color: "#C6914C" },
              { label: "ضريبة القيمة المضافة 15%", val: fmtFull(Math.round(Math.abs(vatAmount))), color: "#FACC15" },
              { label: "الإجمالي شامل الضريبة", val: fmtFull(Math.round(totalWithVAT)), color: "#4ADE80" },
            ].map((r, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.1)" }}>
                <p style={{ fontSize: 10, color: "#5A5A62", marginBottom: 6 }}>{r.label}</p>
                <p className="font-cairo font-bold" style={{ fontSize: 18, color: r.color }}>{r.val} ﷼</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deals VAT table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <div className="p-5" style={{ borderBottom: "1px solid rgba(198,145,76,0.08)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>ضريبة العمولات لكل صفقة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["الصفقة","العمولة الصافية","ضريبة 15%","الإجمالي"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: "#5A5A62", borderBottom: "1px solid rgba(198,145,76,0.08)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.filter(d => d.expected_commission).map(d => {
                const comm = Number(d.expected_commission) || 0;
                const vat  = Math.round(comm * VAT_RATE);
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid rgba(198,145,76,0.04)" }}>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#E5E5E5" }}>{d.title || "—"}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#C6914C", fontWeight: 700 }}>{fmtFull(comm)} ﷼</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#FACC15", fontWeight: 700 }}>{fmtFull(vat)} ﷼</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700 }}>{fmtFull(comm + vat)} ﷼</td>
                  </tr>
                );
              })}
              {/* Total row */}
              <tr style={{ background: "rgba(198,145,76,0.04)" }}>
                <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E5" }}>الإجمالي</td>
                <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#C6914C" }}>{fmtFull(Math.round(totalComm))} ﷼</td>
                <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#FACC15" }}>{fmtFull(Math.round(totalVAT))} ﷼</td>
                <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>{fmtFull(Math.round(totalComm + totalVAT))} ﷼</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — عائد الاستثمار (ROI)
// ══════════════════════════════════════════════════════════════════════════════
function ROITab({ deals }: { deals: any[] }) {
  const roiDeals = deals
    .filter(d => d.target_value && d.expected_commission)
    .map(d => ({
      ...d,
      roi: ((Number(d.expected_commission) / Number(d.target_value)) * 100),
    }))
    .sort((a, b) => b.roi - a.roi);

  const avgROI = roiDeals.length ? roiDeals.reduce((s, d) => s + d.roi, 0) / roiDeals.length : 0;
  const bestROI = roiDeals[0];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "متوسط عائد الاستثمار",  val: avgROI.toFixed(2) + "%",                                                color: "#C6914C" },
          { label: "أعلى عائد",             val: bestROI ? bestROI.roi.toFixed(2) + "%" : "—",                           color: "#4ADE80" },
          { label: "عدد الصفقات المحلّلة",   val: roiDeals.length + " صفقة",                                               color: "#A78BFA" },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 8 }}>{k.label}</p>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* ROI Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <div className="p-5" style={{ borderBottom: "1px solid rgba(198,145,76,0.08)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>عائد الاستثمار لكل صفقة</h3>
          <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 4 }}>مرتّبة من الأعلى عائداً للأقل</p>
        </div>
        {roiDeals.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#5A5A62", fontSize: 13 }}>أدخل قيمة الصفقة والعمولة لحساب العائد</div>
        ) : (
          <div className="space-y-0">
            {roiDeals.map((d, i) => {
              const barPct = (d.roi / roiDeals[0].roi) * 100;
              const color  = d.roi >= 3 ? "#4ADE80" : d.roi >= 1.5 ? "#C6914C" : "#F87171";
              return (
                <div key={d.id} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(198,145,76,0.04)" }}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-cairo font-bold" style={{ fontSize: 15, color: "#5A5A62", minWidth: 24 }}>#{i + 1}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E5E5" }}>{d.title || "—"}</p>
                        <p style={{ fontSize: 11, color: "#5A5A62" }}>
                          قيمة: {fmtFull(Number(d.target_value))} ﷼ · عمولة: {fmtFull(Number(d.expected_commission))} ﷼
                        </p>
                      </div>
                    </div>
                    <span className="font-cairo font-bold" style={{ fontSize: 20, color, flexShrink: 0 }}>{d.roi.toFixed(2)}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                    <div style={{ width: barPct + "%", height: "100%", borderRadius: 999, background: color, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "overview", label: "نظرة عامة",           icon: BarChart3       },
  { id: "pnl",      label: "الإيرادات والمصروفات", icon: Receipt         },
  { id: "vat",      label: "ضريبة القيمة المضافة", icon: Percent         },
  { id: "roi",      label: "عائد الاستثمار",       icon: PieChart        },
];

export default function FinancialPage() {
  const [deals, setDeals]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("overview");

  useEffect(() => {
    supabase.from("deals").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setDeals(data || []); setLoading(false); });
  }, []);

  if (loading) return (
    <div dir="rtl" className="space-y-4">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">التحليل المالي</h2>
        <p style={{ color: "#5A5A62", fontSize: 13 }}>الأرباح والمصروفات والضرائب وعائد الاستثمار</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition"
            style={{
              background: tab === t.id ? "rgba(198,145,76,0.12)" : "#16161A",
              border: "1px solid " + (tab === t.id ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.09)"),
              color:  tab === t.id ? "#C6914C" : "#5A5A62",
              fontSize: 13, fontWeight: 600,
            }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab deals={deals} />}
      {tab === "pnl"      && <PnLTab      deals={deals} />}
      {tab === "vat"      && <VATTab      deals={deals} />}
      {tab === "roi"      && <ROITab      deals={deals} />}
    </div>
  );
}
