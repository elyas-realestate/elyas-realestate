// ══════════════════════════════════════════════════════════════
// vitest.setup.ts — يُحمَّل تلقائياً قبل كل اختبار
// ══════════════════════════════════════════════════════════════
// نضبط متغيرات البيئة الافتراضية للاختبارات هنا، حتى لا نضطر
// لإعدادها يدوياً في كل ملف اختبار.
// ══════════════════════════════════════════════════════════════

// مفتاح تشفير للاختبارات فقط — 64 حرف hex = 32 بايت (AES-256)
// ⚠️ ليس مفتاحاً حقيقياً — مخصّص للاختبارات بشكل deterministic
process.env.ENCRYPTION_SECRET =
  process.env.ENCRYPTION_SECRET ||
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// Meta verify token للاختبارات
process.env.META_WEBHOOK_VERIFY_TOKEN =
  process.env.META_WEBHOOK_VERIFY_TOKEN || "test_verify_token_123";

// Supabase mocks (في حال احتاج اختبار يستدعي client — نستخدم قيم وهمية)
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "test_anon_key";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "test_service_role_key";
