"use client";

import { useEffect, useState } from "react";
import { MapPin, GraduationCap, Coffee, Hospital, Sparkles } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// NeighborhoodIntel — widget يعرض معلومات الحي
// يستدعي /api/ai/neighborhood-intel ويعرض النتيجة
// يخفي نفسه إذا ما توفّر city + district
// ══════════════════════════════════════════════════════════════════

interface IntelData {
  city: string;
  district: string;
  description_ar: string | null;
  highlights: string[] | null;
  schools_count: number | null;
  mosques_count: number | null;
  hospitals_count: number | null;
  restaurants_count: number | null;
}

interface Props {
  city?: string | null;
  district?: string | null;
  accentColor?: string;
}

export default function NeighborhoodIntel({ city, district, accentColor = "#C6914C" }: Props) {
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!city || !district) return;
    setLoading(true);
    setError(false);
    fetch(`/api/ai/neighborhood-intel?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`)
      .then(r => r.json())
      .then(res => {
        if (res.ok && res.data) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [city, district]);

  // إخفاء كامل عند عدم توفّر البيانات
  if (!city || !district) return null;
  if (error && !data) return null;

  return (
    <div
      style={{
        background: "var(--bg-surface-1, #f5f0e8)",
        border: "1px solid var(--gold-bg-soft, rgba(198,145,76,0.15))",
        borderRadius: 16,
        padding: "20px 22px",
        marginTop: 24,
      }}
      dir="rtl"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: `${accentColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
            flexShrink: 0,
          }}
        >
          <MapPin size={16} />
        </span>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-strong, #1a1206)", margin: 0 }}>
          عن الحي — {district}، {city}
        </h3>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 999,
            background: `${accentColor}10`,
            color: accentColor,
            marginRight: "auto",
          }}
        >
          <Sparkles size={10} />
          AI
        </span>
      </div>

      {loading && !data && (
        <div style={{ fontSize: 13, color: "var(--text-faint, #888)", display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 14,
              height: 14,
              border: `2px solid ${accentColor}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              display: "inline-block",
            }}
          />
          جاري تحميل معلومات الحي...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {data?.description_ar && (
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.85,
            color: "var(--text-soft, #444)",
            marginBottom: data.highlights?.length ? 14 : 0,
          }}
        >
          {data.description_ar}
        </p>
      )}

      {data?.highlights && data.highlights.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {data.highlights.slice(0, 6).map((h, i) => (
            <span
              key={i}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 999,
                background: `${accentColor}10`,
                color: "var(--text-strong, #1a1206)",
                border: `1px solid ${accentColor}25`,
              }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {data && (data.schools_count || data.mosques_count || data.hospitals_count || data.restaurants_count) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
            paddingTop: 14,
            borderTop: "1px solid var(--gold-bg-soft, rgba(198,145,76,0.15))",
          }}
        >
          {data.schools_count != null && (
            <StatBox icon={<GraduationCap size={15} />} label="مدارس" value={data.schools_count} accent={accentColor} />
          )}
          {data.mosques_count != null && (
            <StatBox icon={<MosqueIcon size={15} />} label="مساجد" value={data.mosques_count} accent={accentColor} />
          )}
          {data.hospitals_count != null && (
            <StatBox icon={<Hospital size={15} />} label="مستشفيات/عيادات" value={data.hospitals_count} accent={accentColor} />
          )}
          {data.restaurants_count != null && (
            <StatBox icon={<Coffee size={15} />} label="مطاعم/مقاهي" value={data.restaurants_count} accent={accentColor} />
          )}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 10, color: "var(--text-faint, #999)", opacity: 0.7 }}>
        المعلومات إرشادية ومُولَّدة آلياً — يُرجى التحقق ميدانياً.
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: accent, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-strong, #1a1206)", lineHeight: 1.2 }}>
          {value}+
        </div>
        <div style={{ fontSize: 11, color: "var(--text-faint, #777)" }}>{label}</div>
      </div>
    </div>
  );
}

// أيقونة المسجد المخصّصة
function MosqueIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V11a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10" />
      <path d="M12 7c0-1.5-1.5-2-1.5-3.5C10.5 2.5 11 2 12 2s1.5.5 1.5 1.5c0 1.5-1.5 2-1.5 3.5z" />
      <path d="M3 21h18" />
      <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
    </svg>
  );
}
