import { describe, it, expect } from "vitest";
import {
  buildRealEstateAgentSchema,
  buildRealEstateListingSchema,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
} from "../schema-org";

describe("buildRealEstateAgentSchema", () => {
  it("returns a schema with correct @context and @type", () => {
    const schema = buildRealEstateAgentSchema({ slug: "elyas", name: "إلياس" });
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("RealEstateAgent");
  });

  it("constructs a canonical @id from slug", () => {
    const schema = buildRealEstateAgentSchema({ slug: "elyas", name: "إلياس" });
    expect(String(schema["@id"])).toMatch(/\/elyas$/);
    expect(String(schema.url)).toMatch(/\/elyas$/);
  });

  it("prefers phone over whatsapp for telephone", () => {
    const schema = buildRealEstateAgentSchema({
      slug: "x",
      name: "X",
      phone: "+966501234567",
      whatsapp: "+966509876543",
    });
    expect(schema.telephone).toBe("+966501234567");
  });

  it("falls back to whatsapp when phone is missing", () => {
    const schema = buildRealEstateAgentSchema({
      slug: "x",
      name: "X",
      whatsapp: "+966509876543",
    });
    expect(schema.telephone).toBe("+966509876543");
  });

  it("synthesizes a description when bio is missing", () => {
    const schema = buildRealEstateAgentSchema({
      slug: "x",
      name: "إلياس",
      city: "الرياض",
    });
    expect(String(schema.description)).toContain("إلياس");
    expect(String(schema.description)).toContain("الرياض");
  });

  it("uses bio verbatim when provided", () => {
    const schema = buildRealEstateAgentSchema({
      slug: "x",
      name: "إلياس",
      bio: "وسيط محترف منذ ٢٠١٠",
    });
    expect(schema.description).toBe("وسيط محترف منذ ٢٠١٠");
  });

  it("includes address only when city is provided", () => {
    const withCity = buildRealEstateAgentSchema({
      slug: "x",
      name: "X",
      city: "الرياض",
      district: "الياسمين",
    });
    const without = buildRealEstateAgentSchema({ slug: "x", name: "X" });
    expect(withCity.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "الرياض",
      addressRegion: "الياسمين",
      addressCountry: "SA",
    });
    expect(without.address).toBeUndefined();
  });

  it("includes fal license credential when present", () => {
    const schema = buildRealEstateAgentSchema({
      slug: "x",
      name: "X",
      falLicense: "123456",
    });
    const cred = schema.hasCredential as Record<string, unknown>;
    expect(cred?.credentialCategory).toBe("License");
    expect(cred?.identifier).toBe("123456");
  });

  it("omits credential when license is missing", () => {
    const schema = buildRealEstateAgentSchema({ slug: "x", name: "X" });
    expect(schema.hasCredential).toBeUndefined();
  });

  it("builds sameAs URLs from social usernames", () => {
    const schema = buildRealEstateAgentSchema({
      slug: "x",
      name: "X",
      social: {
        social_x: "elyasad1",
        social_instagram: "elyas_realestate",
      },
    });
    const sameAs = schema.sameAs as string[];
    expect(sameAs).toContain("https://x.com/elyasad1");
    expect(sameAs).toContain("https://instagram.com/elyas_realestate");
  });

  it("preserves full URLs in social rather than re-prefixing them", () => {
    const schema = buildRealEstateAgentSchema({
      slug: "x",
      name: "X",
      social: { social_x: "https://x.com/elyasad1" },
    });
    expect((schema.sameAs as string[])[0]).toBe("https://x.com/elyasad1");
  });

  it("omits sameAs entirely when no social entries", () => {
    const schema = buildRealEstateAgentSchema({ slug: "x", name: "X" });
    expect(schema.sameAs).toBeUndefined();
  });

  it("always declares Arabic and English language knowledge", () => {
    const schema = buildRealEstateAgentSchema({ slug: "x", name: "X" });
    expect(schema.knowsLanguage).toEqual(["ar", "en"]);
  });
});

describe("buildRealEstateListingSchema", () => {
  const baseProp = {
    id: "p1",
    title: "فيلا الياسمين",
    brokerSlug: "elyas",
    brokerName: "إلياس",
  };

  it("declares the correct @context and @type", () => {
    const schema = buildRealEstateListingSchema(baseProp);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("RealEstateListing");
  });

  it("builds @id and url from id", () => {
    const schema = buildRealEstateListingSchema(baseProp);
    expect(String(schema["@id"])).toMatch(/\/properties\/p1$/);
  });

  it("includes price offer when price is present", () => {
    const schema = buildRealEstateListingSchema({ ...baseProp, price: 1_500_000 });
    expect(schema.offers).toMatchObject({
      "@type": "Offer",
      price: 1_500_000,
      priceCurrency: "SAR",
    });
  });

  it("supports custom currency", () => {
    const schema = buildRealEstateListingSchema({
      ...baseProp,
      price: 1000,
      currency: "USD",
    });
    expect((schema.offers as Record<string, unknown>).priceCurrency).toBe("USD");
  });

  it("omits offer when no price", () => {
    const schema = buildRealEstateListingSchema(baseProp);
    expect(schema.offers).toBeUndefined();
  });

  it("maps فيلا/شقة/بيت subCategory to Residence", () => {
    for (const sc of ["فيلا", "شقة", "بيت"]) {
      const s = buildRealEstateListingSchema({ ...baseProp, subCategory: sc });
      expect(s.additionalType).toBe("Residence");
    }
  });

  it("maps تجاري mainCategory to CommercialBuilding", () => {
    const s = buildRealEstateListingSchema({ ...baseProp, mainCategory: "تجاري" });
    expect(s.additionalType).toBe("CommercialBuilding");
  });

  it("maps أرض mainCategory to Place", () => {
    const s = buildRealEstateListingSchema({ ...baseProp, mainCategory: "أرض" });
    expect(s.additionalType).toBe("Place");
  });

  it("defaults additionalType to Residence", () => {
    expect(buildRealEstateListingSchema(baseProp).additionalType).toBe("Residence");
  });

  it("emits floorSize in square meters when area is present", () => {
    const s = buildRealEstateListingSchema({ ...baseProp, area: 350 });
    expect(s.floorSize).toMatchObject({
      "@type": "QuantitativeValue",
      value: 350,
      unitCode: "MTK",
    });
  });

  it("references broker by slug + name", () => {
    const s = buildRealEstateListingSchema(baseProp);
    const broker = s.broker as Record<string, unknown>;
    expect(broker["@type"]).toBe("RealEstateAgent");
    expect(broker.name).toBe("إلياس");
    expect(String(broker.url)).toMatch(/\/elyas$/);
  });

  it("falls back to title as description when description is missing", () => {
    const s = buildRealEstateListingSchema(baseProp);
    expect(s.description).toBe(baseProp.title);
  });

  it("uses provided description verbatim", () => {
    const s = buildRealEstateListingSchema({
      ...baseProp,
      description: "فيلا حديثة بمسبح",
    });
    expect(s.description).toBe("فيلا حديثة بمسبح");
  });
});

describe("buildBreadcrumbSchema", () => {
  it("declares the correct @context and @type", () => {
    const s = buildBreadcrumbSchema([{ name: "الرئيسية", url: "/" }]);
    expect(s["@context"]).toBe("https://schema.org");
    expect(s["@type"]).toBe("BreadcrumbList");
  });

  it("assigns sequential 1-based positions", () => {
    const items = [
      { name: "الرئيسية", url: "/" },
      { name: "العقارات", url: "/properties" },
      { name: "فيلا", url: "/properties/p1" },
    ];
    const s = buildBreadcrumbSchema(items);
    const list = s.itemListElement as Array<Record<string, unknown>>;
    expect(list.map((x) => x.position)).toEqual([1, 2, 3]);
    expect(list[0].name).toBe("الرئيسية");
    expect(list[2].item).toBe("/properties/p1");
  });

  it("handles an empty list", () => {
    const s = buildBreadcrumbSchema([]);
    expect(s.itemListElement).toEqual([]);
  });
});

describe("buildOrganizationSchema", () => {
  it("returns a stable Organization schema for Wasit Pro", () => {
    const s = buildOrganizationSchema();
    expect(s["@type"]).toBe("Organization");
    expect(s.name).toBe("وسيط برو");
    expect(s.alternateName).toBe("Wasit Pro");
    expect(s.sameAs).toEqual(["https://x.com/wasitpro"]);
    expect((s.address as Record<string, unknown>).addressCountry).toBe("SA");
  });
});
