"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0A0A0C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Tajawal', sans-serif", padding: "24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .login-input { width: 100%; background: #1C1C22; border: 1px solid rgba(198,145,76,0.15); border-radius: 12px; padding: 14px 16px; font-size: 14px; color: #F5F5F5; outline: none; transition: border-color 0.3s; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        .login-input:focus { border-color: #C6914C; }
        .login-input::placeholder { color: #5A5A62; }
        .dot-pattern { background-image: radial-gradient(rgba(198,145,76,0.04) 1px, transparent 1px); background-size: 32px 32px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease-out both; }
      `}</style>

      {/* Background pattern */}
      <div className="dot-pattern" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
      {/* Gold glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(198,145,76,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Card */}
      <div className="fade-up" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg, #C6914C, #A6743A)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26, fontWeight: 900, color: "#0A0A0C", fontFamily: "'Noto Kufi Arabic', serif" }}>إ</div>
          </Link>
          <h1 className="font-kufi" style={{ fontSize: 22, fontWeight: 800, color: "#F5F5F5", marginBottom: 6 }}>إلياس الدخيل</h1>
          <p style={{ fontSize: 13, color: "#5A5A62" }}>وسيط عقاري مرخّص — الرياض</p>
        </div>

        {/* Form Card */}
        <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.14)", borderRadius: 24, padding: "36px 32px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          <h2 className="font-kufi" style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 4, textAlign: "center" }}>دخول الفريق</h2>
          <p style={{ fontSize: 13, color: "#5A5A62", textAlign: "center", marginBottom: 28 }}>مخصص لأعضاء الفريق فقط</p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#9A9AA0", marginBottom: 8, fontWeight: 500 }}>البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="login-input"
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "#9A9AA0", marginBottom: 8, fontWeight: 500 }}>كلمة المرور</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="login-input"
                  placeholder="••••••••"
                  dir="ltr"
                  style={{ paddingLeft: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#5A5A62", display: "flex", alignItems: "center", padding: 0 }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p style={{ fontSize: 13, color: "#EF4444", margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "15px", borderRadius: 14, background: loading ? "rgba(198,145,76,0.4)" : "linear-gradient(135deg, #C6914C, #A6743A)", border: "none", color: "#0A0A0C", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s", fontFamily: "'Tajawal', sans-serif", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(10,10,12,0.4)", borderTopColor: "#0A0A0C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
                  جاري الدخول...
                </>
              ) : "دخول"}
            </button>
          </form>
        </div>

        {/* Bottom links */}
        <div style={{ textAlign: "center", marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <Link href="/register" style={{ fontSize: 13, color: "#9A9AA0", textDecoration: "none" }}>
              ليس لديك حساب؟{" "}
              <span style={{ color: "#C6914C", fontWeight: 700 }}>سجّل الآن مجاناً</span>
            </Link>
          </div>
          <Link href="/" style={{ fontSize: 12, color: "#3A3A42", textDecoration: "none" }}>
            ← العودة للموقع
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
