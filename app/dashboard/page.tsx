"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Building2, Users, TrendingUp, CheckSquare, FileText, Megaphone,
  Eye, MousePointerClick, BarChart3, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, CheckCircle, Calendar, Activity,
  Layers, ChevronLeft, Sparkles, Target, Zap, Brain,
  MapPin, Bell, BellOff, Info, ChevronRight,
} from "lucide-react";


// ── Deal stages pipeline order ──────────────────────────────────────────
const STAGES = ["تواصل أولي", "عرض", "تفاوض", "توثيق", "إتمام"];
const STAGE_COLOR: Record<string, string> = {
  "تواصل أولي": "#38BDF8",
  "عرض":        "#A78BFA",
  "تفاوض":      "#FACC15",
  "توثيق":      "#FB923C",
  "إتمام":      "#4ADE80",
};

// ── Small components ─────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, color, trend, trendLabel, href }: {
  label: string; value: string | number; sub?: string; icon: any;
  color: string; trend?: "up" | "down" | "neutral"; trendLabel?: string; href?: string;
}) {
  const inner = (
    <div className="stat-card h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center rounded-xl"
          style={{ width: 42, height: 42, background: color + "15", border: "1px solid " + color + "25" }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && trendLabel ? (
          <span className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: trend === "up" ? "#4ADE80" : trend === "down" ? "#F87171" : "#94A3B8" }}>
            {trend === "up" ? <ArrowUpRight size={13} /> : trend === "down" ? <ArrowDownRight size={13} /> : null}
            {trendLabel}
          </span>
        ) : href ? <ChevronLeft size={15} style={{ color: "#3A3A42" }} /> : null}
      </div>
      <div className="font-cairo font-bold" style={{ fontSize: 28, color: "#F8FAFC", lineHeight: 1.1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#94A3B8", marginBottom: sub ? 3 : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#64748B" }}>{sub}</div>}
    </div>
  );
  if (href) return <Link href={href} className="block no-underline" style={{ height: "100%" }}>{inner}</Link>;
  return inner;
}

function MiniRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(16,185,129,0.06)" }}>
      <span style={{ color: "#94A3B8", fontSize: 13 }}>{label}</span>
      <span className="font-cairo font-bold text-sm" style={{ color }}>{value.toLocaleString()}</span>
    </div>
  );
}

// ── AI Insight item ───────────────────────────────────────────────────────
function InsightItem({ text, type }: { text: string; type: "warn" | "info" | "good" }) {
  const cfg = {
    warn: { color: "#FB923C", bg: "rgba(251,146,60,0.07)",  border: "rgba(251,146,60,0.2)",  icon: AlertTriangle },
    info: { color: "#38BDF8", bg: "rgba(56,189,248,0.07)",  border: "rgba(56,189,248,0.2)",  icon: Info          },
    good: { color: "#4ADE80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.2)",  icon: CheckCircle   },
  }[type];
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Icon size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

// ── Pipeline bar ──────────────────────────────────────────────────────────
function PipelineBar({ stage, count, max }: { stage: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const color = STAGE_COLOR[stage] || "#10B981";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontSize: 12, color: "#94A3B8" }}>{stage}</span>
        <span className="font-cairo font-bold" style={{ fontSize: 13, color }}>{count}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.05)" }}>
        <div style={{
          height: "100%", borderRadius: 999,
          background: `linear-gradient(90deg, ${color}CC, ${color})`,
          width: pct + "%",
          transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
    </div>
  );
}

// ── District heat cell ────────────────────────────────────────────────────
function DistrictCell({ name, count, max }: { name: string; count: number; max: number }) {
  const intensity = max > 0 ? count / max : 0;
  const alpha = 0.06 + intensity * 0.45;
  return (
    <div className="rounded-xl p-3 text-center transition"
      style={{
        background: `rgba(16,185,129,${alpha})`,
        border: `1px solid rgba(16,185,129,${alpha * 1.5})`,
        cursor: "default",
      }}>
      <div className="font-cairo font-bold" style={{ fontSize: 16, color: intensity > 0.5 ? "#F8FAFC" : "#10B981" }}>
        {count}
      </div>
      <div style={{ fontSize: 10, color: intensity > 0.5 ? "#34D399" : "#64748B", marginTop: 2 }}>{name}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [stats, setStats] = useState({
    propertiesTotal: 0, propertiesPublished: 0,
    clients: 0,
    dealsActive: 0, dealsCompleted: 0,
    tasksTotal: 0, tasksDone: 0, tasksOverdue: 0,
    requestsNew: 0,
  });
  const [analytics, setAnalytics] = useState({
    viewsToday: 0, viewsWeek: 0, viewsMonth: 0, clicksToday: 0,
    topPages: [] as { page: string; count: number }[],
    analyticsReady: false,
  });
  const [recentTasks, setRecentTasks]   = useState<any[]>([]);
  const [deals, setDeals]               = useState<any[]>([]);
  const [properties, setProperties]     = useState<any[]>([]);
  const [recentProps, setRecentProps]   = useState<any[]>([]);
  const [brokerName, setBrokerName]     = useState("إلياس");
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart  = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [p, c, dActive, dDone, tAll, tDone, rNew, tRecent, allDeals, allProps, identity] = await Promise.all([
      supabase.from("properties").select("id, is_published, city, district, price", { count: "exact" }),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }).not("current_stage", "in", '("مكتملة","ملغاة")'),
      supabase.from("deals").select("id", { count: "exact", head: true }).eq("current_stage", "مكتملة"),
      supabase.from("tasks").select("id, due_date, status", { count: "exact" }),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "مكتملة"),
      supabase.from("property_requests").select("id", { count: "exact", head: true }).eq("status", "جديد"),
      supabase.from("tasks").select("id, title, status, priority, due_date").neq("status", "مكتملة").order("due_date", { ascending: true }).limit(5),
      supabase.from("deals").select("id, title, current_stage, expected_commission, created_at, client_name"),
      supabase.from("properties").select("id, title, city, district, price, is_published").order("created_at", { ascending: false }).limit(5),
      supabase.from("broker_identity").select("broker_name").limit(1).single(),
    ]);

    const props      = p.data || [];
    const published  = props.filter((x: any) => x.is_published).length;
    const overdueCount = (tAll.data || []).filter((t: any) =>
      t.due_date && new Date(t.due_date) < now && t.status !== "مكتملة"
    ).length;

    setStats({
      propertiesTotal: p.count || 0, propertiesPublished: published,
      clients: c.count || 0,
      dealsActive: dActive.count || 0, dealsCompleted: dDone.count || 0,
      tasksTotal: tAll.count || 0, tasksDone: tDone.count || 0,
      tasksOverdue: overdueCount, requestsNew: rNew.count || 0,
    });
    setRecentTasks(tRecent.data || []);
    setDeals(allDeals.data || []);
    setProperties(props);
    setRecentProps(allProps.data || []);
    if (identity.data?.broker_name) setBrokerName(identity.data.broker_name.split(" ")[0]);

    // Analytics
    try {
      const [vToday, vWeek, vMonth, cToday, topP] = await Promise.all([
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "pageview").gte("created_at", todayStart),
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "pageview").gte("created_at", weekStart),
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "pageview").gte("created_at", monthStart),
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "click").gte("created_at", todayStart),
        supabase.from("site_analytics").select("page, element").eq("event_type", "pageview").gte("created_at", monthStart),
      ]);
      const pageCounts: Record<string, { label: string; count: number }> = {};
      (topP.data || []).forEach((r: any) => {
        const key = r.page || "/";
        if (!pageCounts[key]) pageCounts[key] = { label: r.element || key, count: 0 };
        pageCounts[key].count++;
      });
      const topPages = Object.values(pageCounts).sort((a, b) => b.count - a.count).slice(0, 5).map(({ label, count }) => ({ page: label, count }));
      setAnalytics({ viewsToday: vToday.count || 0, viewsWeek: vWeek.count || 0, viewsMonth: vMonth.count || 0, clicksToday: cToday.count || 0, topPages, analyticsReady: !vToday.error });
    } catch { /* not ready */ }
  }

  // ── Computed: pipeline by stage ────────────────────────────────────────
  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {};
    deals.forEach(d => {
      const s = d.current_stage || "تواصل أولي";
      counts[s] = (counts[s] || 0) + 1;
    });
    return STAGES.map(s => ({ stage: s, count: counts[s] || 0 }));
  }, [deals]);

  const pipelineMax = useMemo(() => Math.max(...pipeline.map(p => p.count), 1), [pipeline]);

  // ── Computed: district heatmap ─────────────────────────────────────────
  const districtMap = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(p => {
      const key = p.district || p.city || "غير محدد";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9)
      .map(([name, count]) => ({ name, count }));
  }, [properties]);

  const districtMax = useMemo(() => Math.max(...districtMap.map(d => d.count), 1), [districtMap]);

  // ── Computed: AI smart insights ────────────────────────────────────────
  const insights = useMemo(() => {
    const list: { text: string; type: "warn" | "info" | "good" }[] = [];

    if (stats.tasksOverdue > 0)
      list.push({ type: "warn", text: `لديك ${stats.tasksOverdue} مهمة متأخرة — راجع قائمة المهام واتخذ إجراءً سريعاً.` });

    if (stats.requestsNew > 0)
      list.push({ type: "warn", text: `${stats.requestsNew} طلب عقاري جديد ينتظر ردّك — العملاء المهتمون يستحقون استجابة سريعة.` });

    const staleDeals = deals.filter(d => {
      if (!d.created_at) return false;
      const days = (Date.now() - new Date(d.created_at).getTime()) / 86400000;
      return days > 14 && d.current_stage !== "مكتملة" && d.current_stage !== "ملغاة";
    });
    if (staleDeals.length > 0)
      list.push({ type: "warn", text: `${staleDeals.length} صفقة لم تتحرك منذ أكثر من أسبوعين — تابع "${staleDeals[0]?.title || staleDeals[0]?.client_name || "الصفقة"}" أولاً.` });

    const unpublished = stats.propertiesTotal - stats.propertiesPublished;
    if (unpublished > 0)
      list.push({ type: "info", text: `${unpublished} عقار غير منشور — نشرها يزيد من فرص الحصول على طلبات جديدة.` });

    if (stats.dealsActive > 0)
      list.push({ type: "good", text: `${stats.dealsActive} صفقة نشطة حالياً في خط الأنابيب — أداء جيد، استمر في المتابعة.` });

    if (stats.propertiesPublished > 0 && analytics.viewsWeek > 0)
      list.push({ type: "good", text: `موقعك حصل على ${analytics.viewsWeek} زيارة هذا الأسبوع — تأكد من تحديث صور العقارات لتحسين التحويل.` });

    if (list.length === 0)
      list.push({ type: "good", text: "كل شيء يبدو على ما يرام اليوم! لا تنبيهات عاجلة. وقت مثالي لمراجعة محفظتك العقارية." });

    return list.slice(0, 3);
  }, [stats, deals, analytics]);

  // ── Smart Alerts (separate from insights) ──────────────────────────────
  const alerts = useMemo(() => {
    const list: { text: string; sub: string; type: "red" | "gold" | "blue" }[] = [];
    if (stats.tasksOverdue > 0)
      list.push({ type: "red",  text: "مهام متأخرة",     sub: `${stats.tasksOverdue} مهمة تجاوزت موعدها` });
    if (stats.requestsNew > 0)
      list.push({ type: "gold", text: "طلبات جديدة",      sub: `${stats.requestsNew} طلب ينتظر ردّك` });
    const stale = deals.filter(d => d.created_at && (Date.now() - new Date(d.created_at).getTime()) / 86400000 > 14 && !["مكتملة","ملغاة"].includes(d.current_stage));
    if (stale.length > 0)
      list.push({ type: "blue", text: "صفقات راكدة",      sub: `${stale.length} صفقة لم تُحدَّث منذ فترة` });
    return list;
  }, [stats, deals]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء النور" : "مساء الخير";
  const today = new Date().toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric" });
  const priorityColor: Record<string, string> = { "عاجل": "#F87171", "مرتفع": "#FB923C", "متوسط": "#FACC15", "منخفض": "#94A3B8" };

  return (
    <div dir="rtl">
      <style>{`
        @media (max-width: 640px) {
          .kpi-grid  { grid-template-columns: 1fr 1fr !important; }
          .mid-grid  { grid-template-columns: 1fr !important; }
          .bot-grid  { grid-template-columns: 1fr !important; }
          .heat-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="hero-banner mb-6 fade-up">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: "#10B981" }} />
              <span style={{ fontSize: 12, color: "#10B981", fontWeight: 600 }}>{today}</span>
            </div>
            <h1 className="font-cairo font-bold" style={{ fontSize: 26, color: "#F8FAFC", marginBottom: 6, lineHeight: 1.2 }}>
              {greeting}، {brokerName} 👋
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748B", maxWidth: 420, lineHeight: 1.7 }}>
              إليك نظرة ذكية على أداء منصتك — كل شيء محسوب بناءً على بياناتك الحقيقية.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {stats.tasksOverdue > 0 && (
              <Link href="/dashboard/tasks" className="status-pill red no-underline">
                <AlertTriangle size={11} />{stats.tasksOverdue} مهام متأخرة
              </Link>
            )}
            {stats.requestsNew > 0 && (
              <Link href="/dashboard/requests" className="status-pill gold no-underline">
                <FileText size={11} />{stats.requestsNew} طلب جديد
              </Link>
            )}
            {stats.dealsActive > 0 && (
              <span className="status-pill green">
                <Zap size={11} />{stats.dealsActive} صفقة نشطة
              </span>
            )}
          </div>
        </div>
        {stats.tasksTotal > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="flex justify-between mb-1.5">
              <span style={{ fontSize: 11, color: "#64748B" }}>إنجاز المهام</span>
              <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>
                {Math.round((stats.tasksDone / stats.tasksTotal) * 100)}%
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: "rgba(16,185,129,0.1)" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: "linear-gradient(90deg, #10B981, #34D399)",
                width: Math.round((stats.tasksDone / stats.tasksTotal) * 100) + "%",
                transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Grid ────────────────────────────────────────────── */}
      <div className="kpi-grid grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KPICard label="العقارات" value={stats.propertiesTotal} sub={stats.propertiesPublished + " منشور"} icon={Building2} color="#10B981" href="/dashboard/properties" />
        <KPICard label="العملاء" value={stats.clients} icon={Users} color="#A78BFA" href="/dashboard/clients" />
        <KPICard label="الصفقات النشطة" value={stats.dealsActive} sub={stats.dealsCompleted + " مكتملة"} icon={TrendingUp} color="#4ADE80" href="/dashboard/deals"
          trend={stats.dealsCompleted > 0 ? "up" : "neutral"} trendLabel={stats.dealsCompleted > 0 ? stats.dealsCompleted + " أُغلقت" : undefined} />
        <KPICard label="المهام المعلقة" value={stats.tasksTotal - stats.tasksDone} sub={stats.tasksDone + " مكتملة"} icon={CheckSquare} color="#FB923C" href="/dashboard/tasks"
          trend={stats.tasksOverdue > 0 ? "down" : "neutral"} trendLabel={stats.tasksOverdue > 0 ? stats.tasksOverdue + " متأخرة" : undefined} />
      </div>

      {/* ── AI Copilot + Smart Alerts ────────────────────────────── */}
      <div className="mid-grid grid gap-4 mb-6" style={{ gridTemplateColumns: "2fr 1fr" }}>

        {/* AI Copilot */}
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg"
                style={{ width: 32, height: 32, background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))", border: "1px solid rgba(16,185,129,0.25)" }}>
                <Brain size={16} style={{ color: "#10B981" }} />
              </div>
              <div>
                <h3 className="font-cairo font-bold" style={{ fontSize: 14, lineHeight: 1 }}>المساعد الذكي</h3>
                <p style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>تحليل مبني على بياناتك الحقيقية</p>
              </div>
            </div>
            <span className="status-pill green" style={{ fontSize: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
              نشط
            </span>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <InsightItem key={i} text={insight.text} type={insight.type} />
            ))}
          </div>
        </div>

        {/* Smart Alerts */}
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={15} style={{ color: "#10B981" }} />
              <h3 className="font-cairo font-bold" style={{ fontSize: 14 }}>التنبيهات</h3>
            </div>
            {alerts.length > 0 && (
              <button
                onClick={() => setAlertsDismissed(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 11 }}
              >
                {alertsDismissed ? <Bell size={14} /> : <BellOff size={14} />}
              </button>
            )}
          </div>

          {alertsDismissed || alerts.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={28} className="mx-auto mb-2" style={{ color: "#475569" }} />
              <p style={{ fontSize: 12, color: "#64748B" }}>لا تنبيهات عاجلة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => {
                const colors = {
                  red:  { bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)", dot: "#F87171" },
                  gold: { bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.2)",  dot: "#FBBF24" }, // Swapped to yellow-ish warning
                  blue: { bg: "rgba(56,189,248,0.07)",  border: "rgba(56,189,248,0.2)",  dot: "#38BDF8" },
                }[a.type];
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                      style={{ background: colors.dot }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#F8FAFC" }}>{a.text}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{a.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Pipeline + Heatmap ──────────────────────────────────── */}
      <div className="mid-grid grid gap-4 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Deal Pipeline */}
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: "#10B981" }} />
              <div>
                <h3 className="font-cairo font-bold" style={{ fontSize: 14 }}>خط أنابيب الصفقات</h3>
                <p style={{ fontSize: 10, color: "#64748B" }}>توزيع الصفقات النشطة حسب المرحلة</p>
              </div>
            </div>
            <Link href="/dashboard/deals" className="no-underline" style={{ fontSize: 12, color: "#10B981" }}>عرض الكل</Link>
          </div>

          {deals.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#64748B" }}>
              <TrendingUp size={28} className="mx-auto mb-2" style={{ color: "#475569" }} />
              <p style={{ fontSize: 13 }}>لا توجد صفقات بعد</p>
              <Link href="/dashboard/deals" className="no-underline" style={{ fontSize: 12, color: "#10B981", display: "block", marginTop: 8 }}>
                أضف أول صفقة →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pipeline.map(({ stage, count }) => (
                <PipelineBar key={stage} stage={stage} count={count} max={pipelineMax} />
              ))}
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: "1px solid rgba(16,185,129,0.08)", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#64748B" }}>إجمالي الصفقات النشطة</span>
                <span className="font-cairo font-bold" style={{ fontSize: 16, color: "#10B981" }}>
                  {pipeline.reduce((s, p) => s + p.count, 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* District Heatmap */}
        <div className="card-luxury p-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={15} style={{ color: "#10B981" }} />
            <h3 className="font-cairo font-bold" style={{ fontSize: 14 }}>خريطة حرارة المناطق</h3>
          </div>
          <p style={{ fontSize: 10, color: "#64748B", marginBottom: 16 }}>توزيع العقارات حسب الحي — الأعمق = الأكثر نشاطاً</p>

          {districtMap.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#64748B" }}>
              <MapPin size={28} className="mx-auto mb-2" style={{ color: "#475569" }} />
              <p style={{ fontSize: 13 }}>أضف عقارات لرؤية الخريطة</p>
            </div>
          ) : (
            <>
              <div className="heat-grid grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {districtMap.map(({ name, count }) => (
                  <DistrictCell key={name} name={name} count={count} max={districtMax} />
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(16,185,129,0.08)" }}>
                <div className="flex items-center gap-2">
                  <div style={{ width: 40, height: 6, borderRadius: 999, background: "linear-gradient(90deg, rgba(16,185,129,0.1), rgba(16,185,129,0.6))" }} />
                  <span style={{ fontSize: 10, color: "#64748B" }}>منخفض → مرتفع</span>
                </div>
                <span style={{ fontSize: 11, color: "#64748B" }}>{districtMap.length} منطقة</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Analytics + Tasks ───────────────────────────────────── */}
      <div className="mid-grid grid gap-4 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Analytics */}
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={15} style={{ color: "#10B981" }} />
              <h3 className="font-cairo font-bold" style={{ fontSize: 14 }}>زيارات الموقع</h3>
            </div>
            {analytics.analyticsReady && <span style={{ fontSize: 11, color: "#64748B" }}>آخر 30 يوم</span>}
          </div>

          {!analytics.analyticsReady ? (
            <div className="text-center py-6">
              <Activity size={32} className="mx-auto mb-3" style={{ color: "#475569" }} />
              <p style={{ color: "#64748B", fontSize: 13 }}>تتبع الزيارات غير مفعّل بعد</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[{ label: "اليوم", value: analytics.viewsToday, icon: Eye }, { label: "الأسبوع", value: analytics.viewsWeek, icon: BarChart3 }, { label: "الشهر", value: analytics.viewsMonth, icon: Calendar }].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.08)" }}>
                    <Icon size={14} className="mx-auto mb-2" style={{ color: "#10B981" }} />
                    <div className="font-cairo font-bold text-lg text-white">{value.toLocaleString()}</div>
                    <div style={{ color: "#94A3B8", fontSize: 11 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 mb-3" style={{ borderTop: "1px solid rgba(16,185,129,0.08)" }}>
                <div className="flex items-center gap-2" style={{ color: "#94A3B8", fontSize: 13 }}>
                  <MousePointerClick size={13} style={{ color: "#10B981" }} />
                  نقرات اليوم
                </div>
                <span className="font-cairo font-bold" style={{ color: "#F8FAFC" }}>{analytics.clicksToday.toLocaleString()}</span>
              </div>
              {analytics.topPages.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>أكثر الصفحات زيارةً</p>
                  {analytics.topPages.map(({ page, count }) => (
                    <div key={page} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(16,185,129,0.05)" }}>
                      <span style={{ color: "#94A3B8", fontSize: 12, direction: "ltr" }} className="truncate">{page}</span>
                      <span style={{ color: "#10B981", fontSize: 12, fontWeight: 600, flexShrink: 0, marginRight: 8 }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Tasks */}
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock size={15} style={{ color: "#10B981" }} />
              <h3 className="font-cairo font-bold" style={{ fontSize: 14 }}>المهام القادمة</h3>
            </div>
            <Link href="/dashboard/tasks" className="no-underline" style={{ fontSize: 12, color: "#10B981" }}>عرض الكل</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-10" style={{ color: "#64748B" }}>
              <CheckCircle size={28} className="mx-auto mb-2" style={{ color: "#475569" }} />
              <p style={{ fontSize: 13 }}>لا توجد مهام معلقة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.06)" }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: priorityColor[task.priority] || "#94A3B8" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#F8FAFC" }}>{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs mt-0.5" style={{ color: isOverdue ? "#F87171" : "#64748B" }}>
                          {isOverdue ? "متأخرة — " : ""}
                          {new Date(task.due_date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <span className="status-pill gray" style={{ fontSize: 10, padding: "2px 7px", border: "1px solid rgba(255,255,255,0.05)" }}>{task.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Properties + Summary ─────────────────────────── */}
      <div className="bot-grid grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>

        {/* Recent Properties — Sale / Rent tabs */}
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 size={15} style={{ color: "#10B981" }} />
              <h3 className="font-cairo font-bold" style={{ fontSize: 14 }}>آخر العقارات</h3>
            </div>
            <Link href="/dashboard/properties" className="no-underline" style={{ fontSize: 12, color: "#10B981" }}>عرض الكل</Link>
          </div>

          {/* Offer type mini-tabs */}
          {(() => {
            const saleProps = recentProps.filter((p: any) => p.offer_type === "بيع" || !p.offer_type);
            const rentProps = recentProps.filter((p: any) => p.offer_type === "إيجار");
            const tabs = [
              { key: "sale", label: "بيع", count: saleProps.length, color: "#10B981", items: saleProps },
              { key: "rent", label: "إيجار", count: rentProps.length, color: "#38BDF8", items: rentProps },
            ];

            return (
              <>
                <div className="flex gap-2 mb-4">
                  {tabs.map(tab => (
                    <span key={tab.key}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: tab.color + "15", color: tab.color, border: "1px solid " + tab.color + "25" }}>
                      {tab.label}
                      <span style={{ fontSize: 10, opacity: 0.8 }}>({tab.count})</span>
                    </span>
                  ))}
                </div>

                {recentProps.length === 0 ? (
                  <div className="text-center py-8" style={{ color: "#64748B" }}>
                    <Building2 size={28} className="mx-auto mb-2" style={{ color: "#475569" }} />
                    <p style={{ fontSize: 13 }}>لا توجد عقارات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentProps.map((prop: any) => (
                      <Link key={prop.id} href={`/dashboard/properties/${prop.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl no-underline transition group hover:bg-[#0F172A] border border-transparent hover:border-[#10B98120]"
                      >
                        <div className="flex items-center justify-center rounded-lg flex-shrink-0 bg-[#0F172A] border border-[#10B98120]"
                          style={{ width: 38, height: 38 }}>
                          <Building2 size={16} style={{ color: "#10B981" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ fontSize: 13.5, color: "#F8FAFC" }}>{prop.title || "عقار بدون عنوان"}</p>
                          <p style={{ fontSize: 11, color: "#64748B" }}>{prop.district || prop.city || "—"}</p>
                        </div>
                        <div className="text-left flex-shrink-0">
                          {prop.price ? (
                            <p className="font-cairo font-bold mb-1" style={{ fontSize: 13, color: "#10B981" }}>
                              {prop.price.toLocaleString()} ر.س
                            </p>
                          ) : null}
                          <div className="flex gap-1.5 justify-end">
                            {prop.offer_type && (
                              <span style={{
                                fontSize: 10, padding: "2px 8px", borderRadius: 6,
                                background: prop.offer_type === "إيجار" ? "rgba(56,189,248,0.1)" : "rgba(16,185,129,0.1)",
                                color: prop.offer_type === "إيجار" ? "#38BDF8" : "#10B981",
                                border: "1px solid " + (prop.offer_type === "إيجار" ? "rgba(56,189,248,0.2)" : "rgba(16,185,129,0.2)")
                              }}>
                                {prop.offer_type}
                              </span>
                            )}
                            <span style={{
                              fontSize: 10, padding: "2px 8px", borderRadius: 6,
                              background: prop.is_published ? "rgba(74,222,128,0.1)" : "rgba(90,90,98,0.2)",
                              color: prop.is_published ? "#4ADE80" : "#94A3B8",
                              border: prop.is_published ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(90,90,98,0.2)"
                            }}>
                              {prop.is_published ? "منشور" : "مسودة"}
                            </span>
                          </div>
                        </div>
                        <ChevronLeft size={14} style={{ color: "#475569", flexShrink: 0, marginLeft: 0 }} />
                      </Link>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Summary */}
        <div className="card-luxury p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={15} style={{ color: "#10B981" }} />
            <h3 className="font-cairo font-bold" style={{ fontSize: 14 }}>ملخص سريع</h3>
          </div>
          <MiniRow label="عقارات منشورة"  value={stats.propertiesPublished}                          color="#10B981" />
          <MiniRow label="عقارات مسودة"   value={stats.propertiesTotal - stats.propertiesPublished} color="#94A3B8" />
          <MiniRow label="طلبات جديدة"    value={stats.requestsNew}                                 color="#4ADE80" />
          <MiniRow label="صفقات مكتملة"   value={stats.dealsCompleted}                              color="#A78BFA" />
          <MiniRow label="مهام متأخرة"    value={stats.tasksOverdue}                                color="#F87171" />

          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { label: "العقارات",  href: "/dashboard/properties", icon: Building2,  color: "#10B981" },
              { label: "العملاء",   href: "/dashboard/clients",    icon: Users,       color: "#A78BFA" },
              { label: "الصفقات",   href: "/dashboard/deals",      icon: TrendingUp,  color: "#4ADE80" },
              { label: "المهام",    href: "/dashboard/tasks",      icon: CheckSquare, color: "#FB923C" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="quick-action rounded-lg flex items-center justify-center gap-2 p-2 hover:bg-white/5 transition bg-[#0F172A] border border-[#10B98120] text-sm text-[#F8FAFC]">
                <item.icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
