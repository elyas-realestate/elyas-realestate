"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Search, MapPin, Bed, Maximize2, SlidersHorizontal } from "lucide-react";
import SARIcon from "../components/SARIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const aliases: Record<string, string[]> = {
  "شقة": ["شقه", "شقت", "شقا"],
  "فيلا": ["فلة", "فله", "فيله", "فيلات"],
  "أرض": ["ارض", "ارضي", "أرضي"],
  "مكتب": ["مكتبه", "مكاتب"],
  "مستودع": ["مستودعات", "مخزن"],
  "عمارة": ["عماره", "عماير"],
  "استراحة": ["استراحه", "استراحات"],
};

function smartMatch(text: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const t = text?.toLowerCase() || "";
  if (t.includes(q)) return true;
  for (const [main, alts] of Object.entries(aliases)) {
    if (alts.includes(q) || q === main) {
      if (t.includes(main) || alts.some(a => t.includes(a))) return true;
    }
  }
  return false;
}

const offerFilters = [
  { label: "الكل", value: "" },
  { label: "للبيع", value: "بيع" },
  { label: "للإيجار", value: "إيجار" },
];

const categoryFilters = [
  { label: "الكل", value: "" },
  { label: "سكني", value: "سكني" },
  { label: "تجاري", value: "تجاري" },
  { label: "صناعي", value: "صناعي" },
  { label: "زراعي", value: "زراعي" },
];

export default function PublicProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [offerFilter, setOfferFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    supabase
      .from("properties")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProperties(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = properties.filter(p => {
    const matchSearch = !search ||
      smartMatch(p.title, search) ||
      smartMatch(p.district, search) ||
      smartMatch(p.sub_category, search);
    const matchOffer = !offerFilter || p.offer_type === offerFilter;
    const matchCat = !catFilter || p.main_category === catFilter;
    return matchSearch && matchOffer && matchCat;
  });

  return (
    <div dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>

      {/* ═══ HERO SEARCH ═══ */}
      <div style={{ background: "linear-gradient(180deg, #111114 0%, #0A0A0C 100%)", padding: "64px 48px 48px", borderBottom: "1px solid rgba(198,145,76,0.1)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div className="accent inline-flex items-center gap-2" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.15)", borderRadius: 100, padding: "6px 18px", marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, background: "#C6914C", borderRadius: "50%", display: "inline-block" }}></span>
            كل العقارات المتاحة
          </div>
          <h1 className="font-kufi font-black" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.3, marginBottom: 12, color: "#F5F5F5" }}>
            ابحث عن عقارك المثالي
          </h1>
          <p style={{ fontSize: 15, color: "#9A9AA0", marginBottom: 32, lineHeight: 1.7 }}>
            عقارات مختارة بعناية — سكنية وتجارية في أفضل أحياء الرياض
          </p>

          {/* Search Bar */}
          <div style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.15)", borderRadius: 16, padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "4px 12px" }}>
              <Search size={18} style={{ color: "#5A5A62", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="ابحث باسم العقار أو الحي أو النوع..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#F5F5F5", fontFamily: "'Tajawal', sans-serif" }}
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: showFilters ? "rgba(198,145,76,0.12)" : "#1C1C22", border: "1px solid " + (showFilters ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.08)"), color: showFilters ? "#C6914C" : "#9A9AA0", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.3s", fontFamily: "'Tajawal', sans-serif" }}
            >
              <SlidersHorizontal size={15} />
              فلترة
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {offerFilters.map(f => (
                  <button key={f.value} onClick={() => setOfferFilter(f.value)}
                    style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.25s", fontFamily: "'Tajawal', sans-serif", background: offerFilter === f.value ? "rgba(198,145,76,0.15)" : "#1C1C22", color: offerFilter === f.value ? "#C6914C" : "#9A9AA0", border: "1px solid " + (offerFilter === f.value ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.08)") }}
                  >{f.label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {categoryFilters.map(f => (
                  <button key={f.value} onClick={() => setCatFilter(f.value)}
                    style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.25s", fontFamily: "'Tajawal', sans-serif", background: catFilter === f.value ? "rgba(198,145,76,0.15)" : "#1C1C22", color: catFilter === f.value ? "#C6914C" : "#9A9AA0", border: "1px solid " + (catFilter === f.value ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.08)") }}
                  >{f.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ RESULTS ═══ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px" }}>

        {/* Count + active filters */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {loading ? (
              <span style={{ fontSize: 14, color: "#5A5A62" }}>جاري التحميل...</span>
            ) : (
              <>
                <span className="font-kufi" style={{ fontSize: 22, fontWeight: 800, color: "#C6914C" }}>{filtered.length}</span>
                <span style={{ fontSize: 14, color: "#9A9AA0" }}>عقار متاح</span>
              </>
            )}
          </div>
          {(offerFilter || catFilter || search) && (
            <button onClick={() => { setOfferFilter(""); setCatFilter(""); setSearch(""); }}
              style={{ fontSize: 12, color: "#5A5A62", background: "none", border: "none", cursor: "pointer", fontFamily: "'Tajawal', sans-serif", textDecoration: "underline" }}>
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ background: "#16161A", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(198,145,76,0.08)" }}>
                <div style={{ height: 220, background: "#1C1C22", animation: "pulse 1.5s infinite" }}></div>
                <div style={{ padding: 20 }}>
                  <div style={{ height: 16, background: "#1C1C22", borderRadius: 8, marginBottom: 10 }}></div>
                  <div style={{ height: 12, background: "#1C1C22", borderRadius: 6, width: "60%" }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p className="font-kufi" style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 8 }}>لا توجد عقارات مطابقة</p>
            <p style={{ fontSize: 14, color: "#5A5A62" }}>جرّب تغيير الفلاتر أو كلمة البحث</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {filtered.map(p => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({ p }: { p: any }) {
  const img = p.images?.[0] || p.main_image || "";
  const price = p.price ? Number(p.price).toLocaleString("ar-SA") : null;

  return (
    <Link href={"/properties/" + p.id} style={{ textDecoration: "none", display: "block" }}>
      <div className="prop-card" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", borderRadius: 16, overflow: "hidden", transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", cursor: "pointer" }}>
        <style>{`.prop-card:hover { border-color: rgba(198,145,76,0.35); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.35); } .prop-card:hover .prop-img { transform: scale(1.06); }`}</style>

        {/* Image */}
        <div style={{ position: "relative", height: 220, overflow: "hidden", background: "#1C1C22" }}>
          {img ? (
            <img src={img} alt={p.title} className="prop-img" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#2A2A32" }}>🏠</div>
          )}
          {/* Offer badge */}
          <div style={{ position: "absolute", top: 14, right: 14 }}>
            <span style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)", color: "#0A0A0C", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8, fontFamily: "'Tajawal', sans-serif" }}>
              {p.offer_type === "بيع" ? "للبيع" : p.offer_type === "إيجار" ? "للإيجار" : p.offer_type || "متاح"}
            </span>
          </div>
          {/* Category badge */}
          {p.sub_category && (
            <div style={{ position: "absolute", top: 14, left: 14 }}>
              <span style={{ background: "rgba(10,10,12,0.8)", color: "#9A9AA0", fontSize: 11, padding: "5px 10px", borderRadius: 8, backdropFilter: "blur(8px)", fontFamily: "'Tajawal', sans-serif" }}>
                {p.sub_category}
              </span>
            </div>
          )}
          {/* Gradient overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(22,22,26,1), transparent)" }}></div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 20px 22px" }}>
          <h3 className="font-kufi" style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F5", marginBottom: 8, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {p.title}
          </h3>

          {/* Location */}
          {(p.district || p.city) && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14, color: "#9A9AA0" }}>
              <MapPin size={13} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{[p.district, p.city].filter(Boolean).join("، ")}</span>
            </div>
          )}

          {/* Specs */}
          {(p.rooms || p.land_area || p.built_area) && (
            <div style={{ display: "flex", gap: 16, paddingTop: 14, paddingBottom: 14, borderTop: "1px solid rgba(198,145,76,0.08)", borderBottom: "1px solid rgba(198,145,76,0.08)", marginBottom: 14 }}>
              {p.rooms && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#5A5A62", fontSize: 12 }}>
                  <Bed size={13} />
                  <span>{p.rooms} غرف</span>
                </div>
              )}
              {p.land_area && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#5A5A62", fontSize: 12 }}>
                  <Maximize2 size={12} />
                  <span>{p.land_area} م²</span>
                </div>
              )}
              {p.built_area && !p.land_area && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#5A5A62", fontSize: 12 }}>
                  <Maximize2 size={12} />
                  <span>{p.built_area} م² مبني</span>
                </div>
              )}
            </div>
          )}

          {/* Price */}
          {price ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="font-kufi" style={{ fontSize: 20, fontWeight: 800, color: "#C6914C" }}>{price}</span>
              <SARIcon size={14} color="muted" />
            </div>
          ) : (
            <span style={{ fontSize: 13, color: "#5A5A62" }}>السعر عند التواصل</span>
          )}
        </div>
      </div>
    </Link>
  );
}
