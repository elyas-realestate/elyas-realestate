"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ExternalLink } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    supabase.from("site_settings").select("*").single().then(({ data }) => {
      if (data) setS(data);
    });
  }, []);

  const siteName = s?.site_name || "إلياس الدخيل";
  const heroBadge = s?.hero_badge || "وسيط عقاري مرخّص";
  const navbarLinks: any[] = s?.navbar_links || [];
  const loginText = s?.login_link_text || "دخول الفريق";
  const whatsapp = s?.whatsapp || "";
  const phone = s?.phone || "";
  const footerText = s?.footer_text || "وسيط ومسوق عقاري مرخّص.";
  const falLicense = s?.fal_license || "";
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#0A0A0C", color: "#F5F5F5", fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .accent { color: #C9A84C; }
        .accent-bg { background: linear-gradient(135deg, #C9A84C, #A68A3A); }
        .prop-nav-link { color: #9A9AA0; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.3s; }
        .prop-nav-link:hover { color: #F5F5F5; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", background: "rgba(22,22,26,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="accent-bg flex items-center justify-center font-kufi font-black" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20, color: "#0A0A0C" }}>إ</div>
          <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
            <span className="font-kufi font-extrabold" style={{ fontSize: 17, color: "#F5F5F5" }}>{siteName}</span>
            <span className="accent" style={{ fontSize: 11, fontWeight: 500 }}>{heroBadge}</span>
          </div>
        </Link>

        <div className="flex items-center gap-8">
          {navbarLinks.map((link: any, i: number) =>
            link.type === "cta" ? (
              <a key={i} href={link.href} className="accent-bg no-underline font-bold text-sm" style={{ padding: "10px 24px", borderRadius: 10, color: "#0A0A0C" }}>{link.label}</a>
            ) : link.type === "anchor" ? (
              <a key={i} href={"/" + link.href} className="prop-nav-link">{link.label}</a>
            ) : (
              <Link key={i} href={link.href} className="prop-nav-link">{link.label}</Link>
            )
          )}
          <Link href="/properties" className="prop-nav-link accent" style={{ fontWeight: 600 }}>العقارات</Link>
          <Link href="/login" className="prop-nav-link" style={{ fontSize: 12, borderRight: "1px solid rgba(201,168,76,0.12)", paddingRight: 16, marginRight: -8, color: "#5A5A62" }}>{loginText}</Link>
        </div>
      </nav>

      <main style={{ minHeight: "calc(100vh - 72px)" }}>
        {children}
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#111114", borderTop: "1px solid rgba(201,168,76,0.12)", padding: "48px 48px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, flexWrap: "wrap", marginBottom: 32 }}>
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              <div className="accent-bg flex items-center justify-center font-kufi font-black" style={{ width: 40, height: 40, borderRadius: 10, fontSize: 18, color: "#0A0A0C" }}>إ</div>
              <span className="font-kufi font-extrabold" style={{ fontSize: 16, color: "#F5F5F5" }}>{siteName}</span>
            </div>
            <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8, maxWidth: 280 }}>{footerText}</p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="font-kufi" style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#F5F5F5" }}>التنقل</p>
              <div className="flex flex-col gap-2">
                <Link href="/" className="prop-nav-link" style={{ fontSize: 13 }}>الرئيسية</Link>
                <Link href="/properties" className="prop-nav-link accent" style={{ fontSize: 13, fontWeight: 600 }}>العقارات</Link>
              </div>
            </div>
            <div>
              <p className="font-kufi" style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#F5F5F5" }}>التواصل</p>
              <div className="flex flex-col gap-2">
                {whatsapp && <a href={"https://wa.me/" + whatsapp} target="_blank" rel="noopener noreferrer" className="prop-nav-link" style={{ fontSize: 13 }}>واتساب</a>}
                {phone && <a href={"tel:" + phone} className="prop-nav-link" style={{ fontSize: 13 }}>{phone}</a>}
                <Link href="/" className="prop-nav-link flex items-center gap-1" style={{ fontSize: 13 }}><ExternalLink size={12} /> الموقع الرئيسي</Link>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 24, borderTop: "1px solid rgba(201,168,76,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#5A5A62" }}>
          <span>© {year} {siteName}. جميع الحقوق محفوظة.</span>
          {falLicense && <span className="accent">رخصة فال — {falLicense}</span>}
        </div>
      </footer>
    </div>
  );
}
