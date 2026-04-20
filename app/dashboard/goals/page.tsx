"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { Target, TrendingUp, Banknote, CheckCircle, Plus, Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";
import { formatSAR } from "@/lib/format";
import Breadcrumb from "../../components/Breadcrumb";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTHS_AR[parseInt(m)-1]} ${y}`;
}
function last6Months() {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }
  return keys;
}

type Goal = { id?: string; month: string; target_deals: number; target_revenue: number; target_clients: number };

export default function GoalsPage() {
  const [goals, setGoals]       = useState<Record<string, Goal>>({});
  const [deals, setDeals]       = useState<any[]>([]);
  const [clients, setClients]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<string | null>(null);
  const [form, setForm]         = useState({ target_deals: "", target_revenue: "", target_clients: "" });
  const months = last6Months();
  const thisMonth = currentMonthKey();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: goalsData }, { data: dealsData }, { data: clientsData }] = await Promise.all([
      supabase.from("monthly_goals").select("*"),
      supabase.from("deals").select("current_stage, target_value, created_at, expected_close_date"),
      supabase.from("clients").select("created_at"),
    ]);
    const map: Record<string, Goal> = {};
    (goalsData || []).forEach((g: any) => { map[g.month] = g; });
    setGoals(map);
    setDeals(dealsData || []);
    setClients(clientsData || []);
    setLoading(false);
  }

  function getActuals(monthKey: string) {
    const [y, m] = monthKey.split("-").map(Number);
    const start  = new Date(y, m-1, 1);
    const end    = new Date(y, m, 1);
    const closedDeals = deals.filter(d => {
      if (d.current_stage !== "مكتملة") return false;
      const date = d.expected_close_date ? new Date(d.expected_close_date) : new Date(d.created_at);
      return date >= start && date < end;
    });
    const newClients = clients.filter(c => {
      const date = new Date(c.created_at);
      return date >= start && date < end;
    });
    return {
      deals:   closedDeals.length,
      revenue: closedDeals.reduce((s, d) => s + (d.target_value || 0), 0),
      clients: newClients.length,
    };
  }

  function startEdit(monthKey: string) {
    const g = goals[monthKey];
    setForm({
      target_deals:   String(g?.target_deals   || ""),
      target_revenue: String(g?.target_revenue || ""),
      target_clients: String(g?.target_clients || ""),
    });
    setEditing(monthKey);
  }

  async function saveGoal(monthKey: string) {
    const payload = {
      month:          monthKey,
      target_deals:   Number(form.target_deals)   || 0,
      target_revenue: Number(form.target_revenue) || 0,
      target_clients: Number(form.target_clients) || 0,
    };
    const existing = goals[monthKey];
    let error: any;
    if (existing?.id) {
      ({ error } = await supabase.from("monthly_goals").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("monthly_goals").insert([payload]));
    }
    if (error) {
      // إذا الجدول غير موجود — أعطِ رسالة واضحة
      if (error.code === "42P01") {
        toast.error("يجب تشغيل migration لجدول monthly_goals أولاً");
      } else {
        toast.error("فشل الحفظ");
      }
      return;
    }
    toast.success("تم حفظ الأهداف");
    setEditing(null);
    loadAll();
  }

  function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#9A9AA0" }}>{value.toLocaleString("ar-SA")} / {max.toLocaleString("ar-SA")}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 100 ? "#4ADE80" : color }}>{pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#1C1C22", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "#4ADE80" : color, borderRadius: 3, transition: "width 0.6s ease" }} />
        </div>
      </div>
    );
  }

  const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C6914C] text-[#F5F5F5]";

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "أهداف المبيعات" }]} />

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F5F5F5", marginBottom: 4 }}>أهداف المبيعات</h2>
        <p style={{ fontSize: 13, color: "#5A5A62" }}>تتبع أهدافك الشهرية — صفقات، إيراد، عملاء جدد</p>
      </div>

      {/* ── بطاقات الشهر الحالي ── */}
      {(() => {
        const act = getActuals(thisMonth);
        const g   = goals[thisMonth];
        return (
          <div style={{ background: "linear-gradient(135deg, rgba(198,145,76,0.08), rgba(198,145,76,0.03))", border: "1px solid rgba(198,145,76,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Target size={18} style={{ color: "#C6914C" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F5" }}>الشهر الحالي — {monthLabel(thisMonth)}</span>
              </div>
              <button onClick={() => startEdit(thisMonth)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(198,145,76,0.1)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", fontSize: 12, cursor: "pointer" }}>
                <Pencil size={12} /> تعديل الأهداف
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {[
                { label: "الصفقات المكتملة", actual: act.deals,   target: g?.target_deals   || 0, color: "#C6914C", icon: CheckCircle, suffix: "" },
                { label: "الإيراد المحقق",   actual: act.revenue, target: g?.target_revenue || 0, color: "#4ADE80",  icon: Banknote,    suffix: " ر.س" },
                { label: "عملاء جدد",        actual: act.clients, target: g?.target_clients || 0, color: "#A78BFA",  icon: TrendingUp,  suffix: "" },
              ].map(item => {
                const Icon = item.icon;
                const pct  = item.target > 0 ? Math.min(Math.round((item.actual / item.target) * 100), 100) : 0;
                return (
                  <div key={item.label} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={15} style={{ color: item.color }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#9A9AA0" }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: pct >= 100 ? "#4ADE80" : "#F5F5F5", marginBottom: 10, lineHeight: 1 }}>
                      {item.label === "الإيراد المحقق" ? formatSAR(item.actual, { short: true }) : item.actual.toLocaleString("ar-SA")}
                    </div>
                    {item.target > 0 ? (
                      <ProgressBar value={item.actual} max={item.target} color={item.color} />
                    ) : (
                      <p style={{ fontSize: 11, color: "#3A3A42" }}>لم يُحدَّد هدف بعد</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── الأشهر الستة الماضية ── */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#9A9AA0", marginBottom: 12 }}>الأشهر الستة الماضية</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {months.slice(0, -1).reverse().map(monthKey => {
          const act  = getActuals(monthKey);
          const g    = goals[monthKey];
          const isEd = editing === monthKey;
          return (
            <div key={monthKey} style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isEd ? 14 : 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#D4D4D8" }}>{monthLabel(monthKey)}</span>
                {!isEd ? (
                  <button onClick={() => startEdit(monthKey)} style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#5A5A62", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Pencil size={10} /> {g ? "تعديل" : "ضبط هدف"}
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => saveGoal(monthKey)} style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(198,145,76,0.12)", border: "1px solid rgba(198,145,76,0.25)", color: "#C6914C", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <Save size={10} /> حفظ
                    </button>
                    <button onClick={() => setEditing(null)} style={{ padding: "4px 8px", borderRadius: 7, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#5A5A62", fontSize: 11, cursor: "pointer" }}>
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>

              {isEd ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#5A5A62", display: "block", marginBottom: 4 }}>هدف الصفقات</label>
                    <input type="number" className={inp} value={form.target_deals} onChange={e => setForm(f => ({...f, target_deals: e.target.value}))} placeholder="0" dir="ltr" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#5A5A62", display: "block", marginBottom: 4 }}>هدف الإيراد (ر.س)</label>
                    <input type="number" className={inp} value={form.target_revenue} onChange={e => setForm(f => ({...f, target_revenue: e.target.value}))} placeholder="0" dir="ltr" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#5A5A62", display: "block", marginBottom: 4 }}>هدف العملاء</label>
                    <input type="number" className={inp} value={form.target_clients} onChange={e => setForm(f => ({...f, target_clients: e.target.value}))} placeholder="0" dir="ltr" />
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  {[
                    { label: "صفقات", actual: act.deals,   target: g?.target_deals   || 0, color: "#C6914C" },
                    { label: "إيراد",  actual: act.revenue, target: g?.target_revenue || 0, color: "#4ADE80",  isAmount: true },
                    { label: "عملاء",  actual: act.clients, target: g?.target_clients || 0, color: "#A78BFA" },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 11, color: "#5A5A62", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#E4E4E7", marginBottom: 6 }}>
                        {item.isAmount ? formatSAR(item.actual, { short: true }) : item.actual}
                        {item.target > 0 && <span style={{ fontSize: 10, color: "#3A3A42", fontWeight: 400 }}> / {item.isAmount ? formatSAR(item.target, { short: true }) : item.target}</span>}
                      </div>
                      {item.target > 0 && <ProgressBar value={item.actual} max={item.target} color={item.color} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
