import { supabase } from "@/lib/supabase-browser";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import RequestForm from "./RequestForm";
import SocialIcon from "@/app/components/SocialIcon";
import ServiceIcon from "@/app/components/ServiceIcon";
import SARIcon from "@/app/components/SARIcon";

// 10 ثوان — كافٍ لتفادي ضغط القاعدة دون تأخير ملحوظ بعد تعديل الإعدادات
export const revalidate = 10;

// ⛔ كلمات محجوزة — يمنع /[slug] من اختطاف المسارات النظامية
// إذا طُلب /pricing مثلاً، نحوّله للقسم الصحيح في الـ landing
const RESERVED_SLUGS = new Set<string>([
  "pricing",
  "about",
  "privacy",
  "terms",
  "contact",
  "help",
  "support",
  "register",
  "login",
  "logout",
  "dashboard",
  "admin",
  "settings",
  "api",
  "docs",
  "blog",
  "news",
  "faq",
  "features",
  "team",
  "careers",
  "compare",
  "properties",
  "search",
  "favorites",
  "c", // مساحة /c/[slug] للبطاقات
]);

const RESERVED_REDIRECTS: Record<string, string> = {
  pricing: "/#pricing",
  about: "/#about",
  features: "/#features",
  contact: "/#contact",
};

// ══ جلب البيانات ══════════════════════════════════════════
async function getBrokerData(slug: string) {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, plan")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const tenantId = tenant?.id ?? null;

  const [settingsRes, identityRes, propertiesRes, countRes] = await Promise.all([
    tenantId
      ? supabase.from("site_settings").select("*").eq("tenant_id", tenantId).single()
      : supabase.from("site_settings").select("*").limit(1).single(),
    tenantId
      ? supabase.from("broker_identity").select("*").eq("tenant_id", tenantId).single()
      : supabase.from("broker_identity").select("*").limit(1).single(),
    tenantId
      ? supabase
          .from("properties")
          .select(
            "id, title, district, city, price, offer_type, sub_category, land_area, rooms, images"
          )
          .eq("tenant_id", tenantId)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(12)
      : supabase
          .from("properties")
          .select(
            "id, title, district, city, price, offer_type, sub_category, land_area, rooms, images"
          )
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(12),
    tenantId
      ? supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("is_published", true)
      : supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
  ]);

  return {
    s: settingsRes.data,
    identity: identityRes.data,
    properties: propertiesRes.data || [],
    totalProperties: countRes.count ?? 0,
    tenantId: tenantId ?? null,
  };
}

// ══ SEO Metadata ══════════════════════════════════════════
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Reserved slugs لا تحتاج metadata (سيُحوَّلون أو يعطون 404)
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return {};
  const { s, identity } = await getBrokerData(slug);
  const name = identity?.broker_name || s?.site_name || "وسيط عقاري";
  const bio = identity?.bio_short || s?.hero_subtitle || "وسيط عقاري مرخّص في الرياض";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waseet-pro.com";
  return {
    title: `${name} — وسيط عقاري مرخّص`,
    description: bio,
    alternates: { canonical: `${baseUrl}/${slug}` },
    openGraph: {
      title: `${name} — وسيط عقاري`,
      description: bio,
      url: `${baseUrl}/${slug}`,
      images: s?.hero_image ? [s.hero_image] : [],
      locale: "ar_SA",
      type: "profile",
    },
  };
}

// ══ الصفحة الرئيسية ══════════════════════════════════════
export default async function BrokerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // ⛔ Reserved slug guard — يمنع /pricing وأمثاله من اختطاف صفحة الوسيط
  const lowerSlug = slug.toLowerCase();
  if (RESERVED_SLUGS.has(lowerSlug)) {
    const redirectTarget = RESERVED_REDIRECTS[lowerSlug];
    if (redirectTarget) {
      redirect(redirectTarget);
    }
    notFound(); // باقي الـ reserved يرجع 404 إذا ما له redirect
  }

  const { s, identity, properties, totalProperties, tenantId } = await getBrokerData(slug);
  if (!s && !identity) notFound();

  const name = identity?.broker_name || s?.site_name || "وسيط عقاري";
  const badge =
    s?.hero_badge ||
    (identity?.fal_license ? `رخصة فال ${identity.fal_license}` : "وسيط عقاري مرخّص");
  const bioShort = identity?.bio_short || s?.hero_subtitle || "";
  const bioLong = identity?.bio_long || "";
  const specialization = identity?.specialization || "";
  const brokerPhoto = identity?.photo_url || "";
  const areas = (identity?.coverage_areas || []) as string[];
  const audiences = (identity?.target_audiences || []) as string[];
  const phone = s?.phone || "";
  const whatsapp = s?.whatsapp || "";
  const email = s?.email || "";
  const heroImage = s?.hero_image || "";
  const siteName = s?.site_name || name;
  const siteLogo = s?.site_logo || "";
  const services = (s?.services || []) as any[];
  const whyCards = (s?.why_cards || []) as any[];
  const socials: Record<string, string> = {
    x: s?.social_x || "",
    instagram: s?.social_instagram || "",
    tiktok: s?.social_tiktok || "",
    snapchat: s?.social_snapchat || "",
    linkedin: s?.social_linkedin || "",
    youtube: s?.social_youtube || "",
    threads: s?.social_threads || "",
    whatsapp: s?.social_whatsapp || "",
  };

  // helper: ينظّف القيمة لتفادي var() على الصفحة العامة (لا تملك CSS vars الداكنة)
  const clean = (v: any, fallback: string) => {
    if (!v || typeof v !== "string" || v.trim().startsWith("var(")) return fallback;
    return v;
  };

  // الألوان الافتراضية = الكريمي العقاري الفخم (الثيم الجديد)
  // الوسيط يستطيع تخصيصها من DB، لكن الافتراضي كريمي.
  const clrAccent = clean(s?.color_accent, "#C6914C");
  const clrAccentDark = clean(s?.color_accent_dark, "#A6743A");
  const clrBgPrimary = clean(s?.color_bg_primary, "#FAF7F2"); // كريمي
  const clrBgSecondary = clean(s?.color_bg_secondary, "#F0EBE0");
  const clrBgCard = clean(s?.color_bg_card, "#FFFFFF");
  const clrTextPrimary = clean(s?.color_text_primary, "#1A1206"); // بنّي داكن
  const clrTextSec = clean(s?.color_text_secondary, "#5A5044");
  const clrTextMuted = clean(s?.color_text_muted, "#6A6055");

  // helper: يحوّل hex → rgba بأمان (يدعم #RGB و #RRGGBB، يرجع fallback لو فشل)
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !hex.startsWith("#")) return `rgba(250,247,242,${alpha})`;
    let h = hex.replace("#", "");
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    if (h.length !== 6) return `rgba(250,247,242,${alpha})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(250,247,242,${alpha})`;
    return `rgba(${r},${g},${b},${alpha})`;
  };
  const fntHero = s?.font_size_hero || "clamp(2.2rem, 5vw, 3.8rem)";
  const fntSection = s?.font_size_section_title || "clamp(1.6rem, 3vw, 2.4rem)";
  const fntBody = s?.font_size_body || "15px";
  const fntSmall = s?.font_size_small || "13px";

  const hasSocials = Object.values(socials).some(Boolean);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waseet-pro.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: name,
    description: bioShort,
    url: `${baseUrl}/${slug}`,
    telephone: phone || undefined,
    email: email || undefined,
    image: heroImage || undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "SA",
      addressLocality: areas[0] || "الرياض",
    },
    areaServed: areas.map((a) => ({ "@type": "City", name: a })),
    hasOfferCatalog:
      properties.length > 0
        ? {
            "@type": "OfferCatalog",
            name: "العقارات المتاحة",
            numberOfItems: properties.length,
          }
        : undefined,
  };

  // تحجيم صورة Hero تلقائياً عبر معامل Unsplash لتحسين الأداء
  const optimizedHero =
    heroImage && heroImage.includes("unsplash.com")
      ? heroImage.replace(/[?&]w=\d+/, "").replace(/[?&]q=\d+/, "") +
        (heroImage.includes("?") ? "&" : "?") +
        "w=1600&q=75&auto=format&fit=crop"
      : heroImage;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {optimizedHero && <link rel="preload" as="image" href={optimizedHero} />}
      <div
        dir="rtl"
        style={{
          background: clrBgPrimary,
          color: clrTextPrimary,
          minHeight: "100vh",
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        <style>{`
          .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
          .accent { color: ${clrAccent}; }
          .accent-bg { background: linear-gradient(135deg, ${clrAccent}, ${clrAccentDark}); }
          .card { background: ${clrBgCard}; border: 1px solid color-mix(in srgb, ${clrAccent} 12%, transparent); border-radius: 16px; transition: all 0.35s cubic-bezier(0.16,1,0.3,1); }
          .card:hover { border-color: color-mix(in srgb, ${clrAccent} 28%, transparent); transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,0.32); }
          .dot-pattern { background-image: radial-gradient(color-mix(in srgb, ${clrAccent} 4%, transparent) 1px, transparent 1px); background-size: 40px 40px; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
          .fade-up { animation: fadeUp 0.7s ease-out both; }
          .d1{animation-delay:.1s} .d2{animation-delay:.22s} .d3{animation-delay:.34s} .d4{animation-delay:.46s}
          @media (max-width:767px) {
            .nav-links { display:none!important; }
            .hero-actions { flex-direction:column!important; align-items:stretch!important; }
            .hero-actions a { text-align:center; justify-content:center; }
            .section-pad { padding:64px 20px!important; }
            .prop-grid { grid-template-columns:1fr!important; }
            .why-grid  { grid-template-columns:1fr!important; }
            .svc-grid  { grid-template-columns:1fr!important; }
          }
        `}</style>

        {/* NAVBAR */}
        <nav
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            left: 0,
            zIndex: 50,
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            background: hexToRgba(clrBgPrimary, 0.88),
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid color-mix(in srgb, ${clrAccent} 10%, transparent)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {siteLogo ? (
              <img
                src={siteLogo}
                alt={siteName}
                style={{ width: 36, height: 36, borderRadius: 9, objectFit: "cover" }}
              />
            ) : (
              <div
                className="accent-bg font-kufi"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 900,
                  color: clrBgPrimary,
                }}
              >
                {name.charAt(0)}
              </div>
            )}
            <div style={{ lineHeight: 1.2 }}>
              <span
                className="font-kufi"
                style={{ fontSize: 15, fontWeight: 800, color: clrTextPrimary, display: "block" }}
              >
                {siteName}
              </span>
              {identity?.fal_license ? (
                <span style={{ fontSize: 10, color: clrAccent, fontWeight: 500 }}>
                  مرخّص فال — {identity.fal_license}
                </span>
              ) : (
                specialization && (
                  <span style={{ fontSize: 10, color: clrAccent, fontWeight: 500 }}>
                    {specialization}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {properties.length > 0 && (
              <a
                href="#properties"
                style={{ color: clrTextSec, textDecoration: "none", fontSize: 14, fontWeight: 500 }}
              >
                العقارات
              </a>
            )}
            {services.length > 0 && (
              <a
                href="#services"
                style={{ color: clrTextSec, textDecoration: "none", fontSize: 14, fontWeight: 500 }}
              >
                الخدمات
              </a>
            )}
            <a
              href="#contact"
              style={{ color: clrTextSec, textDecoration: "none", fontSize: 14, fontWeight: 500 }}
            >
              تواصل
            </a>
            <a
              href={`/api/vcard/${slug}`}
              download
              style={{
                color: clrTextSec,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                padding: "7px 14px",
                borderRadius: 8,
                border: `1px solid ${hexToRgba(clrAccent, 0.25)}`,
              }}
              title="حفظ بياناتي في contacts جوّالك"
            >
              📇 احفظ بياناتي
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="accent-bg"
                style={{
                  color: clrBgPrimary,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "9px 20px",
                  borderRadius: 9,
                }}
              >
                واتساب
              </a>
            )}
            <a
              href="/login"
              style={{
                color: clrTextSec,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                padding: "7px 14px",
                borderRadius: 8,
                border: `1px solid ${hexToRgba(clrAccent, 0.25)}`,
              }}
            >
              تسجيل دخول
            </a>
          </div>
        </nav>

        {/* HERO */}
        <section
          className="dot-pattern"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            paddingTop: 68,
          }}
        >
          {heroImage && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(180deg, ${hexToRgba(clrBgPrimary, 0.2)} 0%, ${hexToRgba(clrBgPrimary, 0.45)} 100%), url(${optimizedHero}) center/cover no-repeat`,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${clrAccent} 7%, transparent) 0%, transparent 65%)`,
              pointerEvents: "none",
            }}
          />
          <div
            className="fade-up"
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              maxWidth: 820,
              padding: "0 28px",
            }}
          >
            {brokerPhoto && (
              <div className="d1 fade-up" style={{ display: "inline-block", marginBottom: 24 }}>
                <img
                  src={brokerPhoto}
                  alt={name}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `3px solid color-mix(in srgb, ${clrAccent} 35%, transparent)`,
                    boxShadow: `0 0 0 6px color-mix(in srgb, ${clrAccent} 8%, transparent)`,
                  }}
                />
              </div>
            )}
            <div
              className="d1 fade-up accent"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                background: `color-mix(in srgb, ${clrAccent} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${clrAccent} 20%, transparent)`,
                borderRadius: 100,
                padding: "7px 18px",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  background: clrAccent,
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              {badge}
            </div>
            <h1
              className="font-kufi d2 fade-up"
              style={{
                fontSize: fntHero,
                fontWeight: 900,
                lineHeight: 1.25,
                marginBottom: 20,
                color: clrTextPrimary,
              }}
            >
              {name}
            </h1>
            {bioShort && (
              <p
                className="d3 fade-up"
                style={{
                  fontSize: fntBody,
                  color: clrTextSec,
                  lineHeight: 1.85,
                  maxWidth: 560,
                  margin: "0 auto 36px",
                }}
              >
                {bioShort}
              </p>
            )}
            {specialization && (
              <div
                className="d3 fade-up"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: clrTextSec,
                  background: `color-mix(in srgb, ${clrAccent} 6%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${clrAccent} 12%, transparent)`,
                  borderRadius: 10,
                  padding: "7px 16px",
                  marginBottom: 32,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={clrAccent}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M9 22v-4h6v4" />
                  <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
                </svg>
                {specialization}
                {areas.length > 0 && (
                  <>
                    {" "}
                    — <span style={{ color: clrAccent }}>{areas.slice(0, 3).join("، ")}</span>
                  </>
                )}
              </div>
            )}
            <div
              className="d4 fade-up hero-actions"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}
            >
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="accent-bg"
                  style={{
                    color: clrBgPrimary,
                    textDecoration: "none",
                    fontSize: 15,
                    fontWeight: 800,
                    padding: "14px 32px",
                    borderRadius: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  واتساب
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  style={{
                    color: clrTextPrimary,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "14px 24px",
                    borderRadius: 11,
                    border: `1px solid color-mix(in srgb, ${clrAccent} 15%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  اتصال
                </a>
              )}
              <a
                href="#request-form"
                className="accent-bg"
                style={{
                  color: clrBgPrimary,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "14px 24px",
                  borderRadius: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: 0.9,
                }}
              >
                طلب عقار
              </a>
            </div>

            {(totalProperties > 0 || areas.length > 0) && (
              <div
                className="d4 fade-up"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 0,
                  marginTop: 40,
                  flexWrap: "wrap",
                }}
              >
                {[
                  totalProperties > 0 && { value: `${totalProperties}+`, label: "عقار منشور" },
                  areas.length > 0 && { value: areas.length, label: "منطقة تغطية" },
                  identity?.fal_license && { value: "✓", label: "مرخّص فال" },
                ]
                  .filter(Boolean)
                  .map((stat: any, i, arr) => (
                    <div
                      key={i}
                      style={{
                        textAlign: "center",
                        padding: "16px 32px",
                        borderRight:
                          i < arr.length - 1
                            ? `1px solid color-mix(in srgb, ${clrAccent} 12%, transparent)`
                            : "none",
                      }}
                    >
                      <div
                        className="font-kufi accent"
                        style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}
                      >
                        {stat.value}
                      </div>
                      <div style={{ fontSize: 12, color: clrTextSec, marginTop: 5 }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* نبذة تفصيلية */}
        {bioLong && (
          <section
            style={{ padding: "80px 48px", background: clrBgSecondary }}
            className="section-pad"
          >
            <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
              <div
                className="accent"
                style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}
              >
                — من أنا —
              </div>
              <p
                style={{
                  fontSize: fntBody,
                  color: clrTextSec,
                  lineHeight: 2,
                  whiteSpace: "pre-line",
                }}
              >
                {bioLong}
              </p>
              {audiences.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginTop: 24,
                  }}
                >
                  {audiences.map((a, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        color: clrAccent,
                        background: `color-mix(in srgb, ${clrAccent} 8%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${clrAccent} 18%, transparent)`,
                        borderRadius: 100,
                        padding: "5px 14px",
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* لماذا أنا */}
        {whyCards.length > 0 && (
          <section
            style={{ padding: "90px 48px", background: clrBgPrimary }}
            className="section-pad"
          >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div
                  className="accent"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}
                >
                  — القيمة المضافة —
                </div>
                <h2
                  className="font-kufi"
                  style={{
                    fontSize: fntSection,
                    fontWeight: 800,
                    color: clrTextPrimary,
                    lineHeight: 1.3,
                  }}
                >
                  لماذا تختار {name.split(" ")[0]}؟
                </h2>
              </div>
              <div
                className="why-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 20,
                }}
              >
                {whyCards.map((card: any, i: number) => (
                  <div key={i} className="card" style={{ padding: "32px 28px" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        background: `color-mix(in srgb, ${clrAccent} 8%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${clrAccent} 14%, transparent)`,
                        borderRadius: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                        color: clrAccent,
                      }}
                    >
                      <ServiceIcon name={card.icon || "award"} size={22} />
                    </div>
                    <h3
                      className="font-kufi"
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        marginBottom: 10,
                        color: clrTextPrimary,
                      }}
                    >
                      {card.title}
                    </h3>
                    <p style={{ fontSize: fntBody, color: clrTextSec, lineHeight: 1.8 }}>
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* العقارات */}
        {properties.length > 0 && (
          <section
            id="properties"
            style={{ padding: "90px 48px", background: clrBgSecondary }}
            className="section-pad"
          >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div
                  className="accent"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}
                >
                  — عقارات ومشاريع مختارة —
                </div>
                <h2
                  className="font-kufi"
                  style={{
                    fontSize: fntSection,
                    fontWeight: 800,
                    color: clrTextPrimary,
                    lineHeight: 1.3,
                  }}
                >
                  لا نعرض كل شي — فقط اللي يستاهل
                </h2>
              </div>
              {(["مشروع", "بيع", "إيجار"] as const).map((type) => {
                const filtered =
                  type === "مشروع"
                    ? properties.filter(
                        (p: any) =>
                          p.offer_type === "مشروع" || (p.sub_category || "").includes("مشروع")
                      )
                    : type === "إيجار"
                      ? properties.filter((p: any) => p.offer_type === "إيجار")
                      : properties.filter(
                          (p: any) =>
                            p.offer_type !== "إيجار" &&
                            p.offer_type !== "مشروع" &&
                            !(p.sub_category || "").includes("مشروع")
                        );
                if (!filtered.length) return null;
                const labels: Record<string, { emoji: string; title: string }> = {
                  مشروع: { emoji: "building", title: "المشاريع العقارية" },
                  بيع: { emoji: "home", title: "عقارات للبيع" },
                  إيجار: { emoji: "key", title: "عقارات للإيجار" },
                };
                return (
                  <div key={type} style={{ marginBottom: 60 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}
                    >
                      <span style={{ color: clrAccent, display: "flex" }}>
                        <ServiceIcon name={labels[type].emoji} size={22} />
                      </span>
                      <h3
                        className="font-kufi"
                        style={{ fontSize: 20, fontWeight: 800, color: clrTextPrimary }}
                      >
                        {labels[type].title}
                      </h3>
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: `color-mix(in srgb, ${clrAccent} 15%, transparent)`,
                        }}
                      />
                    </div>
                    <div
                      className="prop-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: 22,
                      }}
                    >
                      {filtered.map((p: any) => (
                        <div
                          key={p.id}
                          className="card"
                          style={{ overflow: "hidden", color: clrTextPrimary }}
                        >
                          <div
                            style={{
                              height: 210,
                              overflow: "hidden",
                              position: "relative",
                              background: "var(--bg-surface-2)",
                            }}
                          >
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "100%",
                                  color: clrTextMuted,
                                }}
                              >
                                <ServiceIcon name={labels[type].emoji} size={48} />
                              </div>
                            )}
                            <span
                              style={{
                                position: "absolute",
                                top: 14,
                                right: 14,
                                background: type === "إيجار" ? "rgba(96,165,250,0.9)" : clrAccent,
                                color: type === "إيجار" ? "#fff" : clrBgPrimary,
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "4px 12px",
                                borderRadius: 7,
                              }}
                            >
                              {p.offer_type || type}
                            </span>
                          </div>
                          <div style={{ padding: 22 }}>
                            <h3
                              className="font-kufi"
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                marginBottom: 6,
                                color: clrTextPrimary,
                              }}
                            >
                              {p.title}
                            </h3>
                            <p style={{ fontSize: fntSmall, color: clrTextSec, marginBottom: 16 }}>
                              📍 {p.district}، {p.city}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                gap: 14,
                                paddingTop: 14,
                                borderTop: `1px solid color-mix(in srgb, ${clrAccent} 10%, transparent)`,
                                marginBottom: 14,
                              }}
                            >
                              {p.rooms && (
                                <span style={{ fontSize: 12, color: clrTextMuted }}>
                                  🛏 {p.rooms} غرف
                                </span>
                              )}
                              {p.land_area && (
                                <span style={{ fontSize: 12, color: clrTextMuted }}>
                                  📐 {p.land_area} م²
                                </span>
                              )}
                            </div>
                            {p.price && (
                              <div
                                className="font-kufi accent"
                                style={{
                                  fontSize: 20,
                                  fontWeight: 800,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span>{Number(p.price).toLocaleString("ar-SA")}</span>
                                <SARIcon size={14} color="accent" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* الخدمات */}
        {services.length > 0 && (
          <section
            id="services"
            style={{ padding: "90px 48px", background: clrBgPrimary }}
            className="section-pad"
          >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div
                  className="accent"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}
                >
                  — خدماتي —
                </div>
                <h2
                  className="font-kufi"
                  style={{
                    fontSize: fntSection,
                    fontWeight: 800,
                    color: clrTextPrimary,
                    lineHeight: 1.3,
                  }}
                >
                  خدمات عقارية متكاملة
                </h2>
              </div>
              <div
                className="svc-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 18,
                }}
              >
                {services.map((svc: any, i: number) => (
                  <div
                    key={i}
                    className="card"
                    style={{ padding: "30px 24px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        margin: "0 auto 18px",
                        background: `color-mix(in srgb, ${clrAccent} 6%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${clrAccent} 12%, transparent)`,
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: clrAccent,
                      }}
                    >
                      <ServiceIcon name={svc.icon || "home"} size={26} />
                    </div>
                    <h3
                      className="font-kufi"
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        marginBottom: 8,
                        color: clrTextPrimary,
                      }}
                    >
                      {svc.title}
                    </h3>
                    <p style={{ fontSize: fntSmall, color: clrTextSec, lineHeight: 1.7 }}>
                      {svc.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* نموذج طلب عقار */}
        {tenantId && (
          <section
            id="request-form"
            style={{ padding: "90px 48px", background: clrBgPrimary }}
            className="section-pad"
          >
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div
                  className="accent"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}
                >
                  — أرسل طلبك —
                </div>
                <h2
                  className="font-kufi"
                  style={{
                    fontSize: fntSection,
                    fontWeight: 900,
                    color: clrTextPrimary,
                    lineHeight: 1.3,
                    marginBottom: 12,
                  }}
                >
                  أخبرني عن العقار الذي تبحث عنه
                </h2>
                <p style={{ fontSize: fntBody, color: clrTextSec, lineHeight: 1.8 }}>
                  سأبحث لك عن أفضل الخيارات وأتواصل معك مباشرة.
                </p>
              </div>
              <RequestForm
                tenantId={tenantId}
                accentColor={clrAccent}
                accentDark={clrAccentDark}
                bgCard={clrBgCard}
                bgPrimary={clrBgPrimary}
                textPrimary={clrTextPrimary}
                textSecondary={clrTextSec}
                fontBody={fntBody}
              />
            </div>
          </section>
        )}

        {/* تواصل */}
        <section
          id="contact"
          style={{
            padding: "90px 48px",
            background: clrBgSecondary,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
          className="section-pad"
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at 50% 50%, color-mix(in srgb, ${clrAccent} 5%, transparent) 0%, transparent 65%)`,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
            <div
              className="accent"
              style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}
            >
              — تواصل معي —
            </div>
            <h2
              className="font-kufi"
              style={{
                fontSize: fntSection,
                fontWeight: 900,
                color: clrTextPrimary,
                lineHeight: 1.3,
                marginBottom: 16,
              }}
            >
              {s?.cta_title || "عندك عقار أو تبحث عن واحد؟"}
            </h2>
            <p style={{ fontSize: fntBody, color: clrTextSec, lineHeight: 1.85, marginBottom: 36 }}>
              {s?.cta_subtitle || "تواصل معي مباشرة وخلنا نختصر عليك الطريق."}
            </p>
            <div
              className="hero-actions"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="accent-bg"
                  style={{
                    color: clrBgPrimary,
                    textDecoration: "none",
                    fontSize: 15,
                    fontWeight: 800,
                    padding: "14px 32px",
                    borderRadius: 11,
                  }}
                >
                  واتساب
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  style={{
                    color: clrTextPrimary,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "14px 28px",
                    borderRadius: 11,
                    border: `1px solid color-mix(in srgb, ${clrAccent} 15%, transparent)`,
                  }}
                >
                  اتصال
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  style={{
                    color: clrTextPrimary,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "14px 28px",
                    borderRadius: 11,
                    border: `1px solid color-mix(in srgb, ${clrAccent} 15%, transparent)`,
                  }}
                >
                  بريد إلكتروني
                </a>
              )}
            </div>

            {/* ⭐ زر "احفظ في جهات اتصالك" — بارز ومميّز */}
            <div style={{ maxWidth: 460, margin: `0 auto ${hasSocials ? 40 : 0}px` }}>
              <a
                href={`/api/vcard/${slug}`}
                download={`${name}.vcf`}
                title="احفظ بياناتي في جهات الاتصال — iPhone · Android · Huawei"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: "16px 22px",
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${clrAccent} 0%, color-mix(in srgb, ${clrAccent} 80%, #000) 100%)`,
                  color: clrBgPrimary,
                  fontSize: 16,
                  fontWeight: 800,
                  textDecoration: "none",
                  border: `1.5px solid color-mix(in srgb, ${clrAccent} 70%, #000)`,
                  boxShadow: `0 8px 24px color-mix(in srgb, ${clrAccent} 35%, transparent), 0 2px 6px rgba(0,0,0,0.08)`,
                  letterSpacing: "0.2px",
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "right",
                    flex: 1,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25 }}>
                    اضغط لحفظ في جهات اتصالك
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.88, marginTop: 2 }}>
                    iPhone · Android · Huawei — بضغطة واحدة
                  </span>
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, opacity: 0.9 }}>←</span>
              </a>
            </div>
            {hasSocials && (
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                {(
                  [
                    { key: "x", label: "X" },
                    { key: "instagram", label: "Instagram" },
                    { key: "tiktok", label: "TikTok" },
                    { key: "snapchat", label: "Snapchat" },
                    { key: "linkedin", label: "LinkedIn" },
                    { key: "youtube", label: "YouTube" },
                    { key: "threads", label: "Threads" },
                    { key: "facebook", label: "Facebook" },
                    { key: "whatsapp", label: "WhatsApp" },
                  ] as const
                )
                  .filter((s) => socials[s.key])
                  .map((s) => (
                    <a
                      key={s.key}
                      href={socials[s.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.label}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        background: `color-mix(in srgb, ${clrAccent} 7%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${clrAccent} 14%, transparent)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        color: clrTextPrimary,
                        transition: "all 0.2s",
                      }}
                    >
                      <SocialIcon name={s.key} size={18} color="current" />
                    </a>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            padding: "32px 48px",
            background: clrBgPrimary,
            borderTop: `1px solid color-mix(in srgb, ${clrAccent} 8%, transparent)`,
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="font-kufi"
                style={{ fontSize: 14, fontWeight: 700, color: clrTextMuted }}
              >
                {name}
              </span>
              {identity?.fal_license && (
                <span
                  style={{
                    fontSize: 11,
                    color: clrTextMuted,
                    borderRight: `1px solid color-mix(in srgb, ${clrAccent} 12%, transparent)`,
                    paddingRight: 8,
                  }}
                >
                  رخصة فال: {identity.fal_license}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 11, color: clrTextMuted }}>
                © {new Date().getFullYear()} جميع الحقوق محفوظة
              </span>
              <Link
                href="/"
                style={{
                  fontSize: 11,
                  color: `color-mix(in srgb, ${clrAccent} 60%, transparent)`,
                  textDecoration: "none",
                }}
              >
                وسيط برو
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
