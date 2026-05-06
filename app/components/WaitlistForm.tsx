"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, User, Phone, Send, Loader2, CheckCircle2 } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// WaitlistForm — نموذج التسجيل في قائمة انتظار Beta
// يُدرج في landing page أو صفحة /beta
// ══════════════════════════════════════════════════════════════

export default function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    city: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("البريد الإلكتروني مطلوب");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ في التسجيل");
      setSubmitted(true);
      toast.success(data.message || "تم التسجيل بنجاح");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ في الإرسال");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div dir="rtl" className="rounded-2xl p-6 text-center space-y-3"
        style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(232,184,109,0.05))", border: "1px solid rgba(34,197,94,0.30)" }}>
        <CheckCircle2 size={40} style={{ color: "rgb(34,197,94)", margin: "0 auto" }} />
        <h3 className="font-bold text-lg" style={{ color: "var(--text-strong)" }}>
          أنت في القائمة الآن ✓
        </h3>
        <p className="text-sm" style={{ color: "var(--text-soft)", lineHeight: 1.7 }}>
          سنتواصل معك على بريدك <strong>{form.email}</strong> عند فتح الموجة القادمة من Beta.
          <br />
          المقاعد محدودة، الأولوية حسب التسجيل.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    background: "var(--bg-surface-2)",
    border: "1px solid var(--gold-bg)",
    color: "var(--text-strong)",
    fontSize: 14,
    fontFamily: "inherit",
  };

  return (
    <form onSubmit={submit} dir="rtl" className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
      <div className="text-center mb-2">
        <h3 className="font-bold text-lg" style={{ color: "var(--text-strong)" }}>
          🚀 سجّل في Beta
        </h3>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          المقاعد الأولى مجانية بالكامل + دعم مباشر
        </p>
      </div>

      <div className="relative">
        <Mail size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="بريدك الإلكتروني *"
          style={{ ...inputStyle, paddingRight: 36 }}
          dir="ltr"
        />
      </div>

      <div className="relative">
        <User size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          placeholder="اسمك (اختياري)"
          style={{ ...inputStyle, paddingRight: 36 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Phone size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="جوّال (اختياري)"
            style={{ ...inputStyle, paddingRight: 36 }}
            dir="ltr"
          />
        </div>
        <input
          type="text"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="المدينة"
          style={inputStyle}
        />
      </div>

      <textarea
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="ما الذي تبحث عنه في المنصة؟ (اختياري)"
        rows={2}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold"
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
        {submitting ? "جارٍ التسجيل..." : "سجّل اسمي في Beta"}
      </button>

      <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
        لن نشارك بياناتك. سننذر فقط عند فتح المقاعد التالية.
      </p>
    </form>
  );
}
