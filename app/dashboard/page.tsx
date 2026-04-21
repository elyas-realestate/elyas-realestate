"use client";

import { formatSAR } from "@/lib/format";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, Users, TrendingUp, ArrowUpRight, ArrowDownRight,
  CheckCircle, Sparkles, Brain, BellRing, Target, CircleDollarSign,
  CreditCard, Flame, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

// --- Mock Data for Charts ---
const revenueData = [
  { name: "يناير", buy: 150000, rent: 45000 },
  { name: "فبراير", buy: 230000, rent: 52000 },
  { name: "مارس", buy: 180000, rent: 48000 },
  { name: "أبريل", buy: 320000, rent: 61000 },
  { name: "مايو", buy: 290000, rent: 55000 },
  { name: "يونيو", buy: 410000, rent: 70000 },
];

const propertyStatusData = [
  { name: "متاح", value: 45, color: "#4ADE80" },
  { name: "قيد التفاوض", value: 12, color: "#FACC15" },
  { name: "مباع/مؤجر", value: 89, color: "#38BDF8" },
];

const dealPipelineData = [
  { stage: "تواصل أولي", count: 24 },
  { stage: "عرض العقار", count: 15 },
  { stage: "تفاوض", count: 8 },
  { stage: "إتمام", count: 5 },
];

export default function DashboardPage() {
  const [viewType, setViewType] = useState<"all" | "buy" | "rent">("all");
  const [stats, setStats] = useState({
    properties: 0,
    clients: 0,
    deals: 0,
    revenue: 0,
  });
  const [subs, setSubs] = useState<any[]>([]);
  const [hotClients, setHotClients] = useState<{ id: string; name: string | null }[]>([]);
  const [staleProps, setStaleProps] = useState(0);

  useEffect(() => {
    fetchData();
  }, [viewType]);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [propRes, clientRes, dealRes, subRes, hotRes, staleRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact" }),
        supabase.from("clients").select("id", { count: "exact" }),
        supabase.from("deals").select("id", { count: "exact" }),
        supabase.from("external_subscriptions").select("*").eq("tenant_id", user.id).limit(3),
        supabase.from("clients").select("id, name").eq("sentiment", "hot").limit(5),
        supabase.from("properties").select("id", { count: "exact", head: true })
          .or(`last_availability_check.is.null,last_availability_check.lt.${weekAgo}`),
      ]);

      setStats({
        properties: propRes.count || 146,
        clients: clientRes.count || 892,
        deals: dealRes.count || 42,
        revenue: 1250400,
      });

      if (subRes.data) setSubs(subRes.data);
      if (hotRes.data) setHotClients(hotRes.data);
      setStaleProps(staleRes.count || 0);

    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* HEADER & TOGGLES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-[#F5F5F5]">نظرة عامة</h1>
          <p className="text-sm text-[#9A9AA0] mt-1">المركز المالي والتشغيلي لمنصتك العقارية</p>
        </div>
        
        <div className="bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl p-1 flex items-center">
          <button 
            onClick={() => setViewType("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${viewType === "all" ? "bg-[#C6914C] text-[#0A0A0C]" : "text-[#9A9AA0] hover:text-[#F5F5F5]"}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setViewType("buy")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${viewType === "buy" ? "bg-[#38BDF8] text-[#0A0A0C]" : "text-[#9A9AA0] hover:text-[#F5F5F5]"}`}
          >
            بيع
          </button>
          <button 
            onClick={() => setViewType("rent")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${viewType === "rent" ? "bg-[#4ADE80] text-[#0A0A0C]" : "text-[#9A9AA0] hover:text-[#F5F5F5]"}`}
          >
            إيجار
          </button>
        </div>
      </div>

      {/* AI COPILOT INSIGHTS */}
      <div className="bg-gradient-to-l from-[rgba(198,145,76,0.15)] to-[rgba(198,145,76,0.02)] border border-[rgba(198,145,76,0.25)] rounded-2xl p-5 flex items-start gap-4 shadow-lg shadow-[rgba(198,145,76,0.05)] relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-[#C6914C] opacity-10 rounded-full blur-3xl"></div>
        <div className="bg-[#0A0A0C] p-3 rounded-xl border border-[rgba(198,145,76,0.3)] shadow-[0_0_15px_rgba(198,145,76,0.2)]">
          <Brain size={24} className="text-[#C6914C]" />
        </div>
        <div className="flex-1 relative z-10">
          <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2 mb-1">
            مستشار الذكاء الاصطناعي <Sparkles size={14} className="text-[#C6914C]" />
          </h3>
          <p className="text-sm text-[#D4D4D8] leading-relaxed">
            صباح الخير! هناك <strong className="text-[#38BDF8]">3 صفقات</strong> إيجار جاهزة للإغلاق اليوم في حي النرجس. 
            {subs.length > 0 && <span> كما أن لديك اشتراكات قريبة الانتهاء، لا تنسَ مراجعتها.</span>}
          </p>
        </div>
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

      {/* TOP STATS - BENTO GRID START */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي العقارات", value: stats.properties, icon: Building2, color: "#C6914C", trend: "+12%" },
          { label: "حجم المبيعات المؤكدة", value: formatSAR(stats.revenue), icon: CircleDollarSign, color: "#4ADE80", trend: "+8.4%" },
          { label: "العملاء النشطين", value: stats.clients, icon: Users, color: "#38BDF8", trend: "+24%" },
          { label: "الصفقات الجارية", value: stats.deals, icon: TrendingUp, color: "#FACC15", trend: "-2.1%" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#1C1C22] border border-[#27272F] rounded-2xl p-5 hover:border-[rgba(198,145,76,0.3)] transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${kpi.trend.startsWith('+') ? 'text-[#4ADE80] bg-[#4ADE80]10' : 'text-[#F87171] bg-[#F87171]10'}`}>
                {kpi.trend.startsWith('+') ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                {kpi.trend}
              </span>
            </div>
            <h4 className="text-3xl font-cairo font-bold text-[#F5F5F5] mb-1">{kpi.value}</h4>
            <span className="text-sm text-[#9A9AA0]">{kpi.label}</span>
          </div>
        ))}
      </div>

      {/* MIDDLE SECTION: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-[#1C1C22] border border-[#27272F] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-cairo font-bold text-[#F5F5F5] text-lg">التدفق المالي (بيع / إيجار)</h3>
          </div>
          <div className="h-[280px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272F" vertical={false} />
                <XAxis dataKey="name" stroke="#6A6A72" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6A6A72" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D0D10', border: '1px solid #27272F', borderRadius: '12px' }}
                  itemStyle={{ fontSize: 13 }} labelStyle={{ color: '#9A9AA0', marginBottom: 4 }}
                />
                {(viewType === "all" || viewType === "buy") && (
                  <Area type="monotone" dataKey="buy" name="مبيعات" stroke="#38BDF8" strokeWidth={3} fillOpacity={1} fill="url(#colorBuy)" />
                )}
                {(viewType === "all" || viewType === "rent") && (
                  <Area type="monotone" dataKey="rent" name="إيجارات" stroke="#4ADE80" strokeWidth={3} fillOpacity={1} fill="url(#colorRent)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROPERTY STATUS PIE */}
        <div className="bg-[#1C1C22] border border-[#27272F] rounded-2xl p-5 flex flex-col">
          <h3 className="font-cairo font-bold text-[#F5F5F5] text-lg mb-2">حالة المحفظة العقارية</h3>
          <div className="flex-1 flex items-center justify-center relative min-h-[220px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={propertyStatusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {propertyStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D0D10', border: '1px solid #27272F', borderRadius: '12px' }}
                  itemStyle={{ fontSize: 13, color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-[#F5F5F5]">{stats.properties || 146}</span>
              <span className="text-xs text-[#9A9AA0]">عقار إجمالي</span>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {propertyStatusData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[#D4D4D8]">{item.name}</span>
                </div>
                <span className="font-bold text-[#F5F5F5]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: SUBSCRIPTIONS & PIPELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PIPELINE */}
        <div className="bg-[#1C1C22] border border-[#27272F] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-cairo font-bold text-[#F5F5F5] text-lg flex items-center gap-2">
              <Target size={18} className="text-[#C6914C]" /> مسار الصفقات (Pipeline)
            </h3>
            <Link href="/dashboard/deals" className="text-xs text-[#C6914C] hover:underline">عرض الكل</Link>
          </div>
          <div className="space-y-5">
            {dealPipelineData.map((stage, idx) => {
              const max = Math.max(...dealPipelineData.map(d => d.count));
              const pct = (stage.count / max) * 100;
              const isLast = idx === dealPipelineData.length - 1;
              return (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#D4D4D8]">{stage.stage}</span>
                    <span className="text-sm font-bold text-[#F5F5F5]">{stage.count} صفقات</span>
                  </div>
                  <div className="h-2 w-full bg-[#0A0A0C] rounded-full overflow-hidden border border-[#27272F]">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${pct}%`, 
                        background: isLast ? 'linear-gradient(90deg, rgba(74,222,128,0.5), #4ADE80)' : 'linear-gradient(90deg, rgba(198,145,76,0.5), #C6914C)' 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUBSCRIPTIONS ALERTS */}
        <div className="bg-[#1C1C22] border border-[#27272F] rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-cairo font-bold text-[#F5F5F5] text-lg flex items-center gap-2">
              <BellRing size={18} className="text-[#F87171]" /> تنبيهات الاشتراكات
            </h3>
            <Link href="/dashboard/external-subscriptions" className="text-xs text-[#C6914C] hover:underline">إدارة الكل</Link>
          </div>
          
          <div className="space-y-3 flex-1">
            {subs && subs.length > 0 ? subs.map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0C] border border-[#27272F]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(198,145,76,0.1)] flex items-center justify-center text-[#C6914C]">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F5F5]">{sub.platform_name || "منصة إعلانية"}</h4>
                    <p className="text-xs text-[#9A9AA0]">انتهاء: {new Date(sub.end_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold px-2 py-1 bg-[rgba(248,113,113,0.1)] text-[#F87171] rounded-lg">
                    يجب التجديد
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#6A6A72] py-6">
                <CheckCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">جميع الاشتراكات سارية ولا توجد تنبيهات قريبة</p>
                <Link href="/dashboard/external-subscriptions" className="mt-3 px-4 py-1.5 rounded-lg border border-[#27272F] text-xs hover:bg-[#1C1C22]">
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
