// ══════════════════════════════════════════════════════════════
// Portal Adapters — مُنسّقات نصوص جاهزة للنشر على المنصّات
// كل منصة لها متطلبات مختلفة: طول النص، hashtags، emojis، روابط
// ══════════════════════════════════════════════════════════════

export type PortalId =
  | "aqar"       // عقار.كوم
  | "bayut"      // بيوت
  | "srett"      // سريتا
  | "twitter"    // تويتر / X
  | "whatsapp"   // واتساب
  | "instagram"  // انستغرام
  | "facebook"   // فيسبوك
  | "other";

export interface PortalMeta {
  id: PortalId;
  name: string;
  nameEn: string;
  icon: string;           // emoji representation
  maxLength?: number;     // حد الأحرف (لو وُجد)
  supportsImages: boolean;
  directUrl?: string;     // رابط إضافة إعلان جديد
  hint?: string;          // تلميح للوسيط
}

export const PORTALS: PortalMeta[] = [
  { id: "aqar",      name: "عقار.كوم",  nameEn: "Aqar",     icon: "🏢", supportsImages: true,  directUrl: "https://sa.aqar.fm/إضافة-عقار", hint: "بوّابة رسمية — إدخال يدوي حالياً" },
  { id: "bayut",     name: "بيوت",       nameEn: "Bayut",    icon: "🏘️", supportsImages: true,  directUrl: "https://www.bayut.sa/",         hint: "إدخال يدوي — واجه ExaStaff للشركاء" },
  { id: "srett",     name: "سريتا",      nameEn: "SRETT",    icon: "🏙️", supportsImages: true,  directUrl: "https://srett.com/",            hint: "منصة سعودية" },
  { id: "twitter",   name: "تويتر / X", nameEn: "Twitter",  icon: "𝕏",  supportsImages: true,  maxLength: 280 },
  { id: "whatsapp",  name: "واتساب",     nameEn: "WhatsApp", icon: "💬", supportsImages: true  },
  { id: "instagram", name: "انستغرام",  nameEn: "Instagram", icon: "📸", supportsImages: true,  maxLength: 2200 },
  { id: "facebook",  name: "فيسبوك",     nameEn: "Facebook", icon: "📘", supportsImages: true  },
  { id: "other",     name: "أخرى",        nameEn: "Other",    icon: "🔗", supportsImages: true  },
];

// ── بيانات العقار المطلوبة من adapter ──
export interface PropertyForDistribution {
  id: string;
  title: string;
  code?: string | null;
  main_category?: string | null;  // سكني | تجاري | أرض
  sub_category?: string | null;   // فيلا | شقة | عمارة ...
  offer_type?: string | null;     // بيع | إيجار | استثمار
  city?: string | null;
  district?: string | null;
  price?: number | null;
  land_area?: number | null;
  rooms?: number | null;
  description?: string | null;
  images?: string[] | null;
  main_image?: string | null;
  broker_phone?: string;
  broker_name?: string;
  fal_license?: string;
  public_url?: string;            // https://yoursite.com/property/{code}
}

function money(n: number | null | undefined): string {
  if (!n) return "—";
  return Number(n).toLocaleString("ar-SA");
}

function fmtLine(label: string, value: unknown): string {
  if (!value || value === "—") return "";
  return `${label}: ${value}\n`;
}

// ══════════════════════════════════════════════════════════════
// الـ Adapters
// ══════════════════════════════════════════════════════════════

// ── Aqar.com — إدخال يدوي، نص تفصيلي طويل ──
function aqarAdapter(p: PropertyForDistribution): string {
  const lines: string[] = [];
  lines.push(`🏷️ ${p.title}`);
  lines.push("");
  if (p.code) lines.push(`كود العقار: ${p.code}`);
  if (p.sub_category) lines.push(`النوع: ${p.sub_category}${p.main_category ? ` (${p.main_category})` : ""}`);
  if (p.offer_type) lines.push(`للـ ${p.offer_type}`);
  if (p.city || p.district) lines.push(`الموقع: ${[p.district, p.city].filter(Boolean).join("، ")}`);
  if (p.land_area) lines.push(`المساحة: ${money(p.land_area)} م²`);
  if (p.rooms) lines.push(`عدد الغرف: ${p.rooms}`);
  if (p.price) lines.push(`السعر: ${money(p.price)} ريال`);
  lines.push("");
  if (p.description) {
    lines.push("📝 الوصف:");
    lines.push(p.description);
    lines.push("");
  }
  lines.push("─────────────");
  if (p.broker_name) lines.push(`👤 ${p.broker_name}`);
  if (p.fal_license) lines.push(`🪪 رخصة فال: ${p.fal_license}`);
  if (p.broker_phone) lines.push(`📞 ${p.broker_phone}`);
  if (p.public_url) lines.push(`🔗 ${p.public_url}`);
  return lines.join("\n");
}

// ── Bayut — مشابه لكن أقل emoji ──
function bayutAdapter(p: PropertyForDistribution): string {
  const lines: string[] = [];
  lines.push(p.title);
  lines.push("");
  if (p.code)         lines.push(`Code: ${p.code}`);
  if (p.sub_category) lines.push(`Type: ${p.sub_category}`);
  if (p.offer_type)   lines.push(`Listing: ${p.offer_type}`);
  if (p.city || p.district) lines.push(`Location: ${[p.district, p.city].filter(Boolean).join(", ")}`);
  if (p.land_area)    lines.push(`Area: ${money(p.land_area)} sqm`);
  if (p.rooms)        lines.push(`Bedrooms: ${p.rooms}`);
  if (p.price)        lines.push(`Price: SAR ${money(p.price)}`);
  lines.push("");
  if (p.description) {
    lines.push("Description:");
    lines.push(p.description);
    lines.push("");
  }
  if (p.broker_phone) lines.push(`Contact: ${p.broker_phone}`);
  if (p.fal_license)  lines.push(`FAL License: ${p.fal_license}`);
  return lines.join("\n");
}

// ── Twitter/X — 280 حرف مع hashtags ──
function twitterAdapter(p: PropertyForDistribution): string {
  const city = p.city || "";
  const price = p.price ? `${money(p.price)} ر.س` : "";
  const type = p.sub_category || p.main_category || "عقار";
  const offer = p.offer_type || "للبيع";

  const tags: string[] = ["#عقار", "#سعودي"];
  if (p.city) tags.push(`#${p.city.replace(/\s/g, "_")}`);
  if (p.offer_type === "إيجار") tags.push("#إيجار");
  else tags.push("#للبيع");

  const line1 = `🏡 ${type} ${offer}${city ? " في " + city : ""}`;
  const line2 = [
    p.rooms ? `${p.rooms} غرف` : null,
    p.land_area ? `${money(p.land_area)} م²` : null,
    price ? `السعر: ${price}` : null,
  ].filter(Boolean).join(" • ");
  const line3 = p.public_url || (p.broker_phone ? `للتواصل: ${p.broker_phone}` : "");

  const parts = [line1];
  if (line2) parts.push(line2);
  if (line3) parts.push(line3);
  parts.push(tags.join(" "));

  let text = parts.join("\n");
  if (text.length > 280) {
    // قصّ الوصف
    const overflow = text.length - 280 + 3;
    text = text.slice(0, text.length - overflow) + "…";
  }
  return text;
}

// ── WhatsApp — مع emojis وروابط مباشرة ──
function whatsappAdapter(p: PropertyForDistribution): string {
  const lines: string[] = [];
  lines.push(`*${p.title}*`);
  lines.push("");
  if (p.code)         lines.push(`🏷️ كود: ${p.code}`);
  if (p.sub_category) lines.push(`🏡 ${p.sub_category}${p.offer_type ? " - " + p.offer_type : ""}`);
  if (p.city || p.district) lines.push(`📍 ${[p.district, p.city].filter(Boolean).join("، ")}`);
  if (p.land_area)    lines.push(`📐 المساحة: ${money(p.land_area)} م²`);
  if (p.rooms)        lines.push(`🛏️ ${p.rooms} غرف`);
  if (p.price)        lines.push(`💰 *${money(p.price)} ريال*`);
  lines.push("");
  if (p.description) {
    lines.push(p.description);
    lines.push("");
  }
  if (p.broker_phone) lines.push(`📞 للتواصل: ${p.broker_phone}`);
  if (p.public_url)   lines.push(`🔗 ${p.public_url}`);
  return lines.join("\n");
}

// ── Instagram — hashtags كثيرة في النهاية ──
function instagramAdapter(p: PropertyForDistribution): string {
  const lines: string[] = [];
  lines.push(`🏡 ${p.title}`);
  lines.push("");
  if (p.sub_category && p.offer_type) lines.push(`${p.sub_category} ${p.offer_type}`);
  if (p.city || p.district) lines.push(`📍 ${[p.district, p.city].filter(Boolean).join("، ")}`);
  if (p.rooms)        lines.push(`🛏️ ${p.rooms} غرف`);
  if (p.land_area)    lines.push(`📐 ${money(p.land_area)} م²`);
  if (p.price)        lines.push(`💰 ${money(p.price)} ريال`);
  lines.push("");
  if (p.description) lines.push(p.description);
  lines.push("");
  if (p.broker_phone) lines.push(`📞 ${p.broker_phone}`);
  lines.push("");
  lines.push("•••");
  lines.push("#عقارات #الرياض #جدة #الدمام #عقار_سعودي");
  if (p.city)         lines.push(`#${p.city.replace(/\s/g, "_")}`);
  if (p.offer_type === "إيجار") lines.push("#إيجار #للإيجار");
  else lines.push("#للبيع #استثمار_عقاري");
  if (p.sub_category) lines.push(`#${p.sub_category.replace(/\s/g, "_")}`);
  lines.push("#ريال_إستيت #real_estate_ksa");
  return lines.join("\n");
}

// ── Facebook — نص طويل بدون حد ──
function facebookAdapter(p: PropertyForDistribution): string {
  // نفس aqar لكن بدون خطوط فاصلة
  return aqarAdapter(p).replace("─────────────\n", "");
}

// ── عام — fallback ──
function genericAdapter(p: PropertyForDistribution): string {
  return aqarAdapter(p);
}

// ══════════════════════════════════════════════════════════════
// Registry
// ══════════════════════════════════════════════════════════════

const ADAPTERS: Record<PortalId, (p: PropertyForDistribution) => string> = {
  aqar:      aqarAdapter,
  bayut:     bayutAdapter,
  srett:     aqarAdapter,
  twitter:   twitterAdapter,
  whatsapp:  whatsappAdapter,
  instagram: instagramAdapter,
  facebook:  facebookAdapter,
  other:     genericAdapter,
};

export function formatForPortal(portal: PortalId, p: PropertyForDistribution): string {
  return (ADAPTERS[portal] || genericAdapter)(p);
}

export function getPortalMeta(portal: PortalId): PortalMeta {
  return PORTALS.find((x) => x.id === portal) || PORTALS[PORTALS.length - 1];
}
