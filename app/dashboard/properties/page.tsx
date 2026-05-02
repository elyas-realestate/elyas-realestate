"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MapPin, Eye, EyeOff, Sparkles, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";
import SARIcon from "../../components/SARIcon";
import { exportToCSV, PROPERTIES_EXPORT_HEADERS } from "@/lib/export";


export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [offerFilter, setOfferFilter] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const offerTabs = ["الكل", "بيع", "إيجار", "استثمار", "تحتاج متابعة"];

  useEffect(() => { fetchProperties(); }, []);

  async function fetchProperties() {
    // اختيار الأعمدة الضرورية فقط للأداء (تحسين من ~6.6s إلى ~1s)
    const { data } = await supabase
      .from("properties")
      .select("id, code, title, district, city, price, offer_type, sub_category, main_category, is_published, images, main_image, owner_confirmed_available, owner_last_check, last_availability_check, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setProperties(data || []);
    setLoading(false);
  }

  async function togglePublish(e: React.MouseEvent, id: string, current: boolean) {
    e.preventDefault();
    e.stopPropagation();
    setToggling(id);
    await supabase.from("properties").update({ is_published: !current }).eq("id", id);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, is_published: !current } : p));
    toast.success(!current ? "تم نشر العقار" : "تم إيقاف نشر العقار");
    setToggling(null);
  }

  function needsAvailabilityCheck(p: any): boolean {
    if (p.owner_confirmed_available === null || p.owner_confirmed_available === undefined) return true;
    if (!p.owner_last_check) return true;
    const days = Math.floor((Date.now() - new Date(p.owner_last_check).getTime()) / 86400000);
    return days > 7;
  }

  const staleProperties = properties.filter(needsAvailabilityCheck);

  const filtered = properties.filter(p => {
    const matchSearch = p.title?.includes(search) || p.district?.includes(search) || p.code?.includes(search);
    if (offerFilter === "تحتاج متابعة") return matchSearch && needsAvailabilityCheck(p);
    const matchOffer = offerFilter === "الكل" || p.offer_type === offerFilter;
    return matchSearch && matchOffer;
  });

  // حساب العدد لكل نوع
  const offerCounts: Record<string, number> = {
    "الكل": properties.length,
    "بيع": properties.filter(p => p.offer_type === "بيع").length,
    "إيجار": properties.filter(p => p.offer_type === "إيجار").length,
    "استثمار": properties.filter(p => p.offer_type === "استثمار").length,
    "تحتاج متابعة": staleProperties.length,
  };

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "العقارات" }]} />
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <h2 className="text-2xl font-bold">العقارات</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportToCSV(filtered, PROPERTIES_EXPORT_HEADERS, "عقارات")}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--overlay-mid)", color: "var(--text-soft)" }}
            title="تصدير إلى Excel / CSV"
          >
            <Download size={14} />
            تصدير
          </button>
          <Link href="/dashboard/properties/smart-add" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition no-underline text-sm" style={{ background:'linear-gradient(135deg, var(--gold-bg-hover), rgba(168,93,255,0.08))', color:'var(--gold-2)', border: '1px solid rgba(198,145,76,0.25)' }}>
            <Sparkles size={15} />
            إضافة بالذكاء الاصطناعي
          </Link>
          <Link href="/dashboard/properties/add" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition no-underline text-sm" style={{ background:'linear-gradient(135deg, var(--gold-2), var(--gold-3))', color:'var(--bg-page)' }}>
            <Plus size={16} />
            إضافة عقار
          </Link>
        </div>
      </div>

      {/* ── تنبيه الإتاحة المجمّع ── */}
      {staleProperties.length > 0 && (
        <button
          onClick={() => setOfferFilter("تحتاج متابعة")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-right transition"
          style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.2)", cursor: "pointer" }}
        >
          <AlertTriangle size={16} style={{ color: "var(--warning)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--warning)", fontWeight: 600 }}>
            {staleProperties.length} {staleProperties.length === 1 ? "عقار يحتاج" : "عقارات تحتاج"} تحديث إتاحة مع المالك
          </span>
          <span style={{ fontSize: 12, color: "var(--text-soft)", marginRight: "auto" }}>انقر للعرض ←</span>
        </button>
      )}

      <div className="relative mb-4">
        <Search size={18} className="absolute right-3 top-3.5" style={{ color:'var(--text-faint)' }} />
        <input type="text" placeholder="ابحث بالاسم أو الحي أو الرمز..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg pr-10 pl-4 py-3 focus:outline-none text-sm" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg)', color:'var(--text-strong)' }} />
      </div>

      {/* ── فلتر نوع العرض ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {offerTabs.map(tab => {
          const isActive = offerFilter === tab;
          const count = offerCounts[tab as keyof typeof offerCounts] || 0;
          return (
            <button
              key={tab}
              onClick={() => setOfferFilter(tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
              style={{
                background: tab === "تحتاج متابعة"
                  ? (isActive ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.04)")
                  : (isActive ? "var(--gold-bg-hover)" : "var(--bg-surface-1)"),
                color: tab === "تحتاج متابعة"
                  ? (isActive ? "var(--warning)" : "var(--text-soft)")
                  : (isActive ? "var(--gold-2)" : "var(--text-faint)"),
                border: "1px solid " + (tab === "تحتاج متابعة"
                  ? (isActive ? "rgba(250,204,21,0.35)" : "rgba(250,204,21,0.1)")
                  : (isActive ? "rgba(198,145,76,0.35)" : "var(--gold-bg-soft)")),
                cursor: "pointer",
              }}
            >
              {tab}
              <span
                className="text-xs font-bold rounded-full px-1.5 py-0.5"
                style={{
                  background: isActive ? "var(--gold-bg-hover)" : "rgba(90,90,98,0.15)",
                  color: isActive ? "var(--gold-2)" : "var(--text-faint)",
                  fontSize: 10,
                  minWidth: 20,
                  textAlign: "center",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background:'var(--bg-surface-1)', border:'1px solid rgba(193,141,74,0.08)' }}>
              <div className="skeleton h-40 rounded-lg mb-3" />
              <div className="skeleton h-4 rounded w-3/4 mb-2" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg mb-4" style={{ color:'var(--text-soft)' }}>لا توجد عقارات بعد</p>
          <Link href="/dashboard/properties/add" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg no-underline font-bold transition text-sm" style={{ background:'linear-gradient(135deg, var(--gold-2), var(--gold-3))', color:'var(--bg-page)' }}>
            <Plus size={16} /> أضف أول عقار
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(property => (
            <div key={property.id} style={{ position: "relative" }}>

              {/* ── زر النشر السريع ── */}
              <button
                onClick={e => togglePublish(e, property.id, property.is_published)}
                disabled={toggling === property.id}
                title={property.is_published ? "اضغط لإيقاف النشر (تحويل لمسودة)" : "اضغط لنشر العقار في صفحتك العامة"}
                style={{
                  position: "absolute", top: 10, left: 10, zIndex: 10,
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 9, border: "none",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif",
                  background: property.is_published
                    ? "rgba(74,222,128,0.95)"
                    : "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
                  color: property.is_published ? "#0A0A0C" : "#1A1206",
                  boxShadow: property.is_published ? "0 4px 14px rgba(74,222,128,0.35)" : "0 4px 14px rgba(198,145,76,0.35)",
                  transition: "all 0.25s",
                  opacity: toggling === property.id ? 0.6 : 1,
                }}
              >
                {toggling === property.id ? (
                  <span style={{ width: 11, height: 11, border: "1.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                ) : property.is_published ? (
                  <Eye size={12} />
                ) : (
                  <Plus size={12} />
                )}
                {property.is_published ? "منشور" : "نشر العقار"}
              </button>

              {/* ── البطاقة ── */}
              <Link href={"/dashboard/properties/" + property.id} className="block rounded-xl overflow-hidden no-underline transition" style={{ background:'var(--bg-surface-1)', border:'1px solid ' + (property.is_published ? 'rgba(74,222,128,0.15)' : 'var(--gold-bg)'), color:'var(--text-strong)' }}>
                <div className="h-44 flex items-center justify-center relative overflow-hidden" style={{ background:'linear-gradient(135deg, var(--bg-surface-2), var(--bg-surface-3))' }}>
                  {(property.images?.[0] || property.main_image) ? (
                    <img src={property.images?.[0] || property.main_image} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2" style={{ color:'var(--text-faint)' }}>
                      {/* SVG illustration: مبنى عقاري بسيط */}
                      <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="10" y="22" width="44" height="32" rx="2" stroke="currentColor" strokeWidth="1.6" opacity="0.55"/>
                        <path d="M10 22 L32 8 L54 22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" opacity="0.55"/>
                        <rect x="18" y="32" width="8"  height="10" stroke="currentColor" strokeWidth="1.4" opacity="0.4" rx="1"/>
                        <rect x="38" y="32" width="8"  height="10" stroke="currentColor" strokeWidth="1.4" opacity="0.4" rx="1"/>
                        <rect x="28" y="42" width="8"  height="12" stroke="currentColor" strokeWidth="1.4" opacity="0.55" rx="1"/>
                      </svg>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>اضغط لإضافة صور</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-1 rounded" style={{ color:'var(--gold-2)', background:'var(--gold-bg)' }}>{property.code}</span>
                    <span className="text-xs" style={{ color:'var(--text-faint)' }}>{property.offer_type}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold leading-snug" style={{ fontSize: 15 }}>{property.title}</h3>
                    {(() => {
                      const avail = property.owner_confirmed_available;
                      const checkDate = property.owner_last_check ? new Date(property.owner_last_check) : null;
                      const isStale = checkDate ? Math.floor((Date.now() - checkDate.getTime()) / 86400000) > 7 : false;
                      let dColor = "var(--text-soft)"; let text = "لم يُتحقق";
                      if (avail === true) { dColor = isStale ? "var(--warning)" : "var(--success)"; text = isStale ? "متاح (قديم)" : "متاح باعتراف"; }
                      else if (avail === false) { dColor = "var(--danger)"; text = "غير متاح"; }
                      return (
                        <div className="flex items-center gap-1.5 flex-shrink-0" style={{ background: "rgba(255,255,255,0.03)", padding: "2px 6px", borderRadius: 6 }} title="حالة الاتاحة مع المالك">
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dColor }} />
                          <span style={{ fontSize: 10, color: dColor, fontWeight: 600 }}>{text}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1 text-sm mb-3" style={{ color:'var(--text-soft)', fontSize: 13 }}>
                    <MapPin size={13} />
                    <span>{property.district} — {property.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1" style={{ color:'var(--gold-2)', fontSize: 15 }}>
                      {property.price?.toLocaleString("ar-SA")} <SARIcon size={12} color="accent" />
                    </span>
                    <span className="text-xs" style={{ color:'var(--text-faint)' }}>{property.main_category}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
