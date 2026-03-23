"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Search, MapPin, Phone } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PublicProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [loading, setLoading] = useState(true);

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
    const matchSearch = !search || p.title?.includes(search) || p.district?.includes(search);
    const matchType = !filterType || p.offer_type === filterType;
    const matchCat = !filterCat || p.main_category === filterCat;
    return matchSearch && matchType && matchCat;
  });

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">إلياس الدخيل</h1>
            <p className="text-gray-400 text-sm">وسيط عقاري مرخص — الرياض</p>
          </div>
          <a href="https://wa.me/966XXXXXXXXX" target="_blank" rel="noreferrer" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition">
            <Phone size={16} />
            تواصل معي
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" placeholder="ابحث عن عقار..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
            <option value="">نوع العرض</option>
            <option>بيع</option>
            <option>إيجار</option>
            <option>استثمار</option>
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
            <option value="">التصنيف</option>
            <option>سكني</option>
            <option>تجاري</option>
            <option>صناعي</option>
            <option>زراعي</option>
            <option>أرض خام</option>
          </select>
        </div>

        <p className="text-gray-400 text-sm mb-6">{filtered.length} عقار</p>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">لا توجد عقارات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <Link href={"/properties/" + p.id} key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500 transition group">
                <div className="h-48 bg-gray-800 flex items-center justify-center overflow-hidden">
                  {p.main_image
                    ? <img src={p.main_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    : <p className="text-gray-600 text-sm">لا توجد صورة</p>
                  }
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">{p.offer_type}</span>
                    <span className="text-xs text-gray-500">{p.sub_category}</span>
                  </div>
                  <h3 className="font-bold mb-2 line-clamp-1">{p.title}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                    <MapPin size={13} />
                    <span>{p.district} — {p.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-bold">{p.price?.toLocaleString()} ريال</span>
                    {p.land_area && <span className="text-gray-500 text-xs">{p.land_area} م²</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}