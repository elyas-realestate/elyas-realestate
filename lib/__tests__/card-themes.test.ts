import { describe, it, expect } from "vitest";
import { CARD_THEMES, CATEGORY_LABELS, getThemeById, getThemesByCategory } from "../card-themes";

describe("CARD_THEMES — data integrity", () => {
  it("has at least 20 themes", () => {
    expect(CARD_THEMES.length).toBeGreaterThanOrEqual(20);
  });

  it("every theme has a unique id", () => {
    const ids = CARD_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every theme has required fields populated", () => {
    for (const t of CARD_THEMES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.emoji).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.bg_color).toMatch(/^#[0-9a-f]{3,8}$/i);
      expect(t.text_color).toMatch(/^#[0-9a-f]{3,8}$/i);
      expect(t.accent_color).toMatch(/^#[0-9a-f]{3,8}$/i);
    }
  });

  it("every category appears in CATEGORY_LABELS", () => {
    const categories = new Set(CARD_THEMES.map((t) => t.category));
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it("preview_gradient (when present) is a CSS linear-gradient string", () => {
    for (const t of CARD_THEMES) {
      if (t.preview_gradient) {
        expect(t.preview_gradient).toMatch(/linear-gradient/);
      }
    }
  });
});

describe("getThemeById", () => {
  it("returns a theme for a known id", () => {
    const theme = getThemeById("royal-gold");
    expect(theme).toBeDefined();
    expect(theme?.name).toBe("ذهبي ملكي");
  });

  it("returns undefined for an unknown id", () => {
    expect(getThemeById("does-not-exist")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getThemeById("")).toBeUndefined();
  });
});

describe("getThemesByCategory", () => {
  it("returns only luxury themes for 'luxury'", () => {
    const themes = getThemesByCategory("luxury");
    expect(themes.length).toBeGreaterThan(0);
    for (const t of themes) {
      expect(t.category).toBe("luxury");
    }
  });

  it("returns only modern themes for 'modern'", () => {
    const themes = getThemesByCategory("modern");
    expect(themes.length).toBeGreaterThan(0);
    for (const t of themes) {
      expect(t.category).toBe("modern");
    }
  });

  it("returns at least one theme for every defined category", () => {
    for (const cat of Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>) {
      const themes = getThemesByCategory(cat);
      expect(themes.length).toBeGreaterThan(0);
    }
  });

  it("partitions: sum of category sizes equals total themes", () => {
    let total = 0;
    for (const cat of Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>) {
      total += getThemesByCategory(cat).length;
    }
    expect(total).toBe(CARD_THEMES.length);
  });
});
