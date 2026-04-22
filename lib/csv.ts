// ══════════════════════════════════════════════════════════════
// CSV parse / stringify — بدون اعتماديات خارجية
// يدعم: حقول مُحاطة بعلامات اقتباس، فواصل داخل الحقول، أسطر جديدة داخل الحقول،
// BOM للتوافق مع Excel العربي، تصدير بفواصل عربية (;) أو إنجليزية (,)
// ══════════════════════════════════════════════════════════════

export type CsvRow = Record<string, string>;

export interface CsvParseOptions {
  delimiter?: string;  // "," أو ";" — لو غير محدد يُكتشف تلقائياً
  trim?: boolean;      // إزالة المسافات من أطراف كل حقل (افتراضياً true)
}

export interface CsvStringifyOptions {
  delimiter?: string;  // افتراضياً ","
  bom?: boolean;       // إضافة BOM للتوافق مع Excel (افتراضياً true)
  columns?: string[];  // ترتيب الأعمدة (افتراضياً يُستنبط من أول صف)
}

// ── اكتشاف الفاصل ──
function detectDelimiter(firstLine: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = (firstLine.match(new RegExp(c === "\t" ? "\\t" : c, "g")) || []).length;
    if (count > bestCount) { bestCount = count; best = c; }
  }
  return best;
}

// ── قراءة CSV → مصفوفة من الأسطر ──
export function parseCsv(input: string, opts: CsvParseOptions = {}): CsvRow[] {
  // أزل BOM إن وُجد
  let text = input.replace(/^\uFEFF/, "");
  const trim = opts.trim !== false;

  // اكتشف الفاصل من أول سطر
  const firstNewline = text.search(/\r?\n/);
  const firstLine = firstNewline >= 0 ? text.slice(0, firstNewline) : text;
  const delimiter = opts.delimiter || detectDelimiter(firstLine);

  // parser يحترم علامات الاقتباس
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    // خارج اقتباس
    if (ch === '"' && field === "") { inQuotes = true; i++; continue; }
    if (ch === delimiter) { row.push(trim ? field.trim() : field); field = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    if (ch === "\n") {
      row.push(trim ? field.trim() : field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = []; i++; continue;
    }
    field += ch; i++;
  }
  // الحقل/السطر الأخير
  if (field !== "" || row.length > 0) {
    row.push(trim ? field.trim() : field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: CsvRow = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? ""; });
    return obj;
  });
}

// ── تحويل مصفوفة كائنات إلى نص CSV ──
export function stringifyCsv(rows: CsvRow[], opts: CsvStringifyOptions = {}): string {
  if (rows.length === 0) return "";
  const delimiter = opts.delimiter || ",";
  const columns = opts.columns || Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const needsQuote = (v: string) =>
    v.includes(delimiter) || v.includes('"') || v.includes("\n") || v.includes("\r");
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return needsQuote(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines: string[] = [];
  lines.push(columns.map(escape).join(delimiter));
  for (const r of rows) {
    lines.push(columns.map((c) => escape(r[c])).join(delimiter));
  }
  return (opts.bom !== false ? "\uFEFF" : "") + lines.join("\r\n");
}

// ── تنزيل CSV في المتصفح ──
export function downloadCsv(filename: string, rows: CsvRow[], opts: CsvStringifyOptions = {}): void {
  if (typeof window === "undefined") return;
  const csv = stringifyCsv(rows, opts);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ══════════════════════════════════════════════════════════════
// mapping: تحويل رؤوس عربية/إنجليزية/خليط إلى أسماء حقول قياسية
// يساعد في استيعاب صيغ مختلفة من عقار.كوم/بيوت/Excel يدوي
// ══════════════════════════════════════════════════════════════

export type FieldAlias = {
  target: string;           // اسم الحقل في قاعدة البيانات
  aliases: string[];        // مرادفات عربية/إنجليزية شائعة
};

// mapping للعقارات
export const PROPERTY_ALIASES: FieldAlias[] = [
  { target: "title",     aliases: ["العنوان", "اسم العقار", "title", "name", "property"] },
  { target: "type",      aliases: ["النوع", "نوع العقار", "type", "property type"] },
  { target: "category",  aliases: ["التصنيف", "الفئة", "category", "listing type"] },
  { target: "price",     aliases: ["السعر", "price", "amount"] },
  { target: "area",      aliases: ["المساحة", "area", "size", "sqm"] },
  { target: "city",      aliases: ["المدينة", "city"] },
  { target: "district",  aliases: ["الحي", "district", "neighborhood"] },
  { target: "bedrooms",  aliases: ["غرف النوم", "عدد الغرف", "bedrooms", "rooms"] },
  { target: "bathrooms", aliases: ["دورات المياه", "الحمامات", "bathrooms"] },
  { target: "description", aliases: ["الوصف", "description", "details"] },
  { target: "address",   aliases: ["العنوان التفصيلي", "address", "location"] },
];

// mapping للعملاء
export const CLIENT_ALIASES: FieldAlias[] = [
  { target: "name",       aliases: ["الاسم", "اسم العميل", "name", "client name"] },
  { target: "phone",      aliases: ["الجوال", "الهاتف", "phone", "mobile"] },
  { target: "email",      aliases: ["البريد", "الإيميل", "email"] },
  { target: "city",       aliases: ["المدينة", "city"] },
  { target: "notes",      aliases: ["ملاحظات", "notes"] },
  { target: "budget",     aliases: ["الميزانية", "budget"] },
  { target: "lead_source", aliases: ["المصدر", "source", "lead source"] },
];

// يُطابق رأس العمود مع حقل قياسي
export function matchFieldAlias(header: string, aliases: FieldAlias[]): string | null {
  const norm = header.trim().toLowerCase().replace(/[\s_-]+/g, "");
  for (const a of aliases) {
    for (const alias of a.aliases) {
      if (alias.trim().toLowerCase().replace(/[\s_-]+/g, "") === norm) return a.target;
    }
  }
  return null;
}

// تحليل سعر من نص (يحذف الفواصل، ر.س، SAR، إلخ)
export function parsePrice(s: string | undefined): number | null {
  if (!s) return null;
  const cleaned = String(s).replace(/[,،\sر\.سSARريال]/gi, "");
  const n = Number(cleaned);
  return isFinite(n) ? n : null;
}

// تحليل عدد صحيح
export function parseIntSafe(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseInt(String(s).replace(/[^\d-]/g, ""), 10);
  return isFinite(n) ? n : null;
}
