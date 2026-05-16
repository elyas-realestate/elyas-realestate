// ══════════════════════════════════════════════════════════════
// rate-limit.test.ts — يحمي من DoS وتجاوز حدود API
// ══════════════════════════════════════════════════════════════
import { describe, it, expect, vi } from "vitest";
import {
  checkRateLimit,
  getClientKey,
  AI_RATE_LIMIT,
  GENERAL_API_RATE_LIMIT,
  PUBLIC_INSERT_RATE_LIMIT,
} from "../rate-limit";

// ⚠️ المتجر in-memory متغيّر مشترك — نحتاج مفاتيح فريدة لكل اختبار
function uniqueKey(suffix: string): string {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2)}_${suffix}`;
}

describe("checkRateLimit", () => {
  it("يسمح بأول طلب لمفتاح جديد", () => {
    const key = uniqueKey("first");
    const result = checkRateLimit(key, { maxRequests: 5, windowSeconds: 60 });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("يتتبّع عدد الطلبات بدقّة ضمن النافذة", () => {
    const key = uniqueKey("counting");
    const config = { maxRequests: 3, windowSeconds: 60 };

    const r1 = checkRateLimit(key, config);
    const r2 = checkRateLimit(key, config);
    const r3 = checkRateLimit(key, config);

    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.remaining).toBe(0);
    expect(r1.allowed && r2.allowed && r3.allowed).toBe(true);
  });

  it("يرفض الطلبات بعد تجاوز الحد", () => {
    const key = uniqueKey("blocked");
    const config = { maxRequests: 2, windowSeconds: 60 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const blocked = checkRateLimit(key, config);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("يفصل بين مفاتيح مختلفة (IP/User) — لا تداخل", () => {
    const keyA = uniqueKey("userA");
    const keyB = uniqueKey("userB");
    const config = { maxRequests: 1, windowSeconds: 60 };

    const a1 = checkRateLimit(keyA, config);
    const a2 = checkRateLimit(keyA, config);
    const b1 = checkRateLimit(keyB, config);

    expect(a1.allowed).toBe(true);
    expect(a2.allowed).toBe(false);
    expect(b1.allowed).toBe(true); // مفتاح مختلف = نافذة منفصلة
  });

  it("يعيد فتح النافذة بعد انتهاء وقتها", () => {
    const key = uniqueKey("reset");
    const config = { maxRequests: 1, windowSeconds: 60 };

    // الطلب الأول
    const r1 = checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);

    // الطلب الثاني = blocked
    const r2 = checkRateLimit(key, config);
    expect(r2.allowed).toBe(false);

    // نُلاعب الوقت ليتقدّم 61 ثانية (تجاوز النافذة)
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 61_000);

    const r3 = checkRateLimit(key, config);
    expect(r3.allowed).toBe(true); // نافذة جديدة
    expect(r3.remaining).toBe(0);

    vi.useRealTimers();
  });
});

describe("getClientKey", () => {
  it("يستخرج IP من x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        "user-agent": "Mozilla/5.0 Chrome",
      },
    });

    const key = getClientKey(req);

    expect(key).toContain("1.2.3.4");
    expect(key).toContain("Mozilla/");
  });

  it("يستخدم 'unknown' عند عدم وجود IP", () => {
    const req = new Request("https://example.com");
    const key = getClientKey(req);

    expect(key.startsWith("unknown:")).toBe(true);
  });
});

describe("الإعدادات الافتراضية", () => {
  it("AI_RATE_LIMIT = 20/minute", () => {
    expect(AI_RATE_LIMIT.maxRequests).toBe(20);
    expect(AI_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it("GENERAL_API_RATE_LIMIT = 60/minute", () => {
    expect(GENERAL_API_RATE_LIMIT.maxRequests).toBe(60);
    expect(GENERAL_API_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it("PUBLIC_INSERT_RATE_LIMIT = 10/minute (أصرم — لمنع spam)", () => {
    expect(PUBLIC_INSERT_RATE_LIMIT.maxRequests).toBe(10);
    expect(PUBLIC_INSERT_RATE_LIMIT.windowSeconds).toBe(60);
  });
});
