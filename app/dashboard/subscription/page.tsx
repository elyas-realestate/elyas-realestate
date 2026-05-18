"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { Check, X, Zap, Crown, Gift, Loader2, CreditCard, Lock } from "lucide-react";
import { PLAN_PRICES } from "@/lib/moyasar";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// ══ تعريف الخطط ══════════════════════════════════════════
const PLANS = [
  {
    id: "free",
    name: "مجاني",
    price: 0,
    period: "",
    icon: Gift,
    color: "var(--text-soft)",
    desc: "للبدء وتجربة المنصة",
    limits: { properties: 5, clients: 10, ai_requests: 0, documents: false },
    features: [
      { label: "٥ عقارات", included: true },
      { label: "١٠ عملاء", included: true },
      { label: "إدارة الصفقات والمهام", included: true },
      { label: "صفحة هبوط خاصة", included: true },
      { label: "وكيل المحتوى الذكي", included: false },
      { label: "الوثائق القانونية", included: false },
      { label: "التحليل المالي", included: false },
      { label: "غرفة المحتوى (٣ نماذج)", included: false },
    ],
  },
  {
    id: "basic",
    name: "أساسي",
    price: 99,
    period: "شهرياً",
    icon: Zap,
    color: "var(--gold-2)",
    desc: "للوسيط النشط",
    badge: "الأكثر طلباً",
    limits: { properties: 50, clients: -1, ai_requests: 50, documents: true },
    features: [
      { label: "٥٠ عقاراً", included: true },
      { label: "عملاء غير محدودين", included: true },
      { label: "إدارة الصفقات والمهام", included: true },
      { label: "صفحة هبوط خاصة", included: true },
      { label: "وكيل المحتوى (٥٠ طلب/شهر)", included: true },
      { label: "الوثائق القانونية", included: true },
      { label: "التحليل المالي", included: true },
      { label: "غرفة المحتوى (٣ نماذج)", included: false },
    ],
  },
  {
    id: "pro",
    name: "احترافي",
    price: 249,
    period: "شهرياً",
    icon: Crown,
    color: "var(--gold-1)",
    desc: "بدون قيود للمحترف",
    limits: { properties: -1, clients: -1, ai_requests: -1, documents: true },
    features: [
      { label: "عقارات غير محدودة", included: true },
      { label: "عملاء غير محدودين", included: true },
      { label: "إدارة الصفقات والمهام", included: true },
      { label: "صفحة هبوط خاصة", included: true },
      { label: "وكيل المحتوى (غير محدود)", included: true },
      { label: "الوثائق القانونية", included: true },
      { label: "التحليل المالي", included: true },
      { label: "غرفة المحتوى (٣ نماذج)", included: true },
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
  const [, setSettingsId] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData>({
    properties: 0,
    clients: 0,
    ai_requests: 0,
    documents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Payment modal
  const [payModal, setPayModal] = useState<{ plan: string; billing: "monthly" | "yearly" } | null>(
    null
  );
  const [payForm, setPayForm] = useState({
    card_name: "",
    card_number: "",
    card_cvc: "",
    card_month: "",
    card_year: "",
  });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          logger.warn("[subscription] missing 'plan' column in site_settings", {
            error: updateErr.message,
          });
          setCurrentPlan("pro");
        }
      }
      setSettingsId(settingsRes.data.id);
    } else {
      // لا يوجد سجل site_settings أصلاً — المالك يحصل على pro
      logger.warn("[subscription] no site_settings row", {
        error: settingsRes.error?.message ?? null,
      });
      setCurrentPlan("pro");
    }

    setUsage({
      properties: propsRes.count || 0,
      clients: clientsRes.count || 0,
      ai_requests: aiRes.count || 0,
      documents: docsRes.count || 0,
    });
    setLoading(false);
  }

  async function handleUpgrade(planId: string) {
    if (planId === currentPlan) return;
    if (planId === "free") {
      setUpgrading(planId);
      const res = await fetch("/api/subscription/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "free" }),
      });
      if (res.ok) {
        setCurrentPlan(planId);
        toast.success("تم التحويل للخطة المجانية");
      } else {
        const d = await res.json();
        toast.error(d.error || "فشل تغيير الخطة");
      }
      setUpgrading(null);
      return;
    }
    setPayModal({ plan: planId, billing: "monthly" });
  }

  async function handlePay() {
    if (!payModal) return;
    const { card_name, card_number, card_cvc, card_month, card_year } = payForm;
    if (!card_name || !card_number || !card_cvc || !card_month || !card_year) {
      toast.error("أكمل بيانات البطاقة");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payModal, ...payForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الدفع");
      if (data.status === "paid" || data.status === "authorized") {
        setCurrentPlan(payModal.plan);
        toast.success(`✅ تم الدفع بنجاح! تم تفعيل خطة ${PLAN_PRICES[payModal.plan]?.label}`);
        setPayModal(null);
        setPayForm({ card_name: "", card_number: "", card_cvc: "", card_month: "", card_year: "" });
      } else {
        toast.error(`حالة الدفع: ${data.status}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطأ في الدفع");
    }
    setPaying(false);
  }

  const activePlan = PLANS.find((p) => p.id === currentPlan) || PLANS[0];

  if (loading)
    return (
      <div dir="rtl" className="space-y-4 p-4">
        <div className="skeleton mb-6 h-8 w-48 rounded" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );

  return (
    <div dir="rtl">
      {/* ── Header ── */}
      <div className="mb-8">
        <h2 className="mb-1 text-2xl font-bold">خطط الاشتراك</h2>
        <p style={{ color: "var(--text-soft)", fontSize: 14 }}>
          اختر الخطة المناسبة لنشاطك العقاري
        </p>
      </div>

      {/* ── الخطة الحالية + الاستهلاك ── */}
      <div
        className="mb-8 rounded-xl p-5"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg-hover)" }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: `${activePlan.color}18`,
                border: `1px solid ${activePlan.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <activePlan.icon size={20} style={{ color: activePlan.color }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 2 }}>
                خطتك الحالية
              </p>
              <p className="font-bold" style={{ color: activePlan.color, fontSize: 18 }}>
                {activePlan.name}
              </p>
            </div>
          </div>
          {currentPlan !== "free" && (
            <span
              style={{
                fontSize: 12,
                color: "var(--success)",
                background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 100,
                padding: "5px 14px",
              }}
            >
              نشطة ✓
            </span>
          )}
        </div>

        {/* شريط الاستهلاك */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
            const isBlocked = item.limit === 0;
            const barColor = isBlocked
              ? "var(--border-1)"
              : pct >= 90
                ? "#EF4444"
                : pct >= 70
                  ? "#F59E0B"
                  : "var(--success)";
            return (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--bg-surface-2)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <span style={{ fontSize: 12, color: "var(--text-soft)" }}>{item.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: isBlocked ? "var(--border-1)" : "var(--text-strong)",
                      fontWeight: 600,
                    }}
                  >
                    {isBlocked ? "—" : isUnlimited ? `${item.used}` : `${item.used}/${item.limit}`}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--bg-surface-3)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${isBlocked ? 0 : pct}%`,
                      height: "100%",
                      background: barColor,
                      borderRadius: 2,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <p style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>
                  {isBlocked
                    ? "غير متاح في خطتك"
                    : isUnlimited
                      ? "غير محدود"
                      : `${Math.round(pct)}% مستخدم`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── بطاقات الخطط ── */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrading = upgrading === plan.id;
          const PlanIcon = plan.icon;

          return (
            <div
              key={plan.id}
              className="flex flex-col rounded-xl p-6"
              style={{
                background: "var(--bg-surface-1)",
                border: isCurrent ? `1px solid ${plan.color}50` : "1px solid var(--gold-bg)",
                position: "relative",
                boxShadow: isCurrent ? `0 0 32px ${plan.color}10` : "none",
              }}
            >
              {/* Badge */}
              {"badge" in plan && plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--bg-page)",
                    background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
                    padding: "4px 12px",
                    borderRadius: 100,
                  }}
                >
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    color: plan.color,
                    background: `${plan.color}15`,
                    border: `1px solid ${plan.color}30`,
                    padding: "4px 12px",
                    borderRadius: 100,
                  }}
                >
                  خطتك الحالية
                </div>
              )}

              {/* أيقونة واسم */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 11,
                    background: `${plan.color}12`,
                    border: `1px solid ${plan.color}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <PlanIcon size={20} style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="font-bold" style={{ fontSize: 17, color: "var(--text-strong)" }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-faint)" }}>{plan.desc}</p>
                </div>
              </div>

              {/* السعر */}
              <div className="mb-5 pb-5" style={{ borderBottom: "1px solid var(--gold-bg)" }}>
                {plan.price === 0 ? (
                  <>
                    <span
                      className="font-bold"
                      style={{ fontSize: 26, color: "var(--text-strong)" }}
                    >
                      مجاناً
                    </span>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                      للأبد
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="font-bold" style={{ fontSize: 28, color: plan.color }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 4 }}>
                        ر.س / شهر
                      </span>
                    </div>
                    {/* السعر السنوي بخصم ١٧٪ */}
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11.5,
                        color: "var(--text-soft)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>أو</span>
                      <strong style={{ color: "var(--gold-2)", fontSize: 12.5 }}>
                        {/* السعر السنوي بخصم ١٧٪: ١٢ شهر × السعر × ٠.٨٣ */}
                        {Math.round((plan.price * 12 * 0.83) / 10) * 10} ر.س
                      </strong>
                      <span>سنوياً</span>
                      <span
                        style={{
                          background: "var(--success-bg)",
                          color: "var(--success)",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        وفّر ١٧٪
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4 }}>
                      الأسعار شاملة ضريبة القيمة المضافة (١٥٪)
                    </div>
                  </>
                )}
              </div>

              {/* المميزات */}
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2" style={{ fontSize: 13 }}>
                    {feat.included ? (
                      <Check size={14} style={{ color: "var(--success)", flexShrink: 0 }} />
                    ) : (
                      <X size={14} style={{ color: "var(--border-1)", flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        color: feat.included ? "var(--text-secondary)" : "var(--border-1)",
                        textDecoration: feat.included ? "none" : "line-through",
                      }}
                    >
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
                      ? "linear-gradient(135deg, var(--gold-2), var(--gold-3))"
                      : plan.id === "pro"
                        ? "linear-gradient(135deg, var(--gold-1), var(--gold-2))"
                        : "var(--bg-surface-2)",
                  color: isCurrent
                    ? plan.color
                    : plan.id === "free"
                      ? "var(--text-soft)"
                      : "var(--bg-page)",
                  opacity: isUpgrading !== null && !isUpgrading ? 0.5 : 1,
                }}
              >
                {isUpgrading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> جاري الترقية...
                  </>
                ) : isCurrent ? (
                  <>
                    <Check size={15} /> خطتك الحالية
                  </>
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

      {/* ── ملاحظة الأمان ── */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--gold-bg-soft)", border: "1px solid var(--gold-bg)" }}
      >
        <p style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.8 }}>
          <span style={{ color: "var(--gold-2)", fontWeight: 600 }}>🔒 دفع آمن:</span> نعتمد بوابة{" "}
          <strong style={{ color: "var(--text-strong)" }}>ميسر</strong> المرخّصة من البنك المركزي
          السعودي. جميع المعاملات مشفّرة ومتوافقة مع معيار <strong>PCI-DSS</strong>. الأسعار شاملة
          ضريبة القيمة المضافة (١٥٪).
        </p>
      </div>

      {/* ══ Payment Modal ══ */}
      {payModal && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            onClick={() => !paying && setPayModal(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "var(--bg-deep)", border: "1px solid var(--gold-bg-hover)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} style={{ color: "var(--gold-2)" }} />
                  <h3 className="font-bold" style={{ fontSize: 16, color: "var(--text-strong)" }}>
                    ادفع واشترك — {PLAN_PRICES[payModal.plan]?.label}
                  </h3>
                </div>
                <button
                  onClick={() => setPayModal(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-faint)",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Billing toggle */}
              <div
                className="mb-5 flex gap-2 rounded-xl p-1"
                style={{ background: "var(--bg-surface-2)" }}
              >
                {(["monthly", "yearly"] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setPayModal((m) => (m ? { ...m, billing: b } : null))}
                    className="flex-1 rounded-lg py-2 text-sm font-bold transition"
                    style={{
                      background: payModal.billing === b ? "var(--gold-bg-hover)" : "transparent",
                      color: payModal.billing === b ? "var(--gold-2)" : "var(--text-faint)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {b === "monthly"
                      ? `شهري — ${PLAN_PRICES[payModal.plan]?.monthly} ر.س`
                      : `سنوي — ${PLAN_PRICES[payModal.plan]?.yearly} ر.س`}
                  </button>
                ))}
              </div>

              {/* Card fields */}
              {[
                {
                  key: "card_name",
                  label: "اسم حامل البطاقة",
                  placeholder: "AHMED AL-OTAIBI",
                  dir: "ltr" as const,
                },
                {
                  key: "card_number",
                  label: "رقم البطاقة",
                  placeholder: "4111 1111 1111 1111",
                  dir: "ltr" as const,
                },
              ].map((f) => (
                <div key={f.key} className="mb-3">
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      color: "var(--text-soft)",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    value={(payForm as Record<string, string>)[f.key]}
                    onChange={(e) => setPayForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    dir={f.dir}
                    className="w-full rounded-xl px-4 py-3 text-sm transition focus:outline-none"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--gold-bg-hover)",
                      color: "var(--text-strong)",
                    }}
                  />
                </div>
              ))}
              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  { key: "card_cvc", label: "CVV", placeholder: "123" },
                  { key: "card_month", label: "الشهر", placeholder: "12" },
                  { key: "card_year", label: "السنة", placeholder: "2027" },
                ].map((f) => (
                  <div key={f.key}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        color: "var(--text-soft)",
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      value={(payForm as Record<string, string>)[f.key]}
                      onChange={(e) => setPayForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      dir="ltr"
                      className="w-full rounded-xl px-3 py-3 text-sm transition focus:outline-none"
                      style={{
                        background: "var(--bg-surface-2)",
                        border: "1px solid var(--gold-bg-hover)",
                        color: "var(--text-strong)",
                      }}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handlePay}
                disabled={paying}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition"
                style={{
                  background: paying
                    ? "rgba(198,145,76,0.4)"
                    : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
                  color: "var(--bg-page)",
                  border: "none",
                  cursor: paying ? "not-allowed" : "pointer",
                }}
              >
                {paying ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> جارٍ الدفع...
                  </>
                ) : (
                  <>
                    <Lock size={14} /> ادفع بأمان الآن
                  </>
                )}
              </button>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--border-1)",
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                مُؤمَّن عبر بوابة ميسر · تشفير SSL
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
