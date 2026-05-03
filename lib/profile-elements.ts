// ══════════════════════════════════════════════════════════════
// lib/profile-elements.ts — كتالوج عناصر بطاقة الوسيط
//
// كل عنصر في "البطاقة" مُعرَّف هنا. الداشبورد يستخدمه لعرض المكتبة
// والفورمات، والصفحة العامة /c/[slug] تستخدمه للعرض.
//
// لإضافة نوع جديد: أضف entry في ELEMENTS، النظام كله يلتقطه تلقائياً.
// ══════════════════════════════════════════════════════════════

import type { LucideIcon } from "lucide-react";
import {
  // Social
  Twitter, Instagram, Music2, Camera, Linkedin, Youtube, Hash, Facebook,
  MessageCircle, Send, MapPin,
  // Contact
  Phone, Mail, MessageSquare, ClipboardList,
  // License & business
  Award, Shield, Briefcase, FileText, BadgeCheck, Building2,
  // Content
  Globe, Link2,
  // Dividers
  Type, Heading,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
export type ElementCategory =
  | "social" | "contact" | "license" | "store"
  | "delivery" | "content" | "form" | "divider";

export interface ElementField {
  key: string;
  label: string;
  type: "text" | "tel" | "email" | "url" | "textarea" | "boolean";
  placeholder?: string;
  required?: boolean;
  prefix?: string;     // e.g., "+966"
  helpText?: string;
}

export interface ProfileElement {
  type: string;                // مفتاح فريد (يُحفَظ في DB.element_type)
  category: ElementCategory;
  label: string;               // اسم عربي يظهر في المكتبة
  icon: LucideIcon;            // Lucide icon
  emoji?: string;              // إيموجي مكمّل/بديل
  brandBg?: string;            // لون العنصر عند العرض (CSS color أو gradient)
  brandFg?: string;
  description?: string;        // وصف للمكتبة
  fields: ElementField[];      // حقول الفورم
  buildUrl?: (v: Record<string, string>) => string;
  buildLabel?: (v: Record<string, string>) => string;
  defaultLabel?: string;       // لو buildLabel غير معرَّف
  isPremium?: boolean;
  // ─────────────────────────────────────────────────────────────
  // autoFrom: مصدر البيانات التلقائي.
  //   إذا محدَّد → العنصر يُسحَب تلقائياً من إعدادات الموقع/الهوية،
  //   ولا يظهر في مكتبة العناصر (لأن المستخدم يديره من /dashboard/settings).
  //   مثال: social_x autoFrom = "site_settings.social_x"
  // ─────────────────────────────────────────────────────────────
  autoFrom?: string;
}

// ─────────────────────────────────────────────────────────────
// التصنيفات (تظهر في tabs المكتبة)
// ─────────────────────────────────────────────────────────────
// التصنيفات (تظهر في tabs المكتبة)
// social/contact/license تأتي auto-pull من الإعدادات (لا تظهر في المكتبة).
// store/delivery تم حذفها — لا علاقة لها بوسيط عقاري سعودي.
export const CATEGORIES: Array<{ key: ElementCategory; label: string; emoji: string }> = [
  { key: "social",   label: "الشبكات الإجتماعية", emoji: "💫" },
  { key: "contact",  label: "التواصل المباشر",     emoji: "📞" },
  { key: "license",  label: "الرخص والاعتمادات",   emoji: "🏆" },
  { key: "form",     label: "نماذج تفاعلية",       emoji: "📝" },
  { key: "content",  label: "روابط عقارية ومحتوى", emoji: "🏘️" },
  { key: "divider",  label: "عناوين وفواصل",       emoji: "—" },
];

// ─────────────────────────────────────────────────────────────
// helper لتنظيف username
// ─────────────────────────────────────────────────────────────
const u = (s: string) => (s || "").trim().replace(/^@+/, "").replace(/\s/g, "");

// ─────────────────────────────────────────────────────────────
// كتالوج العناصر
// ─────────────────────────────────────────────────────────────
export const ELEMENTS: ProfileElement[] = [
  // ════════ SOCIAL — تُسحَب تلقائياً من /dashboard/settings ════════
  {
    type: "social_x", category: "social", label: "اكس (تويتر)",
    icon: Twitter, brandBg: "#000000", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_x",
    fields: [{ key: "username", label: "اسم المستخدم", type: "text", required: true }],
    buildUrl: (v) => `https://x.com/${u(v.username)}`,
    defaultLabel: "اكس",
  },
  {
    type: "social_instagram", category: "social", label: "انستجرام",
    icon: Instagram, brandBg: "linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_instagram",
    fields: [{ key: "username", label: "اسم المستخدم", type: "text", required: true }],
    buildUrl: (v) => `https://instagram.com/${u(v.username)}`,
    defaultLabel: "انستجرام",
  },
  {
    type: "social_tiktok", category: "social", label: "تيك توك",
    icon: Music2, brandBg: "#000000", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_tiktok",
    fields: [{ key: "username", label: "اسم المستخدم", type: "text", required: true }],
    buildUrl: (v) => `https://tiktok.com/@${u(v.username)}`,
    defaultLabel: "تيك توك",
  },
  {
    type: "social_snapchat", category: "social", label: "سناب شات",
    icon: Camera, brandBg: "#FFFC00", brandFg: "#000000",
    autoFrom: "site_settings.social_snapchat",
    fields: [{ key: "username", label: "اسم المستخدم", type: "text", required: true }],
    buildUrl: (v) => `https://snapchat.com/add/${u(v.username)}`,
    defaultLabel: "سناب شات",
  },
  {
    type: "social_linkedin", category: "social", label: "لينكد إن",
    icon: Linkedin, brandBg: "#0A66C2", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_linkedin",
    fields: [{ key: "username", label: "اسم المستخدم", type: "text", required: true }],
    buildUrl: (v) => `https://linkedin.com/in/${u(v.username)}`,
    defaultLabel: "لينكد إن",
  },
  {
    type: "social_youtube", category: "social", label: "يوتيوب",
    icon: Youtube, brandBg: "#FF0000", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_youtube",
    fields: [{ key: "username", label: "اسم القناة", type: "text", required: true }],
    buildUrl: (v) => `https://youtube.com/@${u(v.username)}`,
    defaultLabel: "يوتيوب",
  },
  {
    type: "social_threads", category: "social", label: "ثريدز",
    icon: Hash, brandBg: "#000000", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_threads",
    fields: [{ key: "username", label: "اسم المستخدم", type: "text", required: true }],
    buildUrl: (v) => `https://threads.net/@${u(v.username)}`,
    defaultLabel: "ثريدز",
  },
  {
    type: "social_facebook", category: "social", label: "فيسبوك",
    icon: Facebook, brandBg: "#1877F2", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_facebook",
    fields: [{ key: "username", label: "اسم الصفحة", type: "text", required: true }],
    buildUrl: (v) => `https://facebook.com/${u(v.username)}`,
    defaultLabel: "فيسبوك",
  },
  {
    type: "social_telegram", category: "social", label: "تيليجرام",
    icon: Send, brandBg: "#26A5E4", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_telegram",
    fields: [{ key: "username", label: "اسم المستخدم/القناة", type: "text", required: true }],
    buildUrl: (v) => `https://t.me/${u(v.username)}`,
    defaultLabel: "تيليجرام",
  },
  {
    type: "social_googlemaps", category: "social", label: "خرائط جوجل",
    icon: MapPin, brandBg: "#34A853", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_googlemaps",
    fields: [{ key: "url", label: "رابط Google Maps الكامل", type: "url", required: true }],
    buildUrl: (v) => v.url,
    defaultLabel: "موقعي على الخريطة",
  },

  // ════════ CONTACT — تُسحَب تلقائياً من /dashboard/settings ════════
  {
    type: "contact_whatsapp", category: "contact", label: "واتساب",
    icon: MessageCircle, brandBg: "#25D366", brandFg: "#FFFFFF",
    autoFrom: "site_settings.social_whatsapp",
    fields: [{ key: "phone", label: "رقم الجوال", type: "tel", required: true }],
    buildUrl: (v) => {
      const digits = (v.phone || "").replace(/\D/g, "").replace(/^0+/, "");
      const full = digits.startsWith("966") ? digits : digits.startsWith("5") && digits.length === 9 ? `966${digits}` : digits;
      return `https://wa.me/${full}`;
    },
    defaultLabel: "تواصل على واتساب",
  },
  {
    type: "contact_phone", category: "contact", label: "رقم هاتف",
    icon: Phone, brandBg: "#3B82F6", brandFg: "#FFFFFF",
    autoFrom: "site_settings.phone",
    fields: [{ key: "phone", label: "رقم الهاتف", type: "tel", required: true }],
    buildUrl: (v) => `tel:${v.phone}`,
    defaultLabel: "اتصال هاتفي",
  },
  {
    type: "contact_email", category: "contact", label: "بريد إلكتروني",
    icon: Mail, brandBg: "#EF4444", brandFg: "#FFFFFF",
    autoFrom: "site_settings.email",
    fields: [{ key: "email", label: "البريد الإلكتروني", type: "email", required: true }],
    buildUrl: (v) => `mailto:${v.email}`,
    defaultLabel: "بريدي الإلكتروني",
  },

  // ════════ FORM ════════
  {
    type: "form_whatsapp_orders", category: "form", label: "طلبات على واتساب",
    icon: MessageSquare, brandBg: "#25D366", brandFg: "#FFFFFF",
    description: "نموذج يستقبل طلبات الزوار على واتساب مباشرة",
    fields: [
      { key: "phone", label: "رقم الواتساب لاستقبال الطلبات", type: "tel", placeholder: "0501234567", prefix: "+966", required: true },
      { key: "title", label: "عنوان الخدمة", type: "text", placeholder: "اطلب خدمة استشارة عقارية" },
      { key: "description", label: "وصف الخدمة", type: "textarea", placeholder: "اشرح ما يحصل عليه الزائر..." },
    ],
    buildUrl: (v) => {
      const digits = (v.phone || "").replace(/\D/g, "").replace(/^0+/, "");
      const full = digits.startsWith("966") ? digits : digits.startsWith("5") && digits.length === 9 ? `966${digits}` : digits;
      const text = encodeURIComponent(`مرحباً، أرغب في الاستفادة من خدمة "${v.title || "الخدمة"}"`);
      return `https://wa.me/${full}?text=${text}`;
    },
    defaultLabel: "اطلب خدمة الآن",
  },
  {
    type: "form_contact", category: "form", label: "نموذج اتصل بنا",
    icon: ClipboardList, brandBg: "#F59E0B", brandFg: "#FFFFFF",
    description: "نموذج يجمع رسائل الزوار في صندوق وارد",
    fields: [
      { key: "title", label: "عنوان النموذج", type: "text", placeholder: "تواصل معنا", required: true },
      { key: "description", label: "الوصف", type: "textarea", placeholder: "أرسل رسالتك وسأرد قريباً" },
      { key: "ask_phone", label: "اطلب رقم الجوال", type: "boolean" },
      { key: "ask_email", label: "اطلب البريد الإلكتروني", type: "boolean" },
      { key: "ask_message", label: "اطلب نص الرسالة", type: "boolean" },
    ],
    buildUrl: () => "#contact-form",  // يُعالَج كنموذج داخلي
    defaultLabel: "تواصل معنا",
    isPremium: true,
  },

  // ════════ LICENSE — كلها تُسحَب تلقائياً من /dashboard/settings ════════
  {
    type: "license_falar", category: "license", label: "رخصة فال",
    icon: BadgeCheck, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "◇",
    autoFrom: "site_settings.fal_license",
    fields: [{ key: "number", label: "رقم رخصة فال", type: "text", required: true }],
    defaultLabel: "رخصة فال",
  },
  {
    type: "license_cr", category: "license", label: "السجل التجاري",
    icon: Briefcase, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "📋",
    autoFrom: "site_settings.cr_number",
    fields: [{ key: "number", label: "رقم السجل التجاري", type: "text", required: true }],
    defaultLabel: "السجل التجاري",
  },
  {
    type: "license_vat", category: "license", label: "الرقم الضريبي",
    icon: Award, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "💼",
    autoFrom: "site_settings.vat_number",
    fields: [{ key: "number", label: "الرقم الضريبي", type: "text", required: true }],
    defaultLabel: "الشهادة الضريبية",
  },
  {
    type: "license_maaroof", category: "license", label: "رخصة معروف",
    icon: BadgeCheck, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "✅",
    autoFrom: "site_settings.maaroof_license",
    fields: [{ key: "number", label: "رقم رخصة معروف", type: "text", required: true }],
    defaultLabel: "رخصة معروف",
  },
  {
    type: "license_mowathaq", category: "license", label: "رخصة موثوق",
    icon: BadgeCheck, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "🛡️",
    autoFrom: "site_settings.mowathaq_license",
    fields: [{ key: "number", label: "رقم رخصة موثوق", type: "text", required: true }],
    defaultLabel: "رخصة موثوق",
  },
  {
    type: "license_freelance", category: "license", label: "وثيقة العمل الحر",
    icon: FileText, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "📄",
    autoFrom: "site_settings.freelance_license",
    fields: [{ key: "number", label: "رقم الوثيقة", type: "text", required: true }],
    defaultLabel: "وثيقة العمل الحر",
  },
  {
    type: "license_gam", category: "license", label: "رخصة هيئة العقار",
    icon: Shield, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "🏛️",
    autoFrom: "site_settings.gam_license",
    fields: [{ key: "number", label: "رقم رخصة الهيئة", type: "text", required: true }],
    defaultLabel: "رخصة هيئة العقار",
  },

  // ════════ روابط عقارية ومحتوى مخصص ════════
  // عناصر منطقية لوسيط عقاري سعودي (ليست متاجر أو توصيل)
  {
    type: "content_aqar_listings", category: "content", label: "عقاراتي على عقار.fm",
    icon: Building2, brandBg: "#10B981", brandFg: "#FFFFFF", emoji: "🏘️",
    description: "اعرض عقاراتك المنشورة على منصة عقار",
    fields: [
      { key: "user_id", label: "رقم حسابك على عقار", type: "text", placeholder: "1033913", required: true },
      { key: "label", label: "نص الزر", type: "text", placeholder: "تصفّح عقاراتي" },
    ],
    buildUrl: (v) => `https://sa.aqar.fm/user/${u(v.user_id)}`,
    defaultLabel: "عقاراتي على عقار.fm",
  },
  {
    type: "content_bayut_listings", category: "content", label: "عقاراتي على بيوت",
    icon: Building2, brandBg: "#A52F50", brandFg: "#FFFFFF", emoji: "🏢",
    description: "رابط حسابك على بيوت",
    fields: [
      { key: "url", label: "رابط حسابك على بيوت", type: "url", required: true },
      { key: "label", label: "نص الزر", type: "text", placeholder: "عقاراتي على بيوت" },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "عقاراتي على بيوت",
  },
  {
    type: "content_request_property", category: "content", label: "اطلب عقاراً (بحث مخصص)",
    icon: Building2, brandBg: "#3B82F6", brandFg: "#FFFFFF", emoji: "🔍",
    description: "زر يأخذ العميل لنموذج تقديم طلب عقار جديد",
    fields: [
      { key: "label", label: "نص الزر", type: "text", placeholder: "اطلب بحث عقاري مخصص" },
    ],
    buildUrl: (v) => `/${(v.slug || "")}/request`,
    defaultLabel: "اطلب بحث عقاري مخصص",
  },
  {
    type: "content_website", category: "content", label: "موقع إلكتروني",
    icon: Globe, brandBg: "#1A1206", brandFg: "#FFFFFF",
    description: "رابط لموقعك الشخصي أو موقع شركتك",
    fields: [
      { key: "url", label: "رابط الموقع", type: "url", placeholder: "https://...", required: true },
      { key: "label", label: "اسم الموقع", type: "text", placeholder: "موقعي" },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "موقعي الإلكتروني",
  },
  {
    type: "content_custom_link", category: "content", label: "رابط مخصص",
    icon: Link2, brandBg: "transparent", brandFg: "inherit",
    description: "أي رابط آخر",
    fields: [
      { key: "url", label: "الرابط", type: "url", required: true },
      { key: "label", label: "اسم الرابط", type: "text", required: true },
      { key: "subtitle", label: "وصف فرعي (اختياري)", type: "text" },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "رابط",
  },

  // ════════ DIVIDER ════════
  {
    type: "divider_header", category: "divider", label: "عنوان فرعي",
    icon: Heading, brandBg: "transparent", brandFg: "inherit",
    description: "عنوان قسم لتنظيم الروابط",
    fields: [
      { key: "label", label: "نص العنوان", type: "text", placeholder: "حسابي العقاري", required: true },
    ],
    defaultLabel: "عنوان",
  },
  {
    type: "divider_paragraph", category: "divider", label: "فقرة نصية",
    icon: Type, brandBg: "transparent", brandFg: "inherit",
    fields: [
      { key: "label", label: "النص", type: "textarea", placeholder: "أكثر من 8 سنوات في السوق العقاري بالرياض...", required: true },
    ],
    defaultLabel: "فقرة",
  },
];

// ─────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────
export function getElement(type: string): ProfileElement | undefined {
  return ELEMENTS.find(e => e.type === type);
}

/**
 * عناصر المكتبة (للداشبورد): تستثني العناصر autoFrom (لأنها تأتي من الإعدادات)
 */
export function getCategoryElements(cat: ElementCategory): ProfileElement[] {
  return ELEMENTS.filter(e => e.category === cat && !e.autoFrom);
}

/**
 * AUTO-PULL: يبني قائمة العناصر التلقائية من site_settings + broker_identity
 * يُستخدَم في /c/[slug] لتجنّب طلب نفس البيانات من المستخدم مرتين.
 */
export interface AutoElement {
  type: string;
  metadata: Record<string, string>;
  isAuto: true;
}

export function buildAutoElements(
  siteSettings: Record<string, any> | null,
  brokerIdentity: Record<string, any> | null
): AutoElement[] {
  const result: AutoElement[] = [];
  const s = siteSettings || {};
  const bi = brokerIdentity || {};

  for (const el of ELEMENTS) {
    if (!el.autoFrom) continue;

    // تحليل المصدر مثل "site_settings.social_x"
    const [source, field] = el.autoFrom.split(".");
    let value: string | null = null;

    if (source === "site_settings") {
      value = s[field] || null;
      // لـ social_whatsapp: أيضاً جرّب whatsapp العام
      if (!value && field === "social_whatsapp") value = s.whatsapp || null;
      // لـ email: جرّب contact_email
      if (!value && field === "email") value = s.contact_email || null;
    } else if (source === "broker_identity") {
      value = bi[field] || null;
    }

    if (!value || !String(value).trim()) continue;

    // استخراج القيمة الصحيحة لكل نوع
    const meta: Record<string, string> = {};
    const fieldDef = el.fields[0]; // الحقل الأول هو القيمة الرئيسية
    if (!fieldDef) continue;

    if (fieldDef.key === "username") {
      // لو الـ value رابط كامل، استخرج الـ username
      const m = String(value).match(/(?:\/|@)([\w.\-_]+)\/?$/);
      meta.username = m ? m[1] : String(value).replace(/^@+/, "");
    } else if (fieldDef.key === "phone") {
      const m = String(value).match(/(\d{9,})/);
      meta.phone = m ? m[1] : String(value);
    } else if (fieldDef.key === "email") {
      meta.email = String(value);
    } else {
      meta[fieldDef.key] = String(value);
    }

    result.push({ type: el.type, metadata: meta, isAuto: true });
  }

  return result;
}

export function buildElementUrl(type: string, metadata: Record<string, string>): string {
  const el = getElement(type);
  if (!el || !el.buildUrl) return "";
  try { return el.buildUrl(metadata); } catch { return ""; }
}

export function buildElementLabel(type: string, metadata: Record<string, string>): string {
  const el = getElement(type);
  if (!el) return metadata.label || "رابط";
  if (metadata.label) return metadata.label;
  if (el.buildLabel) try { return el.buildLabel(metadata); } catch {}
  return el.defaultLabel || el.label;
}
