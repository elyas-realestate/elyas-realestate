"use client";
import { CreditCard, Check, X, Gift, Zap, Crown } from "lucide-react";

const PLANS = [
  {
    id: "free", name: "مجاني", price: 0, color: "#71717A", icon: Gift,
    features: ["٥ عقارات", "١٠ عملاء", "صفحة هبوط", "إدارة الصفقات"],
    locked: ["وكيل المحتوى الذكي", "الوثائق القانونية", "التحليل المالي", "غرفة المحتوى"],
  },
  {
    id: "basic", name: "أساسي", price: 99, color: "#C6914C", icon: Zap, badge: "الأكثر طلباً",
    features: ["٥٠ عقاراً", "عملاء غير محدودين", "صفحة هبوط", "وكيل المحتوى (٥٠/شهر)", "الوثائق القانونية", "التحليل المالي"],
    locked: ["غرفة المحتوى"],
  },
  {
    id: "pro", name: "احترافي", price: 249, color: "#E8B86D", icon: Crown,
    features: ["عقارات غير محدودة", "عملاء غير محدودين", "صفحة هبوط", "وكيل المحتوى (غير محدود)", "الوثائق القانونية", "التحليل المالي", "غرفة المحتوى"],
    locked: [],
  },
];

export default function AdminPlansPage() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>الاشتراكات</h1>
        <p style={{ fontSize: 13, color: "#52525B" }}>تفاصيل خطط المنصة وميزاتها</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {PLANS.map(plan => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              style={{ background: "#0F0F12", border: `1px solid ${plan.color}22`, borderRadius: 14, padding: 20, position: "relative" }}
            >
              {"badge" in plan && plan.badge && (
                <div style={{ position: "absolute", top: -10, right: 16, fontSize: 10, fontWeight: 700, color: "#0A0A0C", background: "linear-gradient(135deg, #C6914C, #A6743A)", padding: "3px 10px", borderRadius: 100 }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${plan.color}14`, border: `1px solid ${plan.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: plan.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#F4F4F5" }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: plan.color, fontWeight: 700 }}>
                    {plan.price === 0 ? "مجاناً" : `${plan.price} ريال/شهر`}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${plan.color}14`, paddingTop: 14 }}>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#D4D4D8" }}>
                      <Check size={12} style={{ color: "#4ADE80", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                  {plan.locked.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#3F3F46", textDecoration: "line-through" }}>
                      <X size={12} style={{ color: "#3F3F46", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, padding: "16px 20px", borderRadius: 12, background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <CreditCard size={15} style={{ color: "#7C3AED", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#7C3AED", lineHeight: 1.7 }}>
            تغيير الخطة يدوياً متاح من <strong>صفحة نظرة عامة</strong> → الاشتراك الحالي.
            بوابة الدفع الإلكتروني قيد التطوير وستُربط بـ Stripe أو MyFatoorah.
          </p>
        </div>
      </div>
    </div>
  );
}
