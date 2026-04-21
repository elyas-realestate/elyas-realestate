"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, MapPin, X, ChevronDown,
  Home, Bed, Maximize2, ArrowUpDown, Phone, ExternalLink,
  Calculator,
} from "lucide-react";


// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtPrice(n: number) {
  if (!n) return null;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "م ر.س";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "ألف ر.س";
  return n.toLocaleString("ar-SA") + " ر.س";
}

const OFFER_TYPES   = ["الكل","بيع","إيجار","استثمار","تطوير بالشراكة"];
const CATEGORIES    = ["الكل","سكني","تجاري","أرض","زراعي","صناعي"];
const SORT_OPTIONS  = [
  { id: "newest",     label: "الأحدث"     },
  { id: "price_asc",  label: "الأقل سعراً" },
  { id: "price_desc", label: "الأعلى سعراً" },
  { id: "area_desc",  label: "الأكبر مساحة" },
];
const PRICE_RANGES = [
  { label: "الكل",            min: 0,         max: Infinity },
  { label: "أقل من 500 ألف",  min: 0,         max: 500_000  },
  { label: "500 ألف – 1م",    min: 500_000,   max: 1_000_000 },
  { label: "1م – 3م",         min: 1_000_000, max: 3_000_000 },
  { label: "3م – 5م",         min: 3_000_000, max: 5_000_000 },
  { label: "أكثر من 5م",       min: 5_000_000, max: Infinity },
];

// ── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ p, accent = "#C6914C" }: { p: any; accent?: string }) {
  const img   = p.images?.[0] || p.main_image || null;
  const price = fmtPrice(p.price);

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all"
      style={{
        background: "#16161A",
        border: "1px solid rgba(198,145,76,0.1)",
        cursor: "default",
      }}
    >
      {/* Image */}
      <div style={{ height: 200, position: "relative", background: "#1C1C22", overflow: "hidden" }}>
        {img ? (
          <img src={img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", }} className="group-hover:scale-105" />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 40 }}>🏠</div>
        )}
        {/* Offer badge */}
        {p.offer_type && (
          <span style={{
            position: "absolute", top: 12, right: 12,
            background: accent, color: "#0A0A0C",
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 7,
          }}>{p.offer_type}</span>
        )}
        {/* Map button */}
        {p.location_url && (
          <a href={p.location_url} target="_blank" rel="noopener noreferrer"
            style={{
              position: "absolute", bottom: 12, left: 12,
              background: "rgba(10,10,12,0.8)", backdropFilter: "blur(8px)",
              color: accent, fontSize: 11, fontWeight: 600,
              padding: "5px 10px", borderRadius: 8, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4,
              border: `1px solid ${accent}44`,
            }}>
            <MapPin size={11} /> خريطة
          </a>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#E5E5E5", marginBottom: 6, lineHeight: 1.4 }}
          className="line-clamp-2">
          {p.title || "بدون عنوان"}
        </h3>

        <p style={{ fontSize: 12, color: "#5A5A62", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} style={{ color: accent, flexShrink: 0 }} />
          {[p.district, p.city].filter(Boolean).join("، ") || "—"}
        </p>

        {/* Specs */}
        <div className="flex gap-3 flex-wrap" style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(198,145,76,0.07)" }}>
          {p.rooms && (
            <span style={{ fontSize: 12, color: "#9A9AA0", display: "flex", alignItems: "center", gap: 3 }}>
              <Bed size={12} style={{ color: "#5A5A62" }} /> {p.rooms} غرف
            </span>
          )}
          {p.land_area && (
            <span style={{ fontSize: 12, color: "#9A9AA0", display: "flex", alignItems: "center", gap: 3 }}>
              <Maximize2 size={12} style={{ color: "#5A5A62" }} /> {p.land_area} م²
            </span>
          )}
          {p.sub_category && (
            <span style={{ fontSize: 11, color: "#5A5A62", background: "rgba(198,145,76,0.06)", padding: "2px 8px", borderRadius: 6 }}>
              {p.sub_category}
            </span>
          )}
        </div>

        {/* Price + Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          {price ? (
            <p style={{ fontSize: 18, fontWeight: 800, color: accent, fontFamily: "Cairo, sans-serif" }}>{price}</p>
          ) : (
            <p style={{ fontSize: 13, color: "#5A5A62" }}>السعر عند التواصل</p>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            {p.contact_phone && (
              <a href={`tel:${p.contact_phone}`}
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "rgba(198,145,76,0.06)",
                  border: "1px solid rgba(198,145,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: accent, textDecoration: "none",
                }}>
                <Phone size={13} />
              </a>
            )}
            {p.location_url && (
              <a href={p.location_url} target="_blank" rel="noopener noreferrer"
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "rgba(198,145,76,0.06)",
                  border: "1px solid rgba(198,145,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: accent, textDecoration: "none",
                }}>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function SearchPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState("");
  const [offerType, setOfferType]   = useState("الكل");
  const [category, setCategory]     = useState("الكل");
  const [city, setCity]             = useState("");
  const [priceRange, setPriceRange] = useState(0);  // index into PRICE_RANGES
  const [minRooms, setMinRooms]     = useState(0);
  const [sort, setSort]             = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [brokerName, setBrokerName] = useState("وسيط برو");

  useEffect(() => {
    supabase.from("properties")
      .select("id,title,district,city,price,offer_type,main_category,sub_category,land_area,rooms,bathrooms,images,main_image,location_url,contact_phone,created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setProperties(data || []); setLoading(false); });

    supabase.from("broker_identity").select("broker_name").limit(1).single()
      .then(({ data }) => { if (data?.broker_name) setBrokerName(data.broker_name); });
  }, []);

  // Unique cities
  const cities = useMemo(() => {
    const set = new Set(properties.map(p => p.city).filter(Boolean));
    return Array.from(set).sort();
  }, [properties]);

  // Filter + sort
  const filtered = useMemo(() => {
    const pr = PRICE_RANGES[priceRange];
    let list = properties.filter(p => {
      if (query) {
        const q = query.toLowerCase();
        const match =
          p.title?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.sub_category?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (offerType !== "الكل" && p.offer_type !== offerType) return false;
      if (category !== "الكل" && p.main_category !== category) return false;
      if (city && p.city !== city) return false;
      if (pr.min > 0 && (p.price || 0) < pr.min) return false;
      if (pr.max < Infinity && (p.price || 0) > pr.max) return false;
      if (minRooms > 0 && (p.rooms || 0) < minRooms) return false;
      return true;
    });

    switch (sort) {
      case "price_asc":  list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "price_desc": list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case "area_desc":  list = [...list].sort((a, b) => (b.land_area || 0) - (a.land_area || 0)); break;
    }
    return list;
  }, [properties, query, offerType, category, city, priceRange, minRooms, sort]);

  const hasFilters = offerType !== "الكل" || category !== "الكل" || city || priceRange !== 0 || minRooms > 0;

  function clearFilters() {
    setOfferType("الكل"); setCategory("الكل"); setCity("");
    setPriceRange(0); setMinRooms(0);
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0A0A0C", color: "#F5F5F5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700&display=swap');
        * { font-family: 'Tajawal', sans-serif; }
        .font-cairo { font-family: 'Cairo', sans-serif; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        input[type=range]::-webkit-slider-thumb { background:#C6914C; }
        input[type=range]::-webkit-slider-runnable-track { background:rgba(198,145,76,0.2); }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(10,10,12,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(198,145,76,0.1)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg,#C6914C,#8A5F2E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 900, color: "#0A0A0C", fontFamily: "Cairo,sans-serif",
          }}>و</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F5", lineHeight: 1.2 }}>{brokerName}</p>
            <p style={{ fontSize: 10, color: "#C6914C" }}>البحث عن عقار</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/mortgage" style={{ fontSize: 12, color: "#5A5A62", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.08)" }}>
            <Calculator size={13} /> حاسبة التمويل
          </Link>
          <Link href="/dashboard" style={{ fontSize: 12, color: "#5A5A62", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.08)" }}>
            لوحة التحكم
          </Link>
        </div>
      </header>

      {/* ── Hero Search ── */}
      <div style={{
        background: "linear-gradient(180deg, #1A1208 0%, #0A0A0C 100%)",
        padding: "48px 24px 36px",
        borderBottom: "1px solid rgba(198,145,76,0.08)",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 className="font-cairo" style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, textAlign: "center", marginBottom: 8, lineHeight: 1.3 }}>
            ابحث عن عقارك المثالي
          </h1>
          <p style={{ fontSize: 14, color: "#5A5A62", textAlign: "center", marginBottom: 24 }}>
            {properties.length} عقار متاح — فلتر وابحث بسهولة
          </p>

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={18} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#5A5A62" }} />
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الحي أو المدينة..."
              style={{
                width: "100%", background: "#16161A",
                border: "1px solid rgba(198,145,76,0.2)",
                borderRadius: 14, padding: "14px 50px 14px 16px",
                fontSize: 14, color: "#F5F5F5", outline: "none",
                boxSizing: "border-box",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5A5A62", cursor: "pointer" }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Offer type tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {OFFER_TYPES.map(t => (
              <button key={t} onClick={() => setOfferType(t)}
                style={{
                  padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: offerType === t ? "#C6914C" : "rgba(198,145,76,0.06)",
                  color: offerType === t ? "#0A0A0C" : "#9A9AA0",
                  border: "1px solid " + (offerType === t ? "#C6914C" : "rgba(198,145,76,0.12)"),
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 60px", display: "grid", gridTemplateColumns: showFilters ? "260px 1fr" : "1fr", gap: 24, alignItems: "start" }}>

        {/* Sidebar filters — desktop */}
        {showFilters && (
          <aside style={{ position: "sticky", top: 76 }}>
            <div className="rounded-2xl p-5 space-y-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>الفلاتر</h3>
                {hasFilters && (
                  <button onClick={clearFilters} style={{ fontSize: 11, color: "#F87171", background: "none", border: "none", cursor: "pointer" }}>مسح الكل</button>
                )}
              </div>

              {/* Category */}
              <div>
                <p style={{ fontSize: 11, color: "#5A5A62", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>التصنيف</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      style={{
                        textAlign: "right", padding: "8px 12px", borderRadius: 10, fontSize: 13,
                        background: category === c ? "rgba(198,145,76,0.12)" : "transparent",
                        color: category === c ? "#C6914C" : "#9A9AA0",
                        border: "1px solid " + (category === c ? "rgba(198,145,76,0.3)" : "transparent"),
                        cursor: "pointer", fontWeight: category === c ? 600 : 400,
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <p style={{ fontSize: 11, color: "#5A5A62", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>المدينة</p>
                <select value={city} onChange={e => setCity(e.target.value)}
                  style={{ width: "100%", background: "#1C1C22", border: "1px solid rgba(198,145,76,0.15)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#F5F5F5", outline: "none" }}>
                  <option value="">جميع المدن</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Price range */}
              <div>
                <p style={{ fontSize: 11, color: "#5A5A62", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>نطاق السعر</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {PRICE_RANGES.map((r, i) => (
                    <button key={i} onClick={() => setPriceRange(i)}
                      style={{
                        textAlign: "right", padding: "8px 12px", borderRadius: 10, fontSize: 12,
                        background: priceRange === i ? "rgba(198,145,76,0.12)" : "transparent",
                        color: priceRange === i ? "#C6914C" : "#9A9AA0",
                        border: "1px solid " + (priceRange === i ? "rgba(198,145,76,0.3)" : "transparent"),
                        cursor: "pointer", fontWeight: priceRange === i ? 600 : 400,
                      }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rooms */}
              <div>
                <p style={{ fontSize: 11, color: "#5A5A62", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>الغرف (الحد الأدنى)</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setMinRooms(n)}
                      style={{
                        width: 36, height: 36, borderRadius: 10, fontSize: 13,
                        background: minRooms === n ? "rgba(198,145,76,0.15)" : "#1C1C22",
                        color: minRooms === n ? "#C6914C" : "#5A5A62",
                        border: "1px solid " + (minRooms === n ? "rgba(198,145,76,0.4)" : "rgba(198,145,76,0.08)"),
                        cursor: "pointer", fontWeight: 700,
                      }}>
                      {n === 0 ? "الكل" : n + "+"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Results */}
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setShowFilters(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                  background: showFilters ? "rgba(198,145,76,0.12)" : "#16161A",
                  color: showFilters ? "#C6914C" : "#9A9AA0",
                  border: "1px solid " + (showFilters ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.1)"),
                  cursor: "pointer",
                }}>
                <SlidersHorizontal size={14} />
                فلاتر
                {hasFilters && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C6914C", display: "inline-block" }} />}
              </button>

              {hasFilters && (
                <button onClick={clearFilters}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#F87171", background: "none", border: "none", cursor: "pointer" }}>
                  <X size={12} /> مسح الفلاتر
                </button>
              )}

              <p style={{ fontSize: 13, color: "#5A5A62" }}>
                {filtered.length} نتيجة
              </p>
            </div>

            {/* Sort */}
            <div style={{ position: "relative" }}>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{
                  appearance: "none", background: "#16161A",
                  border: "1px solid rgba(198,145,76,0.1)",
                  borderRadius: 12, padding: "9px 36px 9px 14px",
                  fontSize: 13, color: "#9A9AA0", outline: "none", cursor: "pointer",
                }}>
                {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <ArrowUpDown size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#5A5A62", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Active filter tags */}
          {hasFilters && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {offerType !== "الكل" && (
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(198,145,76,0.1)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                  {offerType} <button onClick={() => setOfferType("الكل")} style={{ background: "none", border: "none", color: "#C6914C", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              )}
              {category !== "الكل" && (
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(198,145,76,0.1)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                  {category} <button onClick={() => setCategory("الكل")} style={{ background: "none", border: "none", color: "#C6914C", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              )}
              {city && (
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(198,145,76,0.1)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                  {city} <button onClick={() => setCity("")} style={{ background: "none", border: "none", color: "#C6914C", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              )}
              {priceRange !== 0 && (
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(198,145,76,0.1)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                  {PRICE_RANGES[priceRange].label} <button onClick={() => setPriceRange(0)} style={{ background: "none", border: "none", color: "#C6914C", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              )}
              {minRooms > 0 && (
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(198,145,76,0.1)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                  {minRooms}+ غرف <button onClick={() => setMinRooms(0)} style={{ background: "none", border: "none", color: "#C6914C", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 340, borderRadius: 16, background: "#16161A", animation: "pulse 2s infinite" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <Home size={48} style={{ color: "rgba(198,145,76,0.2)", margin: "0 auto 16px", display: "block" }} />
              <p style={{ fontSize: 16, color: "#5A5A62", marginBottom: 8 }}>لا توجد نتائج</p>
              <p style={{ fontSize: 13, color: "#3A3A44" }}>جرّب تغيير الفلاتر أو البحث بكلمات مختلفة</p>
              {hasFilters && (
                <button onClick={clearFilters} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12, background: "rgba(198,145,76,0.1)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  مسح الفلاتر
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {filtered.map(p => <PropertyCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
