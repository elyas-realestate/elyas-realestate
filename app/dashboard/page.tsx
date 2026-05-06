"use client";

import { formatSAR } from "@/lib/format";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, Users, TrendingUp, ArrowUpRight, ArrowDownRight,
  CheckCircle, Sparkles, Brain, BellRing, Target, CircleDollarSign,
  CreditCard, Flame, AlertTriangle, IdCard, Bot, ExternalLink, ArrowLeft,
} from "lucide-react";
import OnboardingChecklist from "@/app/components/OnboardingChecklist";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

// أسماء الأشهر العربية
const MONTH_NAMES_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

type RevenuePoint = { name: string; buy: number; rent: number };
type StatusSlice  = { name: string; value: number; color: string };
type PipelineRow  = { stage: string; count: number };

export default function DashboardPage() {
  const [viewType, setViewType] = useState<"all" | "buy" | "rent">("all");
  const [stats, setStats] = useState({
    properties: 0,
    clients: 0,
    deals: 0,
    revenue: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [propertyStatusData, setPropertyStatusData] = useState<StatusSlice[]>([]);
  const [dealPipelineData, setDealPipelineData] = useState<PipelineRow[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [hotClients, setHotClients] = useState<{ id: string; name: string | null }[]>([]);
  const [staleProps, setStaleProps] = useState(0);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [heroData, setHeroData] = useState<{ slug: string; aiActive: number; aiTotal: number; cardLinks: number }>({ slug: "", aiActive: 0, aiTotal: 0, cardLinks: 0 });

  useEffect(() => {
    fetchData();
  }, [viewType]);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1);

      const [propAllRes, propByStatusRes, clientRes, dealRes, dealRevenueRes, dealPipelineRes, subRes, hotRes, staleRes, tenantRes, aiCountRes, cardLinksRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("status, offer_type"),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("deals").select("id", { count: "exact", head: true }).neq("status", "إلغاء"),
        supabase.from("deals").select("commission_amount, offer_type, closed_at, status").gte("closed_at", sixMonthsAgo.toISOString()),
        supabase.from("deals").select("status"),
        supabase.from("external_subscriptions").select("*").eq("tenant_id", user.id).order("end_date", { ascending: true }).limit(3),
        supabase.from("clients").select("id, name").eq("sentiment", "hot").limit(5),
        supabase.from("properties").select("id", { count: "exact", head: true })
          .or(`last_availability_check.is.null,last_availability_check.lt.${weekAgo}`),
        supabase.from("tenants").select("slug").eq("owner_id", user.id).maybeSingle(),
        supabase.from("ai_employees").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profile_links").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      setHeroData({
        slug: tenantRes.data?.slug || "",
        aiActive: aiCountRes.count || 0,
        aiTotal: 16, // إجمالي المساعدين في النظام
        cardLinks: cardLinksRes.count || 0,
      });

      // ── إحصائيات أساسية (بدون أرقام وهمية) ──
      const propsCount   = propAllRes.count   || 0;
      const clientsCount = clientRes.count    || 0;
      const dealsCount   = dealRes.count      || 0;
      const totalRevenue = (dealRevenueRes.data || [])
        .filter((d: any) => d.status === "مكتمل" || d.status === "إغلاق")
        .reduce((sum: number, d: any) => sum + (Number(d.commission_amount) || 0), 0);

      setStats({ properties: propsCount, clients: clientsCount, deals: dealsCount, revenue: totalRevenue });

      // ── رسم تدفق الإيرادات (٦ أشهر فعلية) ──
      const monthMap = new Map<string, { buy: number; rent: number }>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthMap.set(key, { buy: 0, rent: 0 });
      }
      (dealRevenueRes.data || []).forEach((deal: any) => {
        if (!deal.closed_at) return;
        const d = new Date(deal.closed_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const cell = monthMap.get(key);
        if (!cell) return;
        const amt = Number(deal.commission_amount) || 0;
        if (deal.offer_type === "إيجار") cell.rent += amt; else cell.buy += amt;
      });
      const revData: RevenuePoint[] = Array.from(monthMap.entries()).map(([key, vals]) => {
        const [, mIdx] = key.split("-").map(Number);
        return { name: MONTH_NAMES_AR[mIdx], buy: vals.buy, rent: vals.rent };
      });
      setRevenueData(revData);

      // ── حالة المحفظة العقارية الفعلية ──
      const statusCounts = { available: 0, negotiating: 0, sold: 0 };
      (propByStatusRes.data || []).forEach((p: any) => {
        const s = (p.status || "").toLowerCase();
        if (s.includes("متاح") || s === "available") statusCounts.available++;
        else if (s.includes("تفاوض") || s.includes("محجوز")) statusCounts.negotiating++;
        else if (s.includes("مباع") || s.includes("مؤجر") || s.includes("مكتمل")) statusCounts.sold++;
        else statusCounts.available++;
      });
      const statusData: StatusSlice[] = [];
      if (statusCounts.available)   statusData.push({ name: "متاح",        value: statusCounts.available,   color: "var(--success)" });
      if (statusCounts.negotiating) statusData.push({ name: "قيد التفاوض", value: statusCounts.negotiating, color: "var(--warning)" });
      if (statusCounts.sold)        statusData.push({ name: "مباع/مؤجر",   value: statusCounts.sold,        color: "var(--info-2)"  });
      setPropertyStatusData(statusData);

      // ── مسار الصفقات الفعلي ──
      const stageCounts: Record<string, number> = {
        "تواصل أولي": 0, "عرض العقار": 0, "تفاوض": 0, "إتمام": 0,
      };
      (dealPipelineRes.data || []).forEach((d: any) => {
        const s = (d.status || "").trim();
        if (stageCounts.hasOwnProperty(s)) stageCounts[s]++;
        else if (s.includes("جديد") || s.includes("أولي")) stageCounts["تواصل أولي"]++;
        else if (s.includes("عرض"))                         stageCounts["عرض العقار"]++;
        else if (s.includes("تفاوض"))                       stageCounts["تفاوض"]++;
        else if (s.includes("مكتمل") || s.includes("إغلاق")) stageCounts["إتمام"]++;
      });
      setDealPipelineData(Object.entries(stageCounts).map(([stage, count]) => ({ stage, count })));

      if (subRes.data) setSubs(subRes.data);
      if (hotRes.data) setHotClients(hotRes.data);
      setStaleProps(staleRes.count || 0);

      // ── تنبيه AI ديناميكي بناءً على البيانات الفعلية ──
      buildAiInsight({
        properties: propsCount, clients: clientsCount, deals: dealsCount,
        hotCount: (hotRes.data || []).length, staleCount: staleRes.count || 0,
        subsExpiring: (subRes.data || []).length,
      });

    } catch (error) {
      console.error(error);
    }
  }

  function buildAiInsight(d: { properties: number; clients: number; deals: number; hotCount: number; staleCount: number; subsExpiring: number }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء الخير";
    const parts: string[] = [`${greeting}!`];
    if (d.properties === 0 && d.clients === 0) {
      parts.push("ابدأ بإضافة أول عقار وأول عميل من القائمة الجانبية، وسأبدأ في تتبّع نشاطك تلقائياً.");
    } else {
      if (d.hotCount > 0)     parts.push(`عندك ${d.hotCount} عميل ساخن يحتاج متابعة اليوم.`);
      if (d.staleCount > 0)   parts.push(`${d.staleCount} عقار يحتاج تحديث إتاحة مع المالك.`);
      if (d.deals > 0)        parts.push(`${d.deals} صفقة جارية حالياً.`);
      if (d.subsExpiring > 0) parts.push(`${d.subsExpiring} اشتراك خارجي قريب الانتهاء.`);
      if (parts.length === 1) parts.push("كل شيء يسير بسلاسة — لا توجد تنبيهات اليوم.");
    }
    setAiInsight(parts.join(" "));
  }

  return (
    <div className="space-y-6 pb-12" dir="rtl">

      {/* Onboarding Checklist — يظهر للوسطاء الجدد فقط، يختفي تلقائياً عند الإنجاز */}
      <OnboardingChecklist />

      {/* HEADER & TOGGLES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-[var(--text-strong)]">نظرة عامة</h1>
          <p className="text-sm text-[var(--text-soft)] mt-1">المركز المالي والتشغيلي لمنصتك العقارية</p>
        </div>
        
        <div className="bg-[var(--bg-surface-2)] border border-[var(--gold-bg-hover)] rounded-xl p-1 flex items-center">
          <button 
            onClick={() => setViewType("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${viewType === "all" ? "bg-[var(--gold-2)] text-[var(--bg-page)]" : "text-[var(--text-soft)] hover:text-[var(--text-strong)]"}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setViewType("buy")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${viewType === "buy" ? "bg-[var(--info-2)] text-[var(--bg-page)]" : "text-[var(--text-soft)] hover:text-[var(--text-strong)]"}`}
          >
            بيع
          </button>
          <button 
            onClick={() => setViewType("rent")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${viewType === "rent" ? "bg-[var(--success)] text-[var(--bg-page)]" : "text-[var(--text-soft)] hover:text-[var(--text-strong)]"}`}
          >
            إيجار
          </button>
        </div>
      </div>

      {/* AI COPILOT INSIGHTS */}
      <div className="bg-gradient-to-l from-[var(--gold-bg-hover)] to-[rgba(198,145,76,0.02)] border border-[rgba(198,145,76,0.25)] rounded-2xl p-5 flex items-start gap-4 shadow-lg shadow-[rgba(198,145,76,0.05)] relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-[var(--gold-2)] opacity-10 rounded-full blur-3xl"></div>
        <div className="bg-[var(--bg-page)] p-3 rounded-xl border border-[var(--gold-bg-strong)] shadow-[0_0_15px_var(--gold-bg-hover)]">
          <Brain size={24} className="text-[var(--gold-2)]" />
        </div>
        <div className="flex-1 relative z-10">
          <h3 className="text-base font-bold text-[var(--text-strong)] flex items-center gap-2 mb-1">
            مستشار الذكاء الاصطناعي <Sparkles size={14} className="text-[var(--gold-2)]" />
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {aiInsight || "جارٍ تحضير نظرة سريعة على نشاطك..."}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          HERO FEATURES — تمايزك التنافسي (CIB #5)
          AI Employees + Profile Card — لا منصة سعودية أخرى تجمعهما
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* AI Employees Hero */}
        <Link href="/dashboard/ai" className="rounded-2xl p-5 no-underline relative overflow-hidden transition group" style={{
          background: "linear-gradient(135deg, var(--gold-bg-hover), var(--bg-surface-1))",
          border: "1px solid var(--gold-bg-strong)",
        }}>
          <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: "var(--gold-2)" }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                background: "var(--bg-page)", border: "1px solid var(--gold-bg-strong)",
              }}>
                <Bot size={22} style={{ color: "var(--gold-2)" }} />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                background: "var(--gold-2)", color: "var(--bg-page)",
              }}>تمايزنا التنافسي</span>
            </div>
            <div className="font-bold text-base mb-1" style={{ color: "var(--text-strong)" }}>
              فريقك من المساعدين الأذكياء
            </div>
            <div className="text-xs mb-3" style={{ color: "var(--text-soft)" }}>
              {heroData.aiActive > 0
                ? `${heroData.aiActive} من ${heroData.aiTotal} مساعد يعمل بأمرك الآن — يكتب، يتابع، يحلّل`
                : `${heroData.aiTotal} مساعد جاهز — شغّل أول واحد بنقرتين`}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--gold-2)" }}>
              فتح مركز التحكم <ArrowLeft size={12} />
            </div>
          </div>
        </Link>

        {/* Profile Card Hero */}
        <Link href="/dashboard/profile-card" className="rounded-2xl p-5 no-underline relative overflow-hidden transition group" style={{
          background: "linear-gradient(135deg, rgba(167,139,250,0.10), var(--bg-surface-1))",
          border: "1px solid rgba(167,139,250,0.25)",
        }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: "rgb(167,139,250)" }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                background: "var(--bg-page)", border: "1px solid rgba(167,139,250,0.4)",
              }}>
                <IdCard size={22} style={{ color: "rgb(167,139,250)" }} />
              </div>
              {heroData.slug && (
                <Link href={`/c/${heroData.slug}`} target="_blank"
                  onClick={e => e.stopPropagation()}
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 no-underline"
                  style={{ background: "rgb(167,139,250)", color: "#FFFFFF" }}>
                  <ExternalLink size={10} /> /c/{heroData.slug}
                </Link>
              )}
            </div>
            <div className="font-bold text-base mb-1" style={{ color: "var(--text-strong)" }}>
              بطاقتك الاحترافية الذكية
            </div>
            <div className="text-xs mb-3" style={{ color: "var(--text-soft)" }}>
              {heroData.cardLinks > 0
                ? `${heroData.cardLinks} عنصر مفعَّل + رخصك ووسائل تواصلك تلقائياً`
                : "خصّص بطاقتك واسحب QR للمشاركة الفورية"}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold" style={{ color: "rgb(167,139,250)" }}>
              تحرير البطاقة <ArrowLeft size={12} />
            </div>
          </div>
        </Link>
      </div>

      {/* SMART ALERTS ROW */}
      {(hotClients.length > 0 || staleProps > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hotClients.length > 0 && (
            <Link
              href="/dashboard/clients?sentiment=hot"
              className="flex items-center gap-3 bg-gradient-to-l from-red-950/40 to-red-900/10 border border-red-500/30 rounded-xl p-4 hover:border-red-500/60 transition no-underline"
            >
              <div className="w-10 h-10 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <Flame size={20} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-red-300">
                  {hotClients.length} عميل ساخن 🔥 يحتاج متابعة
                </div>
                <div className="text-xs text-red-200/70 truncate mt-0.5">
                  {hotClients.map(c => c.name || "عميل").slice(0, 3).join(" • ")}
                  {hotClients.length > 3 && " ..."}
                </div>
              </div>
              <ArrowUpRight size={18} className="text-red-400 flex-shrink-0" />
            </Link>
          )}

          {staleProps > 0 && (
            <Link
              href="/dashboard/properties?filter=stale"
              className="flex items-center gap-3 bg-gradient-to-l from-amber-950/40 to-amber-900/10 border border-amber-500/30 rounded-xl p-4 hover:border-amber-500/60 transition no-underline"
            >
              <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-amber-300">
                  {staleProps} عقار يحتاج تحديث إتاحة
                </div>
                <div className="text-xs text-amber-200/70 truncate mt-0.5">
                  لم يتم التحقق من المالك منذ أكثر من أسبوع
                </div>
              </div>
              <ArrowUpRight size={18} className="text-amber-400 flex-shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* TOP STATS - بدون trends وهمية، أرقام حقيقية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي العقارات",      value: stats.properties,           icon: Building2,        color: "var(--gold-2)",  href: "/dashboard/properties" },
          { label: "حجم العمولات",          value: formatSAR(stats.revenue),   icon: CircleDollarSign, color: "var(--success)",  href: "/dashboard/commissions" },
          { label: "العملاء",                value: stats.clients,              icon: Users,            color: "var(--info-2)",   href: "/dashboard/clients" },
          { label: "الصفقات الجارية",        value: stats.deals,                icon: TrendingUp,       color: "var(--warning)",  href: "/dashboard/deals" },
        ].map((kpi, i) => (
          <Link
            key={i}
            href={kpi.href}
            className="bg-[var(--bg-surface-2)] border border-[var(--border-2)] rounded-2xl p-5 hover:border-[var(--gold-bg-strong)] transition-colors no-underline block"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
              <ArrowUpRight size={14} style={{ color: "var(--text-faint)" }} />
            </div>
            <h4 className="text-3xl font-cairo font-bold text-[var(--text-strong)] mb-1">{kpi.value}</h4>
            <span className="text-sm text-[var(--text-soft)]">{kpi.label}</span>
          </Link>
        ))}
      </div>

      {/* MIDDLE SECTION: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-[var(--bg-surface-2)] border border-[var(--border-2)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-cairo font-bold text-[var(--text-strong)] text-lg">التدفق المالي (٦ أشهر)</h3>
          </div>
          {revenueData.every(d => d.buy === 0 && d.rent === 0) ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-center">
              <CircleDollarSign size={36} style={{ color:"var(--text-faint)", marginBottom:8 }} />
              <p className="text-sm" style={{ color:"var(--text-soft)" }}>لا توجد عمولات مسجّلة في آخر ٦ أشهر</p>
              <Link href="/dashboard/deals" className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold no-underline" style={{ background:"var(--gold-bg-hover)", color:"var(--gold-2)", border:"1px solid var(--gold-bg-strong)" }}>
                إنشاء صفقة جديدة
              </Link>
            </div>
          ) : (
          <div className="h-[280px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--info-2)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--info-2)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272F" vertical={false} />
                <XAxis dataKey="name" stroke="#6A6A72" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6A6A72" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--sidebar-bg)', border: '1px solid #27272F', borderRadius: '12px' }}
                  itemStyle={{ fontSize: 13 }} labelStyle={{ color: 'var(--text-soft)', marginBottom: 4 }}
                />
                {(viewType === "all" || viewType === "buy") && (
                  <Area type="monotone" dataKey="buy" name="مبيعات" stroke="var(--info-2)" strokeWidth={3} fillOpacity={1} fill="url(#colorBuy)" />
                )}
                {(viewType === "all" || viewType === "rent") && (
                  <Area type="monotone" dataKey="rent" name="إيجارات" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorRent)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>

        {/* PROPERTY STATUS PIE */}
        <div className="bg-[var(--bg-surface-2)] border border-[var(--border-2)] rounded-2xl p-5 flex flex-col">
          <h3 className="font-cairo font-bold text-[var(--text-strong)] text-lg mb-2">حالة المحفظة العقارية</h3>
          {propertyStatusData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 min-h-[280px]">
              <Building2 size={36} style={{ color:"var(--text-faint)", marginBottom:8 }} />
              <p className="text-sm" style={{ color:"var(--text-soft)" }}>لا توجد عقارات بعد</p>
              <Link href="/dashboard/properties" className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold no-underline" style={{ background:"var(--gold-bg-hover)", color:"var(--gold-2)", border:"1px solid var(--gold-bg-strong)" }}>
                إضافة عقار
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center relative min-h-[220px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={propertyStatusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {propertyStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--sidebar-bg)', border: '1px solid var(--border-2)', borderRadius: '12px' }}
                      itemStyle={{ fontSize: 13, color: 'var(--text-strong)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-[var(--text-strong)]">{stats.properties}</span>
                  <span className="text-xs text-[var(--text-soft)]">عقار إجمالي</span>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {propertyStatusData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[var(--text-secondary)]">{item.name}</span>
                    </div>
                    <span className="font-bold text-[var(--text-strong)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: SUBSCRIPTIONS & PIPELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PIPELINE */}
        <div className="bg-[var(--bg-surface-2)] border border-[var(--border-2)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-cairo font-bold text-[var(--text-strong)] text-lg flex items-center gap-2">
              <Target size={18} className="text-[var(--gold-2)]" /> مسار الصفقات (Pipeline)
            </h3>
            <Link href="/dashboard/deals" className="text-xs text-[var(--gold-2)] hover:underline">عرض الكل</Link>
          </div>
          {dealPipelineData.every(d => d.count === 0) ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Target size={32} style={{ color:"var(--text-faint)", marginBottom:8 }} />
              <p className="text-sm" style={{ color:"var(--text-soft)" }}>لا توجد صفقات نشطة</p>
              <Link href="/dashboard/deals" className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold no-underline" style={{ background:"var(--gold-bg-hover)", color:"var(--gold-2)", border:"1px solid var(--gold-bg-strong)" }}>
                إنشاء صفقة
              </Link>
            </div>
          ) : (
          <div className="space-y-5">
            {dealPipelineData.map((stage, idx) => {
              const max = Math.max(...dealPipelineData.map(d => d.count), 1);
              const pct = (stage.count / max) * 100;
              const isLast = idx === dealPipelineData.length - 1;
              return (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">{stage.stage}</span>
                    <span className="text-sm font-bold text-[var(--text-strong)]">{stage.count} صفقة</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--bg-page)] rounded-full overflow-hidden border border-[var(--border-2)]">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: isLast ? 'linear-gradient(90deg, rgba(74,222,128,0.5), var(--success))' : 'linear-gradient(90deg, rgba(198,145,76,0.5), var(--gold-2))'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* SUBSCRIPTIONS ALERTS */}
        <div className="bg-[var(--bg-surface-2)] border border-[#27272F] rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-cairo font-bold text-[var(--text-strong)] text-lg flex items-center gap-2">
              <BellRing size={18} className="text-[var(--danger)]" /> تنبيهات الاشتراكات
            </h3>
            <Link href="/dashboard/external-subscriptions" className="text-xs text-[var(--gold-2)] hover:underline">إدارة الكل</Link>
          </div>
          
          <div className="space-y-3 flex-1">
            {subs && subs.length > 0 ? subs.map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-page)] border border-[#27272F]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--gold-bg)] flex items-center justify-center text-[var(--gold-2)]">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-strong)]">{sub.platform_name || "منصة إعلانية"}</h4>
                    <p className="text-xs text-[var(--text-soft)]">انتهاء: {new Date(sub.end_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold px-2 py-1 bg-[rgba(248,113,113,0.1)] text-[var(--danger)] rounded-lg">
                    يجب التجديد
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#6A6A72] py-6">
                <CheckCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">جميع الاشتراكات سارية ولا توجد تنبيهات قريبة</p>
                <Link href="/dashboard/external-subscriptions" className="mt-3 px-4 py-1.5 rounded-lg border border-[#27272F] text-xs hover:bg-[var(--bg-surface-2)]">
                  إضافة اشتراك جديد
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
