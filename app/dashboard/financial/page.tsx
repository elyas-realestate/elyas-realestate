"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { TrendingUp, DollarSign, Calculator, Award, BarChart3, ChevronDown } from "lucide-react";
import Breadcrumb from "../../components/Breadcrumb";
import SARIcon from "../../components/SARIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stageColors: Record<string, string> = {
  "تواصل أولي":    "#9A9AA0",
  "معاينة":        "#C18D4A",
  "عرض سعر":       "#FACC15",
  "تفاوض":         "#FB923C",
  "توثيق":         "#A78BFA",
  "مكتملة":        "#4ADE80",
  "ملغية":         "#F87171",
};

function fmt(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "م";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "ألف";
  return n.toLocaleString();
}

function fmtFull(n: number) {
  return n?.toLocaleString("ar-SA") || "0";
}

export default function FinancialPage() {
  const [deals, setDeals]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [commRate, setCommRate] = useState(2.5);
  const [commInput, setCommInput] = useState("2.5");
  const [calcVal, setCalcVal]   = useState("");

  useEffect(() => { loadDeals(); }, []);

  async function loadDeals() {
    const { data } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });
    setDeals(data || []);
    setLoading(false);
  }

  if (loading) return (
    <div dir="rtl" className="p-4 space-y-4">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );

  // ── احصائيات ──
  const active    = deals.filter(d => d.current_stage !== "مكتملة" && d.current_stage !== "ملغية");
  const completed = deals.filter(d => d.current_stage === "مكتملة");
  const totalValue    = deals.reduce((s, d) => s + (Number(d.target_value) || 0), 0);
  const completedVal  = completed.reduce((s, d) => s + (Number(d.target_value) || 0), 0);
  const totalComm     = deals.reduce((s, d) => s + (Number(d.expected_commission) || 0), 0);
  const completedComm = completed.reduce((s, d) => s + (Number(d.expected_commission) || 0), 0);
  const topDeal       = deals.reduce((max, d) => (Number(d.target_value) || 0) > (Number(max?.target_value) || 0) ? d : max, deals[0]);

  // ── حاسبة العمولة ──
  const calcResult = calcVal ? (parseFloat(calcVal.replace(/,/g, "")) * commRate) / 100 : 0;

  // ── توزيع المراحل ──
  const stageMap: Record<string, { count: number; value: number }> = {};
  deals.forEach(d => {
    const s = d.current_stage || "غير محدد";
    if (!stageMap[s]) stageMap[s] = { count: 0, value: 0 };
    stageMap[s].count++;
    stageMap[s].value += Number(d.target_value) || 0;
  });

  const kpi = [
    { label: "إجمالي قيمة الصفقات",    value: fmt(totalValue),    sub: fmtFull(totalValue),  subSAR: true,  color: "#C18D4A", icon: TrendingUp },
    { label: "العمولات المتوقعة",       value: fmt(totalComm),     sub: fmtFull(totalComm),   subSAR: true,  color: "#4ADE80", icon: DollarSign },
    { label: "الصفقات المكتملة",        value: fmt(completedVal),  sub: completed.length + " صفقة",  color: "#A78BFA", icon: Award },
    { label: "متوسط قيمة الصفقة",      value: fmt(deals.length ? totalValue / deals.length : 0), sub: deals.length + " صفقة إجمالاً", color: "#FB923C", icon: BarChart3 },
  ];

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "التحليل المالي" }]} />

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">التحليل المالي</h2>
          <p className="text-sm" style={{ color: "#5A5A62" }}>تحليل الصفقات والعمولات المتوقعة</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpi.map((k, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.12)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-xl flex items-center justify-center" style={{ width: 36, height: 36, background: k.color + "18" }}>
                <k.icon size={18} style={{ color: k.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: "#F5F5F5" }}>{k.value}</div>
            <div className="text-xs font-medium mb-1" style={{ color: "#9A9AA0" }}>{k.label}</div>
            <div className="text-xs flex items-center gap-1" style={{ color: "#5A5A62" }}>
              {k.sub}
              {(k as any).subSAR && <SARIcon color="muted" size={11} />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* حاسبة العمولة */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.12)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Calculator size={16} style={{ color: "#C18D4A" }} />
            <h3 className="font-bold text-sm">حاسبة العمولة</h3>
          </div>

          <div className="mb-3">
            <label className="block text-xs mb-2" style={{ color: "#9A9AA0" }}>قيمة الصفقة <SARIcon color="muted" size={11} /></label>
            <input
              type="text"
              inputMode="numeric"
              value={calcVal ? Number(calcVal).toLocaleString("en-US") : ""}
              onChange={e => {
                const raw = e.target.value.replace(/,/g, "").replace(/[^\d]/g, "");
                setCalcVal(raw);
              }}
              placeholder="1,500,000"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{ background: "#1C1C22", border: "1px solid rgba(193,141,74,0.15)", color: "#F5F5F5" }}
              dir="ltr"
            />
          </div>

          <style>{`
            .comm-input::-webkit-outer-spin-button,
            .comm-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            .comm-input { -moz-appearance: textfield; }
          `}</style>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs" style={{ color: "#9A9AA0" }}>نسبة العمولة</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={commInput}
                  onChange={e => {
                    const raw = e.target.value;
                    setCommInput(raw);
                    const v = parseFloat(raw);
                    if (!isNaN(v) && v >= 0.1 && v <= 100) setCommRate(v);
                  }}
                  onBlur={() => {
                    const v = parseFloat(commInput);
                    if (isNaN(v) || v < 0.1) { setCommRate(0.5); setCommInput("0.5"); }
                    else if (v > 100) { setCommRate(100); setCommInput("100"); }
                    else { setCommRate(v); setCommInput(String(v)); }
                  }}
                  className="font-bold text-sm"
                  style={{ width: 56, background: "#1C1C22", border: "1px solid rgba(193,141,74,0.3)", borderRadius: 8, padding: "3px 8px", color: "#C18D4A", outline: "none", textAlign: "center" }}
                  dir="ltr"
                />
                <span className="text-sm font-bold" style={{ color: "#C18D4A" }}>%</span>
              </div>
            </div>
            <input
              type="range" min={0.5} max={100} step={0.5}
              value={commRate}
              onChange={e => { const v = parseFloat(e.target.value); setCommRate(v); setCommInput(String(v)); }}
              className="w-full"
              style={{ accentColor: "#C18D4A" }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "#5A5A62" }}>
              <span>0.5%</span><span>25%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {calcResult > 0 && (
            <div className="rounded-xl p-4 text-center" style={{ background: "rgba(193,141,74,0.08)", border: "1px solid rgba(193,141,74,0.2)" }}>
              <div className="text-xs mb-1" style={{ color: "#9A9AA0" }}>العمولة المتوقعة</div>
              <div className="text-2xl font-bold flex items-center justify-center gap-1.5" style={{ color: "#C18D4A" }}>
                {fmtFull(Math.round(calcResult))} <SARIcon color="accent" size={18} />
              </div>
              <div className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: "#5A5A62" }}>
                بنسبة {commRate}% من {fmtFull(parseFloat(calcVal) || 0)} <SARIcon color="muted" size={11} />
              </div>
            </div>
          )}
        </div>

        {/* توزيع المراحل */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.12)" }}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} style={{ color: "#C18D4A" }} />
            <h3 className="font-bold text-sm">توزيع مراحل الصفقات</h3>
          </div>
          {Object.keys(stageMap).length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "#5A5A62" }}>لا توجد صفقات بعد</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stageMap).sort((a, b) => b[1].value - a[1].value).map(([stage, info]) => {
                const pct = totalValue > 0 ? Math.round((info.value / totalValue) * 100) : 0;
                const col = stageColors[stage] || "#9A9AA0";
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#F5F5F5" }}>{stage}</span>
                      <span style={{ color: "#9A9AA0" }}>{info.count} صفقة · {pct}%</span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: pct + "%", background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ملخص الأداء */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.12)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Award size={16} style={{ color: "#C18D4A" }} />
            <h3 className="font-bold text-sm">ملخص الأداء</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "قيمة الصفقات النشطة",    num: fmtFull(active.reduce((s, d) => s + (Number(d.target_value) || 0), 0)), color: "#C18D4A" },
              { label: "قيمة الصفقات المكتملة",   num: fmtFull(completedVal), color: "#4ADE80" },
              { label: "عمولات محققة",            num: fmtFull(completedComm), color: "#A78BFA" },
              { label: "عمولات متوقعة (نشطة)",    num: fmtFull(active.reduce((s, d) => s + (Number(d.expected_commission) || 0), 0)), color: "#FB923C" },
              { label: "أعلى صفقة بالقيمة",       num: topDeal ? fmtFull(Number(topDeal.target_value) || 0) : null, color: "#FACC15" },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(193,141,74,0.06)" }}>
                <span className="text-xs" style={{ color: "#9A9AA0" }}>{row.label}</span>
                <span className="text-sm font-bold flex items-center gap-1" style={{ color: row.color }}>
                  {row.num ?? "—"}
                  {row.num != null && <SARIcon color={row.color} size={13} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* جدول الصفقات */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.12)" }}>
        <div className="flex items-center gap-2 p-5 border-b" style={{ borderColor: "rgba(193,141,74,0.08)" }}>
          <TrendingUp size={16} style={{ color: "#C18D4A" }} />
          <h3 className="font-bold text-sm">تفاصيل الصفقات</h3>
          <span className="mr-auto text-xs px-2 py-1 rounded-full" style={{ background: "rgba(193,141,74,0.1)", color: "#C18D4A" }}>{deals.length} صفقة</span>
        </div>
        {deals.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: "#5A5A62" }}>لا توجد صفقات مسجّلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  {["الصفقة", "المرحلة", "الأولوية", "قيمة الصفقة", "العمولة المتوقعة", "نسبة العمولة"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-semibold" style={{ color: "#5A5A62", borderBottom: "1px solid rgba(193,141,74,0.08)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map(d => {
                  const val  = Number(d.target_value) || 0;
                  const comm = Number(d.expected_commission) || 0;
                  const pct  = val > 0 ? ((comm / val) * 100).toFixed(1) : "—";
                  const col  = stageColors[d.current_stage] || "#9A9AA0";
                  const priColors: Record<string, string> = { "عاجل": "#F87171", "مرتفع": "#FB923C", "متوسط": "#FACC15", "منخفض": "#9A9AA0" };
                  return (
                    <tr key={d.id} className="transition" style={{ borderBottom: "1px solid rgba(193,141,74,0.04)" }}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm" style={{ color: "#F5F5F5" }}>{d.title || "—"}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#5A5A62" }}>{d.deal_type || ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: col + "18", color: col }}>{d.current_stage || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: priColors[d.priority] || "#9A9AA0" }}>{d.priority || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: "#F5F5F5" }}>
                        {val ? <span className="flex items-center gap-1">{fmtFull(val)} <SARIcon color="#F5F5F5" size={12} /></span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: "#4ADE80" }}>
                        {comm ? <span className="flex items-center gap-1">{fmtFull(comm)} <SARIcon color="#4ADE80" size={12} /></span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#C18D4A" }}>{pct !== "—" ? pct + "%" : "—"}</td>
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
