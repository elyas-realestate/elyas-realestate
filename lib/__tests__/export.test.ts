// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  exportToCSV,
  PROPERTIES_EXPORT_HEADERS,
  CLIENTS_EXPORT_HEADERS,
  DEALS_EXPORT_HEADERS,
} from "../export";

describe("PROPERTIES_EXPORT_HEADERS", () => {
  it("has the expected shape per entry", () => {
    for (const h of PROPERTIES_EXPORT_HEADERS) {
      expect(typeof h.key).toBe("string");
      expect(h.key.length).toBeGreaterThan(0);
      expect(typeof h.label).toBe("string");
      expect(h.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique keys", () => {
    const keys = PROPERTIES_EXPORT_HEADERS.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("includes core property columns", () => {
    const keys = PROPERTIES_EXPORT_HEADERS.map((h) => h.key);
    for (const k of ["code", "title", "city", "price", "is_published"]) {
      expect(keys).toContain(k);
    }
  });
});

describe("CLIENTS_EXPORT_HEADERS", () => {
  it("has the expected shape per entry", () => {
    for (const h of CLIENTS_EXPORT_HEADERS) {
      expect(typeof h.key).toBe("string");
      expect(typeof h.label).toBe("string");
    }
  });

  it("has unique keys", () => {
    const keys = CLIENTS_EXPORT_HEADERS.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("includes core client columns", () => {
    const keys = CLIENTS_EXPORT_HEADERS.map((h) => h.key);
    for (const k of ["code", "full_name", "phone", "category"]) {
      expect(keys).toContain(k);
    }
  });
});

describe("DEALS_EXPORT_HEADERS", () => {
  it("has the expected shape per entry", () => {
    for (const h of DEALS_EXPORT_HEADERS) {
      expect(typeof h.key).toBe("string");
      expect(typeof h.label).toBe("string");
    }
  });

  it("has unique keys", () => {
    const keys = DEALS_EXPORT_HEADERS.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("includes core deal columns", () => {
    const keys = DEALS_EXPORT_HEADERS.map((h) => h.key);
    for (const k of ["code", "title", "current_stage", "target_value"]) {
      expect(keys).toContain(k);
    }
  });
});

describe("exportToCSV — DOM behaviour", () => {
  type CapturedBlob = { content: string; type: string };
  let capturedBlobs: CapturedBlob[] = [];
  let capturedClicks = 0;

  beforeEach(() => {
    capturedBlobs = [];
    capturedClicks = 0;

    // Capture what we'd write to the Blob
    vi.spyOn(global, "Blob").mockImplementation(
      (parts: BlobPart[] | undefined, options?: BlobPropertyBag) => {
        const content = (parts || []).map((p) => (typeof p === "string" ? p : "")).join("");
        capturedBlobs.push({ content, type: options?.type || "" });
        return { size: content.length, type: options?.type || "" } as unknown as Blob;
      }
    );

    // Stub URL.createObjectURL / revokeObjectURL
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:mock-url"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });

    // Track anchor clicks
    HTMLAnchorElement.prototype.click = vi.fn(() => {
      capturedClicks++;
    });
  });

  it("does nothing when given an empty row set", () => {
    exportToCSV([], PROPERTIES_EXPORT_HEADERS, "test");
    expect(capturedBlobs.length).toBe(0);
    expect(capturedClicks).toBe(0);
  });

  it("emits a BOM and CRLF-delimited CSV", () => {
    exportToCSV(
      [{ code: "P1", title: "Villa", price: 100 }],
      [
        { key: "code", label: "Code" },
        { key: "title", label: "Title" },
        { key: "price", label: "Price" },
      ],
      "test"
    );
    expect(capturedBlobs.length).toBe(1);
    const content = capturedBlobs[0].content;
    expect(content.charCodeAt(0)).toBe(0xfeff);
    expect(content).toContain("\r\n");
    expect(content).toContain("Code,Title,Price");
    expect(content).toContain("P1,Villa,100");
  });

  it("sets the correct Blob MIME type", () => {
    exportToCSV([{ a: "1" }], [{ key: "a", label: "A" }], "test");
    expect(capturedBlobs[0].type).toMatch(/text\/csv/);
  });

  it("triggers exactly one anchor click", () => {
    exportToCSV([{ a: "1" }], [{ key: "a", label: "A" }], "filename");
    expect(capturedClicks).toBe(1);
  });

  it("escapes values containing commas with surrounding quotes", () => {
    exportToCSV([{ name: "Hello, World" }], [{ key: "name", label: "Name" }], "test");
    expect(capturedBlobs[0].content).toContain('"Hello, World"');
  });

  it("escapes embedded double quotes by doubling them", () => {
    exportToCSV([{ note: 'He said "hi"' }], [{ key: "note", label: "Note" }], "test");
    expect(capturedBlobs[0].content).toContain('"He said ""hi"""');
  });

  it("quotes values containing newlines", () => {
    exportToCSV([{ multi: "line1\nline2" }], [{ key: "multi", label: "Multi" }], "test");
    expect(capturedBlobs[0].content).toContain('"line1\nline2"');
  });

  it("emits an empty string for null/undefined values without quotes", () => {
    exportToCSV(
      [{ a: null, b: undefined, c: "x" }],
      [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
        { key: "c", label: "C" },
      ],
      "test"
    );
    expect(capturedBlobs[0].content).toContain(",,x");
  });

  it("coerces non-string values to strings", () => {
    exportToCSV(
      [{ n: 42, b: true }],
      [
        { key: "n", label: "N" },
        { key: "b", label: "B" },
      ],
      "test"
    );
    const content = capturedBlobs[0].content;
    expect(content).toContain("42,true");
  });
});
