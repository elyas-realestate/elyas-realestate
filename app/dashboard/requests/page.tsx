"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { FileText, Plus, Search, Eye, Pencil, Trash2, X, Save, Clock, AlertCircle, CheckCircle, Sparkles, Building2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";
import SARIcon from "../../components/SARIcon";
import { formatSAR } from "@/lib/format";


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
  const [clients, setClients]   = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
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
    const [reqRes, clientRes, propRes] = await Promise.all([
      supabase.from("property_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, full_name, phone"),
      supabase.from("properties").select("id, title, main_category, sub_category, offer_type, city, district, price, land_area, rooms, is_published").eq("is_published", true),
    ]);
    setRequests(reqRes.data || []);
    setClients(clientRes.data || []);
    setProperties(propRes.data || []);
    setLoading(false);
  }

  // ── خوارزمية التطابق الذكي ──
  function matchProperties(req: any): Array<{ property: any; score: number; reasons: string[] }> {
    return properties.map(prop => {
      let score = 0;
      const reasons: string[] = [];

      // تطابق التصنيف (40 نقطة)
      if (req.main_category && prop.main_category === req.main_category) {
        score += 40; reasons.push(`تصنيف: ${prop.main_category}`);
      }
      // تطابق التصنيف الفرعي (15 نقطة إضافية)
      if (req.sub_category && prop.sub_category === req.sub_category) {
        score += 15; reasons.push(prop.sub_category);
      }
      // تطابق المدينة (20 نقطة)
      if (req.city && prop.city && prop.city === req.city) {
        score += 20; reasons.push(`مدينة: ${prop.city}`);
      }
      // تطابق الحي (10 نقطة)
      if (req.district && prop.district && prop.district === req.district) {
        score += 10; reasons.push(`حي: ${prop.district}`);
      }
      // ضمن الميزانية (25 نقطة)
      if (prop.price && (req.budget_min || req.budget_max)) {
        const inRange = (!req.budget_min || prop.price >= Number(req.budget_min)) &&
                        (!req.budget_max || prop.price <= Number(req.budget_max));
        if (inRange) { score += 25; reasons.push("ضمن الميزانية"); }
      }
      // ضمن المساحة (10 نقطة)
      if (prop.land_area && (req.area_min || req.area_max)) {
        const inRange = (!req.area_min || prop.land_area >= Number(req.area_min)) &&
                        (!req.area_max || prop.land_area <= Number(req.area_max));
        if (inRange) { score += 10; reasons.push("ضمن المساحة المطلوبة"); }
      }

      return { property: prop, score, reasons };
    })
    .filter(m => m.score >= 40)          // فقط التطابقات المعقولة
    .sort((a, b) => b.score - a.score)   // الأعلى تطابقاً أولاً
    .slice(0, 8);                        // أفضل 8 نتائج
  }

  function getClientName(id: string) {
    const client = clients.find(c => c.id === id);
    return client ? client.full_name : "غير محدد";
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
      toast.success("تم تحديث الطلب");
    } else {
      await supabase.from("property_requests").insert([data]);
      toast.success("تمت إضافة الطلب بنجاح");
    }
    setShowForm(false);
    resetForm();
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا الطلب؟")) return;
    await supabase.from("property_requests").delete().eq("id", id);
    toast.success("تم حذف الطلب");
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

  if (loading) return (
    <div dir="rtl" className="p-4">
      <div className="skeleton h-8 rounded w-36 mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-xl mb-3" />
      ))}
    </div>
  );

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الطلبات العقارية" }]} />
      {/* الهيدر */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">الطلبات العقارية</h2>
          <p className="text-[#9A9AA0] text-sm">إدارة طلبات العملاء — بحث، تصفية، ومتابعة الحالة</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-[#C6914C] hover:bg-[#A6743A] px-4 py-2.5 rounded-xl font-bold transition text-sm">
          <Plus size={16} /> طلب جديد
        </button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 relative" style={{ minWidth: 200 }}>
          <Search size={16} className="absolute right-3 top-3.5 text-[#5A5A62]" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث بالعميل، الحي، الكود..." className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C6914C]">
          <option value="all">كل الحالات</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C6914C]">
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
          <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 700 }}>
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
        </div>
      )}

      {/* نافذة التفاصيل + التطابق الذكي */}
      {selectedRequest && (() => {
        const matches = matchProperties(selectedRequest);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
            <div className="bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-2xl w-full max-h-[88vh] overflow-y-auto p-6" style={{ maxWidth: 700 }} dir="rtl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">تفاصيل الطلب</h3>
                <button onClick={() => setSelectedRequest(null)} className="text-[#5A5A62] hover:text-white"><X size={18} /></button>
              </div>

              {/* ── بيانات الطلب ── */}
              <div className="space-y-3 mb-6">
                {[
                  ["الكود", selectedRequest.code],
                  ["العميل", getClientName(selectedRequest.client_file_id)],
                  ["نوع الطلب", selectedRequest.request_type],
                  ["التصنيف", selectedRequest.main_category + (selectedRequest.sub_category ? " / " + selectedRequest.sub_category : "")],
                  ["المدينة", selectedRequest.city],
                  ["الحي", selectedRequest.district],
                  ["المساحة", (selectedRequest.area_min || "—") + " - " + (selectedRequest.area_max || "—") + " م²"],
                  ["المميزات المطلوبة", selectedRequest.required_features],
                  ["الأولوية", selectedRequest.urgency_level],
                  ["الحالة", selectedRequest.status],
                ].map(([label, value], i) => value ? (
                  <div key={i} className="flex justify-between items-start">
                    <span className="text-[#5A5A62] text-sm">{label}</span>
                    <span className="text-sm font-medium" style={{ maxWidth: "60%", textAlign: "left" }}>{value}</span>
                  </div>
                ) : null)}
                <div className="flex justify-between items-start">
                  <span className="text-[#5A5A62] text-sm">الميزانية</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    {selectedRequest.budget_min ? Number(selectedRequest.budget_min).toLocaleString() : "—"}
                    {" - "}
                    {selectedRequest.budget_max ? Number(selectedRequest.budget_max).toLocaleString() : "—"}
                    <SARIcon size={12} color="secondary" />
                  </span>
                </div>
              </div>

              {/* ── التطابق الذكي ── */}
              <div style={{ borderTop: "1px solid rgba(198,145,76,0.12)", paddingTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(198,145,76,0.1)", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={14} style={{ color: "#C6914C" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F5" }}>عقارات مقترحة</span>
                  <span style={{ fontSize: 11, color: "#5A5A62", background: "#1C1C22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 99, padding: "2px 8px" }}>
                    {matches.length > 0 ? `${matches.length} نتيجة` : "لا تطابق"}
                  </span>
                </div>

                {matches.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#3A3A42", fontSize: 13 }}>
                    <Building2 size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                    <p>لا توجد عقارات منشورة تطابق معايير هذا الطلب</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {matches.map(({ property: p, score, reasons }) => (
                      <div key={p.id} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Score ring */}
                        <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", border: `3px solid ${score >= 90 ? "#4ADE80" : score >= 70 ? "#C6914C" : "#EAB308"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: score >= 90 ? "#4ADE80" : score >= 70 ? "#C6914C" : "#EAB308" }}>
                          {score}%
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#E4E4E7", marginBottom: 3 }}>{p.title}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {reasons.map((r, i) => (
                              <span key={i} style={{ fontSize: 10, color: "#9A9AA0", background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 4 }}>{r}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: "left", flexShrink: 0 }}>
                          {p.price && <div style={{ fontSize: 12, fontWeight: 700, color: "#4ADE80", marginBottom: 3 }}>{formatSAR(p.price, { short: true })}</div>}
                          <a
                            href={`/dashboard/properties/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 10, color: "#C6914C", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}
                          >
                            عرض <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => { openEdit(selectedRequest); setSelectedRequest(null); }} className="flex-1 bg-[#C6914C] hover:bg-[#A6743A] py-2 rounded-lg text-sm font-bold transition">تعديل</button>
                <button onClick={() => handleDelete(selectedRequest.id)} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm transition">حذف</button>
              </div>
            </div>
          </div>
        );
      })()}

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
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} {c.phone ? "— " + c.phone : ""}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">المدينة</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الحي</label>
                  <input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" placeholder="مثال: النرجس" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">المساحة من (م²)</label>
                  <input type="number" value={form.area_min} onChange={e => setForm({ ...form, area_min: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">المساحة إلى (م²)</label>
                  <input type="number" value={form.area_max} onChange={e => setForm({ ...form, area_max: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الميزانية من (ر.س)</label>
                  <input type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الميزانية إلى (ر.س)</label>
                  <input type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">المميزات المطلوبة</label>
                <textarea value={form.required_features} onChange={e => setForm({ ...form, required_features: e.target.value })} rows={3} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" placeholder="مثال: مسبح، مدخل سيارة، قريب من مدرسة..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
