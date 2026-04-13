"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, Download, CheckCircle2, Clock, AlertCircle,
  Banknote, Star, Edit3, Check, X,
} from "lucide-react";
import { toast } from "sonner";
import SARIcon from "../../components/SARIcon";


// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "م";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "ألف";
  return n.toLocaleString("ar-SA");
}
function fmtFull(n: number) {
  return (n || 0).toLocaleString("ar-SA");
}
function toArabicMonth(iso: string) {
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو",
                  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const d = new Date(iso);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  "مدفوعة": { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  icon: CheckCircle2, label: "مدفوعة" },
  "جزئية":  { color: "#FACC15", bg: "rgba(250,204,21,0.1)",  icon: AlertCircle,  label: "جزئية"  },
  "معلقة":  { color: "#9A9AA0", bg: "rgba(154,154,160,0.08)", icon: Clock,        label: "معلقة"  },
};

// ── CSV Export ─────────────────────────────────────────────────────────────────
function exportCSV(deals: any[]) {
  const header = ["الصفقة", "المرحلة", "قيمة الصفقة", "العمولة المتوقعة", "المحصّل", "الحالة", "التاريخ"];
  const rows = deals.map(d => [
    d.title || "",
    d.current_stage || "",
    d.target_value || 0,
    d.expected_commission || 0,
    d.commission_paid || 0,
    d.commission_status || "معلقة",
    d.created_at ? new Date(d.created_at).toLocaleDateString("ar-SA") : "",
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "commissions.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── Inline editor ──────────────────────────────────────────────────────────────
function CommissionRow({ deal, onSaved }: { deal: any; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [paid, setPaid]       = useState(String(deal.commission_paid || 0));
  const [status, setStatus]   = useState(deal.commission_status || "معلقة");
  const [saving, setSaving]   = useState(false);

  const expected = deal.expected_commission || 0;
  const paidNum  = Number(paid) || 0;
  const pct      = expected > 0 ? Math.min(100, Math.round((paidNum / expected) * 100)) : 0;
  const cfg      = STATUS_CFG[status] || STATUS_CFG["معلقة"];
  const Icon     = cfg.icon;

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("deals")
      .update({ commission_paid: paidNum, commission_status: status })
      .eq("id", deal.id);
    setSaving(false);
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تم تحديث العمولة");
    setEditing(false);
    onSaved();
  }

  function cancel() {
    setPaid(String(deal.commission_paid || 0));
    setStatus(deal.commission_status || "معلقة");
    setEditing(false);
  }

  return (
    <div
      className="rounded-2xl transition-all"
      style={{
        background: "#16161A",
        border: "1px solid rgba(198,145,76,0.09)",
        padding: "16px 18px",
        marginBottom: 8,
      }}
    >
      {/* Row header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="font-semibold truncate" style={{ fontSize: 14, color: "#E5E5E5" }}>{deal.title || "—"}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span style={{ fontSize: 11, color: "#5A5A62" }}>
              {deal.current_stage || "—"}
            </span>
            {deal.expected_close_date && (
              <>
                <span style={{ color: "#3A3A44" }}>·</span>
                <span style={{ fontSize: 11, color: "#5A5A62" }}>
                  {new Date(deal.expected_close_date).toLocaleDateString("ar-SA")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status pill */}
        {!editing && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600, flexShrink: 0 }}
          >
            <Icon size={12} />
            {cfg.label}
          </div>
        )}

        {/* Edit / Save buttons */}
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition"
            style={{ background: "rgba(198,145,76,0.06)", border: "1px solid rgba(198,145,76,0.12)", color: "#C6914C", fontSize: 12, flexShrink: 0 }}
          >
            <Edit3 size={12} /> تعديل
          </button>
        ) : (
          <div className="flex gap-2" style={{ flexShrink: 0 }}>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 transition disabled:opacity-50"
              style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ADE80", fontSize: 12 }}>
              {saving ? "..." : <><Check size={12} /> حفظ</>}
            </button>
            <button onClick={cancel}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 transition"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171", fontSize: 12 }}>
              <X size={12} /> إلغاء
            </button>
          </div>
        )}
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <p style={{ fontSize: 10, color: "#5A5A62", marginBottom: 3 }}>قيمة الصفقة</p>
          <div className="flex items-center gap-1">
            <SARIcon size={10} color="secondary" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#E5E5E5" }}>{fmtFull(deal.target_value)}</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 10, color: "#5A5A62", marginBottom: 3 }}>العمولة المتوقعة</p>
          <div className="flex items-center gap-1">
            <SARIcon size={10} color="secondary" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#C6914C" }}>{fmtFull(expected)}</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 10, color: "#5A5A62", marginBottom: 3 }}>
            {editing ? "المحصّل (عدّل)" : "المحصّل"}
          </p>
          {editing ? (
            <input
              type="number"
              value={paid}
              onChange={e => setPaid(e.target.value)}
              className="w-full rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#C6914C]"
              style={{ background: "#1C1C22", border: "1px solid rgba(198,145,76,0.25)", color: "#F5F5F5" }}
              dir="ltr"
            />
          ) : (
            <div className="flex items-center gap-1">
              <SARIcon size={10} color="secondary" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#4ADE80" }}>{fmtFull(paidNum)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status selector while editing */}
      {editing && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.entries(STATUS_CFG).map(([key, c]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 transition"
              style={{
                background:  status === key ? c.bg  : "rgba(255,255,255,0.02)",
                border: "1px solid " + (status === key ? c.color : "rgba(198,145,76,0.08)"),
                color:  status === key ? c.color : "#5A5A62",
                fontSize: 12, fontWeight: 600,
              }}
            >
              <c.icon size={11} /> {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {expected > 0 && !editing && (
        <div className="mt-3">
          <div className="flex justify-between mb-1" style={{ fontSize: 10, color: "#5A5A62" }}>
            <span>نسبة التحصيل</span>
            <span style={{ color: pct === 100 ? "#4ADE80" : "#C6914C" }}>{pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(198,145,76,0.1)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: pct + "%",
              borderRadius: 2,
              background: pct === 100 ? "#4ADE80" : "linear-gradient(90deg, #C6914C, #A6743A)",
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CommissionsPage() {
  const [deals, setDeals]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState<string>("الكل");
  const [missingCol, setMissingCol] = useState(false);

  useEffect(() => { loadDeals(); }, []);

  async function loadDeals() {
    const { data, error } = await supabase
      .from("deals")
      .select("id,title,current_stage,target_value,expected_commission,commission_paid,commission_status,expected_close_date,created_at")
      .order("created_at", { ascending: false });

    if (error?.message?.includes("commission_paid")) {
      setMissingCol(true);
      setLoading(false);
      return;
    }
    setDeals(data || []);
    setLoading(false);
  }

  // ── Computed KPIs ──
  const kpis = useMemo(() => {
    const now   = new Date();
    const month = now.getMonth();
    const year  = now.getFullYear();
    const qStart= Math.floor(month / 3) * 3;

    let totalPaid = 0, totalPending = 0, totalExpected = 0;
    let monthPaid = 0, quarterPaid = 0, yearPaid = 0;
    let bestMonth = 0, bestMonthLabel = "—";

    const byMonth: Record<string, number> = {};

    for (const d of deals) {
      const paid     = Number(d.commission_paid)     || 0;
      const expected = Number(d.expected_commission) || 0;
      totalExpected += expected;
      totalPaid     += paid;
      totalPending  += Math.max(0, expected - paid);

      const created = d.created_at ? new Date(d.created_at) : null;
      if (created) {
        const m = created.getMonth(), y = created.getFullYear();
        if (y === year) {
          yearPaid += paid;
          if (Math.floor(m / 3) === Math.floor(month / 3)) quarterPaid += paid;
          if (m === month) monthPaid += paid;
        }
        const key = `${y}-${String(m + 1).padStart(2, "0")}`;
        byMonth[key] = (byMonth[key] || 0) + paid;
      }
    }

    // Best month
    for (const [k, v] of Object.entries(byMonth)) {
      if (v > bestMonth) { bestMonth = v; bestMonthLabel = toArabicMonth(k + "-01"); }
    }

    // Monthly chart data (last 6 months)
    const chartMonths: { label: string; paid: number; expected: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
      chartMonths.push({ label: months[d.getMonth()], paid: byMonth[key] || 0, expected: 0 });
    }
    const chartMax = Math.max(...chartMonths.map(c => c.paid), 1);

    return { totalPaid, totalPending, totalExpected, monthPaid, quarterPaid, yearPaid, bestMonthLabel, chartMonths, chartMax };
  }, [deals]);

  const filteredDeals = useMemo(() => {
    if (filterStatus === "الكل") return deals;
    return deals.filter(d => (d.commission_status || "معلقة") === filterStatus);
  }, [deals, filterStatus]);

  // ── Filter counts ──
  const counts = useMemo(() => {
    const c: Record<string, number> = { "الكل": deals.length };
    for (const d of deals) c[d.commission_status || "معلقة"] = (c[d.commission_status || "معلقة"] || 0) + 1;
    return c;
  }, [deals]);

  if (loading) return (
    <div dir="rtl" className="space-y-4">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-48 rounded-2xl" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );

  if (missingCol) return (
    <div dir="rtl" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Banknote size={28} style={{ color: "#C6914C" }} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 12 }}>يلزم تفعيل جدول العمولات</h2>
      <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8, marginBottom: 20 }}>
        شغّل ملف <code style={{ background: "#1C1C22", padding: "2px 8px", borderRadius: 6, color: "#C6914C" }}>supabase/003_commissions.sql</code> في Supabase → SQL Editor لإضافة عمودَي تتبع العمولات
      </p>
      <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.15)", borderRadius: 12, padding: "14px 18px", textAlign: "left", direction: "ltr", fontSize: 12, color: "#9A9AA0", fontFamily: "monospace" }}>
        ALTER TABLE public.deals<br />
        &nbsp;&nbsp;ADD COLUMN IF NOT EXISTS commission_paid NUMERIC(14,2) DEFAULT 0,<br />
        &nbsp;&nbsp;ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'معلقة';
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">تتبع العمولات</h2>
          <p style={{ color: "#5A5A62", fontSize: 13 }}>متابعة العمولات المتوقعة والمحصّلة لكل صفقة</p>
        </div>
        <button
          onClick={() => exportCSV(deals)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition"
          style={{ background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.18)", color: "#C6914C", fontSize: 13, fontWeight: 600 }}
        >
          <Download size={15} /> تصدير CSV
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "إجمالي المحصّل",
            value: fmtNum(kpis.totalPaid),
            sub:   "ريال سعودي",
            icon:  Banknote,
            color: "#4ADE80",
            bg:    "rgba(74,222,128,0.08)",
          },
          {
            label: "عمولات معلقة",
            value: fmtNum(kpis.totalPending),
            sub:   "ريال سعودي",
            icon:  Clock,
            color: "#FACC15",
            bg:    "rgba(250,204,21,0.08)",
          },
          {
            label: "هذا الشهر",
            value: fmtNum(kpis.monthPaid),
            sub:   "محصّل",
            icon:  TrendingUp,
            color: "#C6914C",
            bg:    "rgba(198,145,76,0.08)",
          },
          {
            label: "أفضل شهر",
            value: kpis.bestMonthLabel,
            sub:   fmtNum(kpis.totalPaid > 0 ? Math.max(...(Object.values(
              deals.reduce((acc: any, d) => {
                const k = d.created_at ? new Date(d.created_at).toISOString().slice(0,7) : "x";
                acc[k] = (acc[k] || 0) + (d.commission_paid || 0);
                return acc;
              }, {}) as Record<string, number>)
            )) : 0) + " ريال",
            icon:  Star,
            color: "#A78BFA",
            bg:    "rgba(167,139,250,0.08)",
          },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: 12, color: "#5A5A62", fontWeight: 600 }}>{card.label}</p>
              <div className="flex items-center justify-center rounded-xl"
                style={{ width: 34, height: 34, background: card.bg }}>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
            </div>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: card.color, lineHeight: 1 }}>{card.value}</p>
            <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 4 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Monthly Bar Chart ── */}
      <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E5", marginBottom: 20 }}>العمولات المحصّلة — آخر 6 أشهر</h3>
        <div className="flex items-end gap-3" style={{ height: 120 }}>
          {kpis.chartMonths.map((m, i) => {
            const barPct = kpis.chartMax > 0 ? (m.paid / kpis.chartMax) * 100 : 0;
            return (
              <div key={i} className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: "#C6914C", fontWeight: 600, minHeight: 14 }}>
                  {m.paid > 0 ? fmtNum(m.paid) : ""}
                </p>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div
                    style={{
                      width: "100%",
                      height: barPct > 0 ? `${Math.max(barPct, 6)}%` : "4px",
                      borderRadius: "6px 6px 2px 2px",
                      background: barPct > 0
                        ? "linear-gradient(180deg, #C6914C, #8A5F2E)"
                        : "rgba(198,145,76,0.1)",
                      transition: "height 0.6s ease",
                    }}
                  />
                </div>
                <p style={{ fontSize: 10, color: "#5A5A62" }}>{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {["الكل", "مدفوعة", "جزئية", "معلقة"].map(f => {
          const isActive = filterStatus === f;
          const cfg = f !== "الكل" ? STATUS_CFG[f] : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition"
              style={{
                background: isActive ? (cfg ? cfg.bg : "rgba(198,145,76,0.1)") : "#16161A",
                border: "1px solid " + (isActive ? (cfg ? cfg.color : "#C6914C") : "rgba(198,145,76,0.09)"),
                color:  isActive ? (cfg ? cfg.color : "#C6914C") : "#5A5A62",
                fontSize: 13, fontWeight: 600,
              }}
            >
              {f !== "الكل" && cfg && <cfg.icon size={13} />}
              {f}
              {counts[f] !== undefined && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: isActive ? (cfg ? cfg.color : "#C6914C") : "rgba(198,145,76,0.15)",
                  color: isActive ? "#0A0A0C" : "#C6914C",
                  borderRadius: 999, padding: "1px 6px",
                }}>
                  {counts[f] || 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Deals List ── */}
      {filteredDeals.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <Banknote size={36} style={{ color: "rgba(198,145,76,0.25)", margin: "0 auto 12px" }} />
          <p style={{ color: "#5A5A62", fontSize: 14 }}>
            {filterStatus === "الكل" ? "لا توجد صفقات بعد" : `لا توجد صفقات بحالة "${filterStatus}"`}
          </p>
        </div>
      ) : (
        <div>
          {filteredDeals.map(deal => (
            <CommissionRow key={deal.id} deal={deal} onSaved={loadDeals} />
          ))}
        </div>
      )}

      {/* ── Summary Footer ── */}
      {filteredDeals.length > 0 && (
        <div className="rounded-2xl p-5 flex flex-wrap gap-6" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.12)" }}>
          <div>
            <p style={{ fontSize: 11, color: "#5A5A62" }}>إجمالي المتوقع ({filteredDeals.length} صفقة)</p>
            <div className="flex items-center gap-1 mt-1">
              <SARIcon size={12} color="secondary" />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#C6914C" }}>
                {fmtFull(filteredDeals.reduce((s, d) => s + (d.expected_commission || 0), 0))}
              </span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#5A5A62" }}>إجمالي المحصّل</p>
            <div className="flex items-center gap-1 mt-1">
              <SARIcon size={12} color="secondary" />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#4ADE80" }}>
                {fmtFull(filteredDeals.reduce((s, d) => s + (Number(d.commission_paid) || 0), 0))}
              </span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#5A5A62" }}>المتبقي</p>
            <div className="flex items-center gap-1 mt-1">
              <SARIcon size={12} color="secondary" />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#FACC15" }}>
                {fmtFull(filteredDeals.reduce((s, d) => s + Math.max(0, (d.expected_commission || 0) - (Number(d.commission_paid) || 0)), 0))}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
