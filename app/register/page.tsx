"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useRef } from "react";
import Link from "next/link";
import { validateSlug } from "@/lib/slug-validation";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export default function Register() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [fal, setFal]           = useState("");
  const [slug, setSlug]         = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [slugMsg, setSlugMsg]   = useState("");
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [step, setStep]         = useState<"form" | "verify">("form");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون ٨ أحرف على الأقل");
      return;
    }

    const finalSlug = slug || toSlug(email.split("@")[0]);
    const slugCheck = validateSlug(finalSlug);
    if (!slugCheck.valid) {
      setError(slugCheck.error);
      return;
    }
    if (slugStatus === "taken") {
      setError("هذا الرابط محجوز — اختر رابطاً آخر");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, fal_license: fal },
      },
    });

    if (signUpError) {
      const msg = signUpError.message.includes("already registered")
        ? "هذا البريد الإلكتروني مسجّل مسبقاً — جرّب تسجيل الدخول"
        : signUpError.message.includes("weak")
        ? "كلمة المرور ضعيفة — استخدم ٨ أحرف على الأقل مع أرقام"
        : "حدث خطأ أثناء التسجيل — حاول مجدداً";
      setError(msg);
      setLoading(false);
      return;
    }

    if (data.user) {
      // ── أنشئ tenant ──
      const { data: tenant, error: tenantErr } = await supabase
        .from("tenants")
        .insert({ slug: finalSlug, owner_id: data.user.id, plan: "free" })
        .select("id")
        .single();

      if (tenantErr && tenantErr.code === "23505") {
        // slug مكرر — أضف رقم عشوائي
        const fallbackSlug = `${finalSlug}-${Math.floor(Math.random() * 9000) + 1000}`;
        await supabase
          .from("tenants")
          .insert({ slug: fallbackSlug, owner_id: data.user.id, plan: "free" });
      }

      if (tenant?.id) {
        // أنشئ إعدادات أولية
        await Promise.all([
          supabase.from("site_settings").insert({
            tenant_id: tenant.id,
            broker_name: name,
            site_name: name,
            plan: "free",
          }),
          supabase.from("broker_identity").insert({
            tenant_id: tenant.id,
            broker_name: name,
          }),
        ]);
      }
    }

    // إذا الجلسة موجودة مباشرة (email confirmation معطّل) — ابدأ الـ onboarding
    if (data.session) {
      window.location.href = "/onboarding";
      return;
    }

    // إذا يحتاج تأكيد البريد
    setStep("verify");
    setLoading(false);
  }

  async function handleSlugInput(val: string) {
    const cleaned = toSlug(val);
    setSlug(cleaned);
    setSlugTouched(true);
    setSlugStatus("idle");
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (!cleaned) return;
    const v = validateSlug(cleaned);
    if (!v.valid) { setSlugStatus("invalid"); setSlugMsg(v.error); return; }
    slugTimer.current = setTimeout(async () => {
      setSlugStatus("checking");
      const res = await fetch(`/api/slug/check?slug=${cleaned}`);
      const data = await res.json();
      if (data.error) { setSlugStatus("invalid"); setSlugMsg(data.error); }
      else if (data.available) { setSlugStatus("available"); setSlugMsg("متاح ✓"); }
      else { setSlugStatus("taken"); setSlugMsg("محجوز — جرّب اسماً آخر"); }
    }, 600);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace("https://", "") || "waseet-pro.com";

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0A0A0C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Tajawal', sans-serif", padding: "24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .reg-input { width: 100%; background: #1C1C22; border: 1px solid rgba(198,145,76,0.15); border-radius: 12px; padding: 14px 16px; font-size: 14px; color: #F5F5F5; outline: none; transition: border-color 0.3s; box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
        .reg-input:focus { border-color: #C6914C; }
        .reg-input::placeholder { color: #5A5A62; }
        .dot-pattern { background-image: radial-gradient(rgba(198,145,76,0.04) 1px, transparent 1px); background-size: 32px 32px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease-out both; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Background */}
      <div className="dot-pattern" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(198,145,76,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div className="fade-up" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #C6914C, #A6743A)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22, fontWeight: 900, color: "#0A0A0C", fontFamily: "'Noto Kufi Arabic', serif" }}>و</div>
          </Link>
          <h1 className="font-kufi" style={{ fontSize: 20, fontWeight: 800, color: "#F5F5F5", marginBottom: 4 }}>وسيط برو</h1>
          <p style={{ fontSize: 12, color: "#5A5A62" }}>المنصة العقارية الذكية للوسطاء السعوديين</p>
        </div>

        {step === "verify" ? (
          /* ═══ شاشة التحقق ═══ */
          <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.14)", borderRadius: 24, padding: "40px 32px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>📧</div>
            <h2 className="font-kufi" style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 10 }}>تحقق من بريدك</h2>
            <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.7, marginBottom: 24 }}>
              أرسلنا رابط تأكيد إلى<br />
              <span style={{ color: "#C6914C", fontWeight: 600 }}>{email}</span>
              <br />افتح البريد واضغط على الرابط للدخول
            </p>
            <Link href="/login" style={{ display: "inline-block", fontSize: 14, fontWeight: 700, color: "#0A0A0C", background: "linear-gradient(135deg, #C6914C, #A6743A)", padding: "12px 28px", borderRadius: 10, textDecoration: "none" }}>
              الذهاب لتسجيل الدخول
            </Link>
            <p style={{ fontSize: 12, color: "#3A3A42", marginTop: 20 }}>لم يصل البريد؟ تحقق من مجلد Spam</p>
          </div>
        ) : (
          /* ═══ نموذج التسجيل ═══ */
          <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.14)", borderRadius: 24, padding: "36px 32px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
            <h2 className="font-kufi" style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 4, textAlign: "center" }}>إنشاء حساب جديد</h2>
            <p style={{ fontSize: 13, color: "#5A5A62", textAlign: "center", marginBottom: 28 }}>ابدأ مجاناً — بدون بطاقة ائتمان</p>

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* الاسم */}
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9A9AA0", marginBottom: 7, fontWeight: 500 }}>الاسم الكامل</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="reg-input"
                  placeholder="إلياس الدخيل"
                />
              </div>

              {/* البريد */}
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9A9AA0", marginBottom: 7, fontWeight: 500 }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="reg-input"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>

              {/* كلمة المرور */}
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9A9AA0", marginBottom: 7, fontWeight: 500 }}>كلمة المرور</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="reg-input"
                    placeholder="٨ أحرف على الأقل"
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
                {password.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length >= i * 2 ? (password.length >= 8 ? "#4ADE80" : "#C6914C") : "#2A2A32", transition: "background 0.3s" }} />
                    ))}
                    <span style={{ fontSize: 11, color: password.length >= 8 ? "#4ADE80" : "#C6914C", marginRight: 4, whiteSpace: "nowrap" }}>
                      {password.length >= 8 ? "قوية ✓" : password.length >= 4 ? "متوسطة" : "ضعيفة"}
                    </span>
                  </div>
                )}
              </div>

              {/* رابط الملف الشخصي */}
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9A9AA0", marginBottom: 7, fontWeight: 500 }}>
                  رابط صفحتك الشخصية
                  <span style={{ color: "#3A3A42", fontWeight: 400, marginRight: 6 }}>(يراه عملاؤك)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => handleSlugInput(e.target.value)}
                    onBlur={() => { if (!slugTouched && !slug && email) handleSlugInput(email.split("@")[0]); }}
                    className="reg-input"
                    placeholder="elyas-aldakheel"
                    dir="ltr"
                    style={{ paddingLeft: 44, paddingRight: 130 }}
                  />
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#5A5A62", pointerEvents: "none", whiteSpace: "nowrap" }}>
                    {siteUrl}/
                  </span>
                  {/* مؤشر الحالة */}
                  {slugStatus === "checking" && (
                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: "2px solid rgba(198,145,76,0.3)", borderTopColor: "#C6914C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  )}
                  {slugStatus === "available" && (
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#4ADE80", fontSize: 16 }}>✓</span>
                  )}
                  {(slugStatus === "taken" || slugStatus === "invalid") && (
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#F87171", fontSize: 16 }}>✕</span>
                  )}
                </div>
                {slug && slugStatus !== "idle" && (
                  <p style={{ fontSize: 11, marginTop: 5, color: slugStatus === "available" ? "#4ADE80" : slugStatus === "checking" ? "#9A9AA0" : "#F87171" }}>
                    {slugStatus === "checking" ? "جاري الفحص..." : slugStatus === "available" ? `رابطك: ${siteUrl}/${slug}` : slugMsg}
                  </p>
                )}
                {slug && slugStatus === "idle" && (
                  <p style={{ fontSize: 11, marginTop: 5, color: "#5A5A62" }}>{siteUrl}/{slug}</p>
                )}
              </div>

              {/* رخصة فال (اختياري) */}
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#9A9AA0", marginBottom: 7, fontWeight: 500 }}>
                  رقم رخصة فال
                  <span style={{ color: "#3A3A42", fontWeight: 400, marginRight: 6 }}>(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={fal}
                  onChange={e => setFal(e.target.value)}
                  className="reg-input"
                  placeholder="FAL-XXXXXXX"
                  dir="ltr"
                />
              </div>

              {/* خطأ */}
              {error && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize: 13, color: "#EF4444", margin: 0 }}>{error}</p>
                </div>
              )}

              {/* زر التسجيل */}
              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "15px", borderRadius: 14, background: loading ? "rgba(198,145,76,0.4)" : "linear-gradient(135deg, #C6914C, #A6743A)", border: "none", color: "#0A0A0C", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s", fontFamily: "'Tajawal', sans-serif", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(10,10,12,0.4)", borderTopColor: "#0A0A0C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    جاري إنشاء الحساب...
                  </>
                ) : "إنشاء الحساب"}
              </button>

              {/* شروط */}
              <p style={{ fontSize: 11, color: "#3A3A42", textAlign: "center", lineHeight: 1.6 }}>
                بالتسجيل أنت توافق على{" "}
                <span style={{ color: "#5A5A62" }}>شروط الاستخدام</span>
                {" "}و{" "}
                <span style={{ color: "#5A5A62" }}>سياسة الخصوصية</span>
              </p>
            </form>
          </div>
        )}

        {/* رابط تسجيل الدخول */}
        <div style={{ textAlign: "center", marginTop: 20, display: "flex", justifyContent: "center", gap: 16 }}>
          <Link href="/login" style={{ fontSize: 13, color: "#5A5A62", textDecoration: "none" }}>
            عندك حساب؟ <span style={{ color: "#C6914C", fontWeight: 600 }}>سجّل الدخول</span>
          </Link>
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Link href="/" style={{ fontSize: 12, color: "#3A3A42", textDecoration: "none" }}>← العودة للموقع</Link>
        </div>
      </div>
    </div>
  );
}
