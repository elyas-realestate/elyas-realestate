// ══════════════════════════════════════════════════════════════
// Sentry Server Config — تتبّع أخطاء Node.js على Vercel
// يُحمَّل في API routes + Server Components + Middleware
// ══════════════════════════════════════════════════════════════
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,
  debug: false,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NODE_ENV || "development",

  // ── تجاهل أخطاء معروفة ──
  ignoreErrors: [
    // عناوين endpoints المعتادة لـ verification
    "invalid signature",
    "غير مصرح",
  ],

  // ── احذف بيانات حسّاسة من stack traces ──
  beforeSend(event) {
    // تنظيف authorization headers لو ظهرت في breadcrumbs
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-api-key"];
    }
    return event;
  },
});
