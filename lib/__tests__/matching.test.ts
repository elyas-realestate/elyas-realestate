import { describe, it, expect } from "vitest";
import { calculateMatch, findBestMatches } from "../matching";

const property = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  city: "الرياض",
  district: "الياسمين",
  price: 1_000_000,
  offer_type: "بيع",
  main_category: "شقة",
  rooms: 4,
  ...overrides,
});

describe("calculateMatch — city score (max 30)", () => {
  it("awards 30 points for exact city match", () => {
    const m = calculateMatch({ city: "الرياض" }, property(), "r1");
    expect(m.breakdown.city).toBe(30);
  });

  it("awards 15 points when city is missing on the request (no preference)", () => {
    const m = calculateMatch({}, property(), "r1");
    expect(m.breakdown.city).toBe(15);
  });

  it("awards 0 points when cities are unrelated", () => {
    const m = calculateMatch({ city: "جدة" }, property({ city: "الرياض" }), "r1");
    expect(m.breakdown.city).toBe(0);
  });

  it("awards 15 points for partial substring match", () => {
    const m = calculateMatch({ city: "الرياض الكبرى" }, property({ city: "الرياض" }), "r1");
    expect(m.breakdown.city).toBe(15);
  });
});

describe("calculateMatch — district score (max 20)", () => {
  it("awards 20 points for exact district match", () => {
    const m = calculateMatch({ district: "الياسمين" }, property(), "r1");
    expect(m.breakdown.district).toBe(20);
  });

  it("awards 10 points when district is missing on the request", () => {
    const m = calculateMatch({}, property(), "r1");
    expect(m.breakdown.district).toBe(10);
  });

  it("awards 0 points when districts are unrelated", () => {
    const m = calculateMatch({ district: "النرجس" }, property({ district: "الياسمين" }), "r1");
    expect(m.breakdown.district).toBe(0);
  });
});

describe("calculateMatch — price score (max 25)", () => {
  it("awards 25 points when price is inside requested range", () => {
    const m = calculateMatch(
      { min_price: 800_000, max_price: 1_200_000 },
      property({ price: 1_000_000 }),
      "r1"
    );
    expect(m.breakdown.price).toBe(25);
  });

  it("awards 12 points when neither min nor max is set", () => {
    const m = calculateMatch({}, property({ price: 1_000_000 }), "r1");
    expect(m.breakdown.price).toBe(12);
  });

  it("awards 20 points when price is within 10% of midpoint", () => {
    const m = calculateMatch(
      { min_price: 900_000, max_price: 1_100_000 },
      property({ price: 1_200_000 }), // outside range, but close
      "r1"
    );
    // midpoint = 1,000,000; diff = 200k/1M = 20%, which falls in 15-25% bracket = 15 points
    expect(m.breakdown.price).toBe(15);
  });

  it("awards 0 points when property has no price", () => {
    const m = calculateMatch(
      { min_price: 100_000, max_price: 200_000 },
      property({ price: undefined }),
      "r1"
    );
    expect(m.breakdown.price).toBe(0);
  });
});

describe("calculateMatch — category score (max 15)", () => {
  it("awards 8 points for matching main_category", () => {
    const m = calculateMatch(
      { main_category: "شقة", offer_type: undefined },
      property({ main_category: "شقة", offer_type: undefined }),
      "r1"
    );
    expect(m.breakdown.category).toBeGreaterThanOrEqual(8);
  });

  it("awards 7 points for matching offer_type", () => {
    const m = calculateMatch(
      { offer_type: "بيع", main_category: undefined },
      property({ offer_type: "بيع", main_category: undefined }),
      "r1"
    );
    expect(m.breakdown.category).toBeGreaterThanOrEqual(7);
  });

  it("gives default partial credit when category fields are missing on the request", () => {
    const m = calculateMatch({}, property(), "r1");
    // 4 + 3 = 7 baseline
    expect(m.breakdown.category).toBe(7);
  });
});

describe("calculateMatch — rooms score (max 10)", () => {
  it("awards 10 points for exact room match", () => {
    const m = calculateMatch({ rooms: 4 }, property({ rooms: 4 }), "r1");
    expect(m.breakdown.rooms).toBe(10);
  });

  it("awards 6 points for ±1 room difference", () => {
    const m = calculateMatch({ rooms: 4 }, property({ rooms: 5 }), "r1");
    expect(m.breakdown.rooms).toBe(6);
  });

  it("awards 3 points for ±2 room difference", () => {
    const m = calculateMatch({ rooms: 4 }, property({ rooms: 2 }), "r1");
    expect(m.breakdown.rooms).toBe(3);
  });

  it("awards 0 points for large room difference", () => {
    const m = calculateMatch({ rooms: 4 }, property({ rooms: 10 }), "r1");
    expect(m.breakdown.rooms).toBe(0);
  });

  it("awards 5 points when rooms is missing on request (no preference)", () => {
    const m = calculateMatch({}, property({ rooms: 4 }), "r1");
    expect(m.breakdown.rooms).toBe(5);
  });
});

describe("calculateMatch — total score", () => {
  it("returns 100 for a perfect match", () => {
    const m = calculateMatch(
      {
        city: "الرياض",
        district: "الياسمين",
        min_price: 800_000,
        max_price: 1_200_000,
        offer_type: "بيع",
        main_category: "شقة",
        rooms: 4,
      },
      property(),
      "r1"
    );
    expect(m.score).toBe(100);
  });

  it("returns the correct property_id and request_id", () => {
    const m = calculateMatch({}, property({ id: "abc" }), "req-99");
    expect(m.property_id).toBe("abc");
    expect(m.request_id).toBe("req-99");
  });
});

describe("findBestMatches", () => {
  const request = {
    city: "الرياض",
    district: "الياسمين",
    min_price: 800_000,
    max_price: 1_200_000,
    offer_type: "بيع",
    main_category: "شقة",
    rooms: 4,
  };

  it("returns matches sorted by descending score", () => {
    const props = [
      property({ id: "low", city: "جدة", district: "X", price: 5_000_000, rooms: 10 }),
      property({ id: "perfect" }),
      property({ id: "ok", rooms: 3 }),
    ];
    const matches = findBestMatches(request, props, "r1", 5);
    expect(matches[0].property_id).toBe("perfect");
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i].score).toBeLessThanOrEqual(matches[i - 1].score);
    }
  });

  it("filters out matches below 30%", () => {
    const props = [
      property({
        id: "bad",
        city: "جدة",
        district: "X",
        price: 50_000_000,
        rooms: 20,
        offer_type: "إيجار",
        main_category: "أرض",
      }),
    ];
    const matches = findBestMatches(request, props, "r1", 5);
    expect(matches.length).toBe(0);
  });

  it("limits results to the requested count", () => {
    const props = Array.from({ length: 10 }, (_, i) => property({ id: `p${i}` }));
    const matches = findBestMatches(request, props, "r1", 3);
    expect(matches.length).toBe(3);
  });

  it("uses a default limit of 5 when not specified", () => {
    const props = Array.from({ length: 10 }, (_, i) => property({ id: `p${i}` }));
    const matches = findBestMatches(request, props, "r1");
    expect(matches.length).toBe(5);
  });
});
