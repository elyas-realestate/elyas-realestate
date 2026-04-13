"use client";
import { supabase } from "@/lib/supabase-browser";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ExternalLink, Menu, X } from "lucide-react";


export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("*").single().then(({ data }) => {
      if (data) setS(data);
    });
  }, []);

  const siteName    = s?.site_name      || "إلياس الدخيل";
  const heroBadge   = s?.hero_badge     || "وسيط عقاري مرخّص";
  const navbarLinks: any[] = s?.navbar_links || [];
  const loginText   = s?.login_link_text || "دخول الفريق";
  const whatsapp    = s?.whatsapp       || "";
  const phone       = s?.phone          || "";
  const footerText  = s?.footer_text    || "وسيط ومسوق عقاري مرخّص.";
  const falLicense  = s?.fal_license    || "";
  const siteLogo    = s?.site_logo      || "";
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#0A0A0C", color: "#F5F5F5", fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .accent { color: #C6914C; }
        .accent-bg { background: linear-gradient(135deg, #C6914C, #A6743A); }
        .prop-nav-link { color: #9A9AA0; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.3s; }
        .prop-nav-link:hover { color: #F5F5F5; }
        /* Mobile nav drawer */
        .prop-drawer {
          position: fixed; top: 72px; right: 0; left: 0; z-index: 49;
          background: rgba(16,16,20,0.98); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(198,145,76,0.12);
          padding: 12px 20px 20px;
          display: flex; flex-direction: column;
          opacity: 0; visibility: hidden; pointer-events: none;
          transform: translateY(-6px);
          transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s;
        }
        .prop-drawer.open { opacity: 1; visibility: visible; pointer-events: all; transform: translateY(0); }
        .prop-drawer a { padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 15px; color: #9A9AA0; text-decoration: none; display: block; }
        .prop-drawer a:last-child { border-bottom: none; }
        .prop-nav-desktop { display: flex; align-items: center; gap: 32px; }
        .prop-hamburger { display: none; background: none; border: 1px solid rgba(198,145,76,0.2); border-radius: 10px; padding: 8px 10px; cursor: pointer; color: #9A9AA0; }
        @media (max-width: 767px) {
          .prop-nav-desktop { display: none; }
          .prop-hamburger { display: flex; align-items: center; justify-content: center; }
          .prop-footer-grid { flex-direction: column !important; gap: 32px !important; }
          .prop-footer-nav { flex-direction: column !important; gap: 24px !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "rgba(22,22,26,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(198,145,76,0.12)" }}>
        <Link href="/" className="flex items-center gap-3 no-underline">
          {siteLogo ? (
            <img src={siteLogo} alt={siteName} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div className="accent-bg flex items-center justify-center font-kufi font-black" style={{ width: 40, height: 40, borderRadius: 10, fontSize: 18, color: "#0A0A0C", flexShrink: 0 }}>إ</div>
          )}
          <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
            <span className="font-kufi font-extrabold" style={{ fontSize: 16, color: "#F5F5F5" }}>{siteName}</span>
            <span className="accent" style={{ fontSize: 10, fontWeight: 500 }}>{heroBadge}</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="prop-nav-desktop">
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
          <Link href="/login" className="prop-nav-link" style={{ fontSize: 12, borderRight: "1px solid rgba(198,145,76,0.12)", paddingRight: 16, marginRight: -8, color: "#5A5A62" }}>{loginText}</Link>
        </div>

        {/* Hamburger */}
        <button className="prop-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="القائمة" style={{ minWidth: 40, minHeight: 40 }}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={"prop-drawer" + (menuOpen ? " open" : "")}>
        {navbarLinks.map((link: any, i: number) =>
          link.type === "anchor" ? (
            <a key={i} href={"/" + link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>
          ) : (
            <Link key={i} href={link.href} onClick={() => setMenuOpen(false)} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 15, color: "#9A9AA0", textDecoration: "none", display: "block" }}>{link.label}</Link>
          )
        )}
        <Link href="/properties" onClick={() => setMenuOpen(false)} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 15, color: "#C6914C", textDecoration: "none", display: "block", fontWeight: 600 }}>العقارات</Link>
        <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: "14px 0", fontSize: 14, color: "#5A5A62", textDecoration: "none", display: "block" }}>{loginText}</Link>
      </div>

      <main style={{ minHeight: "calc(100vh - 72px)" }}>
        {children}
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#111114", borderTop: "1px solid rgba(198,145,76,0.12)", padding: "48px 24px 28px" }}>
        <div className="prop-footer-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, flexWrap: "wrap", marginBottom: 32 }}>
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div className="accent-bg flex items-center justify-center font-kufi font-black" style={{ width: 36, height: 36, borderRadius: 8, fontSize: 16, color: "#0A0A0C" }}>إ</div>
              )}
              <span className="font-kufi font-extrabold" style={{ fontSize: 16, color: "#F5F5F5" }}>{siteName}</span>
            </div>
            <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8, maxWidth: 280 }}>{footerText}</p>
          </div>
          <div className="prop-footer-nav flex gap-12">
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
                <Link href="/" className="prop-nav-link flex items-center gap-1" style={{ fontSize: 13 }}><ExternalLink size={12} /> الرئيسية</Link>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 24, borderTop: "1px solid rgba(198,145,76,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 12, color: "#5A5A62" }}>
          <span>© {year} {siteName}. جميع الحقوق محفوظة.</span>
          {falLicense && <span className="accent">رخصة فال — {falLicense}</span>}
        </div>
      </footer>
    </div>
  );
}
