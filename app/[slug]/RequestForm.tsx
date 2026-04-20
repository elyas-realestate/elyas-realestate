"use client";

import { useState } from "react";

interface Props {
  tenantId: string;
  accentColor: string;
  accentDark: string;
  bgCard: string;
  bgPrimary: string;
  textPrimary: string;
  textSecondary: string;
  fontBody: string;
}

const REQUEST_TYPES = ["شراء", "إيجار", "استثمار", "أخرى"];
const CATEGORIES    = ["سكني", "تجاري", "أرض"];

export default function RequestForm({ tenantId, accentColor, accentDark, bgCard, bgPrimary, textPrimary, textSecondary, fontBody }: Props) {
  const [form, setForm] = useState({ name: "", phone: "", request_type: "شراء", main_category: "سكني", budget_min: "", budget_max: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const field = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");

    try {
      const res = await fetch("/api/broker-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tenant_id: tenantId }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error || "حدث خطأ"); setStatus("error"); return; }
      setStatus("success");
    } catch {
      setErrMsg("تعذّر الاتصال، حاول مرة أخرى");
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: `color-mix(in srgb, ${accentColor} 4%, ${bgPrimary})`,
    border: `1px solid color-mix(in srgb, ${accentColor} 14%, transparent)`,
    borderRadius: 10,
    color: textPrimary,
    fontSize: fontBody,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    direction: "rtl",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    color: textSecondary,
    marginBottom: 6,
    fontWeight: 500,
  };

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "48px 32px", background: bgCard, border: `1px solid color-mix(in srgb, ${accentColor} 18%, transparent)`, borderRadius: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 10, fontFamily: "inherit" }}>تم استلام طلبك!</h3>
        <p style={{ color: textSecondary, fontSize: fontBody, lineHeight: 1.8 }}>سيتواصل معك الوسيط في أقرب وقت ممكن.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: bgCard, border: `1px solid color-mix(in srgb, ${accentColor} 14%, transparent)`, borderRadius: 20, padding: "36px 32px" }} dir="rtl">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>الاسم الكامل *</label>
          <input required value={form.name} onChange={e => field("name", e.target.value)} placeholder="محمد العتيبي" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>رقم الجوال *</label>
          <input required value={form.phone} onChange={e => field("phone", e.target.value)} placeholder="05XXXXXXXX" style={{ ...inputStyle, direction: "ltr", textAlign: "right" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>نوع الطلب *</label>
          <select value={form.request_type} onChange={e => field("request_type", e.target.value)} style={inputStyle}>
            {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>الفئة</label>
          <select value={form.main_category} onChange={e => field("main_category", e.target.value)} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>الميزانية من (ر.س)</label>
          <input type="number" value={form.budget_min} onChange={e => field("budget_min", e.target.value)} placeholder="500,000" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>الميزانية إلى (ر.س)</label>
          <input type="number" value={form.budget_max} onChange={e => field("budget_max", e.target.value)} placeholder="1,000,000" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>ملاحظات إضافية</label>
        <textarea value={form.notes} onChange={e => field("notes", e.target.value)} placeholder="عدد الغرف، المنطقة المفضلة، أي تفاصيل مهمة..." rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} />
      </div>

      {status === "error" && (
        <p style={{ color: "#f87171", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{errMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          width: "100%",
          padding: "14px 0",
          background: `linear-gradient(135deg, ${accentColor}, ${accentDark})`,
          color: bgPrimary,
          border: "none",
          borderRadius: 11,
          fontSize: 16,
          fontWeight: 800,
          cursor: status === "loading" ? "not-allowed" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
          fontFamily: "inherit",
          transition: "opacity 0.2s",
        }}
      >
        {status === "loading" ? "جارٍ الإرسال..." : "أرسل طلبك الآن"}
      </button>
    </form>
  );
}
