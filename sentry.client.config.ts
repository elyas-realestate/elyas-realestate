// ══════════════════════════════════════════════════════════════
// Sentry Client Config — تتبّع أخطاء المتصفح
// يُحمَّل فقط في المتصفح. إعداد بسيط ومحافظ على الأداء.
// ══════════════════════════════════════════════════════════════
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // ── معدّل العيّنة ──
  // 10% من المعاملات لتتبّع الأداء (يقلل الاستهلاك من free tier)
  tracesSampleRate: 0.1,

  // ── debug ──
  // false في الإنتاج — يقلل ضوضاء console
  debug: false,

  // ── replay (مُعطَّل) ──
  // session replay يستهلك حصة كبيرة من free tier — نشغّله لاحقاً عند الحاجة
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // ── تفعيل فقط في الإنتاج ──
  enabled: process.env.NODE_ENV === "production",

  // ── البيئة ──
  environment: process.env.NODE_ENV || "development",

  // ── تجاهل بعض الأخطاء الشائعة غير المهمة ──
  ignoreErrors: [
    // أخطاء resize observer (سيليّبراً معروفة في Chrome)
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Hydration warnings (نتعامل معها منفصلاً)
    "Hydration failed",
    // Network errors عابرة
    "NetworkError",
    "Failed to fetch",
  ],

  // ── beforeSend filter ──
  beforeSend(event, hint) {
    // تجاهل أخطاء extensions (مثل أداة Claude في المتصفح)
    const error = hint?.originalException;
    if (error && typeof error === "object" && "stack" in error) {
      const stack = String(error.stack || "");
      if (stack.includes("chrome-extension://") || stack.includes("moz-extension://")) {
        return null;
      }
    }
    return event;
  },
});
