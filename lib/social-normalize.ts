// ══════════════════════════════════════════════════════════════
// lib/social-normalize.ts — تطبيع روابط وسائل التواصل
//
// المستخدم يكتب: @elyasad1   أو   elyasad1   أو   https://x.com/elyasad1
// النظام يحفظ:                  https://x.com/elyasad1
//
// كل دالة تأخذ ما كتبه المستخدم وترجع رابطاً كاملاً صالحاً.
// لو الإدخال كان رابطاً كاملاً صحيحاً، تُرجعه كما هو.
// ══════════════════════════════════════════════════════════════

export type SocialPlatform =
  | "x"
  | "twitter"
  | "instagram"
  | "tiktok"
  | "snapchat"
  | "linkedin"
  | "youtube"
  | "threads"
  | "facebook"
  | "whatsapp"
  | "telegram"
  | "googlemaps";

interface PlatformConfig {
  domains: string[]; // الدومينات المعروفة (للتعرّف)
  prefix: string; // البادئة قبل الـ username
  needsAt?: boolean; // هل تحتاج @ قبل اليوزر (TikTok, Threads, YouTube)
  whatsappFormat?: boolean; // واتساب يحتاج تنظيف الرقم
}

const PLATFORMS: Record<SocialPlatform, PlatformConfig> = {
  x: { domains: ["x.com", "twitter.com"], prefix: "https://x.com/" },
  twitter: { domains: ["x.com", "twitter.com"], prefix: "https://x.com/" },
  instagram: { domains: ["instagram.com"], prefix: "https://instagram.com/" },
  tiktok: { domains: ["tiktok.com"], prefix: "https://tiktok.com/@", needsAt: true },
  snapchat: { domains: ["snapchat.com"], prefix: "https://snapchat.com/add/" },
  linkedin: { domains: ["linkedin.com"], prefix: "https://linkedin.com/in/" },
  youtube: { domains: ["youtube.com", "youtu.be"], prefix: "https://youtube.com/@", needsAt: true },
  threads: { domains: ["threads.net"], prefix: "https://threads.net/@", needsAt: true },
  facebook: { domains: ["facebook.com", "fb.com"], prefix: "https://facebook.com/" },
  whatsapp: { domains: ["wa.me", "whatsapp.com"], prefix: "https://wa.me/", whatsappFormat: true },
  telegram: { domains: ["t.me", "telegram.me"], prefix: "https://t.me/" },
  googlemaps: {
    domains: ["maps.google.com", "maps.app.goo.gl", "google.com/maps"],
    prefix: "https://maps.google.com/?q=",
  },
};

/**
 * تنظيف وتطبيع إدخال المستخدم لمنصة محددة.
 * يقبل: username | @username | https://... | wa.me/... | أرقام واتساب
 */
export function normalizeSocial(platform: SocialPlatform, input: string): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  const cfg = PLATFORMS[platform];
  if (!cfg) return trimmed;

  // واتساب: تعامل خاص مع الأرقام
  if (cfg.whatsappFormat) {
    return normalizeWhatsApp(trimmed);
  }

  // 1) رابط كامل؟ → تحقّق إن دومينه معروف، وإلا أرجعه كما هو
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      if (cfg.domains.includes(host)) {
        return trimmed; // رابط صحيح للمنصة، نتركه
      }
      // رابط لمنصة أخرى — لا نعدّله، نرجعه كما كتبه المستخدم
      return trimmed;
    } catch {
      // URL غير صالح، نعالجه كـ username
    }
  }

  // 2) رابط بدون https:// (مثل x.com/elyasad1)
  if (/^([\w-]+\.)+\w{2,}\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // 3) username فقط — نظّفه ونضع البادئة
  let username = trimmed.replace(/^@+/, "").replace(/\s/g, "");

  // إزالة بادئة دومين لو كتبها المستخدم بالخطأ (مثلاً "x.com/elyasad1" بدون https)
  for (const d of cfg.domains) {
    const re = new RegExp(`^(${d.replace(".", "\\.")})/`, "i");
    if (re.test(username)) {
      username = username.replace(re, "");
    }
  }

  // إزالة @ من بداية اليوزر إن جاء (TikTok يحتاج @ في الرابط لكن البادئة معها)
  username = username.replace(/^@+/, "");

  if (!username) return "";

  return cfg.prefix + username;
}

/**
 * واتساب — يقبل: 0501234567 | +966501234567 | 966501234567 | https://wa.me/...
 * يرجع: https://wa.me/966501234567
 */
function normalizeWhatsApp(input: string): string {
  if (!input) return "";

  // رابط كامل؟
  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  // wa.me/... بدون https
  if (/^wa\.me\//i.test(input)) {
    return `https://${input}`;
  }

  // رقم — نظّفه
  let digits = input.replace(/[\s\-()]/g, "").replace(/^\++/, "");
  if (!digits) return "";

  // يبدأ بـ 0 → سعودي محلي → استبدله بـ 966
  if (digits.startsWith("0")) {
    digits = "966" + digits.slice(1);
  }
  // يبدأ بـ 5 وطوله 9 → سعودي بدون مفتاح → أضف 966
  else if (digits.startsWith("5") && digits.length === 9) {
    digits = "966" + digits;
  }

  return `https://wa.me/${digits}`;
}

/**
 * يستخرج الـ username من رابط (للعرض فقط، useful in UI)
 */
export function extractUsername(platform: SocialPlatform, url: string): string {
  if (!url) return "";
  const cfg = PLATFORMS[platform];
  if (!cfg) return url;

  if (cfg.whatsappFormat) {
    const match = url.match(/wa\.me\/(\d+)/);
    return match ? match[1] : url;
  }

  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+/, "").replace(/^@/, "");
    if (cfg.needsAt && !path.startsWith("@")) {
      // do nothing, just clean
    }
    return path.split("/")[0] || url;
  } catch {
    return url;
  }
}

/**
 * Placeholder text للـ input — يوضح ما يقبله النظام
 */
export function getSmartPlaceholder(platform: SocialPlatform): string {
  const examples: Record<SocialPlatform, string> = {
    x: "elyasad1 أو @elyasad1",
    twitter: "elyasad1 أو @elyasad1",
    instagram: "elyas_realestate",
    tiktok: "elyasad1",
    snapchat: "elyasad1",
    linkedin: "elyas-aldakhil",
    youtube: "elyasad1",
    threads: "elyas_realestate",
    facebook: "elyas.realestate",
    whatsapp: "0501234567 أو 966501234567",
    telegram: "elyasad1 أو @elyasad1",
    googlemaps: "https://maps.app.goo.gl/...",
  };
  return examples[platform] || "اسم المستخدم فقط";
}
