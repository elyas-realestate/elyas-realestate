"use client";
import { useState } from "react";
import { Loader2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { extractCoordsFromUrl, isShortMapsUrl } from "@/lib/google-maps-coords";

type Props = {
  /** قيمة lat الحالية (من نموذج الأم) */
  lat?: number | null;
  /** قيمة lng الحالية */
  lng?: number | null;
  /** عند نجاح الاستخراج */
  onChange: (lat: number, lng: number) => void;
  /** اختياري: مسح الإحداثيات */
  onClear?: () => void;
  className?: string;
};

/**
 * حقل واحد يلصق فيه الوسيط رابط Google Maps،
 * يستخرج تلقائياً lat/lng (للروابط الطويلة محلياً، والقصيرة عبر API).
 *
 * يستخدم في صفحات إضافة/تعديل العقار + أي مكان يحتاج تحديد موقع.
 */
export default function MapsLinkInput({ lat, lng, onChange, onClear, className }: Props) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const hasCoords = typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);

  async function handleResolve() {
    setError(null); setWarning(null);
    const trimmed = link.trim();
    if (!trimmed) { setError("الصق رابطاً من Google Maps أولاً"); return; }

    // 1) محاولة محلية فورية
    const localCoords = extractCoordsFromUrl(trimmed);
    if (localCoords) {
      onChange(localCoords.lat, localCoords.lng);
      setLink("");
      return;
    }

    // 2) لو short URL → API
    if (isShortMapsUrl(trimmed)) {
      setLoading(true);
      try {
        const res = await fetch("/api/maps/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "تعذّر استخراج الإحداثيات"); return; }
        onChange(data.lat, data.lng);
        if (data.warning) setWarning(data.warning);
        setLink("");
      } catch (e: any) {
        setError(e?.message || "خطأ في الشبكة");
      } finally {
        setLoading(false);
      }
      return;
    }

    setError("الرابط غير مدعوم. انسخ الرابط من شريط عنوان Google Maps أو من زر «مشاركة».");
  }

  return (
    <div className={className}>
      <label className="block text-sm mb-2" style={{ color: "var(--text-soft)" }}>
        موقع العقار على الخريطة
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="url"
          value={link}
          onChange={e => { setLink(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleResolve(); } }}
          placeholder="الصق رابط Google Maps هنا..."
          dir="ltr"
          className="flex-1 rounded-lg px-3 py-2.5 text-sm focus:outline-none transition"
          style={{
            background: "var(--bg-surface-2)",
            border: "1px solid var(--gold-bg-hover)",
            color: "var(--text-strong)",
          }}
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleResolve}
          disabled={loading || !link.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition"
          style={{
            background: loading || !link.trim() ? "var(--bg-surface-3)" : "var(--gold-bg-hover)",
            color: loading || !link.trim() ? "var(--text-faint)" : "var(--gold-2)",
            border: "1px solid var(--gold-bg-strong)",
            cursor: loading || !link.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
          استخراج
        </button>
      </div>

      {/* رسائل حالة */}
      {error && (
        <div className="mt-2 text-xs flex items-center gap-1" style={{ color: "var(--danger)" }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}
      {warning && (
        <div className="mt-2 text-xs flex items-center gap-1" style={{ color: "var(--warning)" }}>
          <AlertCircle size={12} /> {warning}
        </div>
      )}

      {/* عرض الإحداثيات الحالية */}
      {hasCoords && (
        <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--success-bg)", border: "1px solid var(--success)" }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--success)" }}>
            <CheckCircle2 size={13} />
            <span>الموقع محدّد:</span>
            <code dir="ltr" style={{ fontWeight: 600 }}>{lat?.toFixed(6)}, {lng?.toFixed(6)}</code>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
              style={{ color: "var(--gold-2)", textDecoration: "underline" }}
            >
              معاينة
            </a>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs"
                style={{ color: "var(--danger)", background: "transparent", border: "none", cursor: "pointer" }}
              >
                إزالة
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 text-[11px]" style={{ color: "var(--text-faint)", lineHeight: 1.7 }}>
        💡 افتح Google Maps → حدد الموقع → اضغط «مشاركة» → انسخ الرابط والصقه هنا.
      </div>
    </div>
  );
}
