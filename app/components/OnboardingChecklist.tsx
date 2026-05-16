"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  X,
  ArrowLeft,
  IdCard,
  Building2,
  MessageCircle,
  Bot,
  Sparkles,
} from "lucide-react";
import { logger } from "@/lib/logger";

// ══════════════════════════════════════════════════════════════
// OnboardingChecklist — يظهر للوسطاء الجدد على /dashboard
// يعرض ٤ خطوات للوصول لأقل قدر من الإعداد قبل البدء بالعمل
// يختفي تلقائياً لو dismissed أو لو كل الخطوات اكتملت
// ══════════════════════════════════════════════════════════════

interface OnboardingState {
  step_profile_completed: boolean;
  step_property_added: boolean;
  step_whatsapp_connected: boolean;
  step_assistant_tested: boolean;
  dismissed: boolean;
}

const STEPS = [
  {
    key: "step_profile_completed" as const,
    title: "أكمل ملفك الشخصي",
    description: "اسمك، تخصصك، رقم الجوال، الرخص",
    icon: IdCard,
    href: "/dashboard/settings",
    cta: "افتح الإعدادات",
  },
  {
    key: "step_property_added" as const,
    title: "أضف أول عقار",
    description: "ابدأ كتالوج عقاراتك للعرض",
    icon: Building2,
    href: "/dashboard/properties/add",
    cta: "إضافة عقار",
  },
  {
    key: "step_whatsapp_connected" as const,
    title: "اربط واتساب الأعمال",
    description: "حتى يصلك العملاء وتردّ تلقائياً",
    icon: MessageCircle,
    href: "/dashboard/whatsapp/settings",
    cta: "ربط الواتساب",
  },
  {
    key: "step_assistant_tested" as const,
    title: "جرّب مساعدك الذكي",
    description: "شغّله واختبر ردّاً واحداً على الأقل",
    icon: Bot,
    href: "/dashboard/ai",
    cta: "ابدأ الذكاء الصناعي",
  },
];

export default function OnboardingChecklist() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/onboarding", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setState(data.state);
    } catch (e) {
      logger.error("[onboarding] load failed", e);
    } finally {
      setLoading(false);
    }
  }

  async function dismiss() {
    setDismissing(true);
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
      setState((prev) => (prev ? { ...prev, dismissed: true } : prev));
    } catch (e) {
      logger.error("[onboarding] dismiss failed", e);
    } finally {
      setDismissing(false);
    }
  }

  // لا تعرض شيئاً أثناء التحميل أو إذا dismissed
  if (loading || !state || state.dismissed) return null;

  const completedCount = STEPS.filter((s) => state[s.key]).length;
  const totalSteps = STEPS.length;
  const isAllComplete = completedCount === totalSteps;
  const progress = Math.round((completedCount / totalSteps) * 100);

  // إذا كل الخطوات مكتملة، اعرض رسالة احتفاء بسيطة (ثم يختفي بعد dismiss)
  if (isAllComplete) {
    return (
      <div
        dir="rtl"
        className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(232,184,109,0.10), rgba(200,149,76,0.05))",
          border: "1px solid var(--gold-2)",
        }}
      >
        <div className="flex items-center gap-3">
          <Sparkles size={20} style={{ color: "var(--gold-2)" }} />
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
              ممتاز! أنجزت كل خطوات الإعداد ✨
            </div>
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>
              منصتك جاهزة. تقدر تخفي هذي البطاقة الآن.
            </div>
          </div>
        </div>
        <button
          onClick={dismiss}
          disabled={dismissing}
          className="rounded-lg px-3 py-1.5 text-xs"
          style={{
            background: "var(--gold-2)",
            color: "#0A0A0C",
            border: "none",
            fontWeight: 700,
          }}
        >
          {dismissing ? "..." : "إخفاء"}
        </button>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="relative mb-5 rounded-xl p-4"
      style={{
        background: "var(--bg-surface-1)",
        border: "1px solid var(--gold-bg)",
      }}
    >
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: "var(--gold-2)" }} />
          <h2 className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
            خطوات إعداد منصتك
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs"
            style={{
              background: "var(--gold-bg)",
              color: "var(--gold-2)",
              fontWeight: 600,
            }}
          >
            {completedCount}/{totalSteps}
          </span>
        </div>
        <button
          onClick={dismiss}
          disabled={dismissing}
          title="إخفاء"
          className="rounded p-1 hover:opacity-80"
          style={{ color: "var(--text-faint)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--bg-surface-2)" }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, var(--gold-1), var(--gold-2))",
          }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {STEPS.map((step) => {
          const done = state[step.key];
          const StepIcon = step.icon;
          return (
            <Link
              key={step.key}
              href={done ? "#" : step.href}
              className="flex items-center gap-3 rounded-lg p-3 no-underline transition"
              style={{
                background: done ? "var(--gold-bg-soft)" : "var(--bg-surface-2)",
                border: `1px solid ${done ? "var(--gold-2)" : "var(--gold-bg)"}`,
                opacity: done ? 0.7 : 1,
                cursor: done ? "default" : "pointer",
              }}
              onClick={(e) => {
                if (done) e.preventDefault();
              }}
            >
              {/* Check icon */}
              {done ? (
                <CheckCircle2
                  size={20}
                  style={{ color: "var(--gold-2)", flexShrink: 0 }}
                  fill="currentColor"
                  fillOpacity={0.15}
                />
              ) : (
                <Circle size={20} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div
                  className="flex items-center gap-1.5 text-xs font-bold"
                  style={{
                    color: done ? "var(--text-faint)" : "var(--text-strong)",
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  <StepIcon size={12} />
                  {step.title}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                  {done ? "مكتمل ✓" : step.description}
                </div>
              </div>

              {!done && <ArrowLeft size={14} style={{ color: "var(--gold-2)", flexShrink: 0 }} />}
            </Link>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="mt-3 text-center text-xs" style={{ color: "var(--text-faint)" }}>
        الخطوات تكتمل تلقائياً عند إنجازك لكل بند. تقدر تخفي البطاقة في أي وقت.
      </p>
    </div>
  );
}
