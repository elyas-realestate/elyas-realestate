// ══════════════════════════════════════════════════════════════
// Schema.org JSON-LD Generators للقطاع العقاري
// يحسّن SEO + ظهور rich snippets في Google
// ══════════════════════════════════════════════════════════════

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elyas-realestate.vercel.app";

interface BrokerData {
  slug: string;
  name: string;
  photoUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  falLicense?: string | null;
  bio?: string | null;
  social?: Record<string, string | null | undefined>;
}

export function buildRealEstateAgentSchema(broker: BrokerData): Record<string, unknown> {
  const url = `${SITE_URL}/${broker.slug}`;
  const sameAs: string[] = [];

  if (broker.social) {
    const socialMap: Record<string, string> = {
      social_x: `https://x.com/`,
      social_instagram: `https://instagram.com/`,
      social_tiktok: `https://tiktok.com/@`,
      social_linkedin: `https://linkedin.com/in/`,
      social_youtube: `https://youtube.com/@`,
      social_facebook: `https://facebook.com/`,
      social_threads: `https://threads.net/@`,
    };
    for (const [key, base] of Object.entries(socialMap)) {
      const val = broker.social[key];
      if (val) {
        // إذا الـ value رابط كامل، استخدمه. وإلا أضف username للقاعدة
        sameAs.push(val.startsWith("http") ? val : `${base}${val}`);
      }
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": url,
    name: broker.name,
    url,
    image: broker.photoUrl || undefined,
    description: broker.bio || `${broker.name} — وسيط عقاري معتمد في ${broker.city || "السعودية"}`,
    telephone: broker.phone || broker.whatsapp || undefined,
    email: broker.email || undefined,
    address: broker.city
      ? {
          "@type": "PostalAddress",
          addressLocality: broker.city,
          addressRegion: broker.district,
          addressCountry: "SA",
        }
      : undefined,
    areaServed: broker.city
      ? {
          "@type": "City",
          name: broker.city,
        }
      : undefined,
    knowsLanguage: ["ar", "en"],
    hasCredential: broker.falLicense
      ? {
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "License",
          name: "رخصة فال",
          identifier: broker.falLicense,
        }
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

interface PropertyData {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  currency?: string;
  city?: string | null;
  district?: string | null;
  rooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  mainCategory?: string | null; // سكني / تجاري / أرض
  subCategory?: string | null; // فيلا / شقة / أرض
  offerType?: string | null; // بيع / إيجار
  images?: string[] | null;
  brokerSlug: string;
  brokerName: string;
}

export function buildRealEstateListingSchema(prop: PropertyData): Record<string, unknown> {
  const url = `${SITE_URL}/properties/${prop.id}`;
  const propertyType =
    prop.subCategory === "فيلا" || prop.subCategory === "شقة" || prop.subCategory === "بيت"
      ? "Residence"
      : prop.mainCategory === "تجاري"
        ? "CommercialBuilding"
        : prop.mainCategory === "أرض"
          ? "Place"
          : "Residence";

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": url,
    name: prop.title,
    url,
    description: prop.description || prop.title,
    image: prop.images && prop.images.length > 0 ? prop.images : undefined,
    datePosted: undefined, // يضاف عند الحاجة
    offers: prop.price
      ? {
          "@type": "Offer",
          price: prop.price,
          priceCurrency: prop.currency || "SAR",
          availability: "https://schema.org/InStock",
        }
      : undefined,
    address: prop.city
      ? {
          "@type": "PostalAddress",
          addressLocality: prop.city,
          addressRegion: prop.district,
          addressCountry: "SA",
        }
      : undefined,
    accommodationCategory: prop.subCategory || prop.mainCategory,
    numberOfRooms: prop.rooms || undefined,
    numberOfBathroomsTotal: prop.bathrooms || undefined,
    floorSize: prop.area
      ? {
          "@type": "QuantitativeValue",
          value: prop.area,
          unitCode: "MTK", // متر مربع
        }
      : undefined,
    additionalType: propertyType,
    broker: {
      "@type": "RealEstateAgent",
      name: prop.brokerName,
      url: `${SITE_URL}/${prop.brokerSlug}`,
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "وسيط برو",
    alternateName: "Wasit Pro",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description: "منصة إدارة عقارية متكاملة للوسطاء السعوديين",
    address: {
      "@type": "PostalAddress",
      addressCountry: "SA",
    },
    sameAs: ["https://x.com/wasitpro"],
  };
}
