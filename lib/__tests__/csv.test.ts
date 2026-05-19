import { describe, it, expect } from "vitest";
import {
  parseCsv,
  stringifyCsv,
  matchFieldAlias,
  parsePrice,
  parseIntSafe,
  PROPERTY_ALIASES,
  CLIENT_ALIASES,
} from "../csv";

describe("parseCsv — basic", () => {
  it("parses simple comma-separated headers + rows", () => {
    const csv = "name,age\nAhmed,30\nFatima,25";
    const rows = parseCsv(csv);
    expect(rows).toEqual([
      { name: "Ahmed", age: "30" },
      { name: "Fatima", age: "25" },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("handles CRLF line endings", () => {
    const csv = "a,b\r\n1,2\r\n3,4";
    expect(parseCsv(csv)).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  it("strips UTF-8 BOM", () => {
    const csv = "﻿name,city\nAhmed,Riyadh";
    expect(parseCsv(csv)).toEqual([{ name: "Ahmed", city: "Riyadh" }]);
  });

  it("auto-detects semicolon delimiter when more frequent than commas", () => {
    const csv = "a;b;c\n1;2;3";
    expect(parseCsv(csv)).toEqual([{ a: "1", b: "2", c: "3" }]);
  });

  it("auto-detects tab delimiter", () => {
    const csv = "a\tb\n1\t2";
    expect(parseCsv(csv)).toEqual([{ a: "1", b: "2" }]);
  });

  it("respects explicit delimiter option", () => {
    const csv = "a|b\n1|2";
    expect(parseCsv(csv, { delimiter: "|" })).toEqual([{ a: "1", b: "2" }]);
  });
});

describe("parseCsv — quotes & escapes", () => {
  it("preserves commas inside quoted fields", () => {
    const csv = `name,note\n"Ahmed","Hello, World"`;
    expect(parseCsv(csv)).toEqual([{ name: "Ahmed", note: "Hello, World" }]);
  });

  it("preserves newlines inside quoted fields", () => {
    const csv = `name,note\n"Ahmed","Line1\nLine2"`;
    expect(parseCsv(csv)).toEqual([{ name: "Ahmed", note: "Line1\nLine2" }]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    const csv = `name,note\n"Ahmed","He said ""hi"""`;
    expect(parseCsv(csv)).toEqual([{ name: "Ahmed", note: 'He said "hi"' }]);
  });

  it("trims surrounding whitespace by default", () => {
    const csv = "name,age\n  Ahmed  ,  30  ";
    expect(parseCsv(csv)).toEqual([{ name: "Ahmed", age: "30" }]);
  });

  it("preserves whitespace when trim is disabled", () => {
    const csv = "name,age\n  Ahmed  ,30";
    expect(parseCsv(csv, { trim: false })).toEqual([{ name: "  Ahmed  ", age: "30" }]);
  });

  it("fills missing trailing columns with empty strings", () => {
    const csv = "a,b,c\n1,2";
    expect(parseCsv(csv)).toEqual([{ a: "1", b: "2", c: "" }]);
  });
});

describe("stringifyCsv", () => {
  it("returns an empty string for an empty array", () => {
    expect(stringifyCsv([])).toBe("");
  });

  it("emits BOM by default for Excel compatibility", () => {
    const out = stringifyCsv([{ a: "1" }]);
    expect(out.charCodeAt(0)).toBe(0xfeff);
  });

  it("omits BOM when explicitly disabled", () => {
    const out = stringifyCsv([{ a: "1" }], { bom: false });
    expect(out.charCodeAt(0)).not.toBe(0xfeff);
  });

  it("uses CRLF line endings", () => {
    const out = stringifyCsv([{ a: "1" }], { bom: false });
    expect(out).toContain("\r\n");
  });

  it("quotes fields containing the delimiter", () => {
    const out = stringifyCsv([{ name: "Ahmed", note: "Hello, World" }], { bom: false });
    expect(out).toContain('"Hello, World"');
  });

  it("escapes embedded quotes by doubling them", () => {
    const out = stringifyCsv([{ note: 'He said "hi"' }], { bom: false });
    expect(out).toContain('"He said ""hi"""');
  });

  it("supports a custom delimiter", () => {
    const out = stringifyCsv([{ a: "1", b: "2" }], { delimiter: ";", bom: false });
    expect(out).toMatch(/a;b\r\n1;2/);
  });

  it("respects explicit column ordering", () => {
    const out = stringifyCsv([{ z: "3", a: "1", m: "2" }], {
      columns: ["a", "m", "z"],
      bom: false,
    });
    expect(out.split("\r\n")[0]).toBe("a,m,z");
    expect(out.split("\r\n")[1]).toBe("1,2,3");
  });

  it("round-trips via parseCsv", () => {
    const rows = [
      { name: "Ahmed", city: "Riyadh", note: "Hello, World" },
      { name: "Fatima", city: "Jeddah", note: 'with "quotes"' },
    ];
    const csv = stringifyCsv(rows);
    const parsed = parseCsv(csv);
    expect(parsed).toEqual(rows);
  });
});

describe("matchFieldAlias", () => {
  it("matches a known Arabic property alias to its target", () => {
    expect(matchFieldAlias("السعر", PROPERTY_ALIASES)).toBe("price");
  });

  it("matches a known English property alias to its target", () => {
    expect(matchFieldAlias("Price", PROPERTY_ALIASES)).toBe("price");
  });

  it("is case-insensitive and ignores surrounding whitespace", () => {
    expect(matchFieldAlias("  PRICE  ", PROPERTY_ALIASES)).toBe("price");
  });

  it("normalizes separators (space/underscore/hyphen)", () => {
    expect(matchFieldAlias("property_type", PROPERTY_ALIASES)).toBe("type");
    expect(matchFieldAlias("property-type", PROPERTY_ALIASES)).toBe("type");
    expect(matchFieldAlias("property type", PROPERTY_ALIASES)).toBe("type");
  });

  it("matches client-specific aliases", () => {
    expect(matchFieldAlias("الجوال", CLIENT_ALIASES)).toBe("phone");
    expect(matchFieldAlias("budget", CLIENT_ALIASES)).toBe("budget");
  });

  it("returns null for unrecognized headers", () => {
    expect(matchFieldAlias("xyz_unknown", PROPERTY_ALIASES)).toBeNull();
  });
});

describe("parsePrice", () => {
  it("parses a plain number", () => {
    expect(parsePrice("1500000")).toBe(1500000);
  });

  it("strips comma thousand separators", () => {
    expect(parsePrice("1,500,000")).toBe(1500000);
  });

  it("strips Arabic thousand separators (،)", () => {
    expect(parsePrice("1،500،000")).toBe(1500000);
  });

  it("strips ر.س suffix", () => {
    expect(parsePrice("1500000 ر.س")).toBe(1500000);
  });

  it("strips SAR suffix (case-insensitive)", () => {
    expect(parsePrice("1500 SAR")).toBe(1500);
    expect(parsePrice("1500 sar")).toBe(1500);
  });

  it("strips ريال suffix", () => {
    expect(parsePrice("1500 ريال")).toBe(1500);
  });

  it("returns null for empty input", () => {
    expect(parsePrice("")).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
  });

  it("returns null for non-numeric content", () => {
    expect(parsePrice("abc")).toBeNull();
  });
});

describe("parseIntSafe", () => {
  it("parses a plain integer", () => {
    expect(parseIntSafe("42")).toBe(42);
  });

  it("strips non-digit characters", () => {
    expect(parseIntSafe("42 rooms")).toBe(42);
    expect(parseIntSafe("$100")).toBe(100);
  });

  it("returns null for empty input", () => {
    expect(parseIntSafe("")).toBeNull();
    expect(parseIntSafe(undefined)).toBeNull();
  });
});
