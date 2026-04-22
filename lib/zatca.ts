// ══════════════════════════════════════════════════════════════
// ZATCA (هيئة الزكاة والضريبة والجمارك) — Phase 1 + Phase 2 Foundation
// ══════════════════════════════════════════════════════════════
// Phase 1 (مطلوب من 2021): TLV QR Code في كل فاتورة
// Phase 2 (مطلوب من 2023): XML UBL 2.1 موقّع + QR + إرسال لـ ZATCA
// ══════════════════════════════════════════════════════════════

/**
 * تحويل نص UTF-8 إلى Uint8Array
 */
function utf8Bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * تحويل Uint8Array إلى base64 (يشتغل في Node + Edge + Browser)
 */
function toBase64(bytes: Uint8Array): string {
  // Node.js
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  // Browser/Edge fallback
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * بناء TLV entry واحد: [tag][length][value]
 */
function tlv(tag: number, value: string): Uint8Array {
  const valBytes = utf8Bytes(value);
  const out = new Uint8Array(2 + valBytes.length);
  out[0] = tag;
  out[1] = valBytes.length; // ZATCA spec: length ≤ 255
  out.set(valBytes, 2);
  return out;
}

/**
 * دمج مصفوفات Uint8Array
 */
function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrs) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
// Phase 1 QR Code — TLV encoding (5 tags)
// ══════════════════════════════════════════════════════════════

export interface ZatcaQrInput {
  sellerName: string;          // اسم البائع
  vatNumber: string;           // الرقم الضريبي (15 digit)
  timestamp: string | Date;    // تاريخ الفاتورة (ISO 8601)
  totalWithVat: number;        // الإجمالي شامل الضريبة
  vatAmount: number;           // ضريبة القيمة المضافة
}

/**
 * بناء ZATCA Phase 1 QR code (base64 TLV)
 *
 * المراجع الرسمية:
 * - https://zatca.gov.sa/en/E-Invoicing/Introduction/Pages/specifications.aspx
 * - E-Invoicing Detailed Guideline, Appendix B
 */
export function buildZatcaQr(input: ZatcaQrInput): string {
  const iso =
    input.timestamp instanceof Date
      ? input.timestamp.toISOString()
      : new Date(input.timestamp).toISOString();

  // format numbers with 2 decimals (SAR)
  const total = Number(input.totalWithVat || 0).toFixed(2);
  const vat   = Number(input.vatAmount    || 0).toFixed(2);

  const payload = concatBytes(
    tlv(1, input.sellerName || ""),
    tlv(2, input.vatNumber || ""),
    tlv(3, iso),
    tlv(4, total),
    tlv(5, vat),
  );

  return toBase64(payload);
}

// ══════════════════════════════════════════════════════════════
// فحص صحّة الرقم الضريبي السعودي
// ══════════════════════════════════════════════════════════════

/**
 * الرقم الضريبي السعودي يجب:
 * - 15 رقم
 * - يبدأ بـ 3
 * - ينتهي بـ 3 (رمز الدولة)
 */
export function isValidSaudiVat(vat: string | null | undefined): boolean {
  if (!vat) return false;
  return /^3\d{13}3$/.test(vat.trim());
}

// ══════════════════════════════════════════════════════════════
// Invoice Hashing (Phase 2 preparation)
// ══════════════════════════════════════════════════════════════

/**
 * حساب SHA-256 hash لفاتورة (base64) — Phase 2 requirement
 * يُستخدم في سلسلة الفواتير (chain of hashes)
 */
export async function hashInvoice(xmlOrPayload: string): Promise<string> {
  const bytes = utf8Bytes(xmlOrPayload);
  // Node.js
  if (typeof Buffer !== "undefined" && typeof require !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require("crypto");
      return crypto.createHash("sha256").update(bytes).digest("base64");
    } catch {
      /* fallthrough to WebCrypto */
    }
  }
  // WebCrypto (Edge / Browser)
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toBase64(new Uint8Array(digest));
}

// ══════════════════════════════════════════════════════════════
// UBL 2.1 XML Generator (Phase 2 skeleton)
// ══════════════════════════════════════════════════════════════

export interface ZatcaInvoiceData {
  invoiceUuid: string;
  invoiceNumber: string;
  invoiceCounter: number;
  issueDate: string;            // YYYY-MM-DD
  issueTime: string;            // HH:MM:SS
  invoiceType: "standard" | "simplified";
  previousHash?: string | null; // hash الفاتورة السابقة (أول فاتورة = hash of "0")

  seller: {
    name: string;
    vatNumber: string;
    crNumber?: string;
    street?: string;
    buildingNumber?: string;
    district?: string;
    city?: string;
    postalCode?: string;
  };

  buyer: {
    name: string;
    vatNumber?: string;
    phone?: string;
  };

  lines: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;  // 15 for 15%
  }>;

  currency?: string;            // default SAR
}

/**
 * Escape XML special chars
 */
function xmlEsc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * بناء UBL 2.1 XML للفاتورة — Phase 2 skeleton
 * ملاحظة: التوقيع الرقمي (XAdES) يحتاج شهادة ZATCA onboarding — يُضاف لاحقاً
 */
export function buildUblXml(inv: ZatcaInvoiceData): string {
  const currency = inv.currency || "SAR";
  const typeCode = inv.invoiceType === "simplified" ? "388" : "388"; // 388 = Invoice
  const typeName = inv.invoiceType === "simplified" ? "0200000" : "0100000";

  const lineTotal = inv.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vatTotal  = inv.lines.reduce(
    (sum, l) => sum + (l.quantity * l.unitPrice * l.vatRate) / 100,
    0,
  );
  const grandTotal = lineTotal + vatTotal;

  const linesXml = inv.lines
    .map((l) => {
      const lineAmount = l.quantity * l.unitPrice;
      const lineVat = (lineAmount * l.vatRate) / 100;
      return `
    <cac:InvoiceLine>
      <cbc:ID>${l.id}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="PCE">${l.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${currency}">${lineAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${currency}">${lineVat.toFixed(2)}</cbc:TaxAmount>
        <cbc:RoundingAmount currencyID="${currency}">${(lineAmount + lineVat).toFixed(2)}</cbc:RoundingAmount>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${xmlEsc(l.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${l.vatRate.toFixed(2)}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currency}">${l.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${xmlEsc(inv.invoiceNumber)}</cbc:ID>
  <cbc:UUID>${xmlEsc(inv.invoiceUuid)}</cbc:UUID>
  <cbc:IssueDate>${xmlEsc(inv.issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${xmlEsc(inv.issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${typeName}">${typeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${currency}</cbc:TaxCurrencyCode>

  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${inv.invoiceCounter}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${xmlEsc(inv.previousHash || "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==")}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PostalAddress>
        <cbc:StreetName>${xmlEsc(inv.seller.street || "")}</cbc:StreetName>
        <cbc:BuildingNumber>${xmlEsc(inv.seller.buildingNumber || "")}</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>${xmlEsc(inv.seller.district || "")}</cbc:CitySubdivisionName>
        <cbc:CityName>${xmlEsc(inv.seller.city || "")}</cbc:CityName>
        <cbc:PostalZone>${xmlEsc(inv.seller.postalCode || "")}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${xmlEsc(inv.seller.vatNumber)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEsc(inv.seller.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEsc(inv.buyer.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${vatTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${lineTotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${vatTotal.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${lineTotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${grandTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${linesXml}
</Invoice>`;
}
