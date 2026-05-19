import { describe, it, expect } from "vitest";
import {
  formatForPortal,
  getPortalMeta,
  PORTALS,
  type PropertyForDistribution,
} from "../portal-adapters";

const baseProperty: PropertyForDistribution = {
  id: "p1",
  title: "فيلا الياسمين",
  code: "VL-001",
  main_category: "سكني",
  sub_category: "فيلا",
  offer_type: "بيع",
  city: "الرياض",
  district: "الياسمين",
  price: 1_500_000,
  land_area: 350,
  rooms: 4,
  description: "فيلا حديثة بتشطيب فاخر",
  broker_phone: "+966501234567",
  broker_name: "إلياس الدخيل",
  fal_license: "1234567890",
  public_url: "https://example.com/property/VL-001",
};

describe("PORTALS — registry integrity", () => {
  it("contains the expected portals", () => {
    const ids = PORTALS.map((p) => p.id);
    expect(ids).toContain("aqar");
    expect(ids).toContain("bayut");
    expect(ids).toContain("twitter");
    expect(ids).toContain("whatsapp");
    expect(ids).toContain("instagram");
    expect(ids).toContain("facebook");
    expect(ids).toContain("other");
  });

  it("every portal has required metadata", () => {
    for (const p of PORTALS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.nameEn).toBeTruthy();
      expect(p.icon).toBeTruthy();
      expect(typeof p.supportsImages).toBe("boolean");
    }
  });

  it("twitter has the 280-char limit", () => {
    const tw = PORTALS.find((p) => p.id === "twitter");
    expect(tw?.maxLength).toBe(280);
  });

  it("instagram has the 2200-char limit", () => {
    const ig = PORTALS.find((p) => p.id === "instagram");
    expect(ig?.maxLength).toBe(2200);
  });
});

describe("getPortalMeta", () => {
  it("returns metadata for a known portal", () => {
    const meta = getPortalMeta("aqar");
    expect(meta.name).toBe("عقار.كوم");
  });

  it("falls back to the 'other' portal for an unknown id", () => {
    // @ts-expect-error testing fallback with an invalid id
    const meta = getPortalMeta("nonexistent");
    expect(meta.id).toBe("other");
  });
});

describe("formatForPortal — aqar adapter", () => {
  it("includes the title with emoji marker", () => {
    const out = formatForPortal("aqar", baseProperty);
    expect(out).toContain("🏷️ فيلا الياسمين");
  });

  it("includes property code, type, location, area, rooms, price", () => {
    const out = formatForPortal("aqar", baseProperty);
    expect(out).toContain("VL-001");
    expect(out).toContain("فيلا");
    expect(out).toContain("الياسمين");
    expect(out).toContain("الرياض");
    expect(out).toContain("4");
    expect(out).toContain("ريال");
  });

  it("includes broker info and license", () => {
    const out = formatForPortal("aqar", baseProperty);
    expect(out).toContain("إلياس الدخيل");
    expect(out).toContain("1234567890");
    expect(out).toContain("+966501234567");
  });

  it("includes public_url when present", () => {
    const out = formatForPortal("aqar", baseProperty);
    expect(out).toContain("https://example.com/property/VL-001");
  });

  it("omits missing optional fields", () => {
    const out = formatForPortal("aqar", {
      id: "p2",
      title: "أرض",
    });
    expect(out).toContain("أرض");
    expect(out).not.toContain("undefined");
    expect(out).not.toContain("null");
  });
});

describe("formatForPortal — bayut adapter", () => {
  it("uses English labels (Type/Listing/Area/Bedrooms/Price)", () => {
    const out = formatForPortal("bayut", baseProperty);
    expect(out).toContain("Type:");
    expect(out).toContain("Listing:");
    expect(out).toContain("Area:");
    expect(out).toContain("Bedrooms:");
    expect(out).toContain("Price: SAR");
  });

  it("avoids the heavy emoji markers used by aqar", () => {
    const out = formatForPortal("bayut", baseProperty);
    expect(out).not.toContain("🏷️");
    expect(out).not.toContain("📞");
  });

  it("starts with the title line", () => {
    const out = formatForPortal("bayut", baseProperty);
    expect(out.startsWith("فيلا الياسمين")).toBe(true);
  });
});

describe("formatForPortal — twitter adapter", () => {
  it("respects the 280-character limit", () => {
    const longDesc = "وصف طويل جداً ".repeat(50);
    const out = formatForPortal("twitter", { ...baseProperty, description: longDesc });
    expect(out.length).toBeLessThanOrEqual(280);
  });

  it("truncates with an ellipsis when over the limit", () => {
    const longTitle = "ع".repeat(500);
    const out = formatForPortal("twitter", { ...baseProperty, title: longTitle });
    expect(out.endsWith("…")).toBe(true);
  });

  it("includes hashtags", () => {
    const out = formatForPortal("twitter", baseProperty);
    expect(out).toMatch(/#عقار/);
    expect(out).toMatch(/#سعودي/);
  });

  it("uses #إيجار when offer_type is إيجار", () => {
    const out = formatForPortal("twitter", { ...baseProperty, offer_type: "إيجار" });
    expect(out).toContain("#إيجار");
  });

  it("uses #للبيع by default", () => {
    const out = formatForPortal("twitter", baseProperty);
    expect(out).toContain("#للبيع");
  });

  it("includes the city as a hashtag with spaces replaced", () => {
    const out = formatForPortal("twitter", { ...baseProperty, city: "أبو ظبي" });
    expect(out).toContain("#أبو_ظبي");
  });
});

describe("formatForPortal — whatsapp adapter", () => {
  it("uses WhatsApp bold markdown for title and price", () => {
    const out = formatForPortal("whatsapp", baseProperty);
    expect(out).toContain("*فيلا الياسمين*");
    expect(out).toMatch(/\*[\d,٬٫\s]+ ريال\*/);
  });

  it("includes emoji markers", () => {
    const out = formatForPortal("whatsapp", baseProperty);
    expect(out).toContain("📞");
    expect(out).toContain("💰");
    expect(out).toContain("📍");
  });

  it("includes public_url when present", () => {
    const out = formatForPortal("whatsapp", baseProperty);
    expect(out).toContain("https://example.com/property/VL-001");
  });
});

describe("formatForPortal — instagram adapter", () => {
  it("includes a hashtag block at the end", () => {
    const out = formatForPortal("instagram", baseProperty);
    expect(out).toContain("#عقارات");
    expect(out).toContain("#الرياض");
  });

  it("uses Arabic + English hashtags for cross-reach", () => {
    const out = formatForPortal("instagram", baseProperty);
    expect(out).toMatch(/real_estate_ksa/);
  });

  it("uses #إيجار when offer_type is إيجار", () => {
    const out = formatForPortal("instagram", { ...baseProperty, offer_type: "إيجار" });
    expect(out).toContain("#إيجار");
    expect(out).toContain("#للإيجار");
  });

  it("uses #للبيع #استثمار_عقاري for sale", () => {
    const out = formatForPortal("instagram", baseProperty);
    expect(out).toContain("#للبيع");
    expect(out).toContain("#استثمار_عقاري");
  });
});

describe("formatForPortal — facebook adapter", () => {
  it("returns content similar to aqar but without the separator line", () => {
    const out = formatForPortal("facebook", baseProperty);
    expect(out).not.toContain("─────────────");
    expect(out).toContain("فيلا الياسمين");
  });
});

describe("formatForPortal — fallback", () => {
  it("uses the generic adapter for an unknown portal", () => {
    // @ts-expect-error testing unknown portal fallback
    const out = formatForPortal("unknownportal", baseProperty);
    // generic = aqar
    expect(out).toContain("🏷️ فيلا الياسمين");
  });

  it("handles the 'other' explicit fallback", () => {
    const out = formatForPortal("other", baseProperty);
    expect(out).toContain("فيلا الياسمين");
  });
});
