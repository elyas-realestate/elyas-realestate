"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Building2, Users, TrendingUp, CheckSquare, FileText, Megaphone,
  Eye, MousePointerClick, BarChart3, ArrowUpRight, ArrowDownRight,
  Clock, AlertTriangle, CheckCircle, Calendar, Activity, Globe,
  Layers, ChevronLeft,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function KPICard({ label, value, sub, icon: Icon, color, trend, trendLabel, href }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; trend?: "up" | "down" | "neutral";
  trendLabel?: string; href?: string;
}) {
  const inner = (
    <div className="rounded-2xl p-5 h-full transition" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: color + "18" }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && trendLabel && (
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: trend === "up" ? "#4ADE80" : trend === "down" ? "#F87171" : "#9A9AA0" }}>
            {trend === "up" ? <ArrowUpRight size={13} /> : trend === "down" ? <ArrowDownRight size={13} /> : null}
            {trendLabel}
          </span>
        )}
        {href && <ChevronLeft size={16} style={{ color: "#3A3A42" }} />}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: "#F5F5F5" }}>{value}</div>
      <div className="text-sm font-medium mb-0.5" style={{ color: "#9A9AA0" }}>{label}</div>
      {sub && <div className="text-xs" style={{ color: "#5A5A62" }}>{sub}</div>}
    </div>
  );
  if (href) return <Link href={href} className="block no-underline hover:scale-[1.01] transition-transform" style={{ height: "100%" }}>{inner}</Link>;
  return inner;
}

function MiniStatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(198,145,76,0.06)" }}>
      <span style={{ color: "#9A9AA0", fontSize: 13 }}>{label}</span>
      <span className="font-bold text-sm" style={{ color }}>{value.toLocaleString()}</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    propertiesTotal: 0, propertiesPublished: 0,
    clients: 0,
    dealsActive: 0, dealsCompleted: 0,
    tasksTotal: 0, tasksDone: 0, tasksOverdue: 0,
    requestsNew: 0,
  });
  const [analytics, setAnalytics] = useState({
    viewsToday: 0, viewsWeek: 0, viewsMonth: 0,
    clicksToday: 0, clicksWeek: 0,
    topPages: [] as { page: string; count: number }[],
    analyticsReady: false,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [p, c, dActive, dDone, tAll, tDone, rNew, tRecent] = await Promise.all([
      supabase.from("properties").select("id, is_published", { count: "exact" }),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }).not("current_stage", "in", '("مكتملة","ملغاة")'),
      supabase.from("deals").select("id", { count: "exact", head: true }).eq("current_stage", "مكتملة"),
      supabase.from("tasks").select("id, due_date, status", { count: "exact" }),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "مكتملة"),
      supabase.from("property_requests").select("id", { count: "exact", head: true }).eq("status", "جديد"),
      supabase.from("tasks").select("id, title, status, priority, due_date").neq("status", "مكتملة").order("due_date", { ascending: true }).limit(5),
    ]);

    const props = p.data || [];
    const published = props.filter((x: any) => x.is_published).length;
    const overdueCount = (tAll.data || []).filter((t: any) =>
      t.due_date && new Date(t.due_date) < now && t.status !== "مكتملة"
    ).length;

    setStats({
      propertiesTotal: p.count || 0,
      propertiesPublished: published,
      clients: c.count || 0,
      dealsActive: dActive.count || 0,
      dealsCompleted: dDone.count || 0,
      tasksTotal: tAll.count || 0,
      tasksDone: tDone.count || 0,
      tasksOverdue: overdueCount,
      requestsNew: rNew.count || 0,
    });

    setRecentTasks(tRecent.data || []);

    // Analytics — gracefully handle missing table
    try {
      const [vToday, vWeek, vMonth, cToday, cWeek, topP] = await Promise.all([
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "pageview").gte("created_at", todayStart),
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "pageview").gte("created_at", weekStart),
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "pageview").gte("created_at", monthStart),
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "click").gte("created_at", todayStart),
        supabase.from("site_analytics").select("id", { count: "exact", head: true }).eq("event_type", "click").gte("created_at", weekStart),
        supabase.from("site_analytics").select("page, element").eq("event_type", "pageview").gte("created_at", monthStart),
      ]);

      // Aggregate top pages using Arabic label (stored in element field)
      const pageCounts: Record<string, { label: string; count: number }> = {};
      (topP.data || []).forEach((r: any) => {
        const key = r.page || "/";
        const label = r.element || key;
        if (!pageCounts[key]) pageCounts[key] = { label, count: 0 };
        pageCounts[key].count += 1;
      });
      const topPages = Object.values(pageCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(({ label, count }) => ({ page: label, count }));

      setAnalytics({
        viewsToday: vToday.count || 0,
        viewsWeek: vWeek.count || 0,
        viewsMonth: vMonth.count || 0,
        clicksToday: cToday.count || 0,
        clicksWeek: cWeek.count || 0,
        topPages,
        analyticsReady: !vToday.error,
      });
    } catch {
      // table doesn't exist yet — show setup prompt
    }
  }

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "صباح الخير" : greetingHour < 17 ? "مساء النور" : "مساء الخير";
  const today = new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const priorityColor: Record<string, string> = { "عاجل": "#F87171", "مرتفع": "#FB923C", "متوسط": "#FACC15", "منخفض": "#9A9AA0" };


  return (
    <div dir="rtl">
      <style>{`
        @media (max-width: 640px) {
          .kpi-grid-primary { grid-template-columns: 1fr 1fr !important; }
          .kpi-grid-secondary { grid-template-columns: 1fr 1fr !important; }
          .analytics-grid { grid-template-columns: 1fr !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Greeting Header ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold mb-1">{greeting}، إلياس</h2>
            <p style={{ color: "#5A5A62", fontSize: 13 }}>{today}</p>
          </div>
          <div className="flex items-center gap-2">
            {stats.tasksOverdue > 0 && (
              <Link href="/dashboard/tasks" className="flex items-center gap-2 px-3 py-2 rounded-xl no-underline text-sm"
                style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", border: "1px solid rgba(248,113,113,0.15)" }}>
                <AlertTriangle size={14} />
                {stats.tasksOverdue} متأخرة
              </Link>
            )}
            {stats.requestsNew > 0 && (
              <Link href="/dashboard/requests" className="flex items-center gap-2 px-3 py-2 rounded-xl no-underline text-sm"
                style={{ background: "rgba(198,145,76,0.08)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.15)" }}>
                <FileText size={14} />
                {stats.requestsNew} طلب جديد
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Primary KPIs ── */}
      <div className="kpi-grid-primary grid gap-4 mb-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KPICard
          label="العقارات" value={stats.propertiesTotal}
          sub={stats.propertiesPublished + " منشور"}
          icon={Building2} color="#C6914C"
          href="/dashboard/properties"
        />
        <KPICard
          label="العملاء" value={stats.clients}
          icon={Users} color="#C18D4A"
          href="/dashboard/clients"
        />
        <KPICard
          label="الصفقات النشطة" value={stats.dealsActive}
          sub={stats.dealsCompleted + " مكتملة"}
          icon={TrendingUp} color="#4ADE80"
          href="/dashboard/deals"
        />
        <KPICard
          label="المهام" value={stats.tasksTotal - stats.tasksDone}
          sub={stats.tasksDone + " مكتملة"}
          icon={CheckSquare} color="#A78BFA"
          trend={stats.tasksOverdue > 0 ? "down" : "neutral"}
          trendLabel={stats.tasksOverdue > 0 ? stats.tasksOverdue + " متأخرة" : undefined}
          href="/dashboard/tasks"
        />
      </div>

      {/* ── Analytics + Tasks Row ── */}
      <div className="analytics-grid grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Analytics Card */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={16} style={{ color: "#C6914C" }} />
              <h3 className="font-bold" style={{ fontSize: 14 }}>زيارات الموقع</h3>
            </div>
            {analytics.analyticsReady && (
              <span style={{ fontSize: 11, color: "#5A5A62" }}>آخر 30 يوم</span>
            )}
          </div>

          {!analytics.analyticsReady ? (
            <div className="text-center py-6">
              <Globe size={32} className="mx-auto mb-3" style={{ color: "#3A3A42" }} />
              <p style={{ color: "#5A5A62", fontSize: 13 }} className="mb-3">تتبع الزيارات غير مفعّل بعد</p>
              <p style={{ color: "#3A3A42", fontSize: 11 }}>شغّل الأمر SQL التالي في Supabase:</p>
              <code style={{ display: "block", background: "#0A0A0C", color: "#C6914C", fontSize: 10, padding: "8px 12px", borderRadius: 6, marginTop: 8, textAlign: "left", direction: "ltr" }}>
                create table site_analytics (id uuid default gen_random_uuid() primary key, event_type text, page text, element text, created_at timestamptz default now());
              </code>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "اليوم", value: analytics.viewsToday, icon: Eye },
                  { label: "الأسبوع", value: analytics.viewsWeek, icon: BarChart3 },
                  { label: "الشهر", value: analytics.viewsMonth, icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#111114" }}>
                    <Icon size={16} className="mx-auto mb-2" style={{ color: "#C6914C" }} />
                    <div className="font-bold text-lg">{value.toLocaleString()}</div>
                    <div style={{ color: "#5A5A62", fontSize: 11 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between py-2 mb-3" style={{ borderTop: "1px solid rgba(198,145,76,0.08)" }}>
                <div className="flex items-center gap-2" style={{ color: "#9A9AA0", fontSize: 13 }}>
                  <MousePointerClick size={14} style={{ color: "#C6914C" }} />
                  نقرات اليوم
                </div>
                <span className="font-bold" style={{ color: "#F5F5F5" }}>{analytics.clicksToday.toLocaleString()}</span>
              </div>
              {analytics.topPages.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 8 }}>أكثر الصفحات زيارةً (هذا الشهر)</p>
                  {analytics.topPages.map(({ page, count }) => (
                    <div key={page} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(198,145,76,0.05)" }}>
                      <span style={{ color: "#9A9AA0", fontSize: 12, direction: "ltr" }} className="truncate">{page}</span>
                      <span style={{ color: "#C6914C", fontSize: 12, fontWeight: 600, flexShrink: 0, marginRight: 8 }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: "#C6914C" }} />
              <h3 className="font-bold" style={{ fontSize: 14 }}>المهام القادمة</h3>
            </div>
            <Link href="/dashboard/tasks" className="no-underline" style={{ fontSize: 12, color: "#C6914C" }}>عرض الكل</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-10" style={{ color: "#5A5A62" }}>
              <CheckCircle size={28} className="mx-auto mb-2" style={{ color: "#3A3A42" }} />
              <p style={{ fontSize: 13 }}>لا توجد مهام معلقة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#111114" }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: priorityColor[task.priority] || "#9A9AA0" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#F5F5F5" }}>{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs mt-0.5" style={{ color: isOverdue ? "#F87171" : "#5A5A62" }}>
                          {isOverdue ? "متأخرة — " : ""}
                          {new Date(task.due_date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(198,145,76,0.08)", color: "#9A9AA0" }}>{task.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Secondary KPIs + Quick Access ── */}
      <div className="bottom-grid grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Secondary stats */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} style={{ color: "#C6914C" }} />
            <h3 className="font-bold" style={{ fontSize: 14 }}>ملخص سريع</h3>
          </div>
          <MiniStatRow label="عقارات منشورة" value={stats.propertiesPublished} color="#C6914C" />
          <MiniStatRow label="عقارات مسودة" value={stats.propertiesTotal - stats.propertiesPublished} color="#5A5A62" />
          <MiniStatRow label="طلبات جديدة" value={stats.requestsNew} color="#4ADE80" />
          <MiniStatRow label="صفقات مكتملة" value={stats.dealsCompleted} color="#A78BFA" />
          <MiniStatRow label="مهام متأخرة" value={stats.tasksOverdue} color="#F87171" />
        </div>

        {/* Quick access */}
        <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} style={{ color: "#C6914C" }} />
            <h3 className="font-bold" style={{ fontSize: 14 }}>وصول سريع</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "العقارات", href: "/dashboard/properties", icon: Building2, color: "#C6914C" },
              { label: "العملاء", href: "/dashboard/clients", icon: Users, color: "#C18D4A" },
              { label: "الصفقات", href: "/dashboard/deals", icon: TrendingUp, color: "#4ADE80" },
              { label: "الطلبات", href: "/dashboard/requests", icon: FileText, color: "#FB923C" },
              { label: "المهام", href: "/dashboard/tasks", icon: CheckSquare, color: "#A78BFA" },
              { label: "المحتوى", href: "/dashboard/content", icon: Megaphone, color: "#F472B6" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2 p-3 rounded-xl no-underline transition"
                style={{ background: "#111114", color: "#9A9AA0" }}>
                <item.icon size={16} style={{ color: item.color }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
