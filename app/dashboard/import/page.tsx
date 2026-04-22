"use client";

import { useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase-browser";
import Breadcrumb from "../../components/Breadcrumb";
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download,
  Users, Building2, ArrowRight, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseCsv, stringifyCsv, downloadCsv,
  PROPERTY_ALIASES, CLIENT_ALIASES, matchFieldAlias,
  parsePrice, parseIntSafe,
  type CsvRow,
} from "@/lib/csv";

type EntityType = "properties" | "clients";

const ENTITY_META: Record<EntityType, { label: string; icon: any; color: string; aliases: any[]; requiredFields: string[] }> = {
  properties: {
    label: "العقارات",
    icon: Building2,
    color: "from-[#C6914C] to-[#8A5F2E]",
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
  const [mapping, setMapping] = useState<Record<string, string>>({});  // csv_header -> target_field
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("غير مسجّل"); setImporting(false); return; }
    const { data: tenant } = await supabase.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
    const tenantId = tenant?.id;
    if (!tenantId) { toast.error("لا يوجد حساب مرتبط"); setImporting(false); return; }

    const records: any[] = [];
    let skipped = 0;
    rawRows.forEach((r) => {
      const rec = buildRecord(r);
      if (rec) records.push({ ...rec, tenant_id: tenantId });
      else skipped++;
    });

    if (records.length === 0) {
      setResult({ inserted: 0, skipped, errors: ["لم يُنشأ أي سجل — تحقّق من الحقول الإلزامية والربط."] });
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
    meta.aliases.forEach((a) => { headerRow[a.aliases[0]] = ""; });
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "استيراد البيانات" }]} />

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-[#C6914C]" />
          استيراد من CSV/Excel
        </h1>
        <p className="text-sm text-[#8A8A92] mt-1">
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
              onClick={() => { setEntity(k); resetAll(); }}
              className={`p-4 rounded-2xl border text-right transition ${
                active
                  ? `bg-gradient-to-br ${m.color} border-transparent text-white`
                  : "bg-[#16161A] border-[rgba(198,145,76,0.09)] text-[#9A9AA0] hover:border-[#C6914C]/30"
              }`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <div className="font-bold">{m.label}</div>
              <div className={`text-xs mt-1 ${active ? "text-white/80" : "text-[#5A5A62]"}`}>
                الحقول الإلزامية: {m.requiredFields.join("، ")}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── رفع الملف ── */}
      <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">١. ارفع الملف</h2>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 text-xs text-[#C6914C] hover:text-[#d49f5c] transition"
          >
            <Download className="h-4 w-4" />
            تنزيل قالب فارغ
          </button>
        </div>

        {rawRows.length === 0 ? (
          <label className="block border-2 border-dashed border-[rgba(198,145,76,0.2)] rounded-xl p-8 text-center cursor-pointer hover:border-[#C6914C]/50 transition">
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
            <Upload className="h-10 w-10 text-[#C6914C] mx-auto mb-3" />
            <p className="text-white font-bold">اضغط أو اسحب ملف CSV هنا</p>
            <p className="text-xs text-[#8A8A92] mt-1">الصيغ المدعومة: .csv (UTF-8)</p>
          </label>
        ) : (
          <div className="flex items-center justify-between bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <div className="text-white font-bold">{rawRows.length} صفّ جاهز للاستيراد</div>
                <div className="text-xs text-[#8A8A92]">{headers.length} عمود في الملف</div>
              </div>
            </div>
            <button onClick={resetAll} className="text-[#8A8A92] hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Mapping ── */}
      {rawRows.length > 0 && (
        <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-6">
          <h2 className="font-bold text-white mb-4">٢. اربط الأعمدة بالحقول</h2>
          <div className="space-y-2">
            {headers.map((h) => (
              <div key={h} className="flex items-center gap-3 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#5A5A62] mb-0.5">عمود CSV</div>
                  <div className="text-white font-bold truncate">{h}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#5A5A62] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#5A5A62] mb-0.5">حقل النظام</div>
                  <select
                    value={mapping[h] || ""}
                    onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                    className="w-full bg-[#0E0E11] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#C6914C] outline-none"
                  >
                    <option value="">— تجاهل هذا العمود —</option>
                    {targetFields.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="text-[#8A8A92]">🔗 معيّن: <span className="text-white font-bold">{mappedCount}</span></span>
            <span className="text-[#8A8A92]">✅ صفوف صالحة: <span className="text-emerald-400 font-bold">{validCount}</span></span>
            <span className="text-[#8A8A92]">⚠️ سيُتجاهل: <span className="text-amber-400 font-bold">{rawRows.length - validCount}</span></span>
          </div>
        </div>
      )}

      {/* ── معاينة ── */}
      {previewRows.length > 0 && (
        <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-6">
          <h2 className="font-bold text-white mb-4">٣. معاينة أول 5 صفوف</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                  {headers.map((h) => (
                    <th key={h} className="text-right p-2 text-xs text-[#8A8A92] font-bold">
                      {h}
                      {mapping[h] && <div className="text-[10px] text-[#C6914C] font-normal">→ {mapping[h]}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.03)]">
                    {headers.map((h) => (
                      <td key={h} className="p-2 text-white text-xs">{r[h] || <span className="text-[#5A5A62]">—</span>}</td>
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
          className="w-full py-4 bg-gradient-to-r from-[#C6914C] to-[#8A5F2E] text-white font-bold rounded-xl text-lg disabled:opacity-50 transition"
        >
          {importing ? "…جارِ الاستيراد" : `استيراد ${validCount} سجلّ الآن`}
        </button>
      )}

      {/* ── النتيجة ── */}
      {result && (
        <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-6 space-y-3">
          <h2 className="font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            نتيجة الاستيراد
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="text-xs text-emerald-300">تم إدراج</div>
              <div className="text-3xl font-bold text-emerald-400">{result.inserted}</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="text-xs text-amber-300">تم تجاهل</div>
              <div className="text-3xl font-bold text-amber-400">{result.skipped}</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertCircle className="h-4 w-4" />
                أخطاء
              </div>
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs text-red-300">{e}</div>
              ))}
            </div>
          )}
          <button
            onClick={resetAll}
            className="w-full py-2.5 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] hover:bg-[#26262C] text-white rounded-lg text-sm transition"
          >
            استيراد ملف آخر
          </button>
        </div>
      )}
    </div>
  );
}
