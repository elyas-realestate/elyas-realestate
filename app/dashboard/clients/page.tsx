"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", category: "", city: "", district: "", notes: "",
  });

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  function handleChange(e: any) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    await supabase.from("clients").insert([{ ...form }]);
    setForm({ full_name: "", phone: "", category: "", city: "", district: "", notes: "" });
    setShowAdd(false);
    loadClients();
  }

  const filtered = clients.filter(c =>
    c.full_name?.includes(search) || c.phone?.includes(search) || c.code?.includes(search)
  );

  const categoryColor: any = {
    "مالك": "bg-[rgba(201,168,76,0.1)] text-[#C9A84C]",
    "مشتري": "bg-green-900/30 text-green-400",
    "مستأجر": "bg-yellow-900/30 text-yellow-400",
    "مستثمر": "bg-purple-900/30 text-purple-400",
    "وسيط عقاري": "bg-red-900/30 text-red-400",
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">جاري التحميل...</div>;

  return (
    <div  dir="rtl">
      
      <main className="p-8">
        {showAdd && (
          <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الاسم الكامل *</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">رقم الجوال</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الفئة *</label>
              <select name="category" value={form.category} onChange={handleChange} required className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]">
                <option value="">اختر...</option>
                <option>مالك</option>
                <option>مشتري</option>
                <option>مستأجر</option>
                <option>مستثمر</option>
                <option>وسيط عقاري</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">المدينة</label>
              <input name="city" value={form.city} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">ملاحظات</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div className="col-span-2 flex gap-4">
              <button type="submit" className="bg-[#C9A84C] hover:bg-[#A68A3A] px-6 py-2 rounded-lg transition">حفظ</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition">إلغاء</button>
            </div>
          </form>
        )}
        <div className="relative mb-6 max-w-md">
          <Search size={18} className="absolute right-3 top-3 text-[#9A9AA0]" />
          <input type="text" placeholder="ابحث باسم العميل أو الجوال..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-lg pr-10 pl-4 py-3 focus:outline-none focus:border-[#C9A84C]" />
        </div>
        {filtered.length === 0 ? (
          <p className="text-[#9A9AA0] text-center py-20">لا يوجد عملاء بعد</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(client => (
              <div key={client.id} className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-5 hover:border-[#C9A84C] transition">
                <div className="flex items-center justify-between mb-3">
                  <span className={"text-xs px-2 py-1 rounded " + (categoryColor[client.category] || "bg-[#1C1C22] text-[#9A9AA0]")}>
                    {client.category}
                  </span>
                  <span className="text-xs text-[#5A5A62]">{client.code}</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{client.full_name}</h3>
                <p className="text-[#9A9AA0] text-sm">{client.phone}</p>
                <p className="text-[#5A5A62] text-sm">{client.city}</p>
                {client.notes && <p className="text-[#5A5A62] text-xs mt-2">{client.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}