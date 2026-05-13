"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import {
  Package,
  Plus,
  X,
  Trash2,
  Edit3,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Archive,
  Users,
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

type Technician = {
  id: string;
  name: string;
  phone: string | null;
  specialty: string | null;
  is_active: boolean;
};
type Property = { id: string; title: string };

const STATUS_CFG: Record<Asset["status"], { label: string; color: string; icon: any }> = {
  operational: {
    label: "يعمل",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    icon: CheckCircle2,
  },
  needs_maintenance: {
    label: "يحتاج صيانة",
    color: "text-[var(--gold-1)] bg-[var(--gold-2)]/10 border-[var(--gold-bg-hover)]",
    icon: AlertTriangle,
  },
  out_of_service: {
    label: "خارج الخدمة",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    icon: XCircle,
  },
  retired: {
    label: "خارج الاستخدام",
    color: "text-[var(--text-faint)] bg-slate-500/10 border-slate-500/30",
    icon: Archive,
  },
};

const CATEGORIES = [
  "HVAC",
  "Electrical",
  "Plumbing",
  "Elevator",
  "Generator",
  "Fire Safety",
  "Security",
  "Other",
];

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AssetsPage() {
  const [tab, setTab] = useState<"assets" | "technicians">("assets");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showTechForm, setShowTechForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "HVAC",
    serial_no: "",
    brand: "",
    model: "",
    install_date: "",
    warranty_end: "",
    status: "operational" as Asset["status"],
    location: "",
    property_id: "",
    notes: "",
  });

  const [techForm, setTechForm] = useState({
    name: "",
    phone: "",
    email: "",
    specialty: "general",
    notes: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

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
    if (!form.name.trim()) {
      toast.error("اسم الأصل مطلوب");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const payload = {
      tenant_id: user?.id,
      name: form.name.trim(),
      category: form.category || null,
      serial_no: form.serial_no.trim() || null,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      install_date: form.install_date || null,
      warranty_end: form.warranty_end || null,
      status: form.status,
      location: form.location.trim() || null,
      property_id: form.property_id || null,
      notes: form.notes.trim() || null,
    };

    const res = editing
      ? await supabase.from("assets").update(payload).eq("id", editing.id)
      : await supabase.from("assets").insert(payload);

    if (res.error) toast.error("فشل الحفظ: " + res.error.message);
    else {
      toast.success(editing ? "تم التعديل" : "تم الإضافة");
      setShowAssetForm(false);
      setEditing(null);
      setForm({
        name: "",
        category: "HVAC",
        serial_no: "",
        brand: "",
        model: "",
        install_date: "",
        warranty_end: "",
        status: "operational",
        location: "",
        property_id: "",
        notes: "",
      });
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
    else {
      toast.success("تم الحذف");
      loadAll();
    }
  }

  async function saveTechnician(e: React.FormEvent) {
    e.preventDefault();
    if (!techForm.name.trim()) {
      toast.error("اسم الفني مطلوب");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("technicians").insert({
      tenant_id: user?.id,
      name: techForm.name.trim(),
      phone: techForm.phone.trim() || null,
      email: techForm.email.trim() || null,
      specialty: techForm.specialty || null,
      notes: techForm.notes.trim() || null,
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
    const { error } = await supabase
      .from("technicians")
      .update({ is_active: !t.is_active })
      .eq("id", t.id);
    if (error) toast.error("فشل التحديث");
    else loadAll();
  }

  async function deleteTech(id: string) {
    if (!confirm("حذف الفني؟")) return;
    const { error } = await supabase.from("technicians").delete().eq("id", id);
    if (error) toast.error("فشل الحذف");
    else {
      toast.success("تم الحذف");
      loadAll();
    }
  }

  function propTitle(id: string | null): string {
    if (!id) return "—";
    return properties.find((p) => p.id === id)?.title || "—";
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-strong)]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الأصول" }]} />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Package className="h-7 w-7 text-indigo-400" />
              سجل الأصول والفنيين
            </h1>
            <p className="mt-1 text-sm text-[var(--text-faint)]">أصول العقار + فريق الصيانة</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-[var(--gold-bg)]">
          <button
            onClick={() => setTab("assets")}
            className={`border-b-2 px-4 py-2 font-medium transition ${tab === "assets" ? "border-indigo-500 text-indigo-400" : "border-transparent text-[var(--text-faint)] hover:text-[var(--text-soft)]"}`}
          >
            <Package className="ml-1 inline h-4 w-4" /> الأصول ({assets.length})
          </button>
          <button
            onClick={() => setTab("technicians")}
            className={`border-b-2 px-4 py-2 font-medium transition ${tab === "technicians" ? "border-indigo-500 text-indigo-400" : "border-transparent text-[var(--text-faint)] hover:text-[var(--text-soft)]"}`}
          >
            <Users className="ml-1 inline h-4 w-4" /> الفنيين ({techs.length})
          </button>
        </div>

        {/* Assets tab */}
        {tab === "assets" && (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => {
                  setEditing(null);
                  setShowAssetForm(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" /> أصل جديد
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[var(--text-faint)]">جاري التحميل...</div>
            ) : assets.length === 0 ? (
              <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-12 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-slate-600" />
                <p className="text-[var(--text-faint)]">
                  لا يوجد أصول بعد — أضف أول أصل (مثل: مكيف، مصعد، مولّد)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {assets.map((a) => {
                  const cfg = STATUS_CFG[a.status];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4 transition hover:border-indigo-500/30"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${cfg.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => editAsset(a)}
                            className="rounded p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-2)] hover:text-indigo-400"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteAsset(a.id)}
                            className="rounded p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-2)] hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="font-bold">{a.name}</div>
                      <div className="mt-1 text-xs text-[var(--text-faint)]">
                        {a.category} {a.brand && `— ${a.brand}`} {a.model && a.model}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`rounded border px-2 py-0.5 text-xs ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {a.property_id && (
                          <span className="flex items-center gap-1 rounded border border-[var(--gold-bg-hover)] px-2 py-0.5 text-xs text-[var(--text-faint)]">
                            <Building2 className="h-3 w-3" /> {propTitle(a.property_id)}
                          </span>
                        )}
                      </div>
                      {a.warranty_end && (
                        <div className="mt-2 text-xs text-[var(--text-faint)]">
                          الضمان حتى: {fmtDate(a.warranty_end)}
                        </div>
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
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowTechForm(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium transition hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" /> فني جديد
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[var(--text-faint)]">جاري التحميل...</div>
            ) : techs.length === 0 ? (
              <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-12 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-slate-600" />
                <p className="text-[var(--text-faint)]">
                  لا يوجد فنيين بعد — أضف أول فني لتعيينه في أوامر العمل
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]">
                {techs.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 border-b border-[var(--gold-bg)] p-4 last:border-0"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${t.is_active ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" : "border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] text-[var(--text-faint)]"}`}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-sm text-[var(--text-faint)]">
                        {t.specialty && <span>{t.specialty}</span>}
                        {t.phone && <span dir="ltr"> — {t.phone}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTechActive(t)}
                      className={`rounded px-2 py-1 text-xs ${t.is_active ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] text-[var(--text-faint)]"}`}
                    >
                      {t.is_active ? "نشط" : "غير نشط"}
                    </button>
                    <button
                      onClick={() => deleteTech(t.id)}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            setShowAssetForm(false);
            setEditing(null);
          }}
        >
          <div
            className="my-6 w-full max-w-xl rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? "تعديل أصل" : "أصل جديد"}</h2>
              <button
                onClick={() => {
                  setShowAssetForm(false);
                  setEditing(null);
                }}
                className="rounded p-1 hover:bg-[var(--bg-surface-2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveAsset} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">اسم الأصل *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  placeholder="مثال: مكيف الشقة 3"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm">التصنيف</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm">الحالة</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  >
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm">الماركة</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">الموديل</label>
                  <input
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm">الرقم التسلسلي</label>
                <input
                  value={form.serial_no}
                  onChange={(e) => setForm({ ...form, serial_no: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm">تاريخ التركيب</label>
                  <input
                    type="date"
                    value={form.install_date}
                    onChange={(e) => setForm({ ...form, install_date: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">نهاية الضمان</label>
                  <input
                    type="date"
                    value={form.warranty_end}
                    onChange={(e) => setForm({ ...form, warranty_end: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm">العقار</label>
                <select
                  value={form.property_id}
                  onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                >
                  <option value="">— بدون —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">الموقع/الغرفة</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  placeholder="مثال: السطح — جناح 1"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssetForm(false);
                    setEditing(null);
                  }}
                  className="flex-1 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500"
                >
                  {editing ? "حفظ" : "إضافة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tech Form Modal */}
      {showTechForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowTechForm(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">فني جديد</h2>
              <button
                onClick={() => setShowTechForm(false)}
                className="rounded p-1 hover:bg-[var(--bg-surface-2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveTechnician} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">الاسم *</label>
                <input
                  value={techForm.name}
                  onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">الجوال</label>
                <input
                  value={techForm.phone}
                  onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })}
                  dir="ltr"
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={techForm.email}
                  onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
                  dir="ltr"
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">الاختصاص</label>
                <select
                  value={techForm.specialty}
                  onChange={(e) => setTechForm({ ...techForm, specialty: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                >
                  <option value="general">عام</option>
                  <option value="plumbing">سباكة</option>
                  <option value="electrical">كهرباء</option>
                  <option value="hvac">تكييف</option>
                  <option value="carpentry">نجارة</option>
                  <option value="cleaning">نظافة</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">ملاحظات</label>
                <textarea
                  value={techForm.notes}
                  onChange={(e) => setTechForm({ ...techForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTechForm(false)}
                  className="flex-1 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500"
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
