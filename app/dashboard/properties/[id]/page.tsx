"use client";
import { formatSAR } from "@/lib/format";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, MapPin, Bed, Bath, Layers, Maximize2, Building2,
  Edit3, Trash2, Share2, Eye, EyeOff, Phone, ExternalLink,
  TrendingUp, TrendingDown, Minus, BarChart3, Clock, CheckCircle,
  AlertCircle, RefreshCw, MessageCircle,
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
  const id = params.id;
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comparables, setComparables] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { loadProperty(); }, []);

  async function loadProperty() {
    const { data } = await supabase.from("properties").select("*").eq("id", id).single();
    setProperty(data);
    setLoading(false);
    if (data) loadComparables(data);
  }

  async function loadComparables(prop: any) {
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
    await supabase.from("properties").update({
      owner_confirmed_available: available,
      owner_last_check: now,
    }).eq("id", id);
    setProperty({ ...property, owner_confirmed_available: available, owner_last_check: now });
    toast.success(available ? "تم تأكيد الإتاحة" : "تم تحديث الحالة — غير متاح");
    setUpdating(false);
  }

  function handleWhatsApp() {
    if (!property) return;
    const lines = [
      "🏠 *" + property.title + "*", "",
      "🔖 الرمز: " + (property.code || "—"),
      "📋 التصنيف: " + property.main_category + " / " + property.sub_category,
      "💼 نوع العرض: " + property.offer_type,
      "📍 الموقع: " + property.district + " — " + property.city,
      "📐 المساحة: " + (property.land_area || "—") + " م²",
      "💰 السعر: " + (property.price ? property.price.toLocaleString() : "—") + " ر.س",
      "", "📝 " + (property.description || ""),
    ];
    if (property.location_url) lines.push("📌 " + property.location_url);
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  }

  // ── Market comparison calculations ──
  const marketStats = useMemo(() => {
    if (comparables.length === 0 || !property?.price) return null;
    const prices = comparables.map(c => c.price).filter(Boolean);
    if (prices.length === 0) return null;

    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const diff = ((property.price - avg) / avg) * 100;

    // سعر المتر المربع
    const myPPM = property.land_area ? property.price / property.land_area : null;
    const compPPMs = comparables.filter(c => c.price && c.land_area).map(c => c.price / c.land_area);
    const avgPPM = compPPMs.length > 0 ? compPPMs.reduce((s, p) => s + p, 0) / compPPMs.length : null;

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

  if (loading) return (
    <div dir="rtl" className="space-y-4">
      <div className="skeleton h-8 rounded w-64 mb-4" />
      <div className="skeleton h-48 rounded-2xl mb-4" />
      <div className="skeleton h-40 rounded-2xl" />
    </div>
  );

  if (!property) return (
    <div dir="rtl" className="text-center py-20">
      <Building2 size={48} style={{ color: "#3A3A42", margin: "0 auto 12px" }} />
      <p style={{ color: "#5A5A62", fontSize: 16 }}>العقار غير موجود</p>
      <Link href="/dashboard/properties" className="text-sm mt-4 inline-block" style={{ color: "#C6914C" }}>العودة للعقارات</Link>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">
      {/* ── Breadcrumb + Actions ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2" style={{ color: "#5A5A62", fontSize: 13 }}>
          <Link href="/dashboard/properties" className="hover:text-[#C6914C] transition no-underline" style={{ color: "#5A5A62" }}>العقارات</Link>
          <ArrowRight size={14} />
          <span style={{ color: "#F5F5F5" }} className="truncate max-w-[250px]">{property.title || "تفاصيل العقار"}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={togglePublish}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition"
            style={{ background: property.is_published ? "rgba(74,222,128,0.08)" : "rgba(90,90,98,0.1)", color: property.is_published ? "#4ADE80" : "#9A9AA0", border: "1px solid " + (property.is_published ? "rgba(74,222,128,0.2)" : "rgba(90,90,98,0.15)"), cursor: "pointer" }}>
            {property.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
            {property.is_published ? "منشور" : "مسودة"}
          </button>
          <Link href={`/dashboard/properties/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold no-underline transition"
            style={{ background: "rgba(198,145,76,0.08)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.2)" }}>
            <Edit3 size={13} /> تعديل
          </Link>
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition"
            style={{ background: "rgba(248,113,113,0.06)", color: "#F87171", border: "1px solid rgba(248,113,113,0.15)", cursor: "pointer" }}>
            <Trash2 size={13} /> حذف
          </button>
        </div>
      </div>

      {/* ── Hero: Images + Title ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
        {/* Image Gallery */}
        {property.images?.length > 0 && (
          <div className="grid gap-1" style={{ gridTemplateColumns: property.images.length > 1 ? "2fr 1fr" : "1fr", height: 280 }}>
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
            {property.images.length > 1 && (
              <div className="grid gap-1" style={{ gridTemplateRows: property.images.length > 2 ? "1fr 1fr" : "1fr" }}>
                {property.images.slice(1, 3).map((img: string, i: number) => (
                  <img key={i} src={img} alt="" className="w-full h-full object-cover" />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <div className="flex gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: "rgba(198,145,76,0.1)", color: "#C6914C" }}>{property.code}</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{
                  background: property.offer_type === "إيجار" ? "rgba(96,165,250,0.1)" : "rgba(198,145,76,0.08)",
                  color: property.offer_type === "إيجار" ? "#60A5FA" : "#C6914C",
                }}>{property.offer_type}</span>
                <span className="px-2.5 py-1 rounded-lg text-xs" style={{ background: "#1C1C22", color: "#9A9AA0" }}>{property.main_category} / {property.sub_category}</span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: "#F5F5F5" }}>{property.title}</h1>
              <div className="flex items-center gap-1.5 mt-2" style={{ color: "#5A5A62", fontSize: 13 }}>
                <MapPin size={13} style={{ color: "#C6914C" }} />
                {property.district} — {property.city}
              </div>
            </div>
            <div className="text-left">
              <p className="font-cairo font-bold flex items-center gap-1" style={{ fontSize: 26, color: "#C6914C" }}>
                {property.price ? property.price.toLocaleString() : "—"} <SARIcon color="accent" size={18} />
              </p>
              {property.land_area && property.price && (
                <p style={{ fontSize: 11, color: "#5A5A62" }}>
                  {Math.round(property.price / property.land_area).toLocaleString()} ﷼/م²
                </p>
              )}
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-4" style={{ borderTop: "1px solid rgba(198,145,76,0.06)" }}>
            {[
              { icon: Maximize2, label: "الأرض", val: property.land_area ? property.land_area + " م²" : "—" },
              { icon: Building2, label: "البناء", val: property.built_area ? property.built_area + " م²" : "—" },
              { icon: Bed, label: "الغرف", val: property.rooms || "—" },
              { icon: Bath, label: "دورات المياه", val: property.bathrooms || "—" },
              { icon: Layers, label: "الأدوار", val: property.floors || "—" },
              { icon: Clock, label: "عمر العقار", val: property.age ? property.age + " سنة" : "—" },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl" style={{ background: "#1C1C22" }}>
                <s.icon size={16} style={{ color: "#C6914C", margin: "0 auto 6px" }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: "#E5E5E5" }}>{s.val}</p>
                <p style={{ fontSize: 10, color: "#5A5A62" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left Column: Description + Actions ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          {property.description && (
            <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <h3 className="font-bold mb-3" style={{ fontSize: 14, color: "#C6914C" }}>الوصف</h3>
              <p style={{ color: "#9A9AA0", lineHeight: 1.9, fontSize: 14, whiteSpace: "pre-wrap" }}>{property.description}</p>
            </div>
          )}

          {/* ── Market Comparison ── */}
          <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={16} style={{ color: "#C6914C" }} />
              <h3 className="font-bold" style={{ fontSize: 14, color: "#C6914C" }}>المقارنة السوقية</h3>
            </div>

            {!marketStats ? (
              <div className="text-center py-8">
                <BarChart3 size={32} style={{ color: "#3A3A42", margin: "0 auto 10px" }} />
                <p style={{ color: "#5A5A62", fontSize: 13 }}>لا توجد عقارات مشابهة كافية للمقارنة</p>
                <p style={{ color: "#3A3A42", fontSize: 11, marginTop: 4 }}>أضف المزيد من العقارات في نفس المدينة والتصنيف</p>
              </div>
            ) : (
              <>
                {/* Position Indicator */}
                <div className="rounded-xl p-4 mb-4" style={{
                  background: marketStats.diff > 10 ? "rgba(248,113,113,0.06)" : marketStats.diff < -10 ? "rgba(74,222,128,0.06)" : "rgba(96,165,250,0.06)",
                  border: "1px solid " + (marketStats.diff > 10 ? "rgba(248,113,113,0.15)" : marketStats.diff < -10 ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)"),
                }}>
                  <div className="flex items-center gap-3">
                    {marketStats.diff > 10 ? <TrendingUp size={20} style={{ color: "#F87171" }} /> :
                     marketStats.diff < -10 ? <TrendingDown size={20} style={{ color: "#4ADE80" }} /> :
                     <Minus size={20} style={{ color: "#60A5FA" }} />}
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#E5E5E5" }}>
                        {marketStats.diff > 10 ? "أعلى من السوق" : marketStats.diff < -10 ? "أقل من السوق" : "ضمن متوسط السوق"}
                      </p>
                      <p style={{ fontSize: 12, color: "#9A9AA0" }}>
                        عقارك {marketStats.diff > 0 ? "أغلى" : "أرخص"} بـ {Math.abs(Math.round(marketStats.diff))}% من متوسط {marketStats.count} عقار مشابه
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "متوسط السوق", val: fmtPrice(marketStats.avg), color: "#60A5FA" },
                    { label: "الأقل", val: fmtPrice(marketStats.min), color: "#4ADE80" },
                    { label: "الأعلى", val: fmtPrice(marketStats.max), color: "#F87171" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-3 text-center" style={{ background: "#1C1C22" }}>
                      <p style={{ fontSize: 10, color: "#5A5A62", marginBottom: 4 }}>{s.label}</p>
                      <p className="font-cairo font-bold" style={{ fontSize: 16, color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Price per m² comparison */}
                {marketStats.myPPM && marketStats.avgPPM && (
                  <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid rgba(198,145,76,0.06)" }}>
                    <div>
                      <p style={{ fontSize: 11, color: "#5A5A62" }}>سعر المتر — عقارك</p>
                      <p className="font-cairo font-bold" style={{ fontSize: 15, color: "#C6914C" }}>{Math.round(marketStats.myPPM).toLocaleString()} ﷼/م²</p>
                    </div>
                    <div className="text-left">
                      <p style={{ fontSize: 11, color: "#5A5A62" }}>متوسط سعر المتر</p>
                      <p className="font-cairo font-bold" style={{ fontSize: 15, color: "#60A5FA" }}>{Math.round(marketStats.avgPPM).toLocaleString()} ﷼/م²</p>
                    </div>
                  </div>
                )}

                {/* ── Price position bar ── */}
                {property.price && marketStats.min !== marketStats.max && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(198,145,76,0.06)" }}>
                    <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 10 }}>موقع سعرك على نطاق السوق</p>
                    <div style={{ position: "relative", height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)" }}>
                      {/* gradient bar */}
                      <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: "linear-gradient(90deg, #4ADE80, #FACC15, #F87171)" }} />
                      {/* marker */}
                      {(() => {
                        const pct = Math.min(100, Math.max(0, ((property.price - marketStats.min) / (marketStats.max - marketStats.min)) * 100));
                        return (
                          <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: "#0A0A0C", border: "2.5px solid #C6914C", boxShadow: "0 0 0 3px rgba(198,145,76,0.25)" }} />
                        );
                      })()}
                    </div>
                    <div className="flex justify-between mt-2" style={{ fontSize: 10, color: "#5A5A62" }}>
                      <span>الأقل: {fmtPrice(marketStats.min)}</span>
                      <span>الأعلى: {fmtPrice(marketStats.max)}</span>
                    </div>
                  </div>
                )}

                {/* ── Pricing recommendation ── */}
                {(() => {
                  if (!property.price || Math.abs(marketStats.diff) < 5) return null;
                  const overpriced  = marketStats.diff > 20;
                  const underpriced = marketStats.diff < -20;
                  if (!overpriced && !underpriced) return null;
                  const suggested = Math.round(marketStats.avg * 0.97 / 1000) * 1000;
                  return (
                    <div className="mt-4 rounded-xl p-4" style={{
                      background: overpriced ? "rgba(248,113,113,0.05)" : "rgba(74,222,128,0.05)",
                      border: `1px solid ${overpriced ? "rgba(248,113,113,0.18)" : "rgba(74,222,128,0.18)"}`,
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: overpriced ? "#F87171" : "#4ADE80", marginBottom: 4 }}>
                        {overpriced ? "💡 قد يكون السعر مرتفعاً نسبياً" : "💡 السعر تنافسي جداً"}
                      </p>
                      <p style={{ fontSize: 11, color: "#9A9AA0", lineHeight: 1.7 }}>
                        {overpriced
                          ? `السعر أعلى من متوسط السوق بـ ${Math.round(marketStats.diff)}%. سعر مقترح للتنافسية: ${suggested.toLocaleString()} ﷼`
                          : `السعر أقل من متوسط السوق بـ ${Math.abs(Math.round(marketStats.diff))}%. يمكن رفعه مع الحفاظ على تنافسيته.`
                        }
                      </p>
                    </div>
                  );
                })()}

                {/* ── Comparables list ── */}
                {comparables.length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(198,145,76,0.06)" }}>
                    <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 10 }}>عقارات مشابهة ({comparables.length})</p>
                    <div className="space-y-2">
                      {comparables.slice(0, 5).map((c, i) => {
                        const ppm = c.price && c.land_area ? Math.round(c.price / c.land_area) : null;
                        const diff = property.price && c.price ? Math.round(((c.price - property.price) / property.price) * 100) : null;
                        return (
                          <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-xl" style={{ background: "#1C1C22" }}>
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ fontSize: 12, color: "#E5E5E5" }}>{c.title}</p>
                              <p style={{ fontSize: 10, color: "#5A5A62" }}>{c.district}{ppm ? ` · ${ppm.toLocaleString()} ﷼/م²` : ""}</p>
                            </div>
                            <div className="text-left flex-shrink-0">
                              <p className="font-cairo font-bold" style={{ fontSize: 13, color: "#C6914C" }}>{fmtPrice(c.price)}</p>
                              {diff !== null && (
                                <p style={{ fontSize: 10, color: diff > 0 ? "#F87171" : diff < 0 ? "#4ADE80" : "#5A5A62", textAlign: "left" }}>
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
          <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
            <h3 className="font-bold mb-4" style={{ fontSize: 13, color: "#E5E5E5" }}>إجراءات سريعة</h3>
            <div className="space-y-2">
              <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-semibold"
                style={{ background: "rgba(74,222,128,0.06)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.15)", cursor: "pointer", textAlign: "right" }}>
                <MessageCircle size={16} /> مشاركة واتساب
              </button>
              {property.location_url && (
                <a href={property.location_url} target="_blank" rel="noreferrer"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-semibold no-underline"
                  style={{ background: "rgba(198,145,76,0.06)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.15)" }}>
                  <ExternalLink size={16} /> عرض الموقع
                </a>
              )}
              {property.contact_phone && (
                <a href={`tel:${property.contact_phone}`}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-semibold no-underline"
                  style={{ background: "rgba(96,165,250,0.06)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.15)" }}>
                  <Phone size={16} /> اتصال: {property.contact_phone}
                </a>
              )}
            </div>
          </div>

          {/* ── Owner Availability Check ── */}
          <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid " + (availabilityInfo?.isStale ? "rgba(248,113,113,0.2)" : "rgba(198,145,76,0.1)") }}>
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw size={14} style={{ color: "#C6914C" }} />
              <h3 className="font-bold" style={{ fontSize: 13, color: "#E5E5E5" }}>حالة الإتاحة مع المالك</h3>
            </div>

            {/* Current status */}
            <div className="rounded-xl p-3 mb-3" style={{
              background: availabilityInfo?.available === true ? "rgba(74,222,128,0.06)" :
                          availabilityInfo?.available === false ? "rgba(248,113,113,0.06)" : "rgba(90,90,98,0.06)",
              border: "1px solid " + (availabilityInfo?.available === true ? "rgba(74,222,128,0.15)" :
                                      availabilityInfo?.available === false ? "rgba(248,113,113,0.15)" : "rgba(90,90,98,0.1)"),
            }}>
              <div className="flex items-center gap-2">
                {availabilityInfo?.available === true ? <CheckCircle size={16} style={{ color: "#4ADE80" }} /> :
                 availabilityInfo?.available === false ? <AlertCircle size={16} style={{ color: "#F87171" }} /> :
                 <Clock size={16} style={{ color: "#9A9AA0" }} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: availabilityInfo?.available === true ? "#4ADE80" : availabilityInfo?.available === false ? "#F87171" : "#9A9AA0" }}>
                  {availabilityInfo?.available === true ? "متاح — مؤكد من المالك" :
                   availabilityInfo?.available === false ? "غير متاح" : "لم يتم التحقق بعد"}
                </span>
              </div>
              {availabilityInfo?.lastCheck && (
                <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 6 }}>
                  آخر تحقق: {availabilityInfo.lastCheck.toLocaleDateString("ar-SA")}
                  {availabilityInfo.daysSince !== null && ` (منذ ${availabilityInfo.daysSince} يوم)`}
                </p>
              )}
              {availabilityInfo?.isStale && (
                <p style={{ fontSize: 11, color: "#F87171", marginTop: 4, fontWeight: 600 }}>
                  ⚠ مر أكثر من 7 أيام — يُنصح بالتحقق مجدداً
                </p>
              )}
            </div>

            {/* Update buttons */}
            <div className="flex gap-2">
              <button onClick={() => updateAvailability(true)} disabled={updating}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                style={{ background: "rgba(74,222,128,0.08)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)", cursor: "pointer" }}>
                <CheckCircle size={12} /> متاح
              </button>
              <button onClick={() => updateAvailability(false)} disabled={updating}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                style={{ background: "rgba(248,113,113,0.06)", color: "#F87171", border: "1px solid rgba(248,113,113,0.15)", cursor: "pointer" }}>
                <AlertCircle size={12} /> غير متاح
              </button>
            </div>
          </div>

          {/* Property Info */}
          <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
            <h3 className="font-bold mb-3" style={{ fontSize: 13, color: "#E5E5E5" }}>معلومات إضافية</h3>
            <div className="space-y-3">
              {[
                { label: "تاريخ الإضافة", val: property.created_at ? new Date(property.created_at).toLocaleDateString("ar-SA") : "—" },
                { label: "آخر تعديل", val: property.updated_at ? new Date(property.updated_at).toLocaleDateString("ar-SA") : "—" },
                { label: "واجهة العقار", val: property.facade || "—" },
                { label: "عرض الشارع", val: property.street_width ? property.street_width + " م" : "—" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between" style={{ fontSize: 13 }}>
                  <span style={{ color: "#5A5A62" }}>{item.label}</span>
                  <span style={{ color: "#E5E5E5", fontWeight: 500 }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}