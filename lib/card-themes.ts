// ══════════════════════════════════════════════════════════════
// Card Themes Library — ٢٠ ثيم احترافي للبطاقة التعريفية
// مصنّفة حسب المزاج والقطاع العقاري الفرعي
// ══════════════════════════════════════════════════════════════

export interface CardTheme {
  id: string;
  name: string;
  emoji: string;
  category: "luxury" | "modern" | "classic" | "minimal" | "bold" | "specialty";
  bg_color: string; // الخلفية
  text_color: string; // النص الرئيسي
  accent_color: string; // اللون المميّز
  sub_color?: string; // لون ثانوي للنصوص الخافتة
  preview_gradient?: string; // gradient للـ preview cards
}

export const CARD_THEMES: CardTheme[] = [
  // ═══ الفاخرة (Luxury) ═══
  {
    id: "royal-gold",
    name: "ذهبي ملكي",
    emoji: "👑",
    category: "luxury",
    bg_color: "#0A0A0C",
    text_color: "#FAF7F2",
    accent_color: "#E8B86D",
    preview_gradient: "linear-gradient(135deg, #0A0A0C, #2A1810, #E8B86D)",
  },
  {
    id: "marble-cream",
    name: "كريمي رخامي",
    emoji: "🪨",
    category: "luxury",
    bg_color: "#FAF7F2",
    text_color: "#1A1206",
    accent_color: "#C6914C",
    preview_gradient: "linear-gradient(135deg, #FAF7F2, #F0E8D8, #C6914C)",
  },
  {
    id: "champagne",
    name: "شامبانيا فاخر",
    emoji: "🥂",
    category: "luxury",
    bg_color: "#F5EFE0",
    text_color: "#2A1810",
    accent_color: "#B8860B",
    preview_gradient: "linear-gradient(135deg, #F5EFE0, #E8D4A0, #B8860B)",
  },

  // ═══ العصرية (Modern) ═══
  {
    id: "midnight-blue",
    name: "أزرق منتصف الليل",
    emoji: "🌙",
    category: "modern",
    bg_color: "#0F172A",
    text_color: "#E2E8F0",
    accent_color: "#3B82F6",
    preview_gradient: "linear-gradient(135deg, #0F172A, #1E3A8A, #3B82F6)",
  },
  {
    id: "emerald",
    name: "زمردي عصري",
    emoji: "💎",
    category: "modern",
    bg_color: "#022C22",
    text_color: "#ECFDF5",
    accent_color: "#10B981",
    preview_gradient: "linear-gradient(135deg, #022C22, #064E3B, #10B981)",
  },
  {
    id: "purple-haze",
    name: "بنفسجي ضبابي",
    emoji: "🔮",
    category: "modern",
    bg_color: "#1E1B4B",
    text_color: "#EDE9FE",
    accent_color: "#A78BFA",
    preview_gradient: "linear-gradient(135deg, #1E1B4B, #5B21B6, #A78BFA)",
  },
  {
    id: "rose-gold",
    name: "وردي ذهبي",
    emoji: "🌹",
    category: "modern",
    bg_color: "#FDF2F8",
    text_color: "#831843",
    accent_color: "#E11D48",
    preview_gradient: "linear-gradient(135deg, #FDF2F8, #FBCFE8, #E11D48)",
  },

  // ═══ الكلاسيكية (Classic) ═══
  {
    id: "british-green",
    name: "أخضر بريطاني",
    emoji: "🌳",
    category: "classic",
    bg_color: "#FAF9F6",
    text_color: "#1B4332",
    accent_color: "#2D6A4F",
    preview_gradient: "linear-gradient(135deg, #FAF9F6, #B7E4C7, #2D6A4F)",
  },
  {
    id: "burgundy",
    name: "نبيذي عريق",
    emoji: "🍷",
    category: "classic",
    bg_color: "#FFFAF5",
    text_color: "#581C1C",
    accent_color: "#9B1C1C",
    preview_gradient: "linear-gradient(135deg, #FFFAF5, #FED7D7, #9B1C1C)",
  },
  {
    id: "navy-pearl",
    name: "كحلي لؤلؤي",
    emoji: "⚓",
    category: "classic",
    bg_color: "#F8FAFC",
    text_color: "#0C2340",
    accent_color: "#1D4ED8",
    preview_gradient: "linear-gradient(135deg, #F8FAFC, #DBEAFE, #1D4ED8)",
  },

  // ═══ المينمالية (Minimal) ═══
  {
    id: "pure-white",
    name: "أبيض نقي",
    emoji: "⚪",
    category: "minimal",
    bg_color: "#FFFFFF",
    text_color: "#0F172A",
    accent_color: "#0F172A",
    preview_gradient: "linear-gradient(135deg, #FFFFFF, #F1F5F9, #94A3B8)",
  },
  {
    id: "soft-stone",
    name: "حجري ناعم",
    emoji: "🪞",
    category: "minimal",
    bg_color: "#F4F4F5",
    text_color: "#27272A",
    accent_color: "#52525B",
    preview_gradient: "linear-gradient(135deg, #F4F4F5, #D4D4D8, #52525B)",
  },
  {
    id: "warm-beige",
    name: "بيج دافئ",
    emoji: "🪵",
    category: "minimal",
    bg_color: "#FFFBEB",
    text_color: "#451A03",
    accent_color: "#92400E",
    preview_gradient: "linear-gradient(135deg, #FFFBEB, #FEF3C7, #92400E)",
  },

  // ═══ الجريئة (Bold) ═══
  {
    id: "neon-cyan",
    name: "سيان نيون",
    emoji: "⚡",
    category: "bold",
    bg_color: "#000000",
    text_color: "#F0F9FF",
    accent_color: "#06B6D4",
    preview_gradient: "linear-gradient(135deg, #000000, #0E7490, #06B6D4)",
  },
  {
    id: "lava-red",
    name: "أحمر لافا",
    emoji: "🔥",
    category: "bold",
    bg_color: "#1A0606",
    text_color: "#FFF5F5",
    accent_color: "#EF4444",
    preview_gradient: "linear-gradient(135deg, #1A0606, #7F1D1D, #EF4444)",
  },
  {
    id: "electric-purple",
    name: "بنفسجي كهربائي",
    emoji: "🟣",
    category: "bold",
    bg_color: "#0F0F1A",
    text_color: "#F5F3FF",
    accent_color: "#C026D3",
    preview_gradient: "linear-gradient(135deg, #0F0F1A, #6B21A8, #C026D3)",
  },

  // ═══ المتخصّصة (Specialty) ═══
  {
    id: "desert-sand",
    name: "رمل صحراوي",
    emoji: "🏜️",
    category: "specialty",
    bg_color: "#FFF8E1",
    text_color: "#3E2723",
    accent_color: "#D4A017",
    preview_gradient: "linear-gradient(135deg, #FFF8E1, #F5DEB3, #D4A017)",
  },
  {
    id: "ocean-villa",
    name: "فيلا محيط",
    emoji: "🏖️",
    category: "specialty",
    bg_color: "#F0F9FF",
    text_color: "#0C4A6E",
    accent_color: "#0EA5E9",
    preview_gradient: "linear-gradient(135deg, #F0F9FF, #BAE6FD, #0EA5E9)",
  },
  {
    id: "urban-loft",
    name: "لوفت حضري",
    emoji: "🏙️",
    category: "specialty",
    bg_color: "#1C1917",
    text_color: "#FAFAF9",
    accent_color: "#F59E0B",
    preview_gradient: "linear-gradient(135deg, #1C1917, #44403C, #F59E0B)",
  },
  {
    id: "garden-villa",
    name: "فيلا حدائق",
    emoji: "🌿",
    category: "specialty",
    bg_color: "#F0FDF4",
    text_color: "#14532D",
    accent_color: "#16A34A",
    preview_gradient: "linear-gradient(135deg, #F0FDF4, #BBF7D0, #16A34A)",
  },
];

export const CATEGORY_LABELS: Record<CardTheme["category"], string> = {
  luxury: "فاخرة",
  modern: "عصرية",
  classic: "كلاسيكية",
  minimal: "بسيطة",
  bold: "جريئة",
  specialty: "متخصّصة",
};

export function getThemeById(id: string): CardTheme | undefined {
  return CARD_THEMES.find((t) => t.id === id);
}

export function getThemesByCategory(cat: CardTheme["category"]): CardTheme[] {
  return CARD_THEMES.filter((t) => t.category === cat);
}
