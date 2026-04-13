"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { FileText, Plus, Search, Trash2, X, ExternalLink, Upload, Tag, Calendar, Building2, Users } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";


const docTypes = ["عقد بيع", "عقد إيجار", "توكيل", "عقد وساطة", "شهادة", "وثيقة هوية", "تصريح", "أخرى"];
const statusOpts = ["نشط", "منتهي", "معلق", "ملغي"];

const typeColors: Record<string, string> = {
  "عقد بيع":     "#C18D4A",
  "عقد إيجار":   "#4ADE80",
  "توكيل":        "#A78BFA",
  "عقد وساطة":   "#FB923C",
  "شهادة":        "#FACC15",
  "وثيقة هوية":  "#9A9AA0",
  "تصريح":       "#F87171",
  "أخرى":         "#5A5A62",
};

const statusColors: Record<string, string> = {
  "نشط":   "bg-green-900/30 text-green-400",
  "منتهي": "bg-red-900/30 text-red-400",
  "معلق":  "bg-yellow-900/30 text-yellow-400",
  "ملغي":  "bg-[rgba(90,90,98,0.2)] text-[#9A9AA0]",
};

const emptyForm = {
  title: "", doc_type: "عقد بيع", status: "نشط",
  related_party: "", doc_number: "", issue_date: "", expiry_date: "",
  notes: "", doc_url: "",
};

export default function DocumentsPage() {
  const [docs, setDocs]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterType, setFilterType]     = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm]         = useState({ ...emptyForm });

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    const { data } = await supabase
      .from("legal_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  }

  function resetForm() { setForm({ ...emptyForm }); setEditingId(""); }

  function openEdit(doc: any) {
    setForm({
      title: doc.title || "", doc_type: doc.doc_type || "عقد بيع",
      status: doc.status || "نشط", related_party: doc.related_party || "",
      doc_number: doc.doc_number || "", issue_date: doc.issue_date || "",
      expiry_date: doc.expiry_date || "", notes: doc.notes || "",
      doc_url: doc.doc_url || "",
    });
    setEditingId(doc.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("يرجى إدخال اسم الوثيقة"); return; }
    if (editingId) {
      await supabase.from("legal_documents").update(form).eq("id", editingId);
      toast.success("تم تحديث الوثيقة");
    } else {
      await supabase.from("legal_documents").insert([form]);
      toast.success("تمت إضافة الوثيقة");
    }
    setShowForm(false);
    resetForm();
    loadDocs();
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذه الوثيقة؟")) return;
    await supabase.from("legal_documents").delete().eq("id", id);
    toast.success("تم حذف الوثيقة");
    setSelected(null);
    loadDocs();
  }

  const filtered = docs.filter(d => {
    if (search && !d.title?.includes(search) && !d.related_party?.includes(search) && !d.doc_number?.includes(search)) return false;
    if (filterType !== "all" && d.doc_type !== filterType) return false;
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    return true;
  });

  const stats = docTypes.map(t => ({ type: t, count: docs.filter(d => d.doc_type === t).length })).filter(s => s.count > 0);

  if (loading) return (
    <div dir="rtl" className="p-4 space-y-3">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
    </div>
  );

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الوثائق القانونية" }]} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">الوثائق القانونية</h2>
          <p className="text-sm" style={{ color: "#5A5A62" }}>إدارة العقود والوثائق الرسمية</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition"
          style={{ background: "linear-gradient(135deg, #C18D4A, #A68A3A)", color: "#0A0A0C" }}
        >
          <Plus size={16} />
          إضافة وثيقة
        </button>
      </div>

      {/* إحصائيات سريعة */}
      {stats.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {stats.map(s => (
            <div key={s.type} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.1)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: typeColors[s.type] || "#9A9AA0" }} />
              <span style={{ color: "#9A9AA0" }}>{s.type}</span>
              <span className="font-bold" style={{ color: "#F5F5F5" }}>{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* بحث وفلاتر */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={15} className="absolute right-3 top-3" style={{ color: "#5A5A62" }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الطرف أو الرقم..."
            className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none"
            style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.12)", color: "#F5F5F5" }}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.12)", color: "#9A9AA0" }}>
          <option value="all">كل الأنواع</option>
          {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.12)", color: "#9A9AA0" }}>
          <option value="all">كل الحالات</option>
          {statusOpts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* قائمة الوثائق */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: "#16161A", border: "1px solid rgba(193,141,74,0.08)" }}>
          <FileText size={40} className="mx-auto mb-3" style={{ color: "#3A3A42" }} />
          <p className="text-sm" style={{ color: "#5A5A62" }}>{docs.length === 0 ? "لا توجد وثائق — أضف وثيقتك الأولى" : "لا توجد نتائج مطابقة"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const col = typeColors[doc.doc_type] || "#9A9AA0";
            const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
            return (
              <div
                key={doc.id}
                onClick={() => setSelected(doc)}
                className="rounded-xl p-4 cursor-pointer transition flex items-center gap-4"
                style={{ background: "#16161A", border: `1px solid ${selected?.id === doc.id ? "rgba(193,141,74,0.3)" : "rgba(193,141,74,0.08)"}` }}
              >
                {/* أيقونة النوع */}
                <div className="rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, background: col + "18" }}>
                  <FileText size={18} style={{ color: col }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate" style={{ color: "#F5F5F5" }}>{doc.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: col + "18", color: col }}>{doc.doc_type}</span>
                    {doc.status && <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[doc.status] || ""}`}>{doc.status}</span>}
                    {isExpired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400">منتهية الصلاحية</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {doc.related_party && <span className="text-xs flex items-center gap-1" style={{ color: "#9A9AA0" }}><Users size={11} />{doc.related_party}</span>}
                    {doc.doc_number && <span className="text-xs" style={{ color: "#5A5A62" }}>#{doc.doc_number}</span>}
                    {doc.issue_date && <span className="text-xs flex items-center gap-1" style={{ color: "#5A5A62" }}><Calendar size={11} />{doc.issue_date}</span>}
                    {doc.expiry_date && <span className="text-xs" style={{ color: isExpired ? "#F87171" : "#5A5A62" }}>ينتهي: {doc.expiry_date}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.doc_url && (
                    <a href={doc.doc_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      className="flex items-center justify-center rounded-lg transition"
                      style={{ width: 32, height: 32, background: "rgba(193,141,74,0.08)", color: "#C18D4A" }}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={e => { e.stopPropagation(); openEdit(doc); }}
                    className="rounded-lg transition text-xs px-2 py-1"
                    style={{ background: "rgba(193,141,74,0.08)", color: "#C18D4A" }}>
                    تعديل
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                    className="rounded-lg transition"
                    style={{ width: 32, height: 32, background: "rgba(248,113,113,0.08)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة الإضافة/التعديل */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full rounded-2xl overflow-y-auto" style={{ maxWidth: 560, maxHeight: "90vh", background: "#16161A", border: "1px solid rgba(193,141,74,0.2)" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(193,141,74,0.1)" }}>
              <h3 className="font-bold">{editingId ? "تعديل الوثيقة" : "إضافة وثيقة جديدة"}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ color: "#5A5A62", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "اسم الوثيقة *", key: "title", type: "text", placeholder: "مثال: عقد بيع شقة النرجس" },
                { label: "الطرف المعني", key: "related_party", type: "text", placeholder: "اسم العميل أو الجهة" },
                { label: "رقم الوثيقة", key: "doc_number", type: "text", placeholder: "رقم العقد أو المرجع" },
                { label: "رابط الوثيقة (URL)", key: "doc_url", type: "url", placeholder: "https://..." },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs mb-1.5" style={{ color: "#9A9AA0" }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ background: "#1C1C22", border: "1px solid rgba(193,141,74,0.15)", color: "#F5F5F5" }}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9A9AA0" }}>نوع الوثيقة</label>
                  <select value={form.doc_type} onChange={e => setForm(p => ({ ...p, doc_type: e.target.value }))}
                    className="w-full rounded-xl px-3 py-3 text-sm focus:outline-none"
                    style={{ background: "#1C1C22", border: "1px solid rgba(193,141,74,0.15)", color: "#F5F5F5" }}>
                    {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9A9AA0" }}>الحالة</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-xl px-3 py-3 text-sm focus:outline-none"
                    style={{ background: "#1C1C22", border: "1px solid rgba(193,141,74,0.15)", color: "#F5F5F5" }}>
                    {statusOpts.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9A9AA0" }}>تاريخ الإصدار</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))}
                    className="w-full rounded-xl px-3 py-3 text-sm focus:outline-none"
                    style={{ background: "#1C1C22", border: "1px solid rgba(193,141,74,0.15)", color: "#F5F5F5" }} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#9A9AA0" }}>تاريخ الانتهاء</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))}
                    className="w-full rounded-xl px-3 py-3 text-sm focus:outline-none"
                    style={{ background: "#1C1C22", border: "1px solid rgba(193,141,74,0.15)", color: "#F5F5F5" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#9A9AA0" }}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3} placeholder="أي ملاحظات إضافية..."
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                  style={{ background: "#1C1C22", border: "1px solid rgba(193,141,74,0.15)", color: "#F5F5F5" }} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition"
                  style={{ background: "linear-gradient(135deg, #C18D4A, #A68A3A)", color: "#0A0A0C" }}>
                  {editingId ? "حفظ التعديلات" : "إضافة الوثيقة"}
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-5 py-3 rounded-xl text-sm transition"
                  style={{ background: "#1C1C22", color: "#9A9AA0", border: "1px solid rgba(193,141,74,0.12)" }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
