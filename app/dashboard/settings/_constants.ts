// ══════════════════════════════════════════════════════════════
// _constants.ts — ثوابت صفحة الإعدادات
// ══════════════════════════════════════════════════════════════
// مُستخرَجة من page.tsx الأصلي (كان 1520 سطر)
// لا تحتوي أي logic — مجرد بيانات ثابتة + types.
// ══════════════════════════════════════════════════════════════

import type { SocialPlatform } from "@/lib/social-normalize";

// ─── المنصات الاجتماعية ──────────────────────────────────────────
// المنصات تحفظ كرابط كامل، لكن المستخدم يكتب username فقط
// (نطبّع تلقائياً عند الحفظ)
export const SOCIAL_PLATFORMS: Array<{
  key: string;
  platform: SocialPlatform;
  label: string;
}> = [
  { key: "social_x", platform: "x", label: "X (تويتر)" },
  { key: "social_instagram", platform: "instagram", label: "Instagram" },
  { key: "social_tiktok", platform: "tiktok", label: "TikTok" },
  { key: "social_snapchat", platform: "snapchat", label: "سناب شات" },
  { key: "social_linkedin", platform: "linkedin", label: "LinkedIn" },
  { key: "social_youtube", platform: "youtube", label: "يوتيوب" },
  { key: "social_threads", platform: "threads", label: "Threads" },
  { key: "social_facebook", platform: "facebook", label: "فيسبوك" },
  { key: "social_whatsapp", platform: "whatsapp", label: "واتساب" },
  { key: "social_telegram", platform: "telegram", label: "تيليجرام" },
  { key: "social_googlemaps", platform: "googlemaps", label: "خرائط جوجل (موقع المكتب)" },
];

// ─── الصفحات الثابتة ─────────────────────────────────────────────
export const STATIC_PAGES = [
  { key: "page_home", label: "الصفحة الرئيسية" },
  { key: "page_map", label: "الخريطة" },
  { key: "page_requests", label: "طلبات العقار" },
  { key: "page_links", label: "صفحة الروابط" },
  { key: "page_privacy", label: "سياسة الخصوصية" },
  { key: "page_terms", label: "الشروط والأحكام" },
];

// ─── ملاحظة: SITE_SECTIONS تبقى في page.tsx ──────────────────────
// السبب: تحتوي React Icon components من lucide-react.
// نقلها هنا يتطلب lookup map، نتجنّبه للحفاظ على البساطة.

// ─── ألوان افتراضية ──────────────────────────────────────────────
// قيم Hex حقيقية — لأن هذه الألوان تُحفظ في DB وتُستخدم على الصفحة
// العامة للوسيط حيث لا تتوفر CSS variables الخاصة بلوحة التحكم
export const COLOR_DEFAULTS = {
  color_accent: "#C6914C",
  color_accent_dark: "#A6743A",
  color_bg_primary: "#0A0A0C",
  color_bg_secondary: "#0F0F12",
  color_bg_card: "#16161A",
  color_text_primary: "#F5F5F5",
  color_text_secondary: "#9A9AA0",
  color_text_muted: "#5A5A62",
  font_size_hero: "clamp(2.4rem, 5.5vw, 4.2rem)",
  font_size_section_title: "clamp(1.8rem, 3.5vw, 2.6rem)",
  font_size_body: "15px",
  font_size_small: "13px",
};

// ─── مجموعات الألوان (لـ UI grouping) ────────────────────────────
export const COLOR_GROUPS = [
  {
    id: "accent",
    label: "اللون المميّز",
    fields: [
      { key: "color_accent", label: "اللون الرئيسي", desc: "الأزرار والعناوين والروابط" },
      { key: "color_accent_dark", label: "اللون الأعمق", desc: "تدرج الأزرار والهوفر" },
    ],
  },
  {
    id: "bg",
    label: "الخلفيات",
    fields: [
      { key: "color_bg_primary", label: "الخلفية الرئيسية", desc: "لون الخلفية الأساسي" },
      { key: "color_bg_secondary", label: "الخلفية الفرعية", desc: "أقسام متناوبة" },
      { key: "color_bg_card", label: "خلفية البطاقات", desc: "الكروت والصناديق" },
    ],
  },
  {
    id: "text",
    label: "النصوص",
    fields: [
      { key: "color_text_primary", label: "النص الرئيسي", desc: "العناوين والنصوص" },
      { key: "color_text_secondary", label: "النص الثانوي", desc: "الأوصاف والفقرات" },
      { key: "color_text_muted", label: "النص الخافت", desc: "التواريخ والتفاصيل" },
    ],
  },
];

// ─── Type — ثيم سريع ─────────────────────────────────────────────
export interface QuickTheme {
  name: string;
  emoji: string;
  colors: {
    color_accent: string;
    color_accent_dark: string;
    color_bg_primary: string;
    color_bg_secondary: string;
    color_bg_card: string;
    color_text_primary: string;
    color_text_secondary: string;
    color_text_muted: string;
  };
}

// ─── ثيمات داكنة سريعة ───────────────────────────────────────────
export const QUICK_THEMES_DARK: QuickTheme[] = [
  {
    name: "الذهبي الداكن",
    emoji: "🟤",
    colors: {
      color_accent: "#C6914C",
      color_accent_dark: "#A6743A",
      color_bg_primary: "#0A0A0C",
      color_bg_secondary: "#0F0F12",
      color_bg_card: "#16161A",
      color_text_primary: "#F5F5F5",
      color_text_secondary: "#9A9AA0",
      color_text_muted: "#5A5A62",
    },
  },
  {
    name: "الأزرق الملكي",
    emoji: "🔵",
    colors: {
      color_accent: "#5B8DEF",
      color_accent_dark: "#3B6DCF",
      color_bg_primary: "#08090F",
      color_bg_secondary: "#0E1020",
      color_bg_card: "#131526",
      color_text_primary: "#F0F4FF",
      color_text_secondary: "#8A95B0",
      color_text_muted: "#525870",
    },
  },
  {
    name: "الأخضر الفاخر",
    emoji: "🟢",
    colors: {
      color_accent: "#4ADE80",
      color_accent_dark: "#2AB860",
      color_bg_primary: "#060C0A",
      color_bg_secondary: "#0A1510",
      color_bg_card: "#101A14",
      color_text_primary: "#F0FFF4",
      color_text_secondary: "#7AA886",
      color_text_muted: "#4A6854",
    },
  },
  {
    name: "البنفسجي",
    emoji: "🟣",
    colors: {
      color_accent: "#A78BFA",
      color_accent_dark: "#7C5FD4",
      color_bg_primary: "#080810",
      color_bg_secondary: "#0F0F1A",
      color_bg_card: "#141420",
      color_text_primary: "#F5F0FF",
      color_text_secondary: "#9590A8",
      color_text_muted: "#555068",
    },
  },
];

// ─── ثيمات كريمية سريعة ──────────────────────────────────────────
export const QUICK_THEMES_CREAM: QuickTheme[] = [
  {
    name: "الكريمي الكلاسيكي",
    emoji: "🤎",
    colors: {
      color_accent: "#C6914C",
      color_accent_dark: "#A6743A",
      color_bg_primary: "#FAF7F2",
      color_bg_secondary: "#F0EBE0",
      color_bg_card: "#FFFFFF",
      color_text_primary: "#1A1206",
      color_text_secondary: "#5A5044",
      color_text_muted: "#A89E92",
    },
  },
  {
    name: "الأزرق الناعم",
    emoji: "💙",
    colors: {
      color_accent: "#3B6DCF",
      color_accent_dark: "#2952A8",
      color_bg_primary: "#F5F8FD",
      color_bg_secondary: "#EAF0F9",
      color_bg_card: "#FFFFFF",
      color_text_primary: "#0E1F3F",
      color_text_secondary: "#4A5876",
      color_text_muted: "#9AA4B8",
    },
  },
  {
    name: "الأخضر الزيتوني",
    emoji: "🌿",
    colors: {
      color_accent: "#15803D",
      color_accent_dark: "#0F5E2C",
      color_bg_primary: "#F6FAF6",
      color_bg_secondary: "#EBF3EC",
      color_bg_card: "#FFFFFF",
      color_text_primary: "#10241A",
      color_text_secondary: "#3F5A48",
      color_text_muted: "#92A599",
    },
  },
  {
    name: "البنفسجي الفاتح",
    emoji: "🪻",
    colors: {
      color_accent: "#7C3AED",
      color_accent_dark: "#5B21B6",
      color_bg_primary: "#F8F6FD",
      color_bg_secondary: "#EFEAF8",
      color_bg_card: "#FFFFFF",
      color_text_primary: "#1E1238",
      color_text_secondary: "#574A75",
      color_text_muted: "#A599BA",
    },
  },
];

// ─── alias قديم للتوافق ──────────────────────────────────────────
export const QUICK_THEMES = QUICK_THEMES_DARK;
