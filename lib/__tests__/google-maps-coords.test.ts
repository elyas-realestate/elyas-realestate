import { describe, it, expect } from "vitest";
import { extractCoordsFromUrl, isShortMapsUrl, warnIfOutsideSaudi } from "../google-maps-coords";

describe("extractCoordsFromUrl — @ pattern", () => {
  it("extracts from /@lat,lng,zoom URL", () => {
    const coords = extractCoordsFromUrl("https://www.google.com/maps/@24.7136,46.6753,15z");
    expect(coords).toEqual({ lat: 24.7136, lng: 46.6753 });
  });

  it("extracts from a place URL with @ before coords", () => {
    const coords = extractCoordsFromUrl(
      "https://www.google.com/maps/place/Riyadh/@24.7136,46.6753,12z"
    );
    expect(coords).toEqual({ lat: 24.7136, lng: 46.6753 });
  });
});

describe("extractCoordsFromUrl — q= parameter", () => {
  it("extracts from ?q=lat,lng", () => {
    const coords = extractCoordsFromUrl("https://www.google.com/maps?q=24.7136,46.6753");
    expect(coords).toEqual({ lat: 24.7136, lng: 46.6753 });
  });

  it("extracts from &q=lat,lng (not the first param)", () => {
    const coords = extractCoordsFromUrl("https://www.google.com/maps?foo=bar&q=24.7136,46.6753");
    expect(coords).toEqual({ lat: 24.7136, lng: 46.6753 });
  });
});

describe("extractCoordsFromUrl — !3d!4d pattern", () => {
  it("extracts from a long place URL with !3d!4d", () => {
    const coords = extractCoordsFromUrl(
      "https://www.google.com/maps/place/X/data=!3d24.7136!4d46.6753"
    );
    expect(coords).toEqual({ lat: 24.7136, lng: 46.6753 });
  });
});

describe("extractCoordsFromUrl — bare coords", () => {
  it("extracts from a plain 'lat,lng' string", () => {
    const coords = extractCoordsFromUrl("24.7136, 46.6753");
    expect(coords).toEqual({ lat: 24.7136, lng: 46.6753 });
  });

  it("supports Arabic comma separator", () => {
    const coords = extractCoordsFromUrl("24.7136،46.6753");
    expect(coords).toEqual({ lat: 24.7136, lng: 46.6753 });
  });

  it("ignores surrounding whitespace", () => {
    const coords = extractCoordsFromUrl("  24.7136 , 46.6753  ");
    expect(coords).toEqual({ lat: 24.7136, lng: 46.6753 });
  });
});

describe("extractCoordsFromUrl — invalid input", () => {
  it("returns null for empty input", () => {
    expect(extractCoordsFromUrl("")).toBeNull();
  });

  it("returns null for a non-coord URL", () => {
    expect(extractCoordsFromUrl("https://example.com/page")).toBeNull();
  });

  it("returns null for 0,0 coordinates", () => {
    // 0,0 is the null-island and treated as invalid by isValidLatLng
    const coords = extractCoordsFromUrl("https://maps.google.com/?q=0,0");
    expect(coords).toBeNull();
  });

  it("returns null when only one number is present", () => {
    expect(extractCoordsFromUrl("just 24.7136")).toBeNull();
  });
});

describe("isShortMapsUrl", () => {
  it("returns true for maps.app.goo.gl links", () => {
    expect(isShortMapsUrl("https://maps.app.goo.gl/abc123")).toBe(true);
  });

  it("returns true for goo.gl/maps links", () => {
    expect(isShortMapsUrl("https://goo.gl/maps/xyz789")).toBe(true);
  });

  it("returns false for a full maps URL that already contains coords", () => {
    expect(isShortMapsUrl("https://www.google.com/maps/@24.7136,46.6753,15z")).toBe(false);
  });

  it("returns false for an unrelated URL", () => {
    expect(isShortMapsUrl("https://example.com/")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isShortMapsUrl("")).toBe(false);
  });

  it("is case-insensitive on the host", () => {
    expect(isShortMapsUrl("https://MAPS.APP.GOO.GL/abc")).toBe(true);
  });
});

describe("warnIfOutsideSaudi", () => {
  it("returns null for coords inside Saudi Arabia", () => {
    expect(warnIfOutsideSaudi({ lat: 24.7136, lng: 46.6753 })).toBeNull();
  });

  it("returns a warning for coords outside Saudi Arabia", () => {
    // London ≈ 51.5, -0.13
    const warning = warnIfOutsideSaudi({ lat: 51.5, lng: -0.13 });
    expect(warning).toBeTruthy();
    expect(warning).toMatch(/المملكة/);
  });

  it("returns a warning for coords just below the southern bound", () => {
    expect(warnIfOutsideSaudi({ lat: 15, lng: 45 })).toBeTruthy();
  });

  it("returns null at the corner of the Saudi bounding box", () => {
    expect(warnIfOutsideSaudi({ lat: 16, lng: 34 })).toBeNull();
    expect(warnIfOutsideSaudi({ lat: 33, lng: 56 })).toBeNull();
  });
});
