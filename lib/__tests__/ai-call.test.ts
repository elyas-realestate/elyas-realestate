import { describe, it, expect } from "vitest";
import { isQuotaError } from "../ai-call";

describe("isQuotaError", () => {
  it("detects 'quota' in error messages", () => {
    expect(isQuotaError(new Error("API quota exceeded"))).toBe(true);
    expect(isQuotaError(new Error("Your QUOTA is gone"))).toBe(true);
  });

  it("detects 'rate limit' phrasing", () => {
    expect(isQuotaError(new Error("You hit the rate limit"))).toBe(true);
    expect(isQuotaError(new Error("RATE LIMIT exceeded"))).toBe(true);
  });

  it("detects 'rate_limit' underscore variant", () => {
    expect(isQuotaError(new Error("rate_limit_exceeded"))).toBe(true);
  });

  it("detects HTTP 429 status mention", () => {
    expect(isQuotaError(new Error("HTTP 429 Too Many Requests"))).toBe(true);
  });

  it("detects generic 'exceeded' keyword", () => {
    expect(isQuotaError(new Error("monthly limit exceeded"))).toBe(true);
  });

  it("returns false for unrelated error messages", () => {
    expect(isQuotaError(new Error("Network timeout"))).toBe(false);
    expect(isQuotaError(new Error("Bad request"))).toBe(false);
    expect(isQuotaError(new Error("Server error 500"))).toBe(false);
  });

  it("handles string errors (not Error instances)", () => {
    expect(isQuotaError("rate limit exceeded")).toBe(true);
    expect(isQuotaError("ok")).toBe(false);
  });

  it("handles null/undefined gracefully", () => {
    expect(isQuotaError(null)).toBe(false);
    expect(isQuotaError(undefined)).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isQuotaError(new Error("Rate Limit"))).toBe(true);
    expect(isQuotaError(new Error("QUOTA"))).toBe(true);
    expect(isQuotaError(new Error("Exceeded"))).toBe(true);
  });

  it("handles non-string non-Error values", () => {
    expect(isQuotaError({ message: "rate limit" } as unknown)).toBe(false); // .message not extracted
    expect(isQuotaError(429 as unknown)).toBe(true); // "429" string
  });
});
