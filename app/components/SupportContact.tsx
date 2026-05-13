"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle,
  Mail,
  Send,
  Loader2,
  X,
  AlertCircle,
  Bug,
  Lightbulb,
  CreditCard,
  HelpCircle as Help,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// SupportContact — بطاقة تواصل + نموذج إرسال طلب دعم
// تظهر في /dashboard/help (الأعلى) أو في أي مكان يحتاج CTA دعم
// ══════════════════════════════════════════════════════════════

const SUPPORT_WHATSAPP = "966575828854"; // رقم Wasit Pro Support (نفس WABA)
const SUPPORT_EMAIL = "elyasaldakhil@gmail.com";

const CATEGORIES = [
  { value: "general", label: "سؤال عام", icon: Help },
  { value: "bug", label: "خطأ تقني", icon: Bug },
  { value: "feature_request", label: "اقتراح ميزة", icon: Lightbulb },
  { value: "billing", label: "الفوترة", icon: CreditCard },
  { value: "urgent", label: "عاجل", icon: AlertCircle },
];

export default function SupportContact() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "general",
    preferred_method: "whatsapp" as "whatsapp" | "email" | "phone",
  });

  async function submit() {
    if (!form.subject.trim() || form.subject.length < 3) {
      toast.error("العنوان قصير");
      return;
    }
    if (!form.message.trim() || form.message.length < 10) {
      toast.error("الرسالة قصيرة (٢-٣ جمل على الأقل)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          page_url: typeof window !== "undefined" ? window.location.href : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإرسال");

      toast.success(data.message || "تم استلام طلبك ✓");
      setForm({ subject: "", message: "", category: "general", preferred_method: "whatsapp" });
      setShowForm(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الإرسال");
    } finally {
      setSubmitting(false);
    }
  }

  const waMsg = encodeURIComponent("مرحباً، أحتاج مساعدة في منصة وسيط برو:");
  const waLink = `https://wa.me/${SUPPORT_WHATSAPP}?text=${waMsg}`;
  const emailLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("طلب دعم — وسيط برو")}`;

  return (
    <section
      dir="rtl"
      className="space-y-3 rounded-xl p-4"
      style={{
        background: "linear-gradient(135deg, rgba(232,184,109,0.08), rgba(200,149,76,0.04))",
        border: "1px solid var(--gold-bg)",
      }}
    >
      <div className="flex items-center gap-2">
        <MessageCircle size={18} style={{ color: "var(--gold-2)" }} />
        <h2 className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
          تواصل مع الدعم
        </h2>
      </div>
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        ما لقيت إجابة سؤالك في الأقسام؟ تواصل معنا مباشرة:
      </p>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {/* WhatsApp */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg p-3 no-underline transition"
          style={{
            background: "rgba(37,211,102,0.10)",
            border: "1px solid rgba(37,211,102,0.30)",
            color: "rgb(37,211,102)",
          }}
        >
          <MessageCircle size={16} />
          <div className="flex-1">
            <div className="text-xs font-bold">واتساب</div>
            <div className="text-xs opacity-75" style={{ direction: "ltr", textAlign: "right" }}>
              +966 57 582 8854
            </div>
          </div>
        </a>

        {/* Email */}
        <a
          href={emailLink}
          className="flex items-center gap-2 rounded-lg p-3 no-underline transition"
          style={{
            background: "var(--bg-surface-2)",
            border: "1px solid var(--gold-bg)",
            color: "var(--text-strong)",
          }}
        >
          <Mail size={16} style={{ color: "var(--gold-2)" }} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold">بريد إلكتروني</div>
            <div className="truncate text-xs opacity-75">{SUPPORT_EMAIL}</div>
          </div>
        </a>

        {/* Form */}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg p-3 transition"
          style={{
            background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
            border: "none",
            color: "#0A0A0C",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Send size={16} />
          <div className="flex-1 text-right">
            <div className="text-xs font-bold">نموذج طلب</div>
            <div className="text-xs opacity-75">يصلنا في الداشبورد</div>
          </div>
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div
          className="mt-3 space-y-3 rounded-lg p-4"
          style={{
            background: "var(--bg-surface-1)",
            border: "1px solid var(--gold-2)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
              تفاصيل الطلب
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="rounded p-1"
              style={{ color: "var(--text-faint)" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = form.category === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, category: c.value })}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition"
                  style={{
                    background: active ? "var(--gold-bg)" : "var(--bg-surface-2)",
                    border: `1px solid ${active ? "var(--gold-2)" : "var(--gold-bg)"}`,
                    color: active ? "var(--gold-2)" : "var(--text-soft)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <Icon size={11} />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
              العنوان
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="باختصار: عمّ الطلب؟"
              maxLength={200}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--bg-surface-2)",
                border: "1px solid var(--gold-bg)",
                color: "var(--text-strong)",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
              الرسالة
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="اشرح لنا التفاصيل... كل ما زادت التفاصيل، زادت سرعة الرد"
              rows={5}
              maxLength={5000}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--bg-surface-2)",
                border: "1px solid var(--gold-bg)",
                color: "var(--text-strong)",
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Preferred method */}
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
              نوع الرد المفضّل
            </label>
            <div className="flex gap-2">
              {[
                { v: "whatsapp", l: "واتساب" },
                { v: "email", l: "بريد" },
                { v: "phone", l: "اتصال" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() =>
                    setForm({ ...form, preferred_method: opt.v as "whatsapp" | "email" | "phone" })
                  }
                  className="flex-1 rounded-lg px-3 py-1.5 text-xs"
                  style={{
                    background:
                      form.preferred_method === opt.v ? "var(--gold-bg)" : "var(--bg-surface-2)",
                    border: `1px solid ${form.preferred_method === opt.v ? "var(--gold-2)" : "var(--gold-bg)"}`,
                    color: form.preferred_method === opt.v ? "var(--gold-2)" : "var(--text-soft)",
                    fontWeight: form.preferred_method === opt.v ? 700 : 500,
                  }}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
              color: "#0A0A0C",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitting ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </button>
        </div>
      )}
    </section>
  );
}
