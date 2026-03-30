const fs = require('fs');
const path = require('path');

const propertiesPage = `"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search, MapPin } from "lucide-react";

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
        <Link href="/dashboard/properties/add" className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition no-underline text-white" style={{ background:'linear-gradient(135deg, #C9A84C, #A68A3A)' }}>
          <Plus size={18} />
          إضافة عقار
        </Link>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search size={18} className="absolute right-3 top-3.5" style={{ color:'#5A5A62' }} />
        <input type="text" placeholder="ابحث بالاسم أو الحي أو الرمز..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg pr-10 pl-4 py-3 focus:outline-none text-sm" style={{ background:'#16161A', border:'1px solid rgba(201,168,76,0.12)', color:'#F5F5F5' }} />
      </div>

      {loading ? (
        <p style={{ color:'#9A9AA0' }}>جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg mb-4" style={{ color:'#9A9AA0' }}>لا توجد عقارات بعد</p>
          <Link href="/dashboard/properties/add" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg no-underline text-white font-bold transition" style={{ background:'linear-gradient(135deg, #C9A84C, #A68A3A)' }}>
            <Plus size={18} /> أضف أول عقار
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(property => (
            <Link href={"/dashboard/properties/" + property.id} key={property.id} className="rounded-xl overflow-hidden no-underline transition" style={{ background:'#16161A', border:'1px solid rgba(201,168,76,0.12)', color:'#F5F5F5' }}>
              <div className="h-48 flex items-center justify-center" style={{ background:'#1C1C22' }}>
                {property.main_image ? (
                  <img src={property.main_image} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <p style={{ color:'#5A5A62' }}>لا توجد صورة</p>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-1 rounded" style={{ color:'#C9A84C', background:'rgba(201,168,76,0.1)' }}>{property.code}</span>
                  <span className="text-xs" style={{ color:'#5A5A62' }}>{property.offer_type}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                <div className="flex items-center gap-1 text-sm mb-3" style={{ color:'#9A9AA0' }}>
                  <MapPin size={14} />
                  <span>{property.district} — {property.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color:'#C9A84C' }}>{property.price?.toLocaleString()} ريال</span>
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
`;

// Write properties page
fs.writeFileSync(path.join(__dirname, 'app', 'dashboard', 'properties', 'page.tsx'), propertiesPage, 'utf8');
console.log('1/4 Done: properties page updated');

// Now fix the other pages - read, fix, write
const pagesToFix = ['clients', 'deals', 'tasks'];

pagesToFix.forEach(pageName => {
  const filePath = path.join(__dirname, 'app', 'dashboard', pageName, 'page.tsx');
  if (!fs.existsSync(filePath)) {
    console.log('Skip: ' + pageName + ' (file not found)');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove the duplicate header section
  // Pattern: <header...>...</header>
  content = content.replace(/<header[\s\S]*?<\/header>/g, '');
  
  // Remove wrapper div with min-h-screen bg-gray-950
  content = content.replace(/className="min-h-screen bg-gray-950 text-white"/g, '');
  content = content.replace(/className="min-h-screen bg-gray-950 text-white text-right"/g, '');
  
  // Fix colors: blue -> gold
  content = content.replace(/bg-blue-600/g, 'bg-[#C9A84C]');
  content = content.replace(/bg-blue-700/g, 'bg-[#A68A3A]');
  content = content.replace(/hover:bg-blue-700/g, 'hover:bg-[#A68A3A]');
  content = content.replace(/hover:bg-blue-600/g, 'hover:bg-[#C9A84C]');
  content = content.replace(/text-blue-400/g, 'text-[#C9A84C]');
  content = content.replace(/text-blue-500/g, 'text-[#C9A84C]');
  content = content.replace(/bg-blue-900\/30/g, 'bg-[rgba(201,168,76,0.1)]');
  content = content.replace(/focus:border-blue-500/g, 'focus:border-[#C9A84C]');
  content = content.replace(/hover:border-blue-500/g, 'hover:border-[#C9A84C]');
  content = content.replace(/border-blue-500/g, 'border-[#C9A84C]');
  
  // Fix backgrounds
  content = content.replace(/bg-gray-900(?!\/)(?!\/)/g, 'bg-[#16161A]');
  content = content.replace(/bg-gray-800/g, 'bg-[#1C1C22]');
  content = content.replace(/border-gray-800/g, 'border-[rgba(201,168,76,0.12)]');
  content = content.replace(/border-gray-700/g, 'border-[rgba(201,168,76,0.15)]');
  content = content.replace(/text-gray-400/g, 'text-[#9A9AA0]');
  content = content.replace(/text-gray-500/g, 'text-[#5A5A62]');
  content = content.replace(/text-gray-600/g, 'text-[#5A5A62]');
  content = content.replace(/placeholder-gray-500/g, 'placeholder-[#5A5A62]');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log((pagesToFix.indexOf(pageName) + 2) + '/4 Done: ' + pageName + ' page updated');
});

// Also fix dashboard main page
const dashMainPath = path.join(__dirname, 'app', 'dashboard', 'page.tsx');
if (fs.existsSync(dashMainPath)) {
  let dashContent = fs.readFileSync(dashMainPath, 'utf8');
  
  dashContent = dashContent.replace(/bg-blue-600/g, 'bg-[#C9A84C]');
  dashContent = dashContent.replace(/bg-blue-700/g, 'bg-[#A68A3A]');
  dashContent = dashContent.replace(/hover:bg-blue-700/g, 'hover:bg-[#A68A3A]');
  dashContent = dashContent.replace(/text-blue-400/g, 'text-[#C9A84C]');
  dashContent = dashContent.replace(/text-blue-500/g, 'text-[#C9A84C]');
  dashContent = dashContent.replace(/bg-blue-900\/30/g, 'bg-[rgba(201,168,76,0.1)]');
  dashContent = dashContent.replace(/focus:border-blue-500/g, 'focus:border-[#C9A84C]');
  dashContent = dashContent.replace(/bg-gray-900(?!\/)(?!\/)/g, 'bg-[#16161A]');
  dashContent = dashContent.replace(/bg-gray-800/g, 'bg-[#1C1C22]');
  dashContent = dashContent.replace(/border-gray-800/g, 'border-[rgba(201,168,76,0.12)]');
  dashContent = dashContent.replace(/border-gray-700/g, 'border-[rgba(201,168,76,0.15)]');
  dashContent = dashContent.replace(/text-gray-400/g, 'text-[#9A9AA0]');
  dashContent = dashContent.replace(/text-gray-500/g, 'text-[#5A5A62]');
  
  fs.writeFileSync(dashMainPath, dashContent, 'utf8');
  console.log('5/5 Done: dashboard main page updated');
}

console.log('');
console.log('All dashboard pages updated with gold/dark theme!');
console.log('Restart: taskkill /f /im node.exe && npm run dev');