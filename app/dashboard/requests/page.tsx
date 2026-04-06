"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { FileText, Plus, Search, Filter, Eye, Pencil, Trash2, X, Save, Check, Clock, AlertCircle, CheckCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const requestTypes = ["شراء", "إيجار", "بيع", "استثمار", "أخرى"];
const mainCategories = ["سكني", "تجاري", "أرض"];
const subCategories: Record<string, string[]> = {
  "سكني": ["شقة", "فيلا", "دوبلكس", "تاون هاوس", "استوديو"],
  "تجاري": ["مكتب", "محل", "معرض", "مستودع"],
  "أرض": ["سكنية", "تجارية", "زراعية"],
};
const urgencyLevels = ["عادي", "مستعجل", "عاجل جداً"];
const statusOptions = ["جديد", "قيد البحث", "تم العرض", "مكتمل", "ملغي"];
const statusColors: Record<string, string> = {
  "جديد": "bg-[rgba(198,145,76,0.1)] text-[#C6914C]",
  "قيد البحث": "bg-yellow-900/30 text-yellow-400",
  "تم العرض": "bg-purple-900/30 text-purple-400",
  "مكتمل": "bg-green-900/30 text-green-400",
  "ملغي": "bg-red-900/30 text-red-400",
};
const urgencyColors: Record<string, string> = {
  "عادي": "text-[#9A9AA0]",
  "مستعجل": "text-yellow-400",
  "عاجل جداً": "text-red-400",
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [form, setForm] = useState<any>({
    client_file_id: "", request_type: "", main_category: "", sub_category: "",
    city: "الرياض", district: "", area_min: "", area_max: "",
    budget_min: "", budget_max: "", required_features: "", urgency_level: "عادي", status: "جديد",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [reqRes, clientRes] = await Promise.all([
      supabase.from("property_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name, phone"),
    ]);
    setRequests(reqRes.data || []);
    setClients(clientRes.data || []);
    setLoading(false);
  }

  function getClientName(id: string) {
    const client = clients.find(c => c.id === id);
    return client ? client.name : "غير محدد";
  }

  function resetForm() {
    setForm({ client_file_id: "", request_type: "", main_category: "", sub_category: "", city: "الرياض", district: "", area_min: "", area_max: "", budget_min: "", budget_max: "", required_features: "", urgency_level: "عادي", status: "جديد" });
    setEditingId("");
  }

  function openEdit(req: any) {
    setForm({
      client_file_id: req.client_file_id || "",
      request_type: req.request_type || "",
      main_category: req.main_category || "",
      sub_category: req.sub_category || "",
      city: req.city || "الرياض",
      district: req.district || "",
      area_min: req.area_min || "",
      area_max: req.area_max || "",
      budget_min: req.budget_min || "",
      budget_max: req.budget_max || "",
      required_features: req.required_features || "",
      urgency_level: req.urgency_level || "عادي",
      status: req.status || "جديد",
    });
    setEditingId(req.id);
    setShowForm(true);
  }

  async function handleSave() {
    const data: any = { ...form };
    if (data.area_min) data.area_min = Number(data.area_min);
    else data.area_min = null;
    if (data.area_max) data.area_max = Number(data.area_max);
    else data.area_max = null;
    if (data.budget_min) data.budget_min = Number(data.budget_min);
    else data.budget_min = null;
    if (data.budget_max) data.budget_max = Number(data.budget_max);
    else data.budget_max = null;
    if (!data.client_file_id) data.client_file_id = null;

    if (editingId) {
      await supabase.from("property_requests").update(data).eq("id", editingId);
    } else {
      await supabase.from("property_requests").insert([data]);
    }
    setShowForm(false);
    resetForm();
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا الطلب؟")) return;
    await supabase.from("property_requests").delete().eq("id", id);
    setSelectedRequest(null);
    loadData();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("property_requests").update({ status }).eq("id", id);
    loadData();
  }

  const filtered = requests.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterType !== "all" && r.request_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const clientName = getClientName(r.client_file_id).toLowerCase();
      return clientName.includes(q) || (r.district || "").toLowerCase().includes(q) || (r.code || "").toLowerCase().includes(q) || (r.sub_category || "").toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === "جديد").length,
    searching: requests.filter(r => r.status === "قيد البحث").length,
    done: requests.filter(r => r.status === "مكتمل").length,
  };

  if (loading) return <div className="text-[#9A9AA0] text-center py-20">جاري التحميل...</div>;

  return (
    <div dir="rtl">
      {/* الهيدر */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">الطلبات العقارية</h2>
          <p className="text-[#9A9AA0] text-sm">إدارة طلبات العملاء — بحث، تصفية، ومتابعة الحالة</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-[#C6914C] hover:bg-[#A6743A] px-5 py-3 rounded-xl font-bold transition">
          <Plus size={18} /> طلب جديد
        </button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "إجمالي الطلبات", value: stats.total, color: "text-[#C6914C]", icon: FileText },
          { label: "طلبات جديدة", value: stats.new, color: "text-green-400", icon: AlertCircle },
          { label: "قيد البحث", value: stats.searching, color: "text-yellow-400", icon: Clock },
          { label: "مكتملة", value: stats.done, color: "text-emerald-400", icon: CheckCircle },
        ].map((stat, i) => (
          <div key={i} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-4 flex items-center gap-4">
            <stat.icon size={24} className={stat.color} />
            <div>
              <div className={"text-2xl font-bold " + stat.color}>{stat.value}</div>
              <div className="text-[#5A5A62] text-xs">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* البحث والفلترة */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute right-3 top-3.5 text-[#5A5A62]" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث بالعميل، الحي، الكود، أو النوع..." className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
          <option value="all">كل الحالات</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
          <option value="all">كل الأنواع</option>
          {requestTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* جدول الطلبات */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#5A5A62]">
          <FileText size={48} className="mx-auto mb-4 text-[#3A3A42]" />
          <p>{requests.length === 0 ? "لا توجد طلبات بعد — أضف أول طلب" : "لا توجد نتائج مطابقة"}</p>
        </div>
      ) : (
        <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(198,145,76,0.12)] text-[#5A5A62] text-xs">
                <th className="text-right px-4 py-3 font-medium">الكود</th>
                <th className="text-right px-4 py-3 font-medium">العميل</th>
                <th className="text-right px-4 py-3 font-medium">النوع</th>
                <th className="text-right px-4 py-3 font-medium">التصنيف</th>
                <th className="text-right px-4 py-3 font-medium">الحي</th>
                <th className="text-right px-4 py-3 font-medium">الميزانية</th>
                <th className="text-right px-4 py-3 font-medium">الحالة</th>
                <th className="text-right px-4 py-3 font-medium">الأولوية</th>
                <th className="text-right px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req.id} className="border-b border-gray-800/50 hover:bg-[#1C1C22]/30 transition">
                  <td className="px-4 py-3 text-xs text-[#9A9AA0] font-mono">{req.code || "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium">{getClientName(req.client_file_id)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{req.request_type || "—"}</td>
                  <td className="px-4 py-3 text-sm text-[#9A9AA0]">{req.main_category} {req.sub_category ? "/ " + req.sub_category : ""}</td>
                  <td className="px-4 py-3 text-sm text-[#9A9AA0]">{req.district || "—"}</td>
                  <td className="px-4 py-3 text-sm text-[#9A9AA0]">
                    {req.budget_min || req.budget_max ? (
                      <span>{req.budget_min ? Number(req.budget_min).toLocaleString() : "—"} - {req.budget_max ? Number(req.budget_max).toLocaleString() : "—"}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select value={req.status || "جديد"} onChange={e => updateStatus(req.id, e.target.value)} className={"text-xs px-2 py-1 rounded-lg border-0 focus:outline-none " + (statusColors[req.status] || "bg-[#1C1C22] text-[#9A9AA0]")}>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className={"px-4 py-3 text-xs font-medium " + (urgencyColors[req.urgency_level] || "text-[#9A9AA0]")}>{req.urgency_level || "عادي"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedRequest(req)} className="text-[#5A5A62] hover:text-[#C6914C] transition"><Eye size={16} /></button>
                      <button onClick={() => openEdit(req)} className="text-[#5A5A62] hover:text-yellow-400 transition"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(req.id)} className="text-[#5A5A62] hover:text-red-400 transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* نافذة التفاصيل */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">تفاصيل الطلب</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-[#5A5A62] hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {[
                ["الكود", selectedRequest.code],
                ["العميل", getClientName(selectedRequest.client_file_id)],
                ["نوع الطلب", selectedRequest.request_type],
                ["التصنيف", selectedRequest.main_category + (selectedRequest.sub_category ? " / " + selectedRequest.sub_category : "")],
                ["المدينة", selectedRequest.city],
                ["الحي", selectedRequest.district],
                ["المساحة", (selectedRequest.area_min || "—") + " - " + (selectedRequest.area_max || "—") + " م²"],
                ["الميزانية", (selectedRequest.budget_min ? Number(selectedRequest.budget_min).toLocaleString() : "—") + " - " + (selectedRequest.budget_max ? Number(selectedRequest.budget_max).toLocaleString() : "—") + " ريال"],
                ["المميزات المطلوبة", selectedRequest.required_features],
                ["الأولوية", selectedRequest.urgency_level],
                ["الحالة", selectedRequest.status],
                ["تاريخ الإنشاء", selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString("ar-SA") : "—"],
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between items-start">
                  <span className="text-[#5A5A62] text-sm">{label}</span>
                  <span className="text-sm font-medium text-left" style={{ maxWidth: '60%' }}>{value || "—"}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { openEdit(selectedRequest); setSelectedRequest(null); }} className="flex-1 bg-[#C6914C] hover:bg-[#A6743A] py-2 rounded-lg text-sm font-bold transition">تعديل</button>
              <button onClick={() => { handleDelete(selectedRequest.id); }} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm transition">حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{editingId ? "تعديل الطلب" : "طلب جديد"}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-[#5A5A62] hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">العميل</label>
                <select value={form.client_file_id} onChange={e => setForm({ ...form, client_file_id: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
                  <option value="">بدون عميل محدد</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? "— " + c.phone : ""}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">نوع الطلب *</label>
                  <select value={form.request_type} onChange={e => setForm({ ...form, request_type: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
                    <option value="">اختر...</option>
                    {requestTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">التصنيف الرئيسي</label>
                  <select value={form.main_category} onChange={e => setForm({ ...form, main_category: e.target.value, sub_category: "" })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
                    <option value="">اختر...</option>
                    {mainCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {form.main_category && (
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">التصنيف الفرعي</label>
                  <select value={form.sub_category} onChange={e => setForm({ ...form, sub_category: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
                    <option value="">اختر...</option>
                    {(subCategories[form.main_category] || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">المدينة</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الحي</label>
                  <input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" placeholder="مثال: النرجس" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">المساحة من (م²)</label>
                  <input type="number" value={form.area_min} onChange={e => setForm({ ...form, area_min: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">المساحة إلى (م²)</label>
                  <input type="number" value={form.area_max} onChange={e => setForm({ ...form, area_max: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الميزانية من (ريال)</label>
                  <input type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الميزانية إلى (ريال)</label>
                  <input type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">المميزات المطلوبة</label>
                <textarea value={form.required_features} onChange={e => setForm({ ...form, required_features: e.target.value })} rows={3} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" placeholder="مثال: مسبح، مدخل سيارة، قريب من مدرسة..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الأولوية</label>
                  <select value={form.urgency_level} onChange={e => setForm({ ...form, urgency_level: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
                    {urgencyLevels.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الحالة</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 bg-[#C6914C] hover:bg-[#A6743A] py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                <Save size={18} /> {editingId ? "حفظ التعديلات" : "إضافة الطلب"}
              </button>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="bg-[#1C1C22] hover:bg-[#2A2A32] px-6 py-3 rounded-xl transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
