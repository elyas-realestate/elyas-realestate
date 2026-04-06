"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MapPin, Phone, Share2, ArrowRight, Maximize2, Bed, Bath, Layers, ChevronLeft, ChevronRight, X } from "lucide-react";
import SARIcon from "../../components/SARIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PropertyDetail() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("properties").select("*").eq("id", params.id as string).eq("is_published", true).single(),
      supabase.from("site_settings").select("*").single(),
    ]).then(([{ data: prop }, { data: s }]) => {
      setProperty(prop);
      setSettings(s);
      setLoading(false);
    });
  }, [params.id]);

  const images: string[] = (() => {
    if (!property) return [];
    const arr: string[] = property.images || [];
    if (property.main_image && !arr.includes(property.main_image)) return [property.main_image, ...arr];
    return arr.filter(Boolean);
  })();

  const prev = useCallback(() => setActiveImg(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActiveImg(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  next();
      if (e.key === "ArrowRight") prev();
      if (e.key === "Escape")     setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, prev, next]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleWhatsApp() {
    const phone = (property?.contact_phone || settings?.whatsapp || "").replace(/^\+/, "").replace(/^0/, "966");
    if (!phone) return;
    const msg = encodeURIComponent(property.title + "\n" + window.location.href);
    window.open("https://wa.me/" + phone + "?text=" + msg, "_blank");
  }

  function handleCall() {
    const p = property?.contact_phone || settings?.phone || "";
    if (p) window.location.href = "tel:" + p;
  }

  if (loading) return (
    <div dir="rtl" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Tajawal', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#C6914C" }}>
        <div style={{ width: 20, height: 20, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span>جاري التحميل...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!property) return (
    <div dir="rtl" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Tajawal', sans-serif", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🏚️</div>
      <p className="font-kufi" style={{ fontSize: 20, fontWeight: 700, color: "#F5F5F5", marginBottom: 8 }}>العقار غير موجود</p>
      <p style={{ fontSize: 14, color: "#5A5A62", marginBottom: 24 }}>ربما تم حذفه أو إيقاف نشره</p>
      <Link href="/properties" style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)", color: "#0A0A0C", textDecoration: "none", padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
        العودة للعقارات
      </Link>
    </div>
  );

  const hasContact = property.contact_phone || settings?.whatsapp || settings?.phone;
  const price = property.price ? Number(property.price).toLocaleString("ar-SA") : null;
  const specs = [
    property.land_area  && { icon: <Maximize2 size={18} />, label: "مساحة الأرض",  value: property.land_area + " م²" },
    property.built_area && { icon: <Maximize2 size={18} />, label: "مسطح البناء",  value: property.built_area + " م²" },
    property.rooms      && { icon: <Bed size={18} />,       label: "غرف النوم",    value: property.rooms },
    property.bathrooms  && { icon: <Bath size={18} />,      label: "دورات المياه", value: property.bathrooms },
    property.floors     && { icon: <Layers size={18} />,    label: "الأدوار",      value: property.floors },
  ].filter(Boolean) as any[];

  return (
    <div dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .prop-fade { animation: fadeIn 0.45s ease-out both; }
        .thumb-item { transition: all 0.2s; cursor: pointer; flex-shrink: 0; }
        .thumb-item:hover { opacity: 0.85; }
        .nav-btn { transition: all 0.2s; }
        .nav-btn:hover { background: rgba(198,145,76,0.25) !important; }
        .action-btn { transition: all 0.25s; }
        .action-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .lightbox-nav:hover { background: rgba(198,145,76,0.2) !important; }
      `}</style>

      {/* ═══ BREADCRUMB ═══ */}
      <div style={{ background: "#111114", borderBottom: "1px solid rgba(198,145,76,0.08)", padding: "12px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5A5A62" }}>
          <Link href="/" style={{ color: "#5A5A62", textDecoration: "none" }}>الرئيسية</Link>
          <ChevronLeft size={13} />
          <Link href="/properties" style={{ color: "#5A5A62", textDecoration: "none" }}>العقارات</Link>
          <ChevronLeft size={13} />
          <span style={{ color: "#9A9AA0" }} className="truncate">{property.title}</span>
        </div>
      </div>

      {/* ═══ GALLERY — FULL WIDTH ═══ */}
      {images.length > 0 && (
        <div style={{ background: "#0A0A0C", borderBottom: "1px solid rgba(198,145,76,0.1)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>

            {/* Main image */}
            <div style={{ position: "relative", borderRadius: "0 0 20px 20px", overflow: "hidden", background: "#111114" }}
              onClick={() => setLightbox(true)}>
              <div style={{ height: "clamp(320px, 56vw, 600px)", cursor: "zoom-in" }}>
                <img
                  key={activeImg}
                  src={images[activeImg]}
                  alt={property.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", animation: "fadeIn 0.3s ease-out" }}
                />
              </div>

              {/* Offer badge */}
              <div style={{ position: "absolute", top: 20, right: 20 }}>
                <span style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)", color: "#0A0A0C", fontSize: 13, fontWeight: 700, padding: "7px 18px", borderRadius: 10 }}>
                  {property.offer_type === "بيع" ? "للبيع" : property.offer_type === "إيجار" ? "للإيجار" : property.offer_type || "متاح"}
                </span>
              </div>

              {/* Counter */}
              {images.length > 1 && (
                <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(10,10,12,0.75)", color: "#9A9AA0", fontSize: 12, padding: "5px 14px", borderRadius: 20, backdropFilter: "blur(8px)", letterSpacing: 1 }}>
                  {activeImg + 1} / {images.length}
                </div>
              )}

              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); prev(); }} className="nav-btn"
                    style={{ position: "absolute", top: "50%", right: 16, transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(10,10,12,0.65)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)" }}>
                    <ChevronRight size={20} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); next(); }} className="nav-btn"
                    style={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(10,10,12,0.65)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)" }}>
                    <ChevronLeft size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 10, padding: "14px 0 16px", overflowX: "auto", scrollbarWidth: "none" }}>
                {images.map((img, i) => (
                  <div key={i} className="thumb-item" onClick={() => setActiveImg(i)}
                    style={{ width: 100, height: 70, borderRadius: 10, overflow: "hidden", border: "2px solid " + (activeImg === i ? "#C6914C" : "rgba(198,145,76,0.1)"), flexShrink: 0, boxShadow: activeImg === i ? "0 0 0 2px rgba(198,145,76,0.25)" : "none" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 48px" }} className="prop-fade">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 36, alignItems: "start" }}>

          {/* LEFT */}
          <div>
            {/* Badges + Title */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {property.sub_category && (
                  <span style={{ background: "rgba(198,145,76,0.1)", color: "#C6914C", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(198,145,76,0.2)" }}>
                    {property.sub_category}
                  </span>
                )}
                {property.main_category && (
                  <span style={{ background: "#1C1C22", color: "#9A9AA0", fontSize: 12, padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(198,145,76,0.08)" }}>
                    {property.main_category}
                  </span>
                )}
              </div>
              <h1 className="font-kufi" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, color: "#F5F5F5", lineHeight: 1.35, marginBottom: 12 }}>
                {property.title}
              </h1>
              {(property.district || property.city) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9A9AA0" }}>
                  <MapPin size={15} style={{ color: "#C6914C", flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>{[property.district, property.city].filter(Boolean).join("، ")}</span>
                </div>
              )}
            </div>

            {/* Specs */}
            {specs.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
                {specs.map((spec: any, i: number) => (
                  <div key={i} style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)", borderRadius: 14, padding: "16px 14px", textAlign: "center" }}>
                    <div style={{ color: "#C6914C", marginBottom: 8, display: "flex", justifyContent: "center" }}>{spec.icon}</div>
                    <div className="font-kufi" style={{ fontSize: 20, fontWeight: 800, color: "#F5F5F5", marginBottom: 4 }}>{spec.value}</div>
                    <div style={{ fontSize: 11, color: "#5A5A62" }}>{spec.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", borderRadius: 16, padding: "22px 24px", marginBottom: 20 }}>
                <h3 className="font-kufi" style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#C6914C" }}>تفاصيل العقار</h3>
                <p style={{ fontSize: 14.5, color: "#9A9AA0", lineHeight: 1.9, whiteSpace: "pre-line" }}>{property.description}</p>
              </div>
            )}

            {/* Map */}
            {property.location_url && (
              <a href={property.location_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 12, background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", color: "#9A9AA0", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
                <MapPin size={15} style={{ color: "#C6914C" }} />
                الموقع على الخريطة
              </a>
            )}
          </div>

          {/* RIGHT — Sticky Card */}
          <div style={{ position: "sticky", top: 88 }}>
            <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.18)", borderRadius: 20, overflow: "hidden" }}>

              {/* Price */}
              <div style={{ background: "linear-gradient(135deg, rgba(198,145,76,0.07), transparent)", padding: "22px 24px", borderBottom: "1px solid rgba(198,145,76,0.1)" }}>
                {price ? (
                  <>
                    <div style={{ fontSize: 11, color: "#5A5A62", marginBottom: 6, letterSpacing: 0.5 }}>السعر</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="font-kufi" style={{ fontSize: 30, fontWeight: 900, color: "#C6914C" }}>{price}</span>
                      <SARIcon size={18} color="accent" />
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#9A9AA0" }}>السعر عند التواصل</div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {hasContact && (
                  <>
                    <button onClick={handleWhatsApp} className="action-btn"
                      style={{ width: "100%", padding: "15px", borderRadius: 14, background: "linear-gradient(135deg, #25D366, #128C7E)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Tajawal', sans-serif" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      تواصل عبر واتساب
                    </button>
                    <button onClick={handleCall} className="action-btn"
                      style={{ width: "100%", padding: "13px", borderRadius: 14, background: "#1C1C22", border: "1px solid rgba(198,145,76,0.15)", color: "#F5F5F5", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Tajawal', sans-serif" }}>
                      <Phone size={17} style={{ color: "#C6914C" }} />
                      اتصال مباشر
                    </button>
                  </>
                )}
                <button onClick={handleShare} className="action-btn"
                  style={{ width: "100%", padding: "11px", borderRadius: 12, background: copied ? "rgba(74,222,128,0.08)" : "transparent", border: "1px solid " + (copied ? "rgba(74,222,128,0.2)" : "rgba(198,145,76,0.08)"), color: copied ? "#4ADE80" : "#5A5A62", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Tajawal', sans-serif", transition: "all 0.3s" }}>
                  <Share2 size={14} />
                  {copied ? "تم نسخ الرابط ✓" : "مشاركة الإعلان"}
                </button>
              </div>

              {/* Agent */}
              <div style={{ borderTop: "1px solid rgba(198,145,76,0.08)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #C6914C, #A6743A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0C", fontSize: 15, fontWeight: 900, flexShrink: 0, fontFamily: "'Noto Kufi Arabic', serif" }}>إ</div>
                <div>
                  <p className="font-kufi" style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F5", marginBottom: 2 }}>{settings?.site_name || "إلياس الدخيل"}</p>
                  <p style={{ fontSize: 11, color: "#5A5A62" }}>وسيط عقاري مرخّص{settings?.fal_license ? " — " + settings.fal_license : ""}</p>
                </div>
              </div>
            </div>

            <Link href="/properties" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, color: "#5A5A62", textDecoration: "none", fontSize: 13, justifyContent: "center" }}>
              <ArrowRight size={14} />
              العودة لجميع العقارات
            </Link>
          </div>

        </div>
      </div>

      {/* ═══ LIGHTBOX ═══ */}
      {lightbox && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.96)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)}
            style={{ position: "absolute", top: 20, left: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
          <img src={images[activeImg]} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} className="lightbox-nav"
                style={{ position: "absolute", top: "50%", right: 20, transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={24} />
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }} className="lightbox-nav"
                style={{ position: "absolute", top: "50%", left: 20, transform: "translateY(-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={24} />
              </button>
              <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
                {images.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setActiveImg(i); }}
                    style={{ width: i === activeImg ? 24 : 8, height: 8, borderRadius: 4, background: i === activeImg ? "#C6914C" : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", transition: "all 0.25s", padding: 0 }} />
                ))}
              </div>
            </>
          )}
          <div style={{ position: "absolute", top: 20, right: 20, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            {activeImg + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
