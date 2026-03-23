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
  const [clients, setClients] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", deal_type: "", property_id: "", buyer_id: "",
    seller_id: "", current_stage: "", target_value: "", expected_commission: "",
    priority: "", summary: "", next_action: "", expected_close_date: "",
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [d, c, p] = await Promise.all([
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, full_name, category"),
      supabase.from("properties").select("id, title, code"),
    ]);
    setDeals(d.data || []);
    setClients(c.data || []);
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
      buyer_id: form.buyer_id || null,
      seller_id: form.seller_id || null,
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
    "استفسار": "bg-gray-800 text-gray-400",
    "معاينة": "bg-blue-900/30 text-blue-400",
    "تفاوض": "bg-yellow-900/30 text-yellow-400",
    "توقيع": "bg-purple-900/30 text-purple-400",
    "مكتملة": "bg-green-900/30 text-green-400",
    "ملغاة": "bg-red-900/30 text-red-400",
  };

  const filtered = deals.filter(d =>
    d.title?.includes(search) || d.code?.includes(search)
  );

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white">back</Link>
          <h1 className="text-xl font-bold">Deals</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <Plus size={18} />
          Add
        </button>
      </header>

      <main className="p-8">
        {showAdd && (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <select name="deal_type" value={form.deal_type} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option>بيع</option>
                <option>إيجار</option>
                <option>استثمار</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Stage</label>
              <select name="current_stage" value={form.current_stage} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option>استفسار</option>
                <option>معاينة</option>
                <option>تفاوض</option>
                <option>توقيع</option>
                <option>مكتملة</option>
                <option>ملغاة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Property</label>
              <select name="property_id" value={form.property_id} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option>منخفض</option>
                <option>متوسط</option>
                <option>مرتفع</option>
                <option>عاجل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Value (SAR)</label>
              <input name="target_value" value={form.target_value} onChange={handleChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Commission (SAR)</label>
              <input name="expected_commission" value={form.expected_commission} onChange={handleChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Close Date</label>
              <input name="expected_close_date" value={form.expected_close_date} onChange={handleChange} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Next Action</label>
              <input name="next_action" value={form.next_action} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Summary</label>
              <textarea name="summary" value={form.summary} onChange={handleChange} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2 flex gap-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition">Cancel</button>
            </div>
          </form>
        )}

        <div className="relative mb-6 max-w-md">
          <Search size={18} className="absolute right-3 top-3 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg pr-10 pl-4 py-3 focus:outline-none focus:border-blue-500" />
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-20">No deals yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(deal => (
              <div key={deal.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className={"text-xs px-2 py-1 rounded " + (stageColor[deal.current_stage] || "bg-gray-800 text-gray-400")}>
                    {deal.current_stage || "No stage"}
                  </span>
                  <span className="text-xs text-gray-500">{deal.code}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{deal.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold text-sm">
                    {deal.target_value ? deal.target_value.toLocaleString() + " SAR" : "-"}
                  </span>
                  <span className="text-xs text-gray-500">{deal.priority}</span>
                </div>
                {deal.next_action && <p className="text-gray-400 text-xs mt-2">{deal.next_action}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}