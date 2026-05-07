"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X, Bug, Lightbulb, HelpCircle, Heart, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ══════════════════════════════════════════════════════════════════
// FeedbackWidget — زر عائم لإرسال feedback من أي صفحة
// يظهر في dashboard بعد تسجيل الدخول
// ══════════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: "bug", label: "خطأ / مشكلة", icon: Bug, color: "#ef4444" },
  { id: "feature", label: "اقتراح ميزة", icon: Lightbulb, color: "#C6914C" },
  { id: "question", label: "سؤال", icon: HelpCircle, color: "#3b82f6" },
  { id: "compliment", label: "ثناء / إعجاب", icon: Heart, color: "#ec4899" },
] as const;

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // إخفاء الويدجت في صفحات معينة
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    setHidden(
      path.startsWith("/login") ||
        path.startsWith("/register") ||
        path === "/" ||
        path.startsWith("/c/") ||
        /^\/[a-z][a-z0-9-]*$/.test(path) // /[slug] للوسطاء العامة
    );
  }, []);

  async function submit() {
    if (!category) {
      toast.error("اختر تصنيف الملاحظة");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("الملاحظة قصيرة جداً");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          page_url: window.location.pathname,
        }),
      });
      const j = await res.json();
      if (j.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
          setCategory(null);
          setMessage("");
        }, 2000);
      } else {
        toast.error(j.error || "فشل الإرسال");
      }
    } catch (e: any) {
      toast.error(e?.message || "خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="إرسال ملاحظة"
          title="إرسال ملاحظة"
          style={{
            position: "fixed",
            bottom: 20,
            insetInlineStart: 20,
            zIndex: 9998,
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--gold-2, #C6914C), var(--gold-3, #A6743A))",
            color: "var(--bg-page, #fff)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(198,145,76,0.4), 0 2px 6px rgba(0,0,0,0.1)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <MessageSquare size={20} />
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            bottom: 20,
            insetInlineStart: 20,
            zIndex: 9999,
            width: "calc(100% - 40px)",
            maxWidth: 360,
            background: "var(--bg-page, #fff)",
            border: "1px solid var(--gold-bg, rgba(198,145,76,0.18))",
            borderRadius: 16,
            boxShadow: "0 16px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--gold-bg-soft)",
              background: "var(--bg-surface-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={16} style={{ color: "var(--gold-2)" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>
                ملاحظات & اقتراحات
              </span>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setCategory(null);
                setMessage("");
                setSubmitted(false);
              }}
              aria-label="إغلاق"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-faint)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 16 }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)", marginBottom: 4 }}>
                  شكراً لك!
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  تم استلام ملاحظتك. نقدّر مشاركتك.
                </div>
              </div>
            ) : !category ? (
              <>
                <p style={{ fontSize: 12.5, color: "var(--text-soft)", marginBottom: 12, lineHeight: 1.7 }}>
                  ساعدنا بتحسين المنصة. اختر نوع الملاحظة:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        style={{
                          padding: "12px 8px",
                          borderRadius: 10,
                          background: "var(--bg-surface-2)",
                          border: "1px solid var(--gold-bg)",
                          color: "var(--text-strong)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = c.color;
                          e.currentTarget.style.background = `${c.color}10`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--gold-bg)";
                          e.currentTarget.style.background = "var(--bg-surface-2)";
                        }}
                      >
                        <Icon size={18} style={{ color: c.color }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600 }}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCategory(null)}
                  style={{
                    fontSize: 11,
                    color: "var(--text-faint)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 0 8px",
                    fontFamily: "inherit",
                  }}
                >
                  ← اختيار تصنيف آخر
                </button>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="اكتب ملاحظتك هنا..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--gold-bg)",
                    borderRadius: 9,
                    color: "var(--text-strong)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical",
                    minHeight: 100,
                  }}
                  autoFocus
                />
                <button
                  onClick={submit}
                  disabled={submitting || message.trim().length < 5}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: "10px",
                    borderRadius: 9,
                    background:
                      submitting || message.trim().length < 5
                        ? "var(--bg-surface-2)"
                        : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
                    color:
                      submitting || message.trim().length < 5
                        ? "var(--text-faint)"
                        : "var(--bg-page)",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor:
                      submitting || message.trim().length < 5 ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      إرسال
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
