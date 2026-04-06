"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Deals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", deal_type: "", property_id: "", current_stage: "",
    target_value: "", expected_commission: "", priority: "",
    summary: "", next_action: "", expected_close_date: "",
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [d, p] = await Promise.all([
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, title"),
    ]);
    setDeals(d.data || []);
    setProperties(p.data || []);
    setLoading(false);
  }

  function handleChange(e: any) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    await supabase.from("deals").insert([{
      title: form.title,
      deal_type: form.deal_type,
      property_id: form.property_id || null,
      current_stage: form.current_stage,
      target_value: form.target_value ? Number(form.target_value) : null,
      expected_commission: form.expected_commission ? Number(form.expected_commission) : null,
      priority: form.priority,
      summary: form.summary,
      next_action: form.next_action,
      expected_close_date: form.expected_close_date || null,
    }]);
    setShowAdd(false);
    loadAll();
  }

  const stageColor: any = {
    "استفسار": "bg-[#1C1C22] text-[#9A9AA0]",
    "معاينة": "bg-[rgba(198,145,76,0.1)] text-[#C6914C]",
    "تفاوض": "bg-yellow-900/30 text-yellow-400",
    "توقيع": "bg-purple-900/30 text-purple-400",
    "مكتملة": "bg-green-900/30 text-green-400",
    "ملغاة": "bg-red-900/30 text-red-400",
  };

  const filtered = deals.filter(d => d.title?.includes(search));

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">جاري التحميل...</div>;

  return (
    <div  dir="rtl">
      
      <main className="p-8">
        {showAdd && (
          <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">عنوان الصفقة *</label>
              <input name="title" value={form.title} onChange={handleChange} required className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">نوع الصفقة</label>
              <select name="deal_type" value={form.deal_type} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]">
                <option value="">اختر...</option>
                <option>بيع</option>
                <option>إيجار</option>
                <option>استثمار</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">المرحلة</label>
              <select name="current_stage" value={form.current_stage} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]">
                <option value="">اختر...</option>
                <option>استفسار</option>
                <option>معاينة</option>
                <option>تفاوض</option>
                <option>توقيع</option>
                <option>مكتملة</option>
                <option>ملغاة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">العقار</label>
              <select name="property_id" value={form.property_id} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]">
                <option value="">اختر...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الأولوية</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]">
                <option value="">اختر...</option>
                <option>منخفض</option>
                <option>متوسط</option>
                <option>مرتفع</option>
                <option>عاجل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">قيمة الصفقة (ريال)</label>
              <input name="target_value" value={form.target_value} onChange={handleChange} type="number" className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">العمولة المتوقعة (ريال)</label>
              <input name="expected_commission" value={form.expected_commission} onChange={handleChange} type="number" className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">تاريخ الإغلاق المتوقع</label>
              <input name="expected_close_date" value={form.expected_close_date} onChange={handleChange} type="date" className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الإجراء التالي</label>
              <input name="next_action" value={form.next_action} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">ملخص</label>
              <textarea name="summary" value={form.summary} onChange={handleChange} rows={2} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C6914C]" />
            </div>
            <div className="col-span-2 flex gap-4">
              <button type="submit" className="bg-[#C6914C] hover:bg-[#A6743A] px-6 py-2 rounded-lg transition">حفظ</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition">إلغاء</button>
            </div>
          </form>
        )}
        <div className="relative mb-6 max-w-md">
          <Search size={18} className="absolute right-3 top-3 text-[#9A9AA0]" />
          <input type="text" placeholder="ابحث عن صفقة..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg pr-10 pl-4 py-3 focus:outline-none focus:border-[#C6914C]" />
        </div>
        {filtered.length === 0 ? (
          <p className="text-[#9A9AA0] text-center py-20">لا توجد صفقات بعد</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(deal => (
              <div key={deal.id} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 hover:border-[#C6914C] transition">
                <div className="flex items-center justify-between mb-3">
                  <span className={"text-xs px-2 py-1 rounded " + (stageColor[deal.current_stage] || "bg-[#1C1C22] text-[#9A9AA0]")}>
                    {deal.current_stage || "بدون مرحلة"}
                  </span>
                  <span className="text-xs text-[#5A5A62]">{deal.code}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{deal.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold text-sm">
                    {deal.target_value ? deal.target_value.toLocaleString() + " ريال" : "-"}
                  </span>
                  <span className="text-xs text-[#5A5A62]">{deal.priority}</span>
                </div>
                {deal.next_action && <p className="text-[#9A9AA0] text-xs mt-2">{deal.next_action}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}