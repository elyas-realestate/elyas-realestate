"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search, MapPin, Phone } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  }

  const filtered = properties.filter(
    (p) =>
      p.title?.includes(search) ||
      p.district?.includes(search) ||
      p.code?.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* الشريط العلوي */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white">
            → لوحة التحكم
          </Link>
          <h1 className="text-xl font-bold">العقارات</h1>
        </div>
        <Link
          href="/dashboard/properties/add"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={18} />
          إضافة عقار
        </Link>
      </header>

      <main className="p-8">
        {/* البحث */}
        <div className="relative mb-8 max-w-md">
          <Search
            size={18}
            className="absolute right-3 top-3 text-gray-400"
          />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الحي أو الرمز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* القائمة */}
        {loading ? (
          <p className="text-gray-400">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">لا توجد عقارات بعد</p>
            <Link
              href="/dashboard/properties/add"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg inline-flex items-center gap-2 transition"
            >
              <Plus size={18} />
              أضف أول عقار
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((property) => (
              <Link
                href={`/dashboard/properties/${property.id}`}
                key={property.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500 transition"
              >
                {/* صورة */}
                <div className="h-48 bg-gray-800 flex items-center justify-center">
                  {property.main_image ? (
                    <img
                      src={property.main_image}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <p className="text-gray-600">لا توجد صورة</p>
                  )}
                </div>

                {/* المعلومات */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                      {property.code}
                    </span>
                    <span className="text-xs text-gray-400">
                      {property.offer_type}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                    <MapPin size={14} />
                    <span>
                      {property.district} — {property.city}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-bold">
                      {property.price?.toLocaleString()} ريال
                    </span>
                    <span className="text-xs text-gray-500">
                      {property.main_category} / {property.sub_category}
                    </span>
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