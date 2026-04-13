"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import {
  Building2, Users, TrendingUp, FileText, CheckSquare, Megaphone,
  Scale, BarChart3, RefreshCw, Crown, Zap, Gift, AlertCircle, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";


const PLANS = [
  { id: "free",  name: "مجاني",     icon: Gift,  color: "#71717A" },
  { id: "basic", name: "أساسي",     icon: Zap,   color: "#C6914C" },
  { id: "pro",   name: "احترافي",   icon: Crown, color: "#E8B86D" },
];

type Stats = {
  properties: number;
  clients: number;
  deals: number;
  requests: number;
  tasks: number;
  content: number;
  documents: number;
  financial: number;
};

type Settings = {
  id: string;
  plan: string;
  broker_name: string;
  updated_at: string;
};

const STAT_CARDS = [
  { key: "properties", label: "العقارات",      icon: Building2,  color: "#C6914C" },
  { key: "clients",    label: "العملاء",       icon: Users,      color: "#3B82F6" },
  { key: "deals",      label: "الصفقات",       icon: TrendingUp, color: "#10B981" },
  { key: "requests",   label: "الطلبات",       icon: FileText,   color: "#8B5CF6" },
  { key: "tasks",      label: "المهام",        icon: CheckSquare,color: "#F59E0B" },
  { key: "content",    label: "المحتوى",       icon: Megaphone,  color: "#EC4899" },
  { key: "documents",  label: "الوثائق القانونية", icon: Scale,  color: "#06B6D4" },
  { key: "financial",  label: "تحليلات مالية", icon: BarChart3,  color: "#14B8A6" },
];

export default function AdminPage() {
  const [stats, setStats]         = useState<Stats | null>(null);
  const [settings, setSettings]   = useState<Settings | null>(null);
  const [loading, setLoading]     = useState(true);
  const [planOpen, setPlanOpen]   = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [
      propsRes, clientsRes, dealsRes, reqRes,
      tasksRes, contentRes, docsRes, finRes, settingsRes,
    ] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase.from("requests").select("id", { count: "exact", head: true }),
      supabase.from("tasks").select("id", { count: "exact", head: true }),
      supabase.from("content").select("id", { count: "exact", head: true }),
      supabase.from("legal_documents").select("id", { count: "exact", head: true }),
      supabase.from("financial_analyses").select("id", { count: "exact", head: true }),
      supabase.from("site_settings").select("id, plan, broker_name, updated_at").limit(1).single(),
    ]);

    setStats({
      properties: propsRes.count || 0,
      clients:    clientsRes.count || 0,
      deals:      dealsRes.count || 0,
      requests:   reqRes.count || 0,
      tasks:      tasksRes.count || 0,
      content:    contentRes.count || 0,
      documents:  docsRes.count || 0,
      financial:  finRes.count || 0,
    });

    if (settingsRes.data) setSettings(settingsRes.data);
    setLoading(false);
  }

  async function changePlan(planId: string) {
    if (!settings?.id) return;
    setChangingPlan(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ plan: planId })
      .eq("id", settings.id);

    if (error) {
      toast.error("فشل تغيير الخطة — تأكد من وجود عمود plan في site_settings");
    } else {
      setSettings(prev => prev ? { ...prev, plan: planId } : prev);
      const planName = PLANS.find(p => p.id === planId)?.name || planId;
      toast.success(`تم تغيير الخطة إلى ${planName}`);
    }
    setChangingPlan(false);
    setPlanOpen(false);
  }

  const activePlan = PLANS.find(p => p.id === (settings?.plan || "free")) || PLANS[0];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>نظرة عامة</h1>
          <p style={{ fontSize: 13, color: "#52525B" }}>إحصائيات المنصة وإدارة الاشتراك</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#A78BFA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {STAT_CARDS.map(card => {
          const value = stats ? stats[card.key as keyof Stats] : 0;
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${card.color}14`, border: `1px solid ${card.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={17} style={{ color: card.color }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#F4F4F5", lineHeight: 1 }}>
                  {loading ? <span style={{ display: "inline-block", width: 40, height: 24, background: "#1C1C1E", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} /> : value}
                </div>
                <div style={{ fontSize: 12, color: "#52525B", marginTop: 5 }}>{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* ── Two Columns ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* ── الاشتراك الحالي ── */}
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA", marginBottom: 16 }}>الاشتراك الحالي</h2>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${activePlan.color}14`, border: `1px solid ${activePlan.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <activePlan.icon size={20} style={{ color: activePlan.color }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: activePlan.color }}>{activePlan.name}</div>
              <div style={{ fontSize: 11, color: "#52525B" }}>
                {settings ? `آخر تحديث: ${new Date(settings.updated_at).toLocaleDateString("ar-SA")}` : "—"}
              </div>
            </div>
          </div>

          {/* Plan Switcher */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setPlanOpen(v => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 9, background: "#18181B", border: "1px solid rgba(124,58,237,0.2)", color: "#A78BFA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}
            >
              <span>تغيير الخطة يدوياً</span>
              <ChevronDown size={15} style={{ transition: "transform 0.2s", transform: planOpen ? "rotate(180deg)" : "rotate(0)" }} />
            </button>

            {planOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, left: 0, background: "#18181B", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, zIndex: 50, overflow: "hidden" }}>
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => changePlan(plan.id)}
                    disabled={changingPlan || plan.id === settings?.plan}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                      background: plan.id === settings?.plan ? `${plan.color}0A` : "transparent",
                      border: "none", color: plan.id === settings?.plan ? plan.color : "#A1A1AA",
                      fontSize: 13, cursor: plan.id === settings?.plan ? "default" : "pointer",
                      fontFamily: "'Tajawal', sans-serif", textAlign: "right",
                      opacity: changingPlan ? 0.6 : 1,
                    }}
                  >
                    <plan.icon size={15} style={{ color: plan.color, flexShrink: 0 }} />
                    <span>{plan.name}</span>
                    {plan.id === settings?.plan && <span style={{ marginRight: "auto", fontSize: 10, color: plan.color }}>الحالية</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── الوسيط ── */}
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA", marginBottom: 16 }}>معلومات الوسيط</h2>

          {settings ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Row label="الاسم"     value={settings.broker_name || "—"} />
              <Row label="ID الإعدادات" value={settings.id.slice(0, 8) + "..."} mono />
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "#52525B" }}>لا توجد بيانات</p>
          )}

          <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 9, background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.12)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertCircle size={14} style={{ color: "#CA8A04", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#A16207", lineHeight: 1.6 }}>
                المستخدمون المتعددون سيظهرون هنا بعد إضافة جدول <span style={{ fontFamily: "monospace", background: "rgba(234,179,8,0.1)", padding: "1px 5px", borderRadius: 3 }}>tenants</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── المستخدمون (Placeholder) ── */}
      <div style={{ marginTop: 16, background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA" }}>المستخدمون المسجّلون</h2>
          <span style={{ fontSize: 11, color: "#52525B", background: "#18181B", border: "1px solid #27272A", borderRadius: 100, padding: "3px 10px" }}>قريباً</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} style={{ color: "#7C3AED", opacity: 0.5 }} />
          </div>
          <p style={{ fontSize: 13, color: "#52525B", textAlign: "center", lineHeight: 1.7, maxWidth: 360 }}>
            قائمة المستخدمين المسجّلين ستظهر هنا عند إضافة{" "}
            <span style={{ fontFamily: "monospace", background: "rgba(124,58,237,0.06)", padding: "1px 6px", borderRadius: 4, color: "#A78BFA" }}>SUPABASE_SERVICE_ROLE_KEY</span>{" "}
            في متغيرات البيئة وتفعيل جدول tenants.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: 12, color: "#52525B" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#D4D4D8", fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
    </div>
  );
}
