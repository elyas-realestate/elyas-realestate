// ══════════════════════════════════════════════════════════════
// lib/logger.ts — Logger موحّد لـ Wasit Pro
// ══════════════════════════════════════════════════════════════
// بديل عن console.log المتناثرة في الكود.
// - في dev: يطبع في console (مع color codes)
// - في prod: يستخدم Sentry للأخطاء + stdout structured للباقي
// - يدعم context (user_id, tenant_id, route)
// ══════════════════════════════════════════════════════════════

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  user_id?: string | null;
  tenant_id?: string | null;
  route?: string;
  [key: string]: any;
}

const isProd = process.env.NODE_ENV === "production";

function format(level: LogLevel, message: string, ctx?: LogContext, err?: Error): string {
  const timestamp = new Date().toISOString();
  const ctxStr = ctx ? ` ${JSON.stringify(ctx)}` : "";
  const errStr = err ? `\n${err.stack || err.message}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctxStr}${errStr}`;
}

function logToConsole(level: LogLevel, message: string, ctx?: LogContext, err?: Error) {
  const formatted = format(level, message, ctx, err);
  switch (level) {
    case "debug":
      if (!isProd) console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

/**
 * استدعاء Sentry لو متاح (dynamic import لتجنّب الاعتماد المباشر).
 */
async function sendToSentry(err: Error, ctx?: LogContext): Promise<void> {
  if (!isProd) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      if (ctx) {
        for (const [k, v] of Object.entries(ctx)) {
          scope.setTag(k, String(v));
        }
      }
      Sentry.captureException(err);
    });
  } catch {
    /* Sentry غير متاح — تجاهل */
  }
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * يُنشئ logger جديد بـ context إضافي (immutable).
   * مفيد في الـ API routes: `const log = logger.with({ route: "/api/foo" })`
   */
  with(extraCtx: LogContext): Logger {
    return new Logger({ ...this.context, ...extraCtx });
  }

  debug(message: string, ctx?: LogContext): void {
    logToConsole("debug", message, { ...this.context, ...ctx });
  }

  info(message: string, ctx?: LogContext): void {
    logToConsole("info", message, { ...this.context, ...ctx });
  }

  warn(message: string, ctx?: LogContext): void {
    logToConsole("warn", message, { ...this.context, ...ctx });
  }

  /**
   * تسجيل خطأ — يطبع للـ console + يرسل لـ Sentry في الإنتاج.
   */
  error(message: string, err?: Error | unknown, ctx?: LogContext): void {
    const fullCtx = { ...this.context, ...ctx };
    const error = err instanceof Error ? err : err ? new Error(String(err)) : undefined;
    logToConsole("error", message, fullCtx, error);
    if (error) {
      void sendToSentry(error, fullCtx);
    }
  }
}

/** Logger افتراضي بدون context — للاستخدام المباشر */
export const logger = new Logger();

/** أنشئ logger مع context — للاستخدام في route handlers */
export function createLogger(context: LogContext): Logger {
  return new Logger(context);
}

export type { Logger };
