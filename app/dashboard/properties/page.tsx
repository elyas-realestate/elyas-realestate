"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search, MapPin } from "lucide-react";
import SARIcon from "../../components/SARIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProperties(); }, []);

  async function fetchProperties() {
    const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  }

  const filtered = properties.filter(p =>
    p.title?.includes(search) || p.district?.includes(search) || p.code?.includes(search)
  );

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">العقارات</h2>
        <Link href="/dashboard/properties/add" className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition no-underline text-white" style={{ background:'linear-gradient(135deg, #C6914C, #A6743A)' }}>
          <Plus size={18} />
          إضافة عقار
        </Link>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search size={18} className="absolute right-3 top-3.5" style={{ color:'#5A5A62' }} />
        <input type="text" placeholder="ابحث بالاسم أو الحي أو الرمز..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg pr-10 pl-4 py-3 focus:outline-none text-sm" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)', color:'#F5F5F5' }} />
      </div>

      {loading ? (
        <p style={{ color:'#9A9AA0' }}>جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg mb-4" style={{ color:'#9A9AA0' }}>لا توجد عقارات بعد</p>
          <Link href="/dashboard/properties/add" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg no-underline text-white font-bold transition" style={{ background:'linear-gradient(135deg, #C6914C, #A6743A)' }}>
            <Plus size={18} /> أضف أول عقار
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(property => (
            <Link href={"/dashboard/properties/" + property.id} key={property.id} className="rounded-xl overflow-hidden no-underline transition" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)', color:'#F5F5F5' }}>
              <div className="h-48 flex items-center justify-center" style={{ background:'#1C1C22' }}>
                {property.main_image ? (
                  <img src={property.main_image} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <p style={{ color:'#5A5A62' }}>لا توجد صورة</p>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-1 rounded" style={{ color:'#C6914C', background:'rgba(198,145,76,0.1)' }}>{property.code}</span>
                  <span className="text-xs" style={{ color:'#5A5A62' }}>{property.offer_type}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                <div className="flex items-center gap-1 text-sm mb-3" style={{ color:'#9A9AA0' }}>
                  <MapPin size={14} />
                  <span>{property.district} — {property.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1" style={{ color:'#C6914C' }}>{property.price?.toLocaleString()} <SARIcon size={13} color="accent" /></span>
                  <span className="text-xs" style={{ color:'#5A5A62' }}>{property.main_category} / {property.sub_category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
