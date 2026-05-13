"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Maximize2,
  Bed,
  Bath,
  Layers,
  Phone,
  MessageCircle,
  ArrowRight,
  X,
  Calendar,
  Home,
  Building2,
  CheckCircle2,
  Minus,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import SARIcon from "../components/SARIcon";

// ══════════════════════════════════════════════════════════════════
// /compare?ids=id1,id2,id3 — مقارنة 2-4 عقارات side-by-side
// (Client component — يُستدعى من page.tsx داخل <Suspense>)
// ══════════════════════════════════════════════════════════════════

interface Property {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  district: string | null;
  main_category: string | null;
  sub_category: string | null;
  offer_type: string | null;
  price: number | null;
  land_area: number | null;
  built_area: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  main_image: string | null;
  images: string[] | null;
  contact_phone: string | null;
  ad_license_number: string | null;
  features: string[] | null;
  location_url: string | null;
}

export default function ComparePageClient() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all([
      supabase.from("properties").select("*").in("id", ids).eq("is_published", true),
      supabase.from("site_settings").select("*").limit(1).single(),
    ]).then(([{ data: props }, { data: s }]) => {
      // الحفاظ على ترتيب IDs كما طلبها المستخدم
      const ordered = ids
        .map((id) => (props || []).find((p) => p.id === id))
        .filter(Boolean) as Property[];
      setProperties(ordered);
      setSettings(s);
      setLoading(false);
    });
  }, [idsParam]);

  // ── حالات الفراغ ──
  if (loading) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--gold-2)" }}>
          <div
            style={{
              width: 22,
              height: 22,
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>جاري تحميل المقارنة...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (ids.length === 0) {
    return <EmptyState message="لم يُحدَّد عقارات للمقارنة" />;
  }

  if (properties.length === 0) {
    return <EmptyState message="لم نعثر على العقارات المطلوبة" />;
  }

  if (properties.length === 1) {
    return <EmptyState message="تحتاج عقارين على الأقل للمقارنة" properties={properties} />;
  }

  // ── الصفحة الرئيسية ──
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Tajawal', sans-serif",
        minHeight: "100vh",
        background: "var(--bg-page)",
      }}
    >
      {/* ═══ HEADER ═══ */}
      <div
        style={{
          background: "var(--bg-deep)",
          borderBottom: "1px solid var(--gold-bg-soft)",
          padding: "20px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Link
              href="/properties"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "var(--text-faint)",
                textDecoration: "none",
                marginBottom: 6,
              }}
            >
              <ArrowRight size={14} /> العودة للعقارات
            </Link>
            <h1
              className="font-kufi"
              style={{ fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}
            >
              مقارنة العقارات
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 4 }}>
              عرض {properties.length}{" "}
              {properties.length === 1 ? "عقار" : properties.length === 2 ? "عقارين" : "عقارات"}{" "}
              جنباً إلى جنب
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() =>
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => alert("تم نسخ رابط المقارنة"))
              }
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
                color: "var(--bg-page)",
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              مشاركة المقارنة
            </button>
          </div>
        </div>
      </div>

      {/* ═══ COMPARISON GRID ═══ */}
      <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto", overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${properties.length}, minmax(280px, 1fr))`,
            gap: 16,
            minWidth: properties.length * 280,
          }}
        >
          {properties.map((p) => (
            <PropertyColumn key={p.id} property={p} settings={settings} />
          ))}
        </div>

        {/* ═══ COMPARISON TABLE (المواصفات side-by-side) ═══ */}
        <div style={{ marginTop: 40 }}>
          <h2
            className="font-kufi"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text-strong)",
              marginBottom: 16,
              padding: "0 4px",
            }}
          >
            مقارنة المواصفات
          </h2>
          <div
            style={{
              overflowX: "auto",
              borderRadius: 14,
              border: "1px solid var(--gold-bg)",
              background: "var(--bg-surface-1)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: properties.length * 220,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gold-bg)" }}>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "right",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-faint)",
                      background: "var(--bg-surface-2)",
                      width: 180,
                    }}
                  >
                    المواصفة
                  </th>
                  {properties.map((p, i) => (
                    <th
                      key={p.id}
                      style={{
                        padding: "14px 16px",
                        textAlign: "right",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-strong)",
                      }}
                    >
                      عقار {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SpecRow
                  label="السعر"
                  properties={properties}
                  render={(p) =>
                    p.price ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 700,
                          color: "var(--gold-2)",
                        }}
                      >
                        {Number(p.price).toLocaleString("ar-SA")}
                        <SARIcon size={11} color="accent" />
                      </span>
                    ) : (
                      <Dash />
                    )
                  }
                  highlight={(p) => bestValue(properties, "price", "min") === p.price}
                />

                <SpecRow
                  label="نوع العرض"
                  properties={properties}
                  render={(p) => p.offer_type || <Dash />}
                />
                <SpecRow
                  label="التصنيف"
                  properties={properties}
                  render={(p) => p.sub_category || p.main_category || <Dash />}
                />
                <SpecRow
                  label="الحي"
                  properties={properties}
                  render={(p) => [p.district, p.city].filter(Boolean).join("، ") || <Dash />}
                />

                <SpecRow
                  label="مساحة الأرض (م²)"
                  properties={properties}
                  render={(p) => p.land_area || <Dash />}
                  highlight={(p) => bestValue(properties, "land_area", "max") === p.land_area}
                />
                <SpecRow
                  label="مسطح البناء (م²)"
                  properties={properties}
                  render={(p) => p.built_area || <Dash />}
                  highlight={(p) => bestValue(properties, "built_area", "max") === p.built_area}
                />

                <SpecRow
                  label="الغرف"
                  properties={properties}
                  render={(p) => p.rooms || <Dash />}
                  highlight={(p) => bestValue(properties, "rooms", "max") === p.rooms}
                />
                <SpecRow
                  label="دورات المياه"
                  properties={properties}
                  render={(p) => p.bathrooms || <Dash />}
                  highlight={(p) => bestValue(properties, "bathrooms", "max") === p.bathrooms}
                />
                <SpecRow
                  label="الأدوار"
                  properties={properties}
                  render={(p) => p.floors || <Dash />}
                />

                <SpecRow
                  label="السعر / م² (مسطح البناء)"
                  properties={properties}
                  render={(p) => {
                    if (!p.price || !p.built_area) return <Dash />;
                    const ppm = Math.round(Number(p.price) / Number(p.built_area));
                    return (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {ppm.toLocaleString("ar-SA")}
                        <SARIcon size={10} color="current" />
                      </span>
                    );
                  }}
                />

                <SpecRow
                  label="رقم ترخيص الإعلان"
                  properties={properties}
                  render={(p) =>
                    p.ad_license_number ? (
                      <span style={{ direction: "ltr", fontSize: 11, fontFamily: "monospace" }}>
                        {p.ad_license_number}
                      </span>
                    ) : (
                      <Dash />
                    )
                  }
                />

                <SpecRow
                  label="عدد الصور"
                  properties={properties}
                  render={(p) => (p.images?.length || 0) + (p.main_image ? 1 : 0) || <Dash />}
                />

                <SpecRow
                  label="المميزات"
                  properties={properties}
                  render={(p) =>
                    p.features && p.features.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {p.features.slice(0, 4).map((f, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 11.5,
                              color: "var(--text-soft)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle2
                              size={12}
                              style={{ color: "var(--gold-2)", flexShrink: 0 }}
                            />{" "}
                            {f}
                          </span>
                        ))}
                        {p.features.length > 4 && (
                          <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                            + {p.features.length - 4} أخرى
                          </span>
                        )}
                      </div>
                    ) : (
                      <Dash />
                    )
                  }
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ ACTIONS ROW ═══ */}
        <div
          style={{
            marginTop: 32,
            display: "grid",
            gridTemplateColumns: `repeat(${properties.length}, minmax(280px, 1fr))`,
            gap: 16,
          }}
        >
          {properties.map((p) => (
            <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href={`/properties/${p.id}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px",
                  borderRadius: 11,
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--gold-bg)",
                  color: "var(--text-strong)",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                التفاصيل الكاملة
              </Link>
              {(p.contact_phone || settings?.whatsapp) && (
                <a
                  href={`https://wa.me/${(p.contact_phone || settings?.whatsapp || "").replace(/^\+/, "").replace(/^0/, "966")}?text=${encodeURIComponent(p.title + "\n" + window.location.origin + "/properties/" + p.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px",
                    borderRadius: 11,
                    background: "linear-gradient(135deg, #25D366, #128C7E)",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <MessageCircle size={15} /> واتساب
                </a>
              )}
            </div>
          ))}
        </div>

        {/* hint للتحسين */}
        {properties.length < 4 && (
          <div
            style={{
              marginTop: 36,
              padding: "16px 20px",
              background: "var(--gold-bg-soft)",
              border: "1px solid var(--gold-bg)",
              borderRadius: 12,
              fontSize: 13,
              color: "var(--text-soft)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>💡</span>
            <span>
              تقدر تقارن حتى ٤ عقارات في نفس الوقت — أضف{" "}
              <code style={{ fontFamily: "monospace", direction: "ltr" }}>
                ?ids=id1,id2,id3,id4
              </code>{" "}
              في الرابط.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// عمود عقار واحد (كرت في أعلى الصفحة)
// ─────────────────────────────────────────────────────────────
function PropertyColumn({ property, settings }: { property: Property; settings: any }) {
  const mainImage = property.main_image || property.images?.[0] || null;
  return (
    <div
      style={{
        background: "var(--bg-surface-1)",
        border: "1px solid var(--gold-bg)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {mainImage ? (
        <div style={{ width: "100%", aspectRatio: "16/10", background: "var(--bg-deep)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImage}
            alt={property.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "16/10",
            background: "var(--bg-deep)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-faint)",
          }}
        >
          <Home size={28} />
        </div>
      )}
      <div style={{ padding: "16px" }}>
        {property.sub_category && (
          <div
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 999,
              background: "var(--gold-bg)",
              color: "var(--gold-2)",
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            {property.sub_category}
          </div>
        )}
        <h3
          className="font-kufi"
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-strong)",
            lineHeight: 1.4,
            marginBottom: 8,
          }}
        >
          {property.title}
        </h3>
        {(property.district || property.city) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--text-faint)",
              marginBottom: 12,
            }}
          >
            <MapPin size={11} style={{ color: "var(--gold-2)" }} />
            {[property.district, property.city].filter(Boolean).join("، ")}
          </div>
        )}
        {property.price && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 18,
              fontWeight: 800,
              color: "var(--gold-2)",
            }}
          >
            {Number(property.price).toLocaleString("ar-SA")}
            <SARIcon size={14} color="accent" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// صف مواصفة في جدول المقارنة
// ─────────────────────────────────────────────────────────────
function SpecRow({
  label,
  properties,
  render,
  highlight,
}: {
  label: string;
  properties: Property[];
  render: (p: Property) => React.ReactNode;
  highlight?: (p: Property) => boolean;
}) {
  return (
    <tr style={{ borderBottom: "1px solid var(--gold-bg-soft)" }}>
      <td
        style={{
          padding: "12px 16px",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-faint)",
          background: "var(--bg-surface-2)",
        }}
      >
        {label}
      </td>
      {properties.map((p) => {
        const isBest = highlight && highlight(p);
        return (
          <td
            key={p.id}
            style={{
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--text-strong)",
              background: isBest ? "rgba(74,222,128,0.05)" : "transparent",
              position: "relative",
            }}
          >
            {render(p)}
            {isBest && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  fontSize: 10,
                  color: "var(--success, #4ade80)",
                }}
                title="الأفضل"
              >
                ★
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function Dash() {
  return <Minus size={14} style={{ color: "var(--text-faint)", opacity: 0.5 }} />;
}

// best value helper — يرجع القيمة الأفضل لمقارنة (min أو max) من الحقل
function bestValue(
  properties: Property[],
  field: keyof Property,
  mode: "min" | "max"
): number | null {
  const values = properties
    .map((p) => p[field])
    .filter((v) => typeof v === "number" && !isNaN(v as number)) as number[];
  if (values.length < 2) return null;
  return mode === "min" ? Math.min(...values) : Math.max(...values);
}

// ─────────────────────────────────────────────────────────────
// حالة الفراغ
// ─────────────────────────────────────────────────────────────
function EmptyState({ message, properties }: { message: string; properties?: Property[] }) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 16 }}>⚖️</div>
      <p
        className="font-kufi"
        style={{ fontSize: 20, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8 }}
      >
        {message}
      </p>
      <p style={{ fontSize: 14, color: "var(--text-faint)", marginBottom: 24, maxWidth: 400 }}>
        أضف معرّفات العقارات في الرابط بهذا الشكل:{" "}
        <code
          style={{
            fontFamily: "monospace",
            direction: "ltr",
            background: "var(--bg-surface-1)",
            padding: "2px 8px",
            borderRadius: 6,
          }}
        >
          ?ids=id1,id2
        </code>
      </p>
      {properties && properties[0] && (
        <Link
          href={`/properties/${properties[0].id}`}
          style={{
            padding: "12px 28px",
            borderRadius: 11,
            background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: "var(--bg-page)",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          عرض العقار المتاح
        </Link>
      )}
      <Link
        href="/properties"
        style={{
          padding: "12px 28px",
          borderRadius: 11,
          background: "transparent",
          border: "1px solid var(--gold-bg-hover)",
          color: "var(--gold-2)",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        تصفّح كل العقارات
      </Link>
    </div>
  );
}
