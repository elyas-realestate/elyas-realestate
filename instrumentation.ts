// ══════════════════════════════════════════════════════════════
// instrumentation.ts — Next.js 16 hook لتحميل Sentry حسب البيئة
// يُستدعى مرة واحدة عند بدء كل runtime (node | edge)
// ══════════════════════════════════════════════════════════════
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// ── يلتقط أخطاء غير مُعالَجة في API routes + Server Components ──
export const onRequestError = Sentry.captureRequestError;
