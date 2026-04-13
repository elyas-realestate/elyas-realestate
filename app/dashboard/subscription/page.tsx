"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { Check, X, Zap, Crown, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";


// ══ تعريف الخطط ══════════════════════════════════════════
const PLANS = [
  {
    id: "free",
    name: "مجاني",
    price: 0,
    period: "",
    icon: Gift,
    color: "#9A9AA0",
    desc: "للبدء وتجربة المنصة",
    limits: { properties: 5, clients: 10, ai_requests: 0, documents: false },
    features: [
      { label: "٥ عقارات",               included: true  },
      { label: "١٠ عملاء",               included: true  },
      { label: "إدارة الصفقات والمهام",   included: true  },
      { label: "صفحة هبوط خاصة",         included: true  },
      { label: "وكيل المحتوى الذكي",      included: false },
      { label: "الوثائق القانونية",       included: false },
      { label: "التحليل المالي",          included: false },
      { label: "غرفة المحتوى (٣ نماذج)", included: false },
    ],
  },
  {
    id: "basic",
    name: "أساسي",
    price: 99,
    period: "شهرياً",
    icon: Zap,
    color: "#C6914C",
    desc: "للوسيط النشط",
    badge: "الأكثر طلباً",
    limits: { properties: 50, clients: -1, ai_requests: 50, documents: true },
    features: [
      { label: "٥٠ عقاراً",               included: true  },
      { label: "عملاء غير محدودين",        included: true  },
      { label: "إدارة الصفقات والمهام",    included: true  },
      { label: "صفحة هبوط خاصة",          included: true  },
      { label: "وكيل المحتوى (٥٠ طلب/شهر)", included: true },
      { label: "الوثائق القانونية",        included: true  },
      { label: "التحليل المالي",           included: true  },
      { label: "غرفة المحتوى (٣ نماذج)",  included: false },
    ],
  },
  {
    id: "pro",
    name: "احترافي",
    price: 249,
    period: "شهرياً",
    icon: Crown,
    color: "#E8B86D",
    desc: "بدون قيود للمحترف",
    limits: { properties: -1, clients: -1, ai_requests: -1, documents: true },
    features: [
      { label: "عقارات غير محدودة",        included: true },
      { label: "عملاء غير محدودين",        included: true },
      { label: "إدارة الصفقات والمهام",    included: true },
      { label: "صفحة هبوط خاصة",          included: true },
      { label: "وكيل المحتوى (غير محدود)", included: true },
      { label: "الوثائق القانونية",        included: true },
      { label: "التحليل المالي",           included: true },
      { label: "غرفة المحتوى (٣ نماذج)",  included: true },
    ],
  },
];

type UsageData = {
  properties: number;
  clients: number;
  ai_requests: number;
  documents: number;
};

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [settingsId, setSettingsId]   = useState<string | null>(null);
  const [usage, setUsage]             = useState<UsageData>({ properties: 0, clients: 0, ai_requests: 0, documents: 0 });
  const [loading, setLoading]         = useState(true);
  const [upgrading, setUpgrading]     = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [settingsRes, propsRes, clientsRes, aiRes, docsRes] = await Promise.all([
      supabase.from("site_settings").select("*").limit(1).single(),
      supabase.from("properties").select("id", { count: "exact", head: true }),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("content").select("id", { count: "exact", head: true }),
      supabase.from("legal_documents").select("id", { count: "exact", head: true }),
    ]);

    if (settingsRes.data) {
      // إذا عمود plan موجود ولديه قيمة — استخدمه
      const plan = settingsRes.data.plan;
      if (plan) {
        setCurrentPlan(plan);
      } else {
        // عمود plan غير موجود أو فارغ — حاول تعيينه كـ pro (كمالك)
        const { error: updateErr } = await supabase
          .from("site_settings")
          .update({ plan: "pro" })
          .eq("id", settingsRes.data.id);
        
        if (!updateErr) {
          setCurrentPlan("pro");
        } else {
          // عمود plan غير موجود في الجدول — أظهر pro مؤقتاً
          console.warn("عمود plan غير موجود في site_settings — يجب إضافته:", updateErr.message);
          setCurrentPlan("pro");
        }
      }
      setSettingsId(settingsRes.data.id);
    } else {
      // لا يوجد سجل site_settings أصلاً — المالك يحصل على pro
      console.warn("لا يوجد سجل site_settings:", settingsRes.error?.message);
      setCurrentPlan("pro");
    }

    setUsage({
      properties: propsRes.count || 0,
      clients:    clientsRes.count || 0,
      ai_requests: aiRes.count || 0,
      documents:  docsRes.count || 0,
    });
    setLoading(false);
  }

  async function handleUpgrade(planId: string) {
    if (planId === currentPlan) return;
    if (!settingsId) { toast.error("خطأ في الإعدادات"); return; }

    setUpgrading(planId);
    const { error } = await supabase
      .from("site_settings")
      .update({ plan: planId })
      .eq("id", settingsId);

    if (error) {
      // عمود plan غير موجود — أخبر المستخدم
      toast.error("يجب إضافة عمود plan في جدول site_settings في Supabase");
    } else {
      setCurrentPlan(planId);
      const planName = PLANS.find(p => p.id === planId)?.name || planId;
      toast.success(`تم الترقية للخطة ${planName} ✓`);
    }
    setUpgrading(null);
  }

  const activePlan = PLANS.find(p => p.id === currentPlan) || PLANS[0];

  if (loading) return (
    <div dir="rtl" className="p-4 space-y-4">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="skeleton rounded-xl h-80" />)}
      </div>
    </div>
  );

  return (
    <div dir="rtl">
      {/* ── Header ── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">خطط الاشتراك</h2>
        <p style={{ color: "#9A9AA0", fontSize: 14 }}>اختر الخطة المناسبة لنشاطك العقاري</p>
      </div>

      {/* ── الخطة الحالية + الاستهلاك ── */}
      <div className="mb-8 rounded-xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.15)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${activePlan.color}18`, border: `1px solid ${activePlan.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <activePlan.icon size={20} style={{ color: activePlan.color }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#5A5A62", marginBottom: 2 }}>خطتك الحالية</p>
              <p className="font-bold" style={{ color: activePlan.color, fontSize: 18 }}>{activePlan.name}</p>
            </div>
          </div>
          {currentPlan !== "free" && (
            <span style={{ fontSize: 12, color: "#4ADE80", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 100, padding: "5px 14px" }}>نشطة ✓</span>
          )}
        </div>

        {/* شريط الاستهلاك */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "العقارات",
              used: usage.properties,
              limit: activePlan.limits.properties,
            },
            {
              label: "العملاء",
              used: usage.clients,
              limit: activePlan.limits.clients,
            },
            {
              label: "طلبات AI",
              used: usage.ai_requests,
              limit: activePlan.limits.ai_requests,
            },
            {
              label: "الوثائق",
              used: usage.documents,
              limit: -1,
            },
          ].map((item, i) => {
            const pct = item.limit <= 0 ? 100 : Math.min((item.used / item.limit) * 100, 100);
            const isUnlimited = item.limit === -1;
            const isBlocked   = item.limit === 0;
            const barColor = isBlocked ? "#3A3A42" : pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#4ADE80";
            return (
              <div key={i} className="rounded-lg p-3" style={{ background: "#1C1C22" }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontSize: 12, color: "#9A9AA0" }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: isBlocked ? "#3A3A42" : "#F5F5F5", fontWeight: 600 }}>
                    {isBlocked ? "—" : isUnlimited ? `${item.used}` : `${item.used}/${item.limit}`}
                  </span>
                </div>
                <div style={{ height: 4, background: "#2A2A32", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${isBlocked ? 0 : pct}%`, height: "100%", background: barColor, borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
                <p style={{ fontSize: 10, color: "#5A5A62", marginTop: 4 }}>
                  {isBlocked ? "غير متاح في خطتك" : isUnlimited ? "غير محدود" : `${Math.round(pct)}% مستخدم`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── بطاقات الخطط ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {PLANS.map(plan => {
          const isCurrent  = plan.id === currentPlan;
          const isUpgrading = upgrading === plan.id;
          const PlanIcon   = plan.icon;

          return (
            <div
              key={plan.id}
              className="rounded-xl p-6 flex flex-col"
              style={{
                background: "#16161A",
                border: isCurrent ? `1px solid ${plan.color}50` : "1px solid rgba(198,145,76,0.12)",
                position: "relative",
                boxShadow: isCurrent ? `0 0 32px ${plan.color}10` : "none",
              }}
            >
              {/* Badge */}
              {"badge" in plan && plan.badge && (
                <div style={{ position: "absolute", top: -12, right: 20, fontSize: 11, fontWeight: 700, color: "#0A0A0C", background: "linear-gradient(135deg, #C6914C, #A6743A)", padding: "4px 12px", borderRadius: 100 }}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div style={{ position: "absolute", top: -12, left: 20, fontSize: 11, fontWeight: 700, color: plan.color, background: `${plan.color}15`, border: `1px solid ${plan.color}30`, padding: "4px 12px", borderRadius: 100 }}>
                  خطتك الحالية
                </div>
              )}

              {/* أيقونة واسم */}
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 44, height: 44, borderRadius: 11, background: `${plan.color}12`, border: `1px solid ${plan.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <PlanIcon size={20} style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="font-bold" style={{ fontSize: 17, color: "#F5F5F5" }}>{plan.name}</h3>
                  <p style={{ fontSize: 12, color: "#5A5A62" }}>{plan.desc}</p>
                </div>
              </div>

              {/* السعر */}
              <div className="mb-5 pb-5" style={{ borderBottom: "1px solid rgba(198,145,76,0.1)" }}>
                {plan.price === 0 ? (
                  <span className="font-bold" style={{ fontSize: 26, color: "#F5F5F5" }}>مجاناً</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="font-bold" style={{ fontSize: 28, color: plan.color }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: "#5A5A62", marginBottom: 4 }}>ريال / شهر</span>
                  </div>
                )}
              </div>

              {/* المميزات */}
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2" style={{ fontSize: 13 }}>
                    {feat.included ? (
                      <Check size={14} style={{ color: "#4ADE80", flexShrink: 0 }} />
                    ) : (
                      <X size={14} style={{ color: "#3A3A42", flexShrink: 0 }} />
                    )}
                    <span style={{ color: feat.included ? "#D4D4D8" : "#3A3A42", textDecoration: feat.included ? "none" : "line-through" }}>
                      {feat.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* زر الترقية */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || isUpgrading !== null}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isCurrent || isUpgrading !== null ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  border: "none",
                  fontFamily: "'Tajawal', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background: isCurrent
                    ? `${plan.color}15`
                    : plan.id === "basic"
                    ? "linear-gradient(135deg, #C6914C, #A6743A)"
                    : plan.id === "pro"
                    ? "linear-gradient(135deg, #E8B86D, #C6914C)"
                    : "#1C1C22",
                  color: isCurrent ? plan.color : plan.id === "free" ? "#9A9AA0" : "#0A0A0C",
                  opacity: isUpgrading !== null && !isUpgrading ? 0.5 : 1,
                }}
              >
                {isUpgrading ? (
                  <><Loader2 size={15} className="animate-spin" /> جاري الترقية...</>
                ) : isCurrent ? (
                  <><Check size={15} /> خطتك الحالية</>
                ) : plan.id === "free" ? (
                  "الرجوع للمجاني"
                ) : (
                  `الترقية للـ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── ملاحظة ── */}
      <div className="rounded-xl p-4" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.1)" }}>
        <p style={{ fontSize: 13, color: "#5A5A62", lineHeight: 1.7 }}>
          <span style={{ color: "#C6914C", fontWeight: 600 }}>ملاحظة:</span>{" "}
          الدفع الإلكتروني قيد التطوير — يمكنك تغيير الخطة الآن وسيتم تفعيل بوابة الدفع قريباً.
          للترقية الفورية تواصل معنا عبر واتساب.
        </p>
      </div>
    </div>
  );
}
