"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Bed,
  Bath,
  Layers,
  Maximize2,
  Building2,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Phone,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import SARIcon from "../../../components/SARIcon";

function fmtPrice(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "م";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " ألف";
  return n.toLocaleString("ar-SA");
}

export default function PropertyDetails() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comparables, setComparables] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProperty() {
    const { data } = await supabase.from("properties").select("*").eq("id", id).single();
    setProperty(data);
    setLoading(false);
    if (data) loadComparables(data);
  }

  async function loadComparables(prop: {
    id: string;
    city?: string | null;
    main_category?: string | null;
  }) {
    if (!prop.city || !prop.main_category) return;
    // جلب عقارات مشابهة (نفس المدينة + التصنيف) للمقارنة السوقية
    const { data } = await supabase
      .from("properties")
      .select("id,title,price,land_area,district,offer_type")
      .eq("city", prop.city)
      .eq("main_category", prop.main_category)
      .neq("id", prop.id)
      .not("price", "is", null)
      .limit(20);
    setComparables(data || []);
  }

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا العقار؟")) return;
    await supabase.from("properties").delete().eq("id", id);
    toast.success("تم حذف العقار");
    router.push("/dashboard/properties");
  }

  async function togglePublish() {
    if (!property) return;
    const newVal = !property.is_published;
    await supabase.from("properties").update({ is_published: newVal }).eq("id", id);
    setProperty({ ...property, is_published: newVal });
    toast.success(newVal ? "تم نشر العقار" : "تم إيقاف النشر");
  }

  async function updateAvailability(available: boolean) {
    setUpdating(true);
    const now = new Date().toISOString();
    await supabase
      .from("properties")
      .update({
        owner_confirmed_available: available,
        owner_last_check: now,
      })
      .eq("id", id);
    setProperty({ ...property, owner_confirmed_available: available, owner_last_check: now });
    toast.success(available ? "تم تأكيد الإتاحة" : "تم تحديث الحالة — غير متاح");
    setUpdating(false);
  }

  function handleWhatsApp() {
    if (!property) return;
    const lines = [
      "🏠 *" + property.title + "*",
      "",
      "🔖 الرمز: " + (property.code || "—"),
      "📋 التصنيف: " + property.main_category + " / " + property.sub_category,
      "💼 نوع العرض: " + property.offer_type,
      "📍 الموقع: " + property.district + " — " + property.city,
      "📐 المساحة: " + (property.land_area || "—") + " م²",
      "💰 السعر: " + (property.price ? property.price.toLocaleString() : "—") + " ر.س",
      "",
      "📝 " + (property.description || ""),
    ];
    if (property.location_url) lines.push("📌 " + property.location_url);
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  }

  // ── Market comparison calculations ──
  const marketStats = useMemo(() => {
    if (comparables.length === 0 || !property?.price) return null;
    const prices = comparables.map((c) => c.price).filter(Boolean);
    if (prices.length === 0) return null;

    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const diff = ((property.price - avg) / avg) * 100;

    // سعر المتر المربع
    const myPPM = property.land_area ? property.price / property.land_area : null;
    const compPPMs = comparables
      .filter((c) => c.price && c.land_area)
      .map((c) => c.price / c.land_area);
    const avgPPM =
      compPPMs.length > 0 ? compPPMs.reduce((s, p) => s + p, 0) / compPPMs.length : null;

    return { avg, min, max, diff, count: prices.length, myPPM, avgPPM };
  }, [comparables, property]);

  // ── Availability status ──
  const availabilityInfo = useMemo(() => {
    if (!property) return null;
    const lastCheck = property.owner_last_check ? new Date(property.owner_last_check) : null;
    const daysSince = lastCheck ? Math.floor((Date.now() - lastCheck.getTime()) / 86400000) : null;
    const isStale = daysSince !== null && daysSince > 7;
    return { lastCheck, daysSince, isStale, available: property.owner_confirmed_available };
  }, [property]);

  if (loading)
    return (
      <div dir="rtl" className="space-y-4">
        <div className="skeleton mb-4 h-8 w-64 rounded" />
        <div className="skeleton mb-4 h-48 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );

  if (!property)
    return (
      <div dir="rtl" className="py-20 text-center">
        <Building2 size={48} style={{ color: "var(--border-1)", margin: "0 auto 12px" }} />
        <p style={{ color: "var(--text-faint)", fontSize: 16 }}>العقار غير موجود</p>
        <Link
          href="/dashboard/properties"
          className="mt-4 inline-block text-sm"
          style={{ color: "var(--gold-2)" }}
        >
          العودة للعقارات
        </Link>
      </div>
    );

  return (
    <div dir="rtl" className="space-y-6">
      {/* ── Breadcrumb + Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--text-faint)", fontSize: 13 }}
        >
          <Link
            href="/dashboard/properties"
            className="no-underline transition hover:text-[var(--gold-2)]"
            style={{ color: "var(--text-faint)" }}
          >
            العقارات
          </Link>
          <ArrowRight size={14} />
          <span style={{ color: "var(--text-strong)" }} className="max-w-[250px] truncate">
            {property.title || "تفاصيل العقار"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={togglePublish}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition"
            style={{
              background: property.is_published ? "rgba(74,222,128,0.08)" : "rgba(90,90,98,0.1)",
              color: property.is_published ? "var(--success)" : "var(--text-soft)",
              border:
                "1px solid " +
                (property.is_published ? "rgba(74,222,128,0.2)" : "rgba(90,90,98,0.15)"),
              cursor: "pointer",
            }}
          >
            {property.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
            {property.is_published ? "منشور" : "مسودة"}
          </button>
          <Link
            href={`/dashboard/properties/${id}/edit`}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold no-underline transition"
            style={{
              background: "var(--gold-bg-soft)",
              color: "var(--gold-2)",
              border: "1px solid var(--gold-bg-hover)",
            }}
          >
            <Edit3 size={13} /> تعديل
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition"
            style={{
              background: "rgba(248,113,113,0.06)",
              color: "var(--danger)",
              border: "1px solid rgba(248,113,113,0.15)",
              cursor: "pointer",
            }}
          >
            <Trash2 size={13} /> حذف
          </button>
        </div>
      </div>

      {/* ── Hero: Images + Title ── */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        {/* Image Gallery */}
        {property.images?.length > 0 && (
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: property.images.length > 1 ? "2fr 1fr" : "1fr",
              height: 280,
            }}
          >
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover"
            />
            {property.images.length > 1 && (
              <div
                className="grid gap-1"
                style={{ gridTemplateRows: property.images.length > 2 ? "1fr 1fr" : "1fr" }}
              >
                {property.images.slice(1, 3).map((img: string, i: number) => (
                  <img key={i} src={img} alt="" className="h-full w-full object-cover" />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-bold"
                  style={{ background: "var(--gold-bg)", color: "var(--gold-2)" }}
                >
                  {property.code}
                </span>
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={{
                    background:
                      property.offer_type === "إيجار"
                        ? "rgba(96,165,250,0.1)"
                        : "var(--gold-bg-soft)",
                    color: property.offer_type === "إيجار" ? "var(--info)" : "var(--gold-2)",
                  }}
                >
                  {property.offer_type}
                </span>
                <span
                  className="rounded-lg px-2.5 py-1 text-xs"
                  style={{ background: "var(--bg-surface-2)", color: "var(--text-soft)" }}
                >
                  {property.main_category} / {property.sub_category}
                </span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-strong)" }}>
                {property.title}
              </h1>
              <div
                className="mt-2 flex items-center gap-1.5"
                style={{ color: "var(--text-faint)", fontSize: 13 }}
              >
                <MapPin size={13} style={{ color: "var(--gold-2)" }} />
                {property.district} — {property.city}
              </div>
            </div>
            <div className="text-left">
              <p
                className="font-cairo flex items-center gap-1 font-bold"
                style={{ fontSize: 26, color: "var(--gold-2)" }}
              >
                {property.price ? property.price.toLocaleString() : "—"}{" "}
                <SARIcon color="accent" size={18} />
              </p>
              {property.land_area && property.price && (
                <p style={{ fontSize: 11, color: "var(--text-faint)" }}>
                  {Math.round(property.price / property.land_area).toLocaleString("ar-SA")} ر.س/م²
                </p>
              )}
            </div>
          </div>

          {/* Specs Grid */}
          <div
            className="grid grid-cols-3 gap-3 pt-4 sm:grid-cols-6"
            style={{ borderTop: "1px solid var(--gold-bg-soft)" }}
          >
            {[
              {
                icon: Maximize2,
                label: "الأرض",
                val: property.land_area ? property.land_area + " م²" : "—",
              },
              {
                icon: Building2,
                label: "البناء",
                val: property.built_area ? property.built_area + " م²" : "—",
              },
              { icon: Bed, label: "الغرف", val: property.rooms || "—" },
              { icon: Bath, label: "دورات المياه", val: property.bathrooms || "—" },
              { icon: Layers, label: "الأدوار", val: property.floors || "—" },
              { icon: Clock, label: "عمر العقار", val: property.age ? property.age + " سنة" : "—" },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl p-3 text-center"
                style={{ background: "var(--bg-surface-2)" }}
              >
                <s.icon size={16} style={{ color: "var(--gold-2)", margin: "0 auto 6px" }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-on-dark)" }}>
                  {s.val}
                </p>
                <p style={{ fontSize: 10, color: "var(--text-faint)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Left Column: Description + Actions ── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Description */}
          {property.description && (
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
            >
              <h3 className="mb-3 font-bold" style={{ fontSize: 14, color: "var(--gold-2)" }}>
                الوصف
              </h3>
              <p
                style={{
                  color: "var(--text-soft)",
                  lineHeight: 1.9,
                  fontSize: 14,
                  whiteSpace: "pre-wrap",
                }}
              >
                {property.description}
              </p>
            </div>
          )}

          {/* ── Market Comparison ── */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
          >
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 size={16} style={{ color: "var(--gold-2)" }} />
              <h3 className="font-bold" style={{ fontSize: 14, color: "var(--gold-2)" }}>
                المقارنة السوقية
              </h3>
            </div>

            {!marketStats ? (
              <div className="py-8 text-center">
                <BarChart3 size={32} style={{ color: "var(--border-1)", margin: "0 auto 10px" }} />
                <p style={{ color: "var(--text-faint)", fontSize: 13 }}>
                  لا توجد عقارات مشابهة كافية للمقارنة
                </p>
                <p style={{ color: "var(--border-1)", fontSize: 11, marginTop: 4 }}>
                  أضف المزيد من العقارات في نفس المدينة والتصنيف
                </p>
              </div>
            ) : (
              <>
                {/* Position Indicator */}
                <div
                  className="mb-4 rounded-xl p-4"
                  style={{
                    background:
                      marketStats.diff > 10
                        ? "rgba(248,113,113,0.06)"
                        : marketStats.diff < -10
                          ? "rgba(74,222,128,0.06)"
                          : "rgba(96,165,250,0.06)",
                    border:
                      "1px solid " +
                      (marketStats.diff > 10
                        ? "rgba(248,113,113,0.15)"
                        : marketStats.diff < -10
                          ? "rgba(74,222,128,0.15)"
                          : "rgba(96,165,250,0.15)"),
                  }}
                >
                  <div className="flex items-center gap-3">
                    {marketStats.diff > 10 ? (
                      <TrendingUp size={20} style={{ color: "var(--danger)" }} />
                    ) : marketStats.diff < -10 ? (
                      <TrendingDown size={20} style={{ color: "var(--success)" }} />
                    ) : (
                      <Minus size={20} style={{ color: "var(--info)" }} />
                    )}
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-on-dark)" }}>
                        {marketStats.diff > 10
                          ? "أعلى من السوق"
                          : marketStats.diff < -10
                            ? "أقل من السوق"
                            : "ضمن متوسط السوق"}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-soft)" }}>
                        عقارك {marketStats.diff > 0 ? "أغلى" : "أرخص"} بـ{" "}
                        {Math.abs(Math.round(marketStats.diff))}% من متوسط {marketStats.count} عقار
                        مشابه
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "متوسط السوق", val: fmtPrice(marketStats.avg), color: "var(--info)" },
                    { label: "الأقل", val: fmtPrice(marketStats.min), color: "var(--success)" },
                    { label: "الأعلى", val: fmtPrice(marketStats.max), color: "var(--danger)" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3 text-center"
                      style={{ background: "var(--bg-surface-2)" }}
                    >
                      <p style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 4 }}>
                        {s.label}
                      </p>
                      <p className="font-cairo font-bold" style={{ fontSize: 16, color: s.color }}>
                        {s.val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price per m² comparison */}
                {marketStats.myPPM && marketStats.avgPPM && (
                  <div
                    className="mt-4 flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid var(--gold-bg-soft)" }}
                  >
                    <div>
                      <p style={{ fontSize: 11, color: "var(--text-faint)" }}>سعر المتر — عقارك</p>
                      <p
                        className="font-cairo font-bold"
                        style={{ fontSize: 15, color: "var(--gold-2)" }}
                      >
                        {Math.round(marketStats.myPPM).toLocaleString("ar-SA")} ر.س/م²
                      </p>
                    </div>
                    <div className="text-left">
                      <p style={{ fontSize: 11, color: "var(--text-faint)" }}>متوسط سعر المتر</p>
                      <p
                        className="font-cairo font-bold"
                        style={{ fontSize: 15, color: "var(--info)" }}
                      >
                        {Math.round(marketStats.avgPPM).toLocaleString("ar-SA")} ر.س/م²
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Price position bar ── */}
                {property.price && marketStats.min !== marketStats.max && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--gold-bg-soft)" }}>
                    <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 10 }}>
                      موقع سعرك على نطاق السوق
                    </p>
                    <div
                      style={{
                        position: "relative",
                        height: 8,
                        borderRadius: 999,
                        background: "var(--overlay-mid)",
                      }}
                    >
                      {/* gradient bar */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg, var(--success), var(--warning), var(--danger))",
                        }}
                      />
                      {/* marker */}
                      {(() => {
                        const pct = Math.min(
                          100,
                          Math.max(
                            0,
                            ((property.price - marketStats.min) /
                              (marketStats.max - marketStats.min)) *
                              100
                          )
                        );
                        return (
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: `${pct}%`,
                              transform: "translate(-50%, -50%)",
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: "var(--bg-page)",
                              border: "2.5px solid var(--gold-2)",
                              boxShadow: "0 0 0 3px rgba(198,145,76,0.25)",
                            }}
                          />
                        );
                      })()}
                    </div>
                    <div
                      className="mt-2 flex justify-between"
                      style={{ fontSize: 10, color: "var(--text-faint)" }}
                    >
                      <span>الأقل: {fmtPrice(marketStats.min)}</span>
                      <span>الأعلى: {fmtPrice(marketStats.max)}</span>
                    </div>
                  </div>
                )}

                {/* ── Pricing recommendation ── */}
                {(() => {
                  if (!property.price || Math.abs(marketStats.diff) < 5) return null;
                  const overpriced = marketStats.diff > 20;
                  const underpriced = marketStats.diff < -20;
                  if (!overpriced && !underpriced) return null;
                  const suggested = Math.round((marketStats.avg * 0.97) / 1000) * 1000;
                  return (
                    <div
                      className="mt-4 rounded-xl p-4"
                      style={{
                        background: overpriced ? "rgba(248,113,113,0.05)" : "rgba(74,222,128,0.05)",
                        border: `1px solid ${overpriced ? "rgba(248,113,113,0.18)" : "rgba(74,222,128,0.18)"}`,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: overpriced ? "var(--danger)" : "var(--success)",
                          marginBottom: 4,
                        }}
                      >
                        {overpriced ? "💡 قد يكون السعر مرتفعاً نسبياً" : "💡 السعر تنافسي جداً"}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-soft)", lineHeight: 1.7 }}>
                        {overpriced
                          ? `السعر أعلى من متوسط السوق بـ ${Math.round(marketStats.diff)}%. سعر مقترح للتنافسية: ${suggested.toLocaleString("ar-SA")} ر.س`
                          : `السعر أقل من متوسط السوق بـ ${Math.abs(Math.round(marketStats.diff))}%. يمكن رفعه مع الحفاظ على تنافسيته.`}
                      </p>
                    </div>
                  );
                })()}

                {/* ── Comparables list ── */}
                {comparables.length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--gold-bg-soft)" }}>
                    <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 10 }}>
                      عقارات مشابهة ({comparables.length})
                    </p>
                    <div className="space-y-2">
                      {comparables.slice(0, 5).map((c, i) => {
                        const ppm =
                          c.price && c.land_area ? Math.round(c.price / c.land_area) : null;
                        const diff =
                          property.price && c.price
                            ? Math.round(((c.price - property.price) / property.price) * 100)
                            : null;
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2 rounded-xl p-2.5"
                            style={{ background: "var(--bg-surface-2)" }}
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate"
                                style={{ fontSize: 12, color: "var(--text-on-dark)" }}
                              >
                                {c.title}
                              </p>
                              <p style={{ fontSize: 10, color: "var(--text-faint)" }}>
                                {c.district}
                                {ppm ? ` · ${ppm.toLocaleString("ar-SA")} ر.س/م²` : ""}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-left">
                              <p
                                className="font-cairo font-bold"
                                style={{ fontSize: 13, color: "var(--gold-2)" }}
                              >
                                {fmtPrice(c.price)}
                              </p>
                              {diff !== null && (
                                <p
                                  style={{
                                    fontSize: 10,
                                    color:
                                      diff > 0
                                        ? "var(--danger)"
                                        : diff < 0
                                          ? "var(--success)"
                                          : "var(--text-faint)",
                                    textAlign: "left",
                                  }}
                                >
                                  {diff > 0 ? `+${diff}%` : `${diff}%`}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right Column: Sidebar ── */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
          >
            <h3 className="mb-4 font-bold" style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
              إجراءات سريعة
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleWhatsApp}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
                style={{
                  background: "rgba(74,222,128,0.06)",
                  color: "var(--success)",
                  border: "1px solid rgba(74,222,128,0.15)",
                  cursor: "pointer",
                  textAlign: "right",
                }}
              >
                <MessageCircle size={16} /> مشاركة واتساب
              </button>
              {property.location_url && (
                <a
                  href={property.location_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold no-underline transition"
                  style={{
                    background: "var(--gold-bg-soft)",
                    color: "var(--gold-2)",
                    border: "1px solid var(--gold-bg-hover)",
                  }}
                >
                  <ExternalLink size={16} /> عرض الموقع
                </a>
              )}
              {property.contact_phone && (
                <a
                  href={`tel:${property.contact_phone}`}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold no-underline transition"
                  style={{
                    background: "rgba(96,165,250,0.06)",
                    color: "var(--info)",
                    border: "1px solid rgba(96,165,250,0.15)",
                  }}
                >
                  <Phone size={16} /> اتصال: {property.contact_phone}
                </a>
              )}
            </div>
          </div>

          {/* ── Owner Availability Check ── */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--bg-surface-1)",
              border:
                "1px solid " +
                (availabilityInfo?.isStale ? "rgba(248,113,113,0.2)" : "var(--gold-bg)"),
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <RefreshCw size={14} style={{ color: "var(--gold-2)" }} />
              <h3 className="font-bold" style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
                حالة الإتاحة مع المالك
              </h3>
            </div>

            {/* Current status */}
            <div
              className="mb-3 rounded-xl p-3"
              style={{
                background:
                  availabilityInfo?.available === true
                    ? "rgba(74,222,128,0.06)"
                    : availabilityInfo?.available === false
                      ? "rgba(248,113,113,0.06)"
                      : "rgba(90,90,98,0.06)",
                border:
                  "1px solid " +
                  (availabilityInfo?.available === true
                    ? "rgba(74,222,128,0.15)"
                    : availabilityInfo?.available === false
                      ? "rgba(248,113,113,0.15)"
                      : "rgba(90,90,98,0.1)"),
              }}
            >
              <div className="flex items-center gap-2">
                {availabilityInfo?.available === true ? (
                  <CheckCircle size={16} style={{ color: "var(--success)" }} />
                ) : availabilityInfo?.available === false ? (
                  <AlertCircle size={16} style={{ color: "var(--danger)" }} />
                ) : (
                  <Clock size={16} style={{ color: "var(--text-soft)" }} />
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      availabilityInfo?.available === true
                        ? "var(--success)"
                        : availabilityInfo?.available === false
                          ? "var(--danger)"
                          : "var(--text-soft)",
                  }}
                >
                  {availabilityInfo?.available === true
                    ? "متاح — مؤكد من المالك"
                    : availabilityInfo?.available === false
                      ? "غير متاح"
                      : "لم يتم التحقق بعد"}
                </span>
              </div>
              {availabilityInfo?.lastCheck && (
                <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>
                  آخر تحقق: {availabilityInfo.lastCheck.toLocaleDateString("ar-SA")}
                  {availabilityInfo.daysSince !== null &&
                    ` (منذ ${availabilityInfo.daysSince} يوم)`}
                </p>
              )}
              {availabilityInfo?.isStale && (
                <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 4, fontWeight: 600 }}>
                  ⚠ مر أكثر من 7 أيام — يُنصح بالتحقق مجدداً
                </p>
              )}
            </div>

            {/* Update buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => updateAvailability(true)}
                disabled={updating}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-50"
                style={{
                  background: "rgba(74,222,128,0.08)",
                  color: "var(--success)",
                  border: "1px solid rgba(74,222,128,0.2)",
                  cursor: "pointer",
                }}
              >
                <CheckCircle size={12} /> متاح
              </button>
              <button
                onClick={() => updateAvailability(false)}
                disabled={updating}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-50"
                style={{
                  background: "rgba(248,113,113,0.06)",
                  color: "var(--danger)",
                  border: "1px solid rgba(248,113,113,0.15)",
                  cursor: "pointer",
                }}
              >
                <AlertCircle size={12} /> غير متاح
              </button>
            </div>
          </div>

          {/* Property Info */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
          >
            <h3 className="mb-3 font-bold" style={{ fontSize: 13, color: "var(--text-on-dark)" }}>
              معلومات إضافية
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "تاريخ الإضافة",
                  val: property.created_at
                    ? new Date(property.created_at).toLocaleDateString("ar-SA")
                    : "—",
                },
                {
                  label: "آخر تعديل",
                  val: property.updated_at
                    ? new Date(property.updated_at).toLocaleDateString("ar-SA")
                    : "—",
                },
                { label: "واجهة العقار", val: property.facade || "—" },
                {
                  label: "عرض الشارع",
                  val: property.street_width ? property.street_width + " م" : "—",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between" style={{ fontSize: 13 }}>
                  <span style={{ color: "var(--text-faint)" }}>{item.label}</span>
                  <span style={{ color: "var(--text-on-dark)", fontWeight: 500 }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
