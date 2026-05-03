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
  MessageCircle, Send, Headphones, MapPin, Mic2, Music,
  // Contact
  Phone, Mail, MessageSquare, ClipboardList,
  // License & business
  Award, Shield, Briefcase, FileText, BadgeCheck, Building2,
  // Stores & delivery
  ShoppingBag, Store, Bike, Pizza, Truck, Coffee,
  // Content
  Globe, Link2, Image as ImageIcon, FileIcon, Video, Music as MusicNote,
  // Dividers
  Type, Minus, Heading,
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
}

// ─────────────────────────────────────────────────────────────
// التصنيفات (تظهر في tabs المكتبة)
// ─────────────────────────────────────────────────────────────
export const CATEGORIES: Array<{ key: ElementCategory; label: string; emoji: string }> = [
  { key: "social",   label: "الشبكات الإجتماعية", emoji: "💫" },
  { key: "contact",  label: "التواصل المباشر",     emoji: "📞" },
  { key: "license",  label: "الرخص والاعتمادات",   emoji: "🏆" },
  { key: "form",     label: "نماذج تفاعلية",       emoji: "📝" },
  { key: "store",    label: "المتاجر الإلكترونية", emoji: "🛍️" },
  { key: "delivery", label: "خدمات التوصيل",       emoji: "🛵" },
  { key: "content",  label: "روابط ومحتوى",        emoji: "🔗" },
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
  // ════════ SOCIAL ════════
  {
    type: "social_x", category: "social", label: "اكس (تويتر)",
    icon: Twitter, brandBg: "#000000", brandFg: "#FFFFFF",
    fields: [
      { key: "username", label: "اسم المستخدم", type: "text", placeholder: "elyasad1", required: true },
      { key: "label",    label: "عنوان الرابط (اختياري)", type: "text", placeholder: "حسابي على اكس" },
    ],
    buildUrl: (v) => `https://x.com/${u(v.username)}`,
    defaultLabel: "اكس",
  },
  {
    type: "social_instagram", category: "social", label: "انستجرام",
    icon: Instagram, brandBg: "linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)", brandFg: "#FFFFFF",
    fields: [
      { key: "username", label: "اسم المستخدم", type: "text", placeholder: "elyasad1", required: true },
      { key: "label",    label: "عنوان الرابط (اختياري)", type: "text", placeholder: "حسابي على انستجرام" },
    ],
    buildUrl: (v) => `https://instagram.com/${u(v.username)}`,
    defaultLabel: "انستجرام",
  },
  {
    type: "social_tiktok", category: "social", label: "تيك توك",
    icon: Music2, brandBg: "#000000", brandFg: "#FFFFFF",
    fields: [
      { key: "username", label: "اسم المستخدم", type: "text", placeholder: "elyasad1", required: true },
      { key: "label",    label: "عنوان الرابط (اختياري)", type: "text", placeholder: "حسابي على تيك توك" },
    ],
    buildUrl: (v) => `https://tiktok.com/@${u(v.username)}`,
    defaultLabel: "تيك توك",
  },
  {
    type: "social_snapchat", category: "social", label: "سناب شات",
    icon: Camera, brandBg: "#FFFC00", brandFg: "#000000",
    fields: [
      { key: "username", label: "اسم المستخدم", type: "text", placeholder: "elyasad1", required: true },
      { key: "label",    label: "عنوان الرابط (اختياري)", type: "text", placeholder: "حسابي على سناب شات" },
    ],
    buildUrl: (v) => `https://snapchat.com/add/${u(v.username)}`,
    defaultLabel: "سناب شات",
  },
  {
    type: "social_linkedin", category: "social", label: "لينكد إن",
    icon: Linkedin, brandBg: "#0A66C2", brandFg: "#FFFFFF",
    fields: [
      { key: "username", label: "اسم المستخدم", type: "text", placeholder: "elyas-aldakhil", required: true },
      { key: "label",    label: "عنوان الرابط (اختياري)", type: "text", placeholder: "حسابي على لينكد إن" },
    ],
    buildUrl: (v) => `https://linkedin.com/in/${u(v.username)}`,
    defaultLabel: "لينكد إن",
  },
  {
    type: "social_youtube", category: "social", label: "يوتيوب",
    icon: Youtube, brandBg: "#FF0000", brandFg: "#FFFFFF",
    fields: [
      { key: "username", label: "اسم القناة (بدون @)", type: "text", placeholder: "elyasad1", required: true },
      { key: "label",    label: "عنوان الرابط (اختياري)", type: "text", placeholder: "قناتي على يوتيوب" },
    ],
    buildUrl: (v) => `https://youtube.com/@${u(v.username)}`,
    defaultLabel: "يوتيوب",
  },
  {
    type: "social_threads", category: "social", label: "ثريدز",
    icon: Hash, brandBg: "#000000", brandFg: "#FFFFFF",
    fields: [
      { key: "username", label: "اسم المستخدم", type: "text", placeholder: "elyasad1", required: true },
      { key: "label",    label: "عنوان الرابط (اختياري)", type: "text", placeholder: "حسابي على ثريدز" },
    ],
    buildUrl: (v) => `https://threads.net/@${u(v.username)}`,
    defaultLabel: "ثريدز",
  },
  {
    type: "social_facebook", category: "social", label: "فيسبوك",
    icon: Facebook, brandBg: "#1877F2", brandFg: "#FFFFFF",
    fields: [
      { key: "username", label: "اسم الصفحة/المستخدم", type: "text", placeholder: "elyas.realestate", required: true },
      { key: "label",    label: "عنوان الرابط (اختياري)", type: "text" },
    ],
    buildUrl: (v) => `https://facebook.com/${u(v.username)}`,
    defaultLabel: "فيسبوك",
  },
  {
    type: "social_telegram", category: "social", label: "تيليجرام",
    icon: Send, brandBg: "#26A5E4", brandFg: "#FFFFFF",
    fields: [
      { key: "username", label: "اسم المستخدم/القناة", type: "text", placeholder: "elyasad1", required: true },
    ],
    buildUrl: (v) => `https://t.me/${u(v.username)}`,
    defaultLabel: "تيليجرام",
  },
  {
    type: "social_googlemaps", category: "social", label: "خرائط جوجل",
    icon: MapPin, brandBg: "#34A853", brandFg: "#FFFFFF",
    fields: [
      { key: "url", label: "رابط Google Maps الكامل", type: "url", placeholder: "https://maps.app.goo.gl/...", required: true },
      { key: "label", label: "عنوان (مثل: مكتبي)", type: "text", placeholder: "موقع المكتب" },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "موقعي على الخريطة",
  },

  // ════════ CONTACT ════════
  {
    type: "contact_whatsapp", category: "contact", label: "واتساب",
    icon: MessageCircle, brandBg: "#25D366", brandFg: "#FFFFFF",
    fields: [
      { key: "phone", label: "رقم الجوال", type: "tel", placeholder: "0501234567", prefix: "+966", required: true },
      { key: "label", label: "نص الزر", type: "text", placeholder: "تواصل على واتساب" },
    ],
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
    fields: [
      { key: "phone", label: "رقم الهاتف", type: "tel", placeholder: "0501234567", required: true },
      { key: "label", label: "نص الزر", type: "text", placeholder: "اتصال هاتفي" },
    ],
    buildUrl: (v) => `tel:${v.phone}`,
    defaultLabel: "اتصال هاتفي",
  },
  {
    type: "contact_email", category: "contact", label: "بريد إلكتروني",
    icon: Mail, brandBg: "#EF4444", brandFg: "#FFFFFF",
    fields: [
      { key: "email", label: "البريد الإلكتروني", type: "email", placeholder: "broker@example.com", required: true },
      { key: "label", label: "نص الزر", type: "text", placeholder: "راسلني عبر البريد" },
    ],
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

  // ════════ LICENSE ════════
  {
    type: "license_falar", category: "license", label: "رخصة فال",
    icon: BadgeCheck, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "◇",
    description: "الرخصة الرسمية للوسيط من الهيئة العامة للعقار",
    fields: [
      { key: "number", label: "رقم رخصة فال", type: "text", placeholder: "1100167397", required: true },
      { key: "expires_at", label: "تاريخ الانتهاء (اختياري)", type: "text", placeholder: "2027-01-15" },
    ],
    defaultLabel: "رخصة فال",
  },
  {
    type: "license_gam", category: "license", label: "رخصة هيئة العقار",
    icon: Shield, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "🏛️",
    fields: [
      { key: "number", label: "رقم الرخصة", type: "text", placeholder: "0000000000", required: true },
    ],
    defaultLabel: "رخصة هيئة العقار",
  },
  {
    type: "license_cr", category: "license", label: "السجل التجاري",
    icon: Briefcase, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "📋",
    fields: [
      { key: "number", label: "رقم السجل التجاري", type: "text", placeholder: "1010000000", required: true },
    ],
    defaultLabel: "السجل التجاري",
  },
  {
    type: "license_freelance", category: "license", label: "وثيقة العمل الحر",
    icon: FileText, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "📄",
    fields: [
      { key: "number", label: "رقم الوثيقة", type: "text", placeholder: "FL-XXXXXXXXX", required: true },
    ],
    defaultLabel: "وثيقة العمل الحر",
  },
  {
    type: "license_maaroof", category: "license", label: "رخصة معروف",
    icon: BadgeCheck, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "✅",
    fields: [
      { key: "number", label: "رقم رخصة معروف", type: "text", placeholder: "351692", required: true },
    ],
    defaultLabel: "رخصة معروف",
  },
  {
    type: "license_mowathaq", category: "license", label: "رخصة موثوق",
    icon: BadgeCheck, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "🛡️",
    fields: [
      { key: "number", label: "رقم رخصة موثوق", type: "text", placeholder: "0000000", required: true },
    ],
    defaultLabel: "رخصة موثوق",
  },
  {
    type: "license_vat", category: "license", label: "الشهادة الضريبية",
    icon: Award, brandBg: "#FAFAFA", brandFg: "#1A1206", emoji: "💼",
    fields: [
      { key: "number", label: "الرقم الضريبي", type: "text", placeholder: "3XXXXXXXXXXXXX3", required: true },
    ],
    defaultLabel: "الشهادة الضريبية",
  },

  // ════════ STORE ════════
  {
    type: "store_zid", category: "store", label: "متجر زد",
    icon: Store, brandBg: "#7B61FF", brandFg: "#FFFFFF", emoji: "🛒",
    fields: [
      { key: "url", label: "رابط متجرك على زد", type: "url", placeholder: "https://yourstore.zid.store", required: true },
      { key: "label", label: "اسم المتجر", type: "text", placeholder: "متجري" },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "متجري",
  },
  {
    type: "store_custom", category: "store", label: "متجر إلكتروني",
    icon: ShoppingBag, brandBg: "#1A1206", brandFg: "#FFFFFF",
    fields: [
      { key: "url", label: "رابط المتجر", type: "url", placeholder: "https://...", required: true },
      { key: "label", label: "اسم المتجر", type: "text", placeholder: "متجري", required: true },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "متجري",
  },

  // ════════ DELIVERY ════════
  {
    type: "delivery_hungerstation", category: "delivery", label: "هنقرستيشن",
    icon: Bike, brandBg: "#FFB300", brandFg: "#000000", emoji: "🍔",
    fields: [
      { key: "url", label: "رابط مطعمك على هنقرستيشن", type: "url", required: true },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "اطلب من هنقرستيشن",
  },
  {
    type: "delivery_jahez", category: "delivery", label: "جاهز",
    icon: Pizza, brandBg: "#E53935", brandFg: "#FFFFFF", emoji: "🍕",
    fields: [{ key: "url", label: "رابطك على جاهز", type: "url", required: true }],
    buildUrl: (v) => v.url,
    defaultLabel: "اطلب من جاهز",
  },
  {
    type: "delivery_keeta", category: "delivery", label: "كيتا",
    icon: Truck, brandBg: "#FFE600", brandFg: "#000000", emoji: "🛵",
    fields: [{ key: "url", label: "رابطك على كيتا", type: "url", required: true }],
    buildUrl: (v) => v.url,
    defaultLabel: "اطلب من كيتا",
  },
  {
    type: "delivery_mrsool", category: "delivery", label: "مرسول",
    icon: Truck, brandBg: "#FB923C", brandFg: "#FFFFFF",
    fields: [{ key: "url", label: "رابطك على مرسول", type: "url", required: true }],
    buildUrl: (v) => v.url,
    defaultLabel: "اطلب من مرسول",
  },

  // ════════ CONTENT ════════
  {
    type: "content_website", category: "content", label: "موقع إلكتروني",
    icon: Globe, brandBg: "#1A1206", brandFg: "#FFFFFF",
    fields: [
      { key: "url", label: "رابط الموقع", type: "url", placeholder: "https://yourwebsite.com", required: true },
      { key: "label", label: "اسم الموقع", type: "text", placeholder: "موقعي الإلكتروني" },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "موقعي الإلكتروني",
  },
  {
    type: "content_custom_link", category: "content", label: "رابط مخصص",
    icon: Link2, brandBg: "transparent", brandFg: "inherit",
    fields: [
      { key: "url", label: "الرابط", type: "url", required: true },
      { key: "label", label: "اسم الرابط", type: "text", required: true },
      { key: "subtitle", label: "وصف فرعي", type: "text" },
    ],
    buildUrl: (v) => v.url,
    defaultLabel: "رابط",
  },
  {
    type: "content_aqar_listings", category: "content", label: "عقاراتي على عقار",
    icon: Building2, brandBg: "#10B981", brandFg: "#FFFFFF", emoji: "🏘️",
    fields: [
      { key: "user_id", label: "رقم حسابك على عقار (مثل 1033913)", type: "text", required: true },
      { key: "label", label: "نص الزر", type: "text", placeholder: "تصفّح عقاراتي" },
    ],
    buildUrl: (v) => `https://sa.aqar.fm/user/${u(v.user_id)}`,
    defaultLabel: "عقاراتي على عقار",
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

export function getCategoryElements(cat: ElementCategory): ProfileElement[] {
  return ELEMENTS.filter(e => e.category === cat);
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
