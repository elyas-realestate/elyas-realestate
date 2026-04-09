"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";

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
    const { error } = await supabase.from("clients").insert([{ ...form }]);
    if (error) { toast.error("حدث خطأ أثناء الإضافة"); return; }
    toast.success("تمت إضافة العميل بنجاح");
    setForm({ full_name: "", phone: "", category: "", city: "", district: "", notes: "" });
    setShowAdd(false);
    loadClients();
  }

  const filtered = clients.filter(c =>
    c.full_name?.includes(search) || c.phone?.includes(search) || c.code?.includes(search)
  );

  const categoryColor: any = {
    "مالك": "bg-[rgba(198,145,76,0.1)] text-[#C6914C]",
    "مشتري": "bg-green-900/30 text-green-400",
    "مستأجر": "bg-yellow-900/30 text-yellow-400",
    "مستثمر": "bg-purple-900/30 text-purple-400",
    "وسيط عقاري": "bg-red-900/30 text-red-400",
  };

  if (loading) return (
    <div dir="rtl" className="p-4">
      <div className="skeleton h-8 rounded w-40 mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-16 rounded-xl mb-3" />
      ))}
    </div>
  );

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "العملاء" }]} />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">العملاء</h2>
          <p className="text-sm" style={{ color:'#5A5A62' }}>إدارة قائمة عملائك</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-sm"
          style={{ background: showAdd ? '#1C1C22' : 'linear-gradient(135deg, #C6914C, #A6743A)', color: showAdd ? '#9A9AA0' : '#0A0A0C', border: showAdd ? '1px solid rgba(198,145,76,0.15)' : 'none' }}
        >
          {showAdd ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> إضافة عميل</>}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 mb-6">
          <h3 className="font-bold mb-4" style={{ color:'#C6914C', fontSize:13, letterSpacing:1, textTransform:'uppercase' }}>عميل جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الاسم الكامل *</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" style={{ color:'#F5F5F5' }} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">رقم الجوال</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" style={{ color:'#F5F5F5' }} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الفئة *</label>
              <select name="category" value={form.category} onChange={handleChange} required className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" style={{ color:'#F5F5F5' }}>
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
              <input name="city" value={form.city} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" style={{ color:'#F5F5F5' }} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">ملاحظات</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" style={{ color:'#F5F5F5' }} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="bg-[#C6914C] hover:bg-[#A6743A] px-6 py-2.5 rounded-lg font-bold transition text-sm text-[#0A0A0C]">حفظ</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2.5 rounded-lg transition text-sm" style={{ background:'#1C1C22', color:'#9A9AA0' }}>إلغاء</button>
            </div>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute right-3 top-3.5 text-[#9A9AA0]" />
        <input type="text" placeholder="ابحث باسم العميل أو الجوال..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" style={{ color:'#F5F5F5' }} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg mb-4" style={{ color:'#9A9AA0' }}>لا يوجد عملاء بعد</p>
          <button onClick={() => setShowAdd(true)} className="px-6 py-3 rounded-xl font-bold text-sm text-[#0A0A0C]" style={{ background:'linear-gradient(135deg, #C6914C, #A6743A)' }}>
            أضف أول عميل
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div key={client.id} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 hover:border-[#C6914C] transition">
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
    </div>
  );
}
