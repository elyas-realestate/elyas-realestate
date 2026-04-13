"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MapPin, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";
import SARIcon from "../../components/SARIcon";


export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [offerFilter, setOfferFilter] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const offerTabs = ["الكل", "بيع", "إيجار", "استثمار"];

  useEffect(() => { fetchProperties(); }, []);

  async function fetchProperties() {
    const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
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

  const filtered = properties.filter(p => {
    const matchSearch = p.title?.includes(search) || p.district?.includes(search) || p.code?.includes(search);
    const matchOffer = offerFilter === "الكل" || p.offer_type === offerFilter;
    return matchSearch && matchOffer;
  });

  // حساب العدد لكل نوع
  const offerCounts = {
    "الكل": properties.length,
    "بيع": properties.filter(p => p.offer_type === "بيع").length,
    "إيجار": properties.filter(p => p.offer_type === "إيجار").length,
    "استثمار": properties.filter(p => p.offer_type === "استثمار").length,
  };

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "العقارات" }]} />
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <h2 className="text-2xl font-bold">العقارات</h2>
        <div className="flex gap-2">
          <Link href="/dashboard/properties/smart-add" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition no-underline text-sm" style={{ background:'linear-gradient(135deg, rgba(198,145,76,0.15), rgba(168,93,255,0.08))', color:'#C6914C', border: '1px solid rgba(198,145,76,0.25)' }}>
            <Sparkles size={15} />
            إضافة ذكية AI
          </Link>
          <Link href="/dashboard/properties/add" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition no-underline text-sm" style={{ background:'linear-gradient(135deg, #C6914C, #A6743A)', color:'#0A0A0C' }}>
            <Plus size={16} />
            إضافة عقار
          </Link>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute right-3 top-3.5" style={{ color:'#5A5A62' }} />
        <input type="text" placeholder="ابحث بالاسم أو الحي أو الرمز..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg pr-10 pl-4 py-3 focus:outline-none text-sm" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)', color:'#F5F5F5' }} />
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
                background: isActive ? "rgba(198,145,76,0.15)" : "#16161A",
                color: isActive ? "#C6914C" : "#5A5A62",
                border: "1px solid " + (isActive ? "rgba(198,145,76,0.35)" : "rgba(198,145,76,0.08)"),
                cursor: "pointer",
              }}
            >
              {tab}
              <span
                className="text-xs font-bold rounded-full px-1.5 py-0.5"
                style={{
                  background: isActive ? "rgba(198,145,76,0.2)" : "rgba(90,90,98,0.15)",
                  color: isActive ? "#C6914C" : "#5A5A62",
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
            <div key={i} className="rounded-xl p-4" style={{ background:'#16161A', border:'1px solid rgba(193,141,74,0.08)' }}>
              <div className="skeleton h-40 rounded-lg mb-3" />
              <div className="skeleton h-4 rounded w-3/4 mb-2" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg mb-4" style={{ color:'#9A9AA0' }}>لا توجد عقارات بعد</p>
          <Link href="/dashboard/properties/add" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg no-underline font-bold transition text-sm" style={{ background:'linear-gradient(135deg, #C6914C, #A6743A)', color:'#0A0A0C' }}>
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
                title={property.is_published ? "انقر لتحويل لمسودة" : "انقر للنشر"}
                style={{
                  position: "absolute", top: 10, left: 10, zIndex: 10,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 10px", borderRadius: 8, border: "none",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif",
                  background: property.is_published ? "rgba(74,222,128,0.15)" : "rgba(90,90,98,0.25)",
                  color: property.is_published ? "#4ADE80" : "#9A9AA0",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.25s",
                  opacity: toggling === property.id ? 0.5 : 1,
                }}
              >
                {toggling === property.id ? (
                  <span style={{ width: 10, height: 10, border: "1.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                ) : property.is_published ? (
                  <Eye size={11} />
                ) : (
                  <EyeOff size={11} />
                )}
                {property.is_published ? "منشور" : "مسودة"}
              </button>

              {/* ── البطاقة ── */}
              <Link href={"/dashboard/properties/" + property.id} className="block rounded-xl overflow-hidden no-underline transition" style={{ background:'#16161A', border:'1px solid ' + (property.is_published ? 'rgba(74,222,128,0.15)' : 'rgba(198,145,76,0.12)'), color:'#F5F5F5' }}>
                <div className="h-44 flex items-center justify-center" style={{ background:'#1C1C22' }}>
                  {(property.images?.[0] || property.main_image) ? (
                    <img src={property.images?.[0] || property.main_image} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <p style={{ color:'#5A5A62', fontSize: 13 }}>لا توجد صورة</p>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-1 rounded" style={{ color:'#C6914C', background:'rgba(198,145,76,0.1)' }}>{property.code}</span>
                    <span className="text-xs" style={{ color:'#5A5A62' }}>{property.offer_type}</span>
                  </div>
                  <h3 className="font-bold mb-2 leading-snug" style={{ fontSize: 15 }}>{property.title}</h3>
                  <div className="flex items-center gap-1 text-sm mb-3" style={{ color:'#9A9AA0', fontSize: 13 }}>
                    <MapPin size={13} />
                    <span>{property.district} — {property.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1" style={{ color:'#C6914C', fontSize: 15 }}>
                      {property.price?.toLocaleString()} <SARIcon size={12} color="accent" />
                    </span>
                    <span className="text-xs" style={{ color:'#5A5A62' }}>{property.main_category}</span>
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
