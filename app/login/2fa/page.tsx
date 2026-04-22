"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { ShieldCheck, Smartphone, Key } from "lucide-react";

export default function TwoFactorChallenge() {
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setError("أدخل الرمز"); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "رمز غير صحيح"); setBusy(false); return; }
      window.location.href = "/dashboard";
    } catch {
      setError("خطأ في الاتصال");
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#0A0A0C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');`}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#16161A",
          border: "1px solid rgba(198,145,76,0.14)",
          borderRadius: 24,
          padding: 36,
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "linear-gradient(135deg, #C6914C, #8A5F2E)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F5F5F5", marginBottom: 6 }}>
            التحقّق الثنائي
          </h1>
          <p style={{ fontSize: 13, color: "#9A9AA0" }}>
            {mode === "totp"
              ? "أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة"
              : "أدخل أحد رموز الاسترداد (XXXX-XXXX-XXXX)"}
          </p>
        </div>

        <form onSubmit={submit}>
          <input
            value={code}
            onChange={(e) => {
              const v = mode === "totp" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value.toUpperCase().slice(0, 14);
              setCode(v);
              setError("");
            }}
            placeholder={mode === "totp" ? "123456" : "XXXX-XXXX-XXXX"}
            autoFocus
            inputMode={mode === "totp" ? "numeric" : "text"}
            style={{
              width: "100%",
              background: "#1C1C22",
              border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(198,145,76,0.15)"}`,
              borderRadius: 12,
              padding: "16px 18px",
              fontSize: 20,
              color: "#F5F5F5",
              outline: "none",
              textAlign: "center",
              letterSpacing: mode === "totp" ? "0.4em" : "0.1em",
              fontFamily: "monospace",
              fontWeight: 600,
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, marginTop: 10, textAlign: "center" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !code.trim()}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "14px 0",
              background: "linear-gradient(135deg, #C6914C, #8A5F2E)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 12,
              cursor: busy ? "wait" : "pointer",
              opacity: busy || !code.trim() ? 0.5 : 1,
            }}
          >
            {busy ? "…جارِ التحقّق" : "تحقّق"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => { setMode(mode === "totp" ? "recovery" : "totp"); setCode(""); setError(""); }}
            style={{
              background: "transparent",
              border: "none",
              color: "#C6914C",
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {mode === "totp" ? <Key size={14} /> : <Smartphone size={14} />}
            {mode === "totp" ? "استخدم رمز استرداد بدلاً من ذلك" : "العودة لتطبيق المصادقة"}
          </button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
          <button
            type="button"
            onClick={logout}
            style={{
              background: "transparent",
              border: "none",
              color: "#5A5A62",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
