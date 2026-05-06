"use client";

import { useState, useEffect } from "react";
import { Lock, User, Phone, Mail, Send, Loader2, CheckCircle2 } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// LeadCaptureGate — الميزة القاتلة
// يُعرَض قبل عرض تفاصيل عقار/بطاقة/PDF/فيديو
// الزائر يدخل اسم + جوّال + بريد → يُحفَظ في lead_captures
// بعد التقديم: يظهر المحتوى + cookie يمنع إعادة التعبئة
// ══════════════════════════════════════════════════════════════

interface Props {
  tenantSlug: string;
  contextType: "property" | "card" | "pdf" | "video" | "phone";
  contextId?: string;
  contextLabel?: string;                       // "تفاصيل العقار" / "بيانات الاتصال"
  message?: string;                             // رسالة مخصّصة من المالك
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  children: React.ReactNode;                    // المحتوى المحمي
}

const INTENTS = ["شراء", "إيجار", "استثمار", "استفسار"];

export default function LeadCaptureGate({
  tenantSlug,
  contextType,
  contextId,
  contextLabel = "هذي المعلومة",
  message,
  accentColor = "#C6914C",
  bgColor = "#FAF7F2",
  textColor = "#1A1206",
  children,
}: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    intent: "شراء",
  });

  // فحص cookie سابق — إذا الزائر قدّم سابقاً، افتح المحتوى مباشرة
  useEffect(() => {
    if (typeof document === "undefined") return;
    const cookieName = `lc_${tenantSlug}`;
    const has = document.cookie.split("; ").some(c => c.startsWith(cookieName + "="));
    if (has) setUnlocked(true);
  }, [tenantSlug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.full_name.trim().length < 2) { setError("الاسم مطلوب"); return; }
    if (form.phone.replace(/\D/g, "").length < 9) { setError("رقم الجوّال غير صحيح"); return; }

    setSubmitting(true);
    try {
      // قراءة UTM params من URL
      const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
      const utm_source = url?.searchParams.get("utm_source") || undefined;
      const utm_campaign = url?.searchParams.get("utm_campaign") || undefined;

      const res = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: tenantSlug,
          context_type: contextType,
          context_id: contextId,
          ...form,
          utm_source,
          utm_campaign,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذّر التسجيل");

      // افتح المحتوى
      setUnlocked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ في الإرسال");
    } finally {
      setSubmitting(false);
    }
  }

  // ── المحتوى مكشوف ──
  if (unlocked) return <>{children}</>;

  // ── الـ Gate ──
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    paddingRight: 40,
    borderRadius: 10,
    background: "rgba(0,0,0,0.04)",
    border: `1px solid ${accentColor}33`,
    color: textColor,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  };

  return (
    <div dir="rtl" style={{
      maxWidth: 480,
      margin: "20px auto",
      padding: 28,
      borderRadius: 20,
      background: bgColor,
      color: textColor,
      border: `1px solid ${accentColor}22`,
      boxShadow: `0 12px 40px ${accentColor}14`,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          margin: "0 auto 12px",
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Lock size={26} color="#fff" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
          أدخل بياناتك لرؤية {contextLabel}
        </h3>
        <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.7 }}>
          {message || "تواصل سريع وآمن — سيرد عليك الوسيط مباشرة. بياناتك محفوظة وفق نظام حماية البيانات الشخصية (PDPL)."}
        </p>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <User size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
          <input
            type="text"
            placeholder="الاسم الكامل *"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ position: "relative" }}>
          <Phone size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
          <input
            type="tel"
            placeholder="رقم الجوّال * (05xxxxxxxx)"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            style={{ ...inputStyle, direction: "ltr", textAlign: "right" }}
            required
          />
        </div>

        <div style={{ position: "relative" }}>
          <Mail size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
          <input
            type="email"
            placeholder="البريد الإلكتروني (اختياري)"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ ...inputStyle, direction: "ltr", textAlign: "right" }}
          />
        </div>

        {/* Intent pills */}
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>أبحث عن:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {INTENTS.map(it => (
              <button
                key={it}
                type="button"
                onClick={() => setForm({ ...form, intent: it })}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${form.intent === it ? accentColor : `${accentColor}33`}`,
                  background: form.intent === it ? `${accentColor}22` : "transparent",
                  color: form.intent === it ? accentColor : textColor,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {it}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "#EF4444", padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "13px",
            borderRadius: 12,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 800,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
            marginTop: 4,
          }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {submitting ? "جارٍ الإرسال..." : `أرسل وأكمل لـ ${contextLabel}`}
        </button>

        <p style={{ fontSize: 11, opacity: 0.55, textAlign: "center", lineHeight: 1.7, marginTop: 4 }}>
          بإدخال بياناتك، توافق على معالجتها للتواصل العقاري وفق نظام PDPL.
        </p>
      </form>
    </div>
  );
}
