"use client";

import { useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase-browser";
import Breadcrumb from "../../components/Breadcrumb";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  Users,
  Building2,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseCsv,
  stringifyCsv,
  PROPERTY_ALIASES,
  CLIENT_ALIASES,
  matchFieldAlias,
  parsePrice,
  parseIntSafe,
  type CsvRow,
  type FieldAlias,
} from "@/lib/csv";
import type { LucideIcon } from "lucide-react";

type EntityType = "properties" | "clients";

const ENTITY_META: Record<
  EntityType,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    aliases: FieldAlias[];
    requiredFields: string[];
  }
> = {
  properties: {
    label: "العقارات",
    icon: Building2,
    color: "from-[var(--gold-2)] to-[var(--gold-4)]",
    aliases: PROPERTY_ALIASES,
    requiredFields: ["title"],
  },
  clients: {
    label: "العملاء",
    icon: Users,
    color: "from-blue-500 to-blue-700",
    aliases: CLIENT_ALIASES,
    requiredFields: ["name", "phone"],
  },
};

export default function ImportPage() {
  const [entity, setEntity] = useState<EntityType>("properties");
  const [rawRows, setRawRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // csv_header -> target_field
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const meta = ENTITY_META[entity];

  // الحقول المستهدفة المتاحة للـ mapping
  const targetFields = useMemo(() => meta.aliases.map((a) => a.target), [meta]);

  async function handleFile(file: File) {
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      toast.error("الملف فارغ أو غير صالح");
      return;
    }
    const hdrs = Object.keys(rows[0]);
    setHeaders(hdrs);
    setRawRows(rows);
    // auto-map
    const auto: Record<string, string> = {};
    hdrs.forEach((h) => {
      const match = matchFieldAlias(h, meta.aliases);
      if (match) auto[h] = match;
    });
    setMapping(auto);
    setResult(null);
    toast.success(`تم قراءة ${rows.length} صفّ. تحقّق من الربط ثم اضغط استيراد.`);
  }

  function resetAll() {
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // بناء payload من صفّ CSV بناءً على الـ mapping
  function buildRecord(row: CsvRow): Record<string, any> | null {
    const obj: Record<string, any> = {};
    for (const [csvHeader, targetField] of Object.entries(mapping)) {
      if (!targetField) continue;
      const raw = row[csvHeader] ?? "";
      if (!raw) continue;
      // تحويلات ذكية حسب الحقل
      if (["price", "amount", "budget", "area"].includes(targetField)) {
        const n = parsePrice(raw);
        if (n != null) obj[targetField] = n;
      } else if (["bedrooms", "bathrooms"].includes(targetField)) {
        const n = parseIntSafe(raw);
        if (n != null) obj[targetField] = n;
      } else {
        obj[targetField] = raw;
      }
    }
    // تحقّق من الحقول الإلزامية
    for (const req of meta.requiredFields) {
      if (!obj[req]) return null;
    }
    return obj;
  }

  async function runImport() {
    if (rawRows.length === 0) return;
    setImporting(true);
    setResult(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("غير مسجّل");
      setImporting(false);
      return;
    }
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    const tenantId = tenant?.id;
    if (!tenantId) {
      toast.error("لا يوجد حساب مرتبط");
      setImporting(false);
      return;
    }

    const records: any[] = [];
    let skipped = 0;
    rawRows.forEach((r) => {
      const rec = buildRecord(r);
      if (rec) records.push({ ...rec, tenant_id: tenantId });
      else skipped++;
    });

    if (records.length === 0) {
      setResult({
        inserted: 0,
        skipped,
        errors: ["لم يُنشأ أي سجل — تحقّق من الحقول الإلزامية والربط."],
      });
      setImporting(false);
      return;
    }

    // إدخال بدفعات من 50
    const BATCH = 50;
    let inserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < records.length; i += BATCH) {
      const chunk = records.slice(i, i + BATCH);
      const { error, data } = await supabase.from(entity).insert(chunk).select("id");
      if (error) {
        errors.push(`دفعة ${i}-${i + chunk.length}: ${error.message}`);
      } else {
        inserted += data?.length || chunk.length;
      }
    }
    setResult({ inserted, skipped, errors });
    if (inserted > 0) toast.success(`تم استيراد ${inserted} سجلّ`);
    setImporting(false);
  }

  function downloadTemplate() {
    const headerRow: CsvRow = {};
    meta.aliases.forEach((a) => {
      headerRow[a.aliases[0]] = "";
    });
    const csv = stringifyCsv([headerRow], { delimiter: "," });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template-${entity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewRows = rawRows.slice(0, 5);
  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const validCount = useMemo(
    () => rawRows.filter((r) => buildRecord(r) !== null).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawRows, mapping]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Breadcrumb
        crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "استيراد البيانات" }]}
      />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <FileSpreadsheet className="h-6 w-6 text-[var(--gold-2)]" />
          استيراد من CSV/Excel
        </h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          ارفع ملف CSV أو احفظ ملف Excel كـ CSV — ندعم الأعمدة العربية والإنجليزية تلقائياً.
        </p>
      </div>

      {/* ── اختيار نوع الكيان ── */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(ENTITY_META) as EntityType[]).map((k) => {
          const m = ENTITY_META[k];
          const active = entity === k;
          const Icon = m.icon;
          return (
            <button
              key={k}
              onClick={() => {
                setEntity(k);
                resetAll();
              }}
              className={`rounded-2xl border p-4 text-right transition ${
                active
                  ? `bg-gradient-to-br ${m.color} border-transparent text-white`
                  : "border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] text-[var(--text-soft)] hover:border-[var(--gold-2)]/30"
              }`}
            >
              <Icon className="mb-2 h-6 w-6" />
              <div className="font-bold">{m.label}</div>
              <div
                className={`mt-1 text-xs ${active ? "text-white/80" : "text-[var(--text-faint)]"}`}
              >
                الحقول الإلزامية: {m.requiredFields.join("، ")}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── رفع الملف ── */}
      <div className="rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-white">١. ارفع الملف</h2>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 text-xs text-[var(--gold-2)] transition hover:text-[#d49f5c]"
          >
            <Download className="h-4 w-4" />
            تنزيل قالب فارغ
          </button>
        </div>

        {rawRows.length === 0 ? (
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[var(--gold-bg-hover)] p-8 text-center transition hover:border-[var(--gold-2)]/50">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Upload className="mx-auto mb-3 h-10 w-10 text-[var(--gold-2)]" />
            <p className="font-bold text-white">اضغط أو اسحب ملف CSV هنا</p>
            <p className="mt-1 text-xs text-[var(--text-soft)]">الصيغ المدعومة: .csv (UTF-8)</p>
          </label>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <div className="font-bold text-white">{rawRows.length} صفّ جاهز للاستيراد</div>
                <div className="text-xs text-[var(--text-soft)]">
                  {headers.length} عمود في الملف
                </div>
              </div>
            </div>
            <button
              onClick={resetAll}
              className="text-[var(--text-soft)] hover:text-[var(--text-strong)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Mapping ── */}
      {rawRows.length > 0 && (
        <div className="rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-6">
          <h2 className="mb-4 font-bold text-white">٢. اربط الأعمدة بالحقول</h2>
          <div className="space-y-2">
            {headers.map((h) => (
              <div
                key={h}
                className="flex items-center gap-3 rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 text-xs text-[var(--text-faint)]">عمود CSV</div>
                  <div className="truncate font-bold text-white">{h}</div>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--text-faint)]" />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 text-xs text-[var(--text-faint)]">حقل النظام</div>
                  <select
                    value={mapping[h] || ""}
                    onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                    className="w-full rounded-lg border border-[var(--overlay-soft)] bg-[#0E0E11] px-3 py-1.5 text-sm text-white outline-none focus:border-[var(--gold-2)]"
                  >
                    <option value="">— تجاهل هذا العمود —</option>
                    {targetFields.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="text-[var(--text-soft)]">
              🔗 معيّن: <span className="font-bold text-white">{mappedCount}</span>
            </span>
            <span className="text-[var(--text-soft)]">
              ✅ صفوف صالحة: <span className="font-bold text-emerald-400">{validCount}</span>
            </span>
            <span className="text-[var(--text-soft)]">
              ⚠️ سيُتجاهل:{" "}
              <span className="font-bold text-amber-400">{rawRows.length - validCount}</span>
            </span>
          </div>
        </div>
      )}

      {/* ── معاينة ── */}
      {previewRows.length > 0 && (
        <div className="rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-6">
          <h2 className="mb-4 font-bold text-white">٣. معاينة أول 5 صفوف</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--overlay-soft)]">
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="p-2 text-right text-xs font-bold text-[var(--text-soft)]"
                    >
                      {h}
                      {mapping[h] && (
                        <div className="text-[10px] font-normal text-[var(--gold-2)]">
                          → {mapping[h]}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.03)]">
                    {headers.map((h) => (
                      <td key={h} className="p-2 text-xs text-white">
                        {r[h] || <span className="text-[var(--text-faint)]">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── زر الاستيراد ── */}
      {rawRows.length > 0 && !result && (
        <button
          onClick={runImport}
          disabled={importing || validCount === 0}
          className="w-full rounded-xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-4)] py-4 text-lg font-bold text-white transition disabled:opacity-50"
        >
          {importing ? "…جارِ الاستيراد" : `استيراد ${validCount} سجلّ الآن`}
        </button>
      )}

      {/* ── النتيجة ── */}
      {result && (
        <div className="space-y-3 rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-6">
          <h2 className="flex items-center gap-2 font-bold text-white">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            نتيجة الاستيراد
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="text-xs text-emerald-300">تم إدراج</div>
              <div className="text-3xl font-bold text-emerald-400">{result.inserted}</div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="text-xs text-amber-300">تم تجاهل</div>
              <div className="text-3xl font-bold text-amber-400">{result.skipped}</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-red-400">
                <AlertCircle className="h-4 w-4" />
                أخطاء
              </div>
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs text-red-300">
                  {e}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={resetAll}
            className="w-full rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] py-2.5 text-sm text-white transition hover:bg-[#26262C]"
          >
            استيراد ملف آخر
          </button>
        </div>
      )}
    </div>
  );
}
