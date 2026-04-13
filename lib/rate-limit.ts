/**
 * نظام Rate Limiting في الذاكرة
 * يستخدم Sliding Window مع تنظيف تلقائي للذاكرة
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// تنظيف تلقائي كل 5 دقائق لمنع تسرب الذاكرة
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** عدد الطلبات المسموحة */
  maxRequests: number;
  /** نافذة الوقت بالثواني */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/**
 * فحص Rate Limit لمفتاح محدد (IP أو User ID)
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = store.get(key);

  // إذا لم يوجد سجل أو انتهت النافذة — ابدأ نافذة جديدة
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // إذا لم يتجاوز الحد
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  // تجاوز الحد
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

// ── إعدادات Rate Limit الافتراضية ──

/** AI API — 20 طلب في الدقيقة */
export const AI_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowSeconds: 60,
};

/** API عام — 60 طلب في الدقيقة */
export const GENERAL_API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowSeconds: 60,
};

/** إدراج عام (property_requests, analytics) — 10 في الدقيقة */
export const PUBLIC_INSERT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60,
};

/**
 * استخراج مفتاح تعريف من الطلب (IP + User Agent hash)
 */
export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const ua = request.headers.get("user-agent") || "";
  // نستخدم أول 8 أحرف من الـ UA لتمييز بسيط
  return `${ip}:${ua.slice(0, 8)}`;
}
