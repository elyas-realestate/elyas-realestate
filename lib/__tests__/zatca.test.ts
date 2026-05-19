import { describe, it, expect } from "vitest";
import { buildZatcaQr, isValidSaudiVat, hashInvoice, buildUblXml } from "../zatca";

describe("buildZatcaQr — TLV encoding", () => {
  const baseInput = {
    sellerName: "وسيط برو",
    vatNumber: "300000000000003",
    timestamp: "2026-05-19T10:00:00.000Z",
    totalWithVat: 1150,
    vatAmount: 150,
  };

  it("returns a non-empty base64 string", () => {
    const qr = buildZatcaQr(baseInput);
    expect(typeof qr).toBe("string");
    expect(qr.length).toBeGreaterThan(0);
    expect(qr).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("encodes all 5 TLV tags into the payload", () => {
    const qr = buildZatcaQr(baseInput);
    const bytes = Buffer.from(qr, "base64");
    // The payload starts with tag=1, length=N, name bytes...
    expect(bytes[0]).toBe(1);
    // Then a tag=2 (vatNumber) section, then 3 (timestamp), 4 (total), 5 (vat)
    const decoded = bytes.toString("utf8");
    expect(decoded).toContain("وسيط برو");
    expect(decoded).toContain("300000000000003");
    expect(decoded).toContain("2026-05-19");
    expect(decoded).toContain("1150.00");
    expect(decoded).toContain("150.00");
  });

  it("formats totalWithVat and vatAmount with 2 decimals", () => {
    const qr = buildZatcaQr({ ...baseInput, totalWithVat: 100, vatAmount: 15 });
    const decoded = Buffer.from(qr, "base64").toString("utf8");
    expect(decoded).toContain("100.00");
    expect(decoded).toContain("15.00");
  });

  it("handles Date object timestamps", () => {
    const date = new Date("2026-05-19T10:00:00.000Z");
    const qr = buildZatcaQr({ ...baseInput, timestamp: date });
    const decoded = Buffer.from(qr, "base64").toString("utf8");
    expect(decoded).toContain("2026-05-19T10:00:00.000Z");
  });

  it("defaults missing seller name and VAT to empty strings", () => {
    const qr = buildZatcaQr({
      sellerName: "",
      vatNumber: "",
      timestamp: "2026-05-19T10:00:00.000Z",
      totalWithVat: 0,
      vatAmount: 0,
    });
    // should not throw, should produce a valid base64
    expect(qr.length).toBeGreaterThan(0);
  });

  it("the TLV length byte equals the value byte length", () => {
    const qr = buildZatcaQr({ ...baseInput, sellerName: "abc" });
    const bytes = Buffer.from(qr, "base64");
    // first tag=1, length should be 3 (utf-8 of "abc")
    expect(bytes[0]).toBe(1);
    expect(bytes[1]).toBe(3);
    expect(bytes.slice(2, 5).toString("utf8")).toBe("abc");
  });
});

describe("isValidSaudiVat", () => {
  it("accepts a well-formed 15-digit VAT starting and ending with 3", () => {
    expect(isValidSaudiVat("300000000000003")).toBe(true);
    expect(isValidSaudiVat("312345678901293")).toBe(true);
  });

  it("rejects VAT not starting with 3", () => {
    expect(isValidSaudiVat("400000000000003")).toBe(false);
    expect(isValidSaudiVat("100000000000003")).toBe(false);
  });

  it("rejects VAT not ending with 3", () => {
    expect(isValidSaudiVat("300000000000004")).toBe(false);
    expect(isValidSaudiVat("300000000000000")).toBe(false);
  });

  it("rejects VAT of incorrect length", () => {
    expect(isValidSaudiVat("30000000000003")).toBe(false); // 14
    expect(isValidSaudiVat("3000000000000003")).toBe(false); // 16
  });

  it("rejects VAT containing non-digits", () => {
    expect(isValidSaudiVat("30000abc0000003")).toBe(false);
  });

  it("rejects null/undefined/empty", () => {
    expect(isValidSaudiVat(null)).toBe(false);
    expect(isValidSaudiVat(undefined)).toBe(false);
    expect(isValidSaudiVat("")).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidSaudiVat("  300000000000003  ")).toBe(true);
  });
});

describe("hashInvoice", () => {
  it("returns a base64-encoded SHA-256 hash", async () => {
    const hash = await hashInvoice("test invoice");
    expect(typeof hash).toBe("string");
    // SHA-256 → 32 bytes → 44 chars in base64 with padding
    expect(hash.length).toBe(44);
    expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("is deterministic for the same input", async () => {
    const a = await hashInvoice("payload");
    const b = await hashInvoice("payload");
    expect(a).toBe(b);
  });

  it("returns different hashes for different inputs", async () => {
    const a = await hashInvoice("a");
    const b = await hashInvoice("b");
    expect(a).not.toBe(b);
  });

  it("handles empty input", async () => {
    const hash = await hashInvoice("");
    // SHA-256 of "" is well-known
    expect(hash).toBe("47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");
  });
});

describe("buildUblXml", () => {
  const baseInvoice = {
    invoiceUuid: "uuid-1",
    invoiceNumber: "INV-001",
    invoiceCounter: 1,
    issueDate: "2026-05-19",
    issueTime: "10:00:00",
    invoiceType: "standard" as const,
    seller: {
      name: "Vista Rise العقارية",
      vatNumber: "300000000000003",
      city: "Riyadh",
    },
    buyer: {
      name: "Ahmed Ali",
    },
    lines: [{ id: 1, description: "Commission", quantity: 1, unitPrice: 1000, vatRate: 15 }],
  };

  it("returns a UTF-8 XML document with the correct preamble", () => {
    const xml = buildUblXml(baseInvoice);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).toContain("<Invoice");
  });

  it("includes invoice metadata fields", () => {
    const xml = buildUblXml(baseInvoice);
    expect(xml).toContain("<cbc:ID>INV-001</cbc:ID>");
    expect(xml).toContain("<cbc:UUID>uuid-1</cbc:UUID>");
    expect(xml).toContain("<cbc:IssueDate>2026-05-19</cbc:IssueDate>");
    expect(xml).toContain("<cbc:IssueTime>10:00:00</cbc:IssueTime>");
  });

  it("includes seller name and VAT number", () => {
    const xml = buildUblXml(baseInvoice);
    expect(xml).toContain("Vista Rise العقارية");
    expect(xml).toContain("<cbc:CompanyID>300000000000003</cbc:CompanyID>");
  });

  it("includes buyer name", () => {
    const xml = buildUblXml(baseInvoice);
    expect(xml).toContain("Ahmed Ali");
  });

  it("calculates and emits line-level totals (VAT-exclusive + inclusive)", () => {
    const xml = buildUblXml(baseInvoice);
    // 1000 * 1 = 1000; VAT = 150; total = 1150
    expect(xml).toContain('currencyID="SAR">1000.00</cbc:LineExtensionAmount>');
    expect(xml).toContain('currencyID="SAR">1150.00</cbc:TaxInclusiveAmount>');
    expect(xml).toContain('currencyID="SAR">150.00</cbc:TaxAmount>');
  });

  it("emits one InvoiceLine per line item", () => {
    const xml = buildUblXml({
      ...baseInvoice,
      lines: [
        { id: 1, description: "A", quantity: 1, unitPrice: 100, vatRate: 15 },
        { id: 2, description: "B", quantity: 2, unitPrice: 200, vatRate: 15 },
      ],
    });
    const matches = xml.match(/<cac:InvoiceLine>/g);
    expect(matches?.length).toBe(2);
  });

  it("escapes special XML characters in names and descriptions", () => {
    const xml = buildUblXml({
      ...baseInvoice,
      seller: { ...baseInvoice.seller, name: "A & B <Co>" },
      lines: [{ id: 1, description: "<bold>x</bold>", quantity: 1, unitPrice: 1, vatRate: 15 }],
    });
    expect(xml).toContain("A &amp; B &lt;Co&gt;");
    expect(xml).toContain("&lt;bold&gt;x&lt;/bold&gt;");
  });

  it("uses SAR as the default currency", () => {
    const xml = buildUblXml(baseInvoice);
    expect(xml).toContain("<cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>");
    expect(xml).toContain("<cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>");
  });

  it("respects a custom currency", () => {
    const xml = buildUblXml({ ...baseInvoice, currency: "USD" });
    expect(xml).toContain("<cbc:DocumentCurrencyCode>USD</cbc:DocumentCurrencyCode>");
    expect(xml).toContain('currencyID="USD"');
  });

  it("uses the standard invoice type code 388", () => {
    const xml = buildUblXml(baseInvoice);
    expect(xml).toContain('<cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>');
  });

  it("uses 0200000 type name for simplified invoices", () => {
    const xml = buildUblXml({ ...baseInvoice, invoiceType: "simplified" });
    expect(xml).toContain('name="0200000"');
  });

  it("includes the ICV counter reference", () => {
    const xml = buildUblXml({ ...baseInvoice, invoiceCounter: 42 });
    expect(xml).toContain("<cbc:ID>ICV</cbc:ID>");
    expect(xml).toContain("<cbc:UUID>42</cbc:UUID>");
  });

  it("includes the PIH (previous hash) reference, defaulting to ZATCA seed hash", () => {
    const xml = buildUblXml(baseInvoice);
    // ZATCA default seed for the very first invoice
    expect(xml).toContain("PIH");
    expect(xml).toContain(
      "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ=="
    );
  });

  it("uses provided previousHash when set", () => {
    const xml = buildUblXml({ ...baseInvoice, previousHash: "PREVIOUS_HASH_B64" });
    expect(xml).toContain("PREVIOUS_HASH_B64");
  });
});
