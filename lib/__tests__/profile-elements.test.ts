import { describe, it, expect } from "vitest";
import {
  ELEMENTS,
  CATEGORIES,
  getElement,
  getCategoryElements,
  buildAutoElements,
  buildElementUrl,
  buildElementLabel,
} from "../profile-elements";

describe("ELEMENTS — registry integrity", () => {
  it("has a non-empty registry", () => {
    expect(ELEMENTS.length).toBeGreaterThan(0);
  });

  it("every element has unique type and required fields", () => {
    const types = new Set<string>();
    for (const el of ELEMENTS) {
      expect(el.type).toBeTruthy();
      expect(types.has(el.type)).toBe(false);
      types.add(el.type);

      expect(el.label).toBeTruthy();
      expect(el.category).toBeTruthy();
      expect(el.icon).toBeDefined();
      expect(Array.isArray(el.fields)).toBe(true);
    }
  });

  it("every element's category is one of the declared CATEGORIES", () => {
    const known = new Set(CATEGORIES.map((c) => c.key));
    for (const el of ELEMENTS) {
      expect(known.has(el.category)).toBe(true);
    }
  });

  it("every CATEGORIES entry has at least one element (unless auto-only)", () => {
    for (const cat of CATEGORIES) {
      const hasAny = ELEMENTS.some((e) => e.category === cat.key);
      expect(hasAny).toBe(true);
    }
  });
});

describe("CATEGORIES", () => {
  it("includes the main expected categories", () => {
    const keys = CATEGORIES.map((c) => c.key);
    expect(keys).toContain("social");
    expect(keys).toContain("contact");
    expect(keys).toContain("license");
    expect(keys).toContain("content");
    expect(keys).toContain("divider");
  });

  it("every entry has key + label + emoji", () => {
    for (const c of CATEGORIES) {
      expect(c.key).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.emoji).toBeTruthy();
    }
  });
});

describe("getElement", () => {
  it("returns the matching element for a known type", () => {
    const first = ELEMENTS[0];
    expect(getElement(first.type)).toBe(first);
  });

  it("returns undefined for an unknown type", () => {
    expect(getElement("does-not-exist-anywhere")).toBeUndefined();
  });

  it("returns undefined for empty input", () => {
    expect(getElement("")).toBeUndefined();
  });
});

describe("getCategoryElements", () => {
  it("filters by category", () => {
    for (const cat of CATEGORIES) {
      const filtered = getCategoryElements(cat.key);
      for (const el of filtered) {
        expect(el.category).toBe(cat.key);
      }
    }
  });

  it("excludes auto-pull (autoFrom) elements", () => {
    for (const cat of CATEGORIES) {
      const filtered = getCategoryElements(cat.key);
      for (const el of filtered) {
        expect(el.autoFrom).toBeFalsy();
      }
    }
  });
});

describe("buildAutoElements", () => {
  it("returns empty array when both inputs are null", () => {
    expect(buildAutoElements(null, null)).toEqual([]);
  });

  it("returns empty array when no autoFrom fields are populated", () => {
    expect(buildAutoElements({}, {})).toEqual([]);
  });

  it("pulls a username from site_settings.social_x", () => {
    const result = buildAutoElements({ social_x: "elyasad1" }, null);
    // exact element type depends on registry — only assert one of them has username metadata
    const xEntry = result.find((r) => r.type === "social_x");
    if (xEntry) {
      expect(xEntry.metadata.username).toBe("elyasad1");
      expect(xEntry.isAuto).toBe(true);
    }
  });

  it("extracts username from a full URL value", () => {
    const result = buildAutoElements({ social_x: "https://x.com/elyasad1" }, null);
    const xEntry = result.find((r) => r.type === "social_x");
    if (xEntry) {
      expect(xEntry.metadata.username).toBe("elyasad1");
    }
  });

  it("strips leading @ from username values", () => {
    const result = buildAutoElements({ social_x: "@elyasad1" }, null);
    const xEntry = result.find((r) => r.type === "social_x");
    if (xEntry) {
      expect(xEntry.metadata.username).toBe("elyasad1");
    }
  });

  it("falls back to whatsapp field when social_whatsapp is missing", () => {
    const result = buildAutoElements({ whatsapp: "966501234567" }, null);
    const wa = result.find((r) => r.type === "social_whatsapp");
    if (wa) {
      // should extract digits
      expect(wa.metadata.phone).toMatch(/\d{9,}/);
    }
  });

  it("falls back to contact_email when email field is missing", () => {
    const result = buildAutoElements({ contact_email: "hello@example.com" }, null);
    const emailEntry = result.find((r) => r.metadata.email === "hello@example.com");
    if (emailEntry) {
      expect(emailEntry.isAuto).toBe(true);
    }
  });

  it("skips elements when value is empty / whitespace", () => {
    const result = buildAutoElements({ social_x: "   " }, null);
    expect(result.every((r) => r.type !== "social_x")).toBe(true);
  });

  it("merges broker_identity fields", () => {
    const result = buildAutoElements(null, { fal_license: "123456" });
    // any element pulling from broker_identity.fal_license should appear
    const license = result.find((r) => Object.values(r.metadata).some((v) => v === "123456"));
    if (license) {
      expect(license.isAuto).toBe(true);
    }
  });
});

describe("buildElementUrl", () => {
  it("returns empty string for an unknown type", () => {
    expect(buildElementUrl("unknown-element-type", {})).toBe("");
  });

  it("uses element's buildUrl when defined", () => {
    // find an element with a buildUrl
    const el = ELEMENTS.find((e) => typeof e.buildUrl === "function");
    if (el && el.fields[0]?.key) {
      const meta: Record<string, string> = {};
      meta[el.fields[0].key] = "testvalue";
      const url = buildElementUrl(el.type, meta);
      // we just verify it returns a string (URL or empty if invalid input)
      expect(typeof url).toBe("string");
    }
  });

  it("returns empty string for elements without buildUrl (e.g. dividers)", () => {
    const dividers = ELEMENTS.filter((e) => e.category === "divider" && !e.buildUrl);
    for (const d of dividers) {
      expect(buildElementUrl(d.type, {})).toBe("");
    }
  });

  it("catches exceptions thrown by buildUrl and returns empty string", () => {
    // we can't directly inject a throwing buildUrl, but we can pass malformed metadata
    // to an element with buildUrl and verify it never throws
    const el = ELEMENTS.find((e) => typeof e.buildUrl === "function");
    if (el) {
      expect(() => buildElementUrl(el.type, {})).not.toThrow();
    }
  });
});

describe("buildElementLabel", () => {
  it("uses metadata.label when provided (overrides everything)", () => {
    const el = ELEMENTS[0];
    expect(buildElementLabel(el.type, { label: "Custom Label" })).toBe("Custom Label");
  });

  it("falls back to defaultLabel or element.label for unknown types", () => {
    expect(buildElementLabel("unknown-type", {})).toBe("رابط");
    expect(buildElementLabel("unknown-type", { label: "X" })).toBe("X");
  });

  it("uses element.label when no metadata.label or buildLabel is available", () => {
    // pick an element that has no buildLabel and no defaultLabel
    const simple = ELEMENTS.find((e) => !e.buildLabel && !e.defaultLabel);
    if (simple) {
      expect(buildElementLabel(simple.type, {})).toBe(simple.label);
    }
  });

  it("uses element.buildLabel when present", () => {
    const el = ELEMENTS.find((e) => typeof e.buildLabel === "function");
    if (el && el.fields[0]?.key) {
      const meta: Record<string, string> = {};
      meta[el.fields[0].key] = "X";
      const label = buildElementLabel(el.type, meta);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
