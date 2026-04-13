"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";
import SARIcon from "../../components/SARIcon";

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
    toast.success("تمت إضافة الصفقة بنجاح");
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

  const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]";

  const filtered = deals.filter(d => d.title?.includes(search));

  if (loading) return (
    <div dir="rtl" className="p-4">
      <div className="skeleton h-8 rounded w-36 mb-6" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-xl mb-3" />
      ))}
    </div>
  );

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الصفقات" }]} />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">الصفقات</h2>
          <p className="text-sm" style={{ color:'#5A5A62' }}>تتبع صفقاتك العقارية ومراحلها</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-sm"
          style={{ background: showAdd ? '#1C1C22' : 'linear-gradient(135deg, #C6914C, #A6743A)', color: showAdd ? '#9A9AA0' : '#0A0A0C', border: showAdd ? '1px solid rgba(198,145,76,0.15)' : 'none' }}
        >
          {showAdd ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> صفقة جديدة</>}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 mb-6">
          <h3 className="font-bold mb-4" style={{ color:'#C6914C', fontSize:13, letterSpacing:1, textTransform:'uppercase' }}>صفقة جديدة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">عنوان الصفقة *</label>
              <input name="title" value={form.title} onChange={handleChange} required className={inp} style={{ color:'#F5F5F5' }} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">نوع الصفقة</label>
              <select name="deal_type" value={form.deal_type} onChange={handleChange} className={inp} style={{ color:'#F5F5F5' }}>
                <option value="">اختر...</option>
                <option>بيع</option>
                <option>إيجار</option>
                <option>استثمار</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">المرحلة</label>
              <select name="current_stage" value={form.current_stage} onChange={handleChange} className={inp} style={{ color:'#F5F5F5' }}>
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
              <select name="property_id" value={form.property_id} onChange={handleChange} className={inp} style={{ color:'#F5F5F5' }}>
                <option value="">اختر...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الأولوية</label>
              <select name="priority" value={form.priority} onChange={handleChange} className={inp} style={{ color:'#F5F5F5' }}>
                <option value="">اختر...</option>
                <option>منخفض</option>
                <option>متوسط</option>
                <option>مرتفع</option>
                <option>عاجل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">قيمة الصفقة (ريال)</label>
              <input name="target_value" value={form.target_value} onChange={handleChange} type="number" className={inp} style={{ color:'#F5F5F5' }} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">العمولة المتوقعة (ريال)</label>
              <input name="expected_commission" value={form.expected_commission} onChange={handleChange} type="number" className={inp} style={{ color:'#F5F5F5' }} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">تاريخ الإغلاق المتوقع</label>
              <input name="expected_close_date" value={form.expected_close_date} onChange={handleChange} type="date" className={inp} style={{ color:'#F5F5F5' }} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الإجراء التالي</label>
              <input name="next_action" value={form.next_action} onChange={handleChange} className={inp} style={{ color:'#F5F5F5' }} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">ملخص</label>
              <textarea name="summary" value={form.summary} onChange={handleChange} rows={2} className={inp} style={{ color:'#F5F5F5' }} />
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
        <input type="text" placeholder="ابحث عن صفقة..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" style={{ color:'#F5F5F5' }} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg mb-4" style={{ color:'#9A9AA0' }}>لا توجد صفقات بعد</p>
          <button onClick={() => setShowAdd(true)} className="px-6 py-3 rounded-xl font-bold text-sm text-[#0A0A0C]" style={{ background:'linear-gradient(135deg, #C6914C, #A6743A)' }}>
            أضف أول صفقة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <span className="text-green-400 font-bold text-sm flex items-center gap-1">
                  {deal.target_value ? <>{deal.target_value.toLocaleString()} <SARIcon size={12} color="accent" /></> : "—"}
                </span>
                <span className="text-xs text-[#5A5A62]">{deal.priority}</span>
              </div>
              {deal.next_action && <p className="text-[#9A9AA0] text-xs mt-2">{deal.next_action}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
