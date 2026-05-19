import { describe, it, expect } from "vitest";
import {
  DEPARTMENT_META,
  PROVIDER_LABELS,
  KB_CATEGORIES,
  DIRECTIVE_SOURCE_META,
  TRIGGER_LABELS,
} from "../org-constants";

describe("DEPARTMENT_META", () => {
  it("includes all five core departments", () => {
    const keys = Object.keys(DEPARTMENT_META);
    expect(keys).toContain("cs");
    expect(keys).toContain("marketing");
    expect(keys).toContain("asset");
    expect(keys).toContain("financial");
    expect(keys).toContain("dev_bizdev");
  });

  it("every entry has label, color, bg, and icon", () => {
    for (const meta of Object.values(DEPARTMENT_META)) {
      expect(typeof meta.label).toBe("string");
      expect(meta.label.length).toBeGreaterThan(0);
      expect(typeof meta.color).toBe("string");
      expect(meta.color).toMatch(/^var\(/);
      expect(typeof meta.bg).toBe("string");
      expect(meta.icon).toBeDefined();
    }
  });
});

describe("PROVIDER_LABELS", () => {
  it("maps every supported AI provider", () => {
    expect(PROVIDER_LABELS.openai).toBe("OpenAI");
    expect(PROVIDER_LABELS.anthropic).toBe("Claude");
    expect(PROVIDER_LABELS.google).toBe("Gemini");
    expect(PROVIDER_LABELS.groq).toBe("Groq");
    expect(PROVIDER_LABELS.deepseek).toBe("DeepSeek");
    expect(PROVIDER_LABELS.xai).toBe("Grok");
  });

  it("every label is non-empty", () => {
    for (const label of Object.values(PROVIDER_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("KB_CATEGORIES", () => {
  it("includes general/faq/brand/policy categories", () => {
    const keys = Object.keys(KB_CATEGORIES);
    expect(keys).toContain("general");
    expect(keys).toContain("faq");
    expect(keys).toContain("brand");
    expect(keys).toContain("policy");
  });

  it("includes real-estate-specific categories", () => {
    const keys = Object.keys(KB_CATEGORIES);
    expect(keys).toContain("property_data");
    expect(keys).toContain("client_history");
    expect(keys).toContain("market_intel");
  });

  it("uses Arabic labels", () => {
    for (const label of Object.values(KB_CATEGORIES)) {
      // every label should contain at least one Arabic character
      expect(label).toMatch(/[؀-ۿ]/);
    }
  });
});

describe("DIRECTIVE_SOURCE_META", () => {
  it("includes the three known source types", () => {
    expect(DIRECTIVE_SOURCE_META.custom).toBeDefined();
    expect(DIRECTIVE_SOURCE_META.inherited).toBeDefined();
    expect(DIRECTIVE_SOURCE_META.suggested).toBeDefined();
  });

  it("every entry has label/color/bg fields", () => {
    for (const meta of Object.values(DIRECTIVE_SOURCE_META)) {
      expect(typeof meta.label).toBe("string");
      expect(meta.label.length).toBeGreaterThan(0);
      expect(typeof meta.color).toBe("string");
      expect(typeof meta.bg).toBe("string");
    }
  });
});

describe("TRIGGER_LABELS", () => {
  it("covers cron and event-based triggers", () => {
    expect(TRIGGER_LABELS.cron_daily).toBeDefined();
    expect(TRIGGER_LABELS.cron_hourly).toBeDefined();
    expect(TRIGGER_LABELS.cron_weekly).toBeDefined();
    expect(TRIGGER_LABELS.webhook).toBeDefined();
    expect(TRIGGER_LABELS.on_event).toBeDefined();
  });

  it("uses Arabic labels", () => {
    for (const label of Object.values(TRIGGER_LABELS)) {
      expect(label).toMatch(/[؀-ۿ]/);
    }
  });
});
