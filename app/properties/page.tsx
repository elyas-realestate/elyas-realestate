"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Search, MapPin, Bed } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// smart search aliases
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

const filters = [
  { label: "الكل", value: "" },
  { label: "للبيع", value: "بيع" },
  { label: "للإيجار", value: "إيجار" },
];

export default function PublicProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  useEffect(() => { loadProperties(); }, []);

  async function loadProperties() {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  }

  const filtered = properties.filter(p => {
    const matchSearch = !search || smartMatch(p.title, search) || smartMatch(p.district, search) || smartMatch(p.sub_category, search);
    const matchCat = !category || p.main_category === category;
    const matchFilter = !activeFilter || p.offer_type === activeFilter;
    return matchSearch && matchCat && matchFilter;
  });

  return (
    <div>
      <div className="bg-gray-900 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">{"ابحث عن عقارك المثالي"}</h2>
          <div className="flex flex-wrap gap-3 bg-gray-800 p-3 rounded-xl">
            <input type="text" placeholder="ابحث باسم العقار أو الحي أو نوع العقار..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-48 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
            <select value={category} onChange={e => setCategory(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm">
              <option value="">{"التصنيف (الكل)"}</option>
              <option value="سكني">{"سكني"}</option>
              <option value="تجاري">{"تجاري"}</option>
              <option value="صناعي">{"صناعي"}</option>
              <option value="زراعي">{"زراعي"}</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition text-sm">
              <Search size={16} />
              {"بحث"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {filters.map(f => (
            <button key={f.value} onClick={() => setActiveFilter(f.value)}
              className={"px-5 py-2 rounded-lg text-sm font-medium transition " + (activeFilter === f.value ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-300 hover:text-white")}
            >
              {f.label}
            </button>
          ))}
          <span className="text-gray-400 text-sm mr-auto">{filtered.length + " عقار"}</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">{"جاري التحميل..."}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{"لا توجد عقارات متاحة حالياً"}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <Link href={"/properties/" + p.id} key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500 transition group">
                <div className="relative h-48 bg-gray-800">
                  {p.main_image
                    ? <img src={p.main_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">{"لا توجد صورة"}</div>
                  }
                  <div className="absolute top-3 right-3">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">{p.offer_type}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-2 line-clamp-1">{p.title}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                    <MapPin size={13} />
                    <span>{p.district} — {p.city}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 text-xs mb-3">
                    {p.rooms && <span className="flex items-center gap-1"><Bed size={12} />{p.rooms + " غرف"}</span>}
                    {p.land_area && <span>{p.land_area + " م²"}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-bold">{p.price?.toLocaleString() + " ريال"}</span>
                    <span className="text-gray-500 text-xs">{p.sub_category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}