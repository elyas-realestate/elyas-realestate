"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MapPin, Phone, Share2, ArrowRight, Maximize2, Bed, Bath, Images, ChevronLeft, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    Promise.all([
      supabase.from("properties").select("*").eq("id", params.id).eq("is_published", true).single(),
      supabase.from("site_settings").select("*").single(),
    ]).then(([{ data: prop }, { data: s }]) => {
      setProperty(prop);
      setSettings(s);
      setLoading(false);
    });
  }, [params.id]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleWhatsApp() {
    const contactPhone = property?.contact_phone || settings?.whatsapp || "";
    if (!contactPhone) return;
    const phone = contactPhone.replace(/^\+/, "").replace(/^0/, "966");
    const msg = encodeURIComponent(property.title + "\n" + window.location.href);
    window.open("https://wa.me/" + phone + "?text=" + msg, "_blank");
  }

  function handleCall() {
    const contactPhone = property?.contact_phone || settings?.phone || "";
    if (contactPhone) window.location.href = "tel:" + contactPhone;
  }

  if (loading) return (
    <div dir="rtl" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Tajawal', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#C6914C" }}>
        <div style={{ width: 20, height: 20, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
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
      <Link href="/properties" style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)", color: "#0A0A0C", textDecoration: "none", padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14, fontFamily: "'Tajawal', sans-serif" }}>العودة للعقارات</Link>
    </div>
  );

  const images: string[] = (property.images || []).filter(Boolean);
  if (property.main_image && !images.includes(property.main_image)) images.unshift(property.main_image);
  const hasContact = property.contact_phone || settings?.whatsapp || settings?.phone;
  const price = property.price ? Number(property.price).toLocaleString("ar-SA") : null;

  const specs = [
    property.land_area && { icon: "📐", label: "مساحة الأرض", value: property.land_area + " م²" },
    property.built_area && { icon: "🏗️", label: "مسطح البناء", value: property.built_area + " م²" },
    property.rooms && { icon: "🛏️", label: "غرف النوم", value: property.rooms },
    property.bathrooms && { icon: "🚿", label: "دورات المياه", value: property.bathrooms },
    property.floor && { icon: "🏢", label: "الدور", value: property.floor },
    property.age && { icon: "📅", label: "عمر البناء", value: property.age + " سنة" },
  ].filter(Boolean) as { icon: string; label: string; value: string | number }[];

  return (
    <div dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .detail-fade { animation: fadeIn 0.5s ease-out both; }
        .spec-card:hover { border-color: rgba(198,145,76,0.25) !important; background: rgba(198,145,76,0.04) !important; }
        .action-btn { transition: all 0.25s; }
        .action-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .thumb-btn:hover { border-color: rgba(198,145,76,0.5) !important; }
      `}</style>

      {/* ═══ BREADCRUMB ═══ */}
      <div style={{ background: "#111114", borderBottom: "1px solid rgba(198,145,76,0.08)", padding: "14px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5A5A62" }}>
          <Link href="/" style={{ color: "#5A5A62", textDecoration: "none", transition: "color 0.3s" }}>الرئيسية</Link>
          <ChevronLeft size={14} style={{ color: "#2A2A32" }} />
          <Link href="/properties" style={{ color: "#5A5A62", textDecoration: "none", transition: "color 0.3s" }}>العقارات</Link>
          <ChevronLeft size={14} style={{ color: "#2A2A32" }} />
          <span style={{ color: "#9A9AA0" }}>{property.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 48px" }} className="detail-fade">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>

          {/* ═══ LEFT COLUMN ═══ */}
          <div>
            {/* Image Gallery */}
            <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 24, background: "#16161A", border: "1px solid rgba(198,145,76,0.12)" }}>
              {images.length > 0 ? (
                <>
                  <div style={{ position: "relative", height: 440 }}>
                    <img src={images[activeImg]} alt={property.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {/* offer badge */}
                    <div style={{ position: "absolute", top: 20, right: 20 }}>
                      <span style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)", color: "#0A0A0C", fontSize: 13, fontWeight: 700, padding: "7px 16px", borderRadius: 10 }}>
                        {property.offer_type === "بيع" ? "للبيع" : property.offer_type === "إيجار" ? "للإيجار" : property.offer_type || "متاح"}
                      </span>
                    </div>
                    {/* nav arrows */}
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)} style={{ position: "absolute", top: "50%", right: 16, transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(10,10,12,0.7)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)" }}>
                          <ChevronRight size={18} />
                        </button>
                        <button onClick={() => setActiveImg(i => (i + 1) % images.length)} style={{ position: "absolute", top: "50%", left: 16, transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(10,10,12,0.7)", border: "1px solid rgba(201,168,201,0.2)", color: "#C6914C", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)" }}>
                          <ChevronLeft size={18} />
                        </button>
                      </>
                    )}
                    {/* counter */}
                    {images.length > 1 && (
                      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(10,10,12,0.75)", color: "#9A9AA0", fontSize: 12, padding: "4px 12px", borderRadius: 20, backdropFilter: "blur(8px)" }}>
                        {activeImg + 1} / {images.length}
                      </div>
                    )}
                  </div>
                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div style={{ display: "flex", gap: 8, padding: 12, overflowX: "auto" }}>
                      {images.map((img, i) => (
                        <button key={i} onClick={() => setActiveImg(i)} className="thumb-btn" style={{ flexShrink: 0, width: 72, height: 54, borderRadius: 8, overflow: "hidden", border: "2px solid " + (activeImg === i ? "#C6914C" : "rgba(198,145,76,0.08)"), cursor: "pointer", padding: 0, transition: "border-color 0.25s" }}>
                          <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ height: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#2A2A32" }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>🏠</div>
                  <span style={{ fontSize: 13, color: "#5A5A62" }}>لا توجد صور</span>
                </div>
              )}
            </div>

            {/* Title & Location */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {property.sub_category && (
                  <span style={{ background: "rgba(198,145,76,0.1)", color: "#C6914C", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(198,145,76,0.2)" }}>
                    {property.sub_category}
                  </span>
                )}
                {property.main_category && (
                  <span style={{ background: "#1C1C22", color: "#9A9AA0", fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(198,145,76,0.08)" }}>
                    {property.main_category}
                  </span>
                )}
              </div>
              <h1 className="font-kufi" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 800, color: "#F5F5F5", lineHeight: 1.35, marginBottom: 12 }}>
                {property.title}
              </h1>
              {(property.district || property.city) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9A9AA0" }}>
                  <MapPin size={16} style={{ color: "#C6914C", flexShrink: 0 }} />
                  <span style={{ fontSize: 14 }}>{[property.district, property.city].filter(Boolean).join("، ")}</span>
                </div>
              )}
            </div>

            {/* Specs Grid */}
            {specs.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
                {specs.map((spec, i) => (
                  <div key={i} className="spec-card" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)", borderRadius: 14, padding: "18px 16px", textAlign: "center", transition: "all 0.25s" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{spec.icon}</div>
                    <div className="font-kufi" style={{ fontSize: 18, fontWeight: 800, color: "#F5F5F5", marginBottom: 4 }}>{spec.value}</div>
                    <div style={{ fontSize: 11, color: "#5A5A62" }}>{spec.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", borderRadius: 16, padding: "24px 24px", marginBottom: 24 }}>
                <h3 className="font-kufi" style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#C6914C" }}>تفاصيل العقار</h3>
                <p style={{ fontSize: 14.5, color: "#9A9AA0", lineHeight: 1.9, whiteSpace: "pre-line" }}>{property.description}</p>
              </div>
            )}

            {/* Map / Gallery Links */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {property.location_url && (
                <a href={property.location_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 12, background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", color: "#9A9AA0", textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "all 0.25s" }}>
                  <MapPin size={15} style={{ color: "#C6914C" }} />
                  الموقع على الخريطة
                </a>
              )}
              {property.images_url && (
                <a href={property.images_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 12, background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", color: "#9A9AA0", textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "all 0.25s" }}>
                  <Images size={15} style={{ color: "#C6914C" }} />
                  مجلد الصور الكامل
                </a>
              )}
            </div>
          </div>

          {/* ═══ RIGHT COLUMN — Sticky Card ═══ */}
          <div style={{ position: "sticky", top: 92 }}>
            <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.18)", borderRadius: 20, overflow: "hidden" }}>
              {/* Price header */}
              <div style={{ background: "linear-gradient(135deg, rgba(198,145,76,0.08), rgba(166,138,58,0.04))", padding: "24px 24px", borderBottom: "1px solid rgba(198,145,76,0.1)" }}>
                {price ? (
                  <>
                    <div style={{ fontSize: 11, color: "#5A5A62", marginBottom: 6, letterSpacing: 0.5 }}>السعر</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span className="font-kufi" style={{ fontSize: 28, fontWeight: 900, color: "#C6914C" }}>{price}</span>
                      <SARIcon size={16} color="secondary" />
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#9A9AA0" }}>السعر عند التواصل</div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ padding: "20px 20px" }}>
                {hasContact && (
                  <>
                    <button onClick={handleWhatsApp} className="action-btn" style={{ width: "100%", padding: "16px", borderRadius: 14, marginBottom: 10, background: "linear-gradient(135deg, #25D366, #128C7E)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Tajawal', sans-serif" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      تواصل عبر واتساب
                    </button>
                    <button onClick={handleCall} className="action-btn" style={{ width: "100%", padding: "14px", borderRadius: 14, marginBottom: 10, background: "#1C1C22", border: "1px solid rgba(198,145,76,0.15)", color: "#F5F5F5", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Tajawal', sans-serif" }}>
                      <Phone size={18} style={{ color: "#C6914C" }} />
                      اتصال مباشر
                    </button>
                  </>
                )}
                <button onClick={handleShare} className="action-btn" style={{ width: "100%", padding: "12px", borderRadius: 12, background: copied ? "rgba(74,222,128,0.08)" : "transparent", border: "1px solid " + (copied ? "rgba(74,222,128,0.2)" : "rgba(198,145,76,0.08)"), color: copied ? "#4ADE80" : "#5A5A62", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Tajawal', sans-serif", transition: "all 0.3s" }}>
                  <Share2 size={15} />
                  {copied ? "تم نسخ الرابط ✓" : "مشاركة الإعلان"}
                </button>
              </div>

              {/* Agent info */}
              <div style={{ borderTop: "1px solid rgba(198,145,76,0.08)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #C6914C, #A6743A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0C", fontSize: 16, fontWeight: 900, flexShrink: 0, fontFamily: "'Noto Kufi Arabic', serif" }}>إ</div>
                <div>
                  <p className="font-kufi" style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F5", marginBottom: 2 }}>{settings?.site_name || "إلياس الدخيل"}</p>
                  <p style={{ fontSize: 11, color: "#5A5A62" }}>وسيط عقاري مرخّص{settings?.fal_license ? " — " + settings.fal_license : ""}</p>
                </div>
              </div>
            </div>

            {/* Back link */}
            <Link href="/properties" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, color: "#5A5A62", textDecoration: "none", fontSize: 13, justifyContent: "center", transition: "color 0.3s" }}>
              <ArrowRight size={14} />
              العودة لجميع العقارات
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
