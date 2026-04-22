"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import {
  Package, Plus, X, Trash2, Edit3, Building2, CheckCircle2, AlertTriangle, XCircle, Archive, Users,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";

type Asset = {
  id: string;
  name: string;
  category: string | null;
  serial_no: string | null;
  brand: string | null;
  model: string | null;
  install_date: string | null;
  warranty_end: string | null;
  status: "operational" | "needs_maintenance" | "out_of_service" | "retired";
  location: string | null;
  property_id: string | null;
  notes: string | null;
  created_at: string;
};

type Technician = { id: string; name: string; phone: string | null; specialty: string | null; is_active: boolean };
type Property = { id: string; title: string };

const STATUS_CFG: Record<Asset["status"], { label: string; color: string; icon: any }> = {
  operational:       { label: "يعمل",              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  needs_maintenance: { label: "يحتاج صيانة",        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",       icon: AlertTriangle },
  out_of_service:    { label: "خارج الخدمة",        color: "text-red-400 bg-red-500/10 border-red-500/30",             icon: XCircle },
  retired:           { label: "خارج الاستخدام",     color: "text-slate-400 bg-slate-500/10 border-slate-500/30",       icon: Archive },
};

const CATEGORIES = [
  "HVAC", "Electrical", "Plumbing", "Elevator", "Generator", "Fire Safety", "Security", "Other",
];

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

export default function AssetsPage() {
  const [tab, setTab] = useState<"assets" | "technicians">("assets");
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [techs, setTechs]             = useState<Technician[]>([]);
  const [properties, setProperties]   = useState<Property[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showTechForm, setShowTechForm]   = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  const [form, setForm] = useState({
    name: "", category: "HVAC", serial_no: "", brand: "", model: "",
    install_date: "", warranty_end: "", status: "operational" as Asset["status"],
    location: "", property_id: "", notes: "",
  });

  const [techForm, setTechForm] = useState({
    name: "", phone: "", email: "", specialty: "general", notes: "",
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [aRes, tRes, pRes] = await Promise.all([
      supabase.from("assets").select("*").order("created_at", { ascending: false }),
      supabase.from("technicians").select("*").order("name"),
      supabase.from("properties").select("id, title").limit(200),
    ]);
    setAssets((aRes.data || []) as Asset[]);
    setTechs((tRes.data || []) as Technician[]);
    setProperties((pRes.data || []) as Property[]);
    setLoading(false);
  }

  async function saveAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("اسم الأصل مطلوب"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      tenant_id: user?.id,
      name:         form.name.trim(),
      category:     form.category || null,
      serial_no:    form.serial_no.trim() || null,
      brand:        form.brand.trim()     || null,
      model:        form.model.trim()     || null,
      install_date: form.install_date     || null,
      warranty_end: form.warranty_end     || null,
      status:       form.status,
      location:     form.location.trim()  || null,
      property_id:  form.property_id      || null,
      notes:        form.notes.trim()     || null,
    };

    const res = editing
      ? await supabase.from("assets").update(payload).eq("id", editing.id)
      : await supabase.from("assets").insert(payload);

    if (res.error) toast.error("فشل الحفظ: " + res.error.message);
    else {
      toast.success(editing ? "تم التعديل" : "تم الإضافة");
      setShowAssetForm(false);
      setEditing(null);
      setForm({ name: "", category: "HVAC", serial_no: "", brand: "", model: "", install_date: "", warranty_end: "", status: "operational", location: "", property_id: "", notes: "" });
      loadAll();
    }
  }

  function editAsset(a: Asset) {
    setEditing(a);
    setForm({
      name: a.name,
      category: a.category || "HVAC",
      serial_no: a.serial_no || "",
      brand: a.brand || "",
      model: a.model || "",
      install_date: a.install_date || "",
      warranty_end: a.warranty_end || "",
      status: a.status,
      location: a.location || "",
      property_id: a.property_id || "",
      notes: a.notes || "",
    });
    setShowAssetForm(true);
  }

  async function deleteAsset(id: string) {
    if (!confirm("حذف الأصل نهائياً؟")) return;
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) toast.error("فشل الحذف");
    else { toast.success("تم الحذف"); loadAll(); }
  }

  async function saveTechnician(e: React.FormEvent) {
    e.preventDefault();
    if (!techForm.name.trim()) { toast.error("اسم الفني مطلوب"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("technicians").insert({
      tenant_id: user?.id,
      name:      techForm.name.trim(),
      phone:     techForm.phone.trim() || null,
      email:     techForm.email.trim() || null,
      specialty: techForm.specialty    || null,
      notes:     techForm.notes.trim() || null,
      is_active: true,
    });
    if (error) toast.error("فشل الحفظ: " + error.message);
    else {
      toast.success("تم الإضافة");
      setShowTechForm(false);
      setTechForm({ name: "", phone: "", email: "", specialty: "general", notes: "" });
      loadAll();
    }
  }

  async function toggleTechActive(t: Technician) {
    const { error } = await supabase.from("technicians").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) toast.error("فشل التحديث");
    else loadAll();
  }

  async function deleteTech(id: string) {
    if (!confirm("حذف الفني؟")) return;
    const { error } = await supabase.from("technicians").delete().eq("id", id);
    if (error) toast.error("فشل الحذف");
    else { toast.success("تم الحذف"); loadAll(); }
  }

  function propTitle(id: string | null): string {
    if (!id) return "—";
    return properties.find(p => p.id === id)?.title || "—";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الأصول" }]} />

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-400" />
              سجل الأصول والفنيين
            </h1>
            <p className="text-slate-400 text-sm mt-1">أصول العقار + فريق الصيانة</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-slate-800">
          <button
            onClick={() => setTab("assets")}
            className={`px-4 py-2 font-medium border-b-2 transition ${tab === "assets" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
          >
            <Package className="w-4 h-4 inline ml-1" /> الأصول ({assets.length})
          </button>
          <button
            onClick={() => setTab("technicians")}
            className={`px-4 py-2 font-medium border-b-2 transition ${tab === "technicians" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
          >
            <Users className="w-4 h-4 inline ml-1" /> الفنيين ({techs.length})
          </button>
        </div>

        {/* Assets tab */}
        {tab === "assets" && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditing(null); setShowAssetForm(true); }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" /> أصل جديد
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400">جاري التحميل...</div>
            ) : assets.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">لا يوجد أصول بعد — أضف أول أصل (مثل: مكيف، مصعد، مولّد)</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assets.map(a => {
                  const cfg = STATUS_CFG[a.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/30 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => editAsset(a)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteAsset(a.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="font-bold">{a.name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {a.category} {a.brand && `— ${a.brand}`} {a.model && a.model}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                        {a.property_id && (
                          <span className="text-xs px-2 py-0.5 rounded border border-slate-700 text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {propTitle(a.property_id)}
                          </span>
                        )}
                      </div>
                      {a.warranty_end && (
                        <div className="text-xs text-slate-500 mt-2">الضمان حتى: {fmtDate(a.warranty_end)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Technicians tab */}
        {tab === "technicians" && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowTechForm(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" /> فني جديد
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400">جاري التحميل...</div>
            ) : techs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">لا يوجد فنيين بعد — أضف أول فني لتعيينه في أوامر العمل</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {techs.map(t => (
                  <div key={t.id} className="flex items-center gap-4 p-4 border-b border-slate-800 last:border-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${t.is_active ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-sm text-slate-400">
                        {t.specialty && <span>{t.specialty}</span>}
                        {t.phone && <span dir="ltr"> — {t.phone}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTechActive(t)}
                      className={`text-xs px-2 py-1 rounded ${t.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"}`}
                    >
                      {t.is_active ? "نشط" : "غير نشط"}
                    </button>
                    <button onClick={() => deleteTech(t.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Asset Form Modal */}
      {showAssetForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => { setShowAssetForm(false); setEditing(null); }}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-xl w-full my-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? "تعديل أصل" : "أصل جديد"}</h2>
              <button onClick={() => { setShowAssetForm(false); setEditing(null); }} className="p-1 hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveAsset} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">اسم الأصل *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="مثال: مكيف الشقة 3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">التصنيف</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">الحالة</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">الماركة</label>
                  <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">الموديل</label>
                  <input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">الرقم التسلسلي</label>
                <input value={form.serial_no} onChange={e => setForm({ ...form, serial_no: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">تاريخ التركيب</label>
                  <input type="date" value={form.install_date} onChange={e => setForm({ ...form, install_date: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">نهاية الضمان</label>
                  <input type="date" value={form.warranty_end} onChange={e => setForm({ ...form, warranty_end: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">العقار</label>
                <select value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <option value="">— بدون —</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">الموقع/الغرفة</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="مثال: السطح — جناح 1" />
              </div>
              <div>
                <label className="block text-sm mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowAssetForm(false); setEditing(null); }} className="flex-1 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg">إلغاء</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium">{editing ? "حفظ" : "إضافة"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tech Form Modal */}
      {showTechForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowTechForm(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">فني جديد</h2>
              <button onClick={() => setShowTechForm(false)} className="p-1 hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveTechnician} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">الاسم *</label>
                <input value={techForm.name} onChange={e => setTechForm({ ...techForm, name: e.target.value })} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">الجوال</label>
                <input value={techForm.phone} onChange={e => setTechForm({ ...techForm, phone: e.target.value })} dir="ltr" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="05xxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm mb-1">البريد الإلكتروني</label>
                <input type="email" value={techForm.email} onChange={e => setTechForm({ ...techForm, email: e.target.value })} dir="ltr" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">الاختصاص</label>
                <select value={techForm.specialty} onChange={e => setTechForm({ ...techForm, specialty: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <option value="general">عام</option>
                  <option value="plumbing">سباكة</option>
                  <option value="electrical">كهرباء</option>
                  <option value="hvac">تكييف</option>
                  <option value="carpentry">نجارة</option>
                  <option value="cleaning">نظافة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">ملاحظات</label>
                <textarea value={techForm.notes} onChange={e => setTechForm({ ...techForm, notes: e.target.value })} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowTechForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg">إلغاء</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium">إضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
