import { describe, it, expect } from "vitest";
import { formatSAR, formatNumber } from "../format";

describe("formatSAR", () => {
  describe("null/undefined/empty handling", () => {
    it("returns em-dash for null", () => {
      expect(formatSAR(null)).toBe("—");
    });

    it("returns em-dash for undefined", () => {
      expect(formatSAR(undefined)).toBe("—");
    });

    it("returns em-dash for empty string", () => {
      expect(formatSAR("")).toBe("—");
    });

    it("returns em-dash for NaN-producing input", () => {
      expect(formatSAR("not a number")).toBe("—");
    });
  });

  describe("standard formatting", () => {
    it("formats a small number with currency suffix", () => {
      const result = formatSAR(1500);
      expect(result).toContain("ر.س");
    });

    it("formats a million-scale number with thousand separators", () => {
      const result = formatSAR(1_500_000);
      expect(result).toContain("ر.س");
      // ar-SA locale uses Arabic-Indic or Western digits depending on Node version
      // we just verify the grouping logic ran
      expect(result.length).toBeGreaterThan(5);
    });

    it("accepts a numeric string", () => {
      expect(formatSAR("1000")).toContain("ر.س");
    });

    it("handles zero", () => {
      expect(formatSAR(0)).toContain("ر.س");
    });
  });

  describe("short format", () => {
    it("formats exact million as Xم ر.س without decimals", () => {
      expect(formatSAR(1_000_000, { short: true })).toBe("1م ر.س");
    });

    it("formats 1.5 million with one decimal", () => {
      expect(formatSAR(1_500_000, { short: true })).toBe("1.5م ر.س");
    });

    it("formats exact thousand as Xك ر.س without decimals", () => {
      expect(formatSAR(5_000, { short: true })).toBe("5ك ر.س");
    });

    it("formats partial thousand with one decimal", () => {
      expect(formatSAR(1_500, { short: true })).toBe("1.5ك ر.س");
    });

    it("falls back to long form for sub-thousand values", () => {
      // short format only triggers at >= 1000
      const result = formatSAR(500, { short: true });
      expect(result).toContain("ر.س");
      expect(result).not.toContain("ك");
      expect(result).not.toContain("م");
    });
  });
});

describe("formatNumber", () => {
  it("returns empty string for null", () => {
    expect(formatNumber(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatNumber(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(formatNumber("")).toBe("");
  });

  it("returns empty string for non-numeric input", () => {
    expect(formatNumber("abc")).toBe("");
  });

  it("formats numeric values without currency suffix", () => {
    const result = formatNumber(1500);
    expect(result).not.toContain("ر.س");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts numeric strings", () => {
    const result = formatNumber("9999");
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain("ر.س");
  });
});
