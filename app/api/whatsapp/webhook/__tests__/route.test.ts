// ══════════════════════════════════════════════════════════════
// route.test.ts — WhatsApp webhook verification challenge
// ══════════════════════════════════════════════════════════════
// نختبر GET فقط (Meta verification handshake) — وهو أكثر جزء أمني
// لأنه يقرر هل Meta يقدر يربط webhook أصلاً.
//
// الـ POST مع معالجة الرسائل = integration test أكبر، نؤجله.
// ══════════════════════════════════════════════════════════════
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

const VERIFY_TOKEN = "test_verify_token_123"; // مطابق لـ vitest.setup.ts

function buildRequest(params: Record<string, string>): NextRequest {
  const url = new URL("https://example.com/api/whatsapp/webhook");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe("GET /api/whatsapp/webhook — Meta verification", () => {
  it("يقبل التحقق الصحيح ويُعيد الـ challenge", async () => {
    const req = buildRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "abc123_challenge",
    });

    const res = await GET(req);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toBe("abc123_challenge");
  });

  it("يرفض token غير صحيح بـ 403", async () => {
    const req = buildRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong_token_xxx",
      "hub.challenge": "abc123",
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("يرفض mode غير 'subscribe'", async () => {
    const req = buildRequest({
      "hub.mode": "unsubscribe", // mode خطأ
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "abc123",
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("يرفض الطلب بدون token", async () => {
    const req = buildRequest({
      "hub.mode": "subscribe",
      "hub.challenge": "abc123",
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("يرفض الطلب بدون mode أو token", async () => {
    const req = buildRequest({});
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("الاستجابة الناجحة فيها challenge فقط (للأمان)", async () => {
    const req = buildRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "my_secret_challenge",
    });

    const res = await GET(req);
    const text = await res.text();

    expect(text).toBe("my_secret_challenge");
    expect(text).not.toContain("token"); // لا تسريب
    expect(text).not.toContain("verify"); // لا تسريب
  });
});
