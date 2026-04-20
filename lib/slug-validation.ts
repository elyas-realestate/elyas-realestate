// ── قائمة الكلمات المحجوزة — لا يمكن اختيارها كـ slug ──
export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "auth", "login", "logout", "register", "signup",
  "dashboard", "settings", "profile", "account", "billing", "subscription",
  "broker", "search", "mortgage", "help", "support", "contact", "about",
  "terms", "privacy", "legal", "blog", "news", "docs", "faq",
  "null", "undefined", "true", "false", "new", "edit", "delete",
  "waseet", "waseetpro", "pro", "www", "mail", "smtp", "cdn", "static",
]);

/** التحقق من صحة الـ slug */
export function validateSlug(slug: string): { valid: true } | { valid: false; error: string } {
  if (!slug) return { valid: false, error: "الرابط لا يمكن أن يكون فارغاً" };
  if (slug.length < 3) return { valid: false, error: "الرابط يجب أن يكون 3 أحرف على الأقل" };
  if (slug.length > 40) return { valid: false, error: "الرابط لا يمكن أن يتجاوز 40 حرفاً" };
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && !/^[a-z0-9]$/.test(slug)) {
    return { valid: false, error: "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة (-) فقط، ولا يبدأ أو ينتهي بشرطة" };
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return { valid: false, error: "هذا الرابط محجوز ولا يمكن استخدامه" };
  }
  return { valid: true };
}
