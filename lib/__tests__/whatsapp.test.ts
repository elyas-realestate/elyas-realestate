import { describe, it, expect } from "vitest";
import { normalizePhone, waMeUrl } from "../whatsapp";

describe("normalizePhone", () => {
  it("strips all non-digit characters", () => {
    expect(normalizePhone("+966 50 123-4567")).toBe("966501234567");
    expect(normalizePhone("(966) 50 123 4567")).toBe("966501234567");
  });

  it("converts Saudi local 0XXXXXXXXX to 966XXXXXXXXX", () => {
    expect(normalizePhone("0501234567")).toBe("966501234567");
  });

  it("converts a 9-digit number starting with 5 to international", () => {
    expect(normalizePhone("501234567")).toBe("966501234567");
  });

  it("strips international '00' prefix", () => {
    expect(normalizePhone("00966501234567")).toBe("966501234567");
  });

  it("preserves a number already in 966 format", () => {
    expect(normalizePhone("966501234567")).toBe("966501234567");
  });

  it("returns empty string for empty input", () => {
    expect(normalizePhone("")).toBe("");
  });

  it("returns empty string for nullable input cast as string", () => {
    expect(normalizePhone(null as unknown as string)).toBe("");
    expect(normalizePhone(undefined as unknown as string)).toBe("");
  });

  it("handles letters and symbols by stripping them", () => {
    expect(normalizePhone("phone: +966-50-123-4567")).toBe("966501234567");
  });

  it("does not double-normalize an already-correct number", () => {
    const once = normalizePhone("0501234567");
    const twice = normalizePhone(once);
    expect(twice).toBe(once);
  });
});

describe("waMeUrl", () => {
  it("builds a wa.me link with the normalized phone", () => {
    const url = waMeUrl("0501234567", "hello");
    expect(url).toMatch(/^https:\/\/wa\.me\/966501234567\?/);
  });

  it("URL-encodes the message text", () => {
    const url = waMeUrl("966501234567", "Hello, World!");
    expect(url).toContain("Hello%2C%20World!");
  });

  it("encodes Arabic text correctly", () => {
    const url = waMeUrl("966501234567", "مرحبا");
    // each Arabic char becomes %XX%XX
    expect(url).toMatch(/%[0-9A-F]{2}%[0-9A-F]{2}/);
  });

  it("handles an empty text gracefully", () => {
    expect(waMeUrl("0501234567", "")).toBe("https://wa.me/966501234567?text=");
  });

  it("normalizes Saudi local numbers before building the URL", () => {
    expect(waMeUrl("0501234567", "x")).toBe("https://wa.me/966501234567?text=x");
    expect(waMeUrl("501234567", "x")).toBe("https://wa.me/966501234567?text=x");
    expect(waMeUrl("+966 (50) 123-4567", "x")).toBe("https://wa.me/966501234567?text=x");
  });

  it("preserves an already international number", () => {
    const url = waMeUrl("9665XXXXXXXX".replace(/X/g, "1"), "hi");
    expect(url).toBe("https://wa.me/966511111111?text=hi");
  });
});
