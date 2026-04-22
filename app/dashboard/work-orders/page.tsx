"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import {
  Wrench, Plus, X, Clock, CheckCircle2, AlertCircle, PauseCircle,
  User, Building2, Calendar, Flame, ChevronRight, Filter, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";

type WorkOrder = {
  id: string;
  ticket_number: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  kind: "corrective" | "preventive" | "inspection";
  status: "open" | "assigned" | "in_progress" | "on_hold" | "completed" | "cancelled";
  property_id: string | null;
  asset_id: string | null;
  technician_id: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  resolution: string | null;
  created_at: string;
};

type Technician = { id: string; name: string; specialty: string | null };
type Property   = { id: string; title: string };
type Asset      = { id: string; name: string };

const STATUS_CFG: Record<WorkOrder["status"], { label: string; color: string; icon: any }> = {
  open:         { label: "مفتوح",       color: "text-blue-400 bg-blue-500/10 border-blue-500/30",         icon: AlertCircle  },
  assigned:     { label: "مُسنَد",       color: "text-purple-400 bg-purple-500/10 border-purple-500/30",   icon: User         },
  in_progress:  { label: "قيد التنفيذ",  color: "text-amber-400 bg-amber-500/10 border-amber-500/30",      icon: Clock        },
  on_hold:      { label: "مُعلَّق",       color: "text-slate-400 bg-slate-500/10 border-slate-500/30",      icon: PauseCircle  },
  completed:    { label: "مكتمل",       color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  cancelled:    { label: "ملغي",        color: "text-red-400 bg-red-500/10 border-red-500/30",           icon: X            },
};

const PRIORITY_CFG: Record<WorkOrder["priority"], { label: string; color: string }> = {
  low:    { label: "منخفض",   color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
  normal: { label: "عادي",    color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  high:   { label: "عالي",    color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  urgent: { label: "عاجل",    color: "text-red-400 bg-red-500/10 border-red-500/30" },
};

const CATEGORY_OPTIONS = [
  { value: "plumbing",    label: "سباكة" },
  { value: "electrical",  label: "كهرباء" },
  { value: "hvac",        label: "تكييف" },
  { value: "cleaning",    label: "نظافة" },
  { value: "safety",      label: "سلامة" },
  { value: "other",       label: "أخرى" },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function WorkOrdersPage() {
  const [orders, setOrders]             = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians]   = useState<Technician[]>([]);
  const [properties, setProperties]     = useState<Property[]>([]);
  const [assets, setAssets]             = useState<Asset[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm]         = useState(false);
  const [selected, setSelected]         = useState<WorkOrder | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "plumbing",
    priority: "normal" as WorkOrder["priority"],
    kind: "corrective" as WorkOrder["kind"],
    property_id: "",
    asset_id: "",
    technician_id: "",
    reporter_name: "",
    reporter_phone: "",
    scheduled_for: "",
    estimated_cost: "",
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [woRes, techRes, propRes, assetRes] = await Promise.all([
      supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("technicians").select("id, name, specialty").eq("is_active", true).order("name"),
      supabase.from("properties").select("id, title").order("title").limit(200),
      supabase.from("assets").select("id, name").order("name"),
    ]);

    if (woRes.error)    toast.error("فشل التحميل: " + woRes.error.message);
    else setOrders((woRes.data || []) as WorkOrder[]);

    setTechnicians((techRes.data || []) as Technician[]);
    setProperties((propRes.data || []) as Property[]);
    setAssets((assetRes.data || []) as Asset[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("العنوان مطلوب"); return; }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      tenant_id: user?.id,
      reported_by: user?.id,
      title:           form.title.trim(),
      description:     form.description.trim() || null,
      category:        form.category || null,
      priority:        form.priority,
      kind:            form.kind,
      property_id:     form.property_id || null,
      asset_id:        form.asset_id    || null,
      technician_id:   form.technician_id || null,
      reporter_name:   form.reporter_name.trim() || null,
      reporter_phone:  form.reporter_phone.trim() || null,
      scheduled_for:   form.scheduled_for || null,
      estimated_cost:  form.estimated_cost ? Number(form.estimated_cost) : null,
      status:          form.technician_id ? "assigned" : "open",
    };

    const { error } = await supabase.from("work_orders").insert(payload);
    if (error) toast.error("فشل الإنشاء: " + error.message);
    else {
      toast.success("تم إنشاء أمر العمل");
      setShowForm(false);
      setForm({ title: "", description: "", category: "plumbing", priority: "normal", kind: "corrective",
                property_id: "", asset_id: "", technician_id: "", reporter_name: "", reporter_phone: "",
                scheduled_for: "", estimated_cost: "" });
      loadAll();
    }
    setSubmitting(false);
  }

  async function updateStatus(id: string, status: WorkOrder["status"], resolution?: string) {
    const patch: any = { status };
    if (resolution) patch.resolution = resolution;
    const { error } = await supabase.from("work_orders").update(patch).eq("id", id);
    if (error) toast.error("فشل التحديث: " + error.message);
    else {
      toast.success("تم التحديث");
      loadAll();
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
    }
  }

  async function assignTech(id: string, technician_id: string) {
    const { error } = await supabase
      .from("work_orders")
      .update({ technician_id, status: "assigned" })
      .eq("id", id);
    if (error) toast.error("فشل التعيين");
    else { toast.success("تم التعيين"); loadAll(); }
  }

  async function deleteOrder(id: string) {
    if (!confirm("حذف أمر العمل نهائياً؟")) return;
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) toast.error("فشل الحذف");
    else { toast.success("تم الحذف"); setSelected(null); loadAll(); }
  }

  const filtered = orders.filter(o => statusFilter === "all" ? true : o.status === statusFilter);

  const stats = {
    open:        orders.filter(o => o.status === "open").length,
    in_progress: orders.filter(o => o.status === "in_progress" || o.status === "assigned").length,
    completed:   orders.filter(o => o.status === "completed").length,
    urgent:      orders.filter(o => o.priority === "urgent" && o.status !== "completed" && o.status !== "cancelled").length,
  };

  function techName(id: string | null): string {
    if (!id) return "—";
    return technicians.find(t => t.id === id)?.name || "—";
  }
  function propTitle(id: string | null): string {
    if (!id) return "—";
    return properties.find(p => p.id === id)?.title || "—";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "أوامر العمل" }]} />

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="w-7 h-7 text-amber-400" />
              أوامر العمل والصيانة
            </h1>
            <p className="text-slate-400 text-sm mt-1">إدارة طلبات الصيانة — من الفتح حتى الإغلاق</p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus className="w-4 h-4" /> أمر عمل جديد
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
            <div className="text-xs text-slate-400">مفتوح</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{stats.in_progress}</div>
            <div className="text-xs text-slate-400">قيد التنفيذ</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
            <div className="text-xs text-slate-400">مكتمل</div>
          </div>
          <div className={`border rounded-xl p-4 ${stats.urgent > 0 ? "bg-red-950/30 border-red-500/30" : "bg-slate-900 border-slate-800"}`}>
            <div className={`text-2xl font-bold flex items-center gap-1 ${stats.urgent > 0 ? "text-red-400" : "text-slate-500"}`}>
              {stats.urgent > 0 && <Flame className="w-5 h-5" />}
              {stats.urgent}
            </div>
            <div className="text-xs text-slate-400">عاجل</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {["all", ...Object.keys(STATUS_CFG)].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${
                statusFilter === s
                  ? "bg-amber-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {s === "all" ? "الكل" : STATUS_CFG[s as WorkOrder["status"]].label}
              {s !== "all" && ` (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">لا يوجد أوامر عمل {statusFilter !== "all" ? "بهذه الحالة" : "بعد"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(o => {
              const sCfg = STATUS_CFG[o.status];
              const pCfg = PRIORITY_CFG[o.priority];
              const Icon = sCfg.icon;
              return (
                <div
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-xl p-4 cursor-pointer transition"
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${sCfg.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-slate-500">{o.ticket_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${sCfg.color}`}>{sCfg.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${pCfg.color}`}>
                          {o.priority === "urgent" && "🔥 "}{pCfg.label}
                        </span>
                        {o.kind !== "corrective" && (
                          <span className="text-xs px-2 py-0.5 rounded border border-slate-700 text-slate-400">
                            {o.kind === "preventive" ? "وقائية" : "فحص"}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold mt-1">{o.title}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        {o.property_id && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {propTitle(o.property_id)}</span>}
                        {o.technician_id && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {techName(o.technician_id)}</span>}
                        {o.scheduled_for && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(o.scheduled_for)}</span>}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full my-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> أمر عمل جديد
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">العنوان *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" required placeholder="مثال: تسريب في حمام الشقة 3" />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">الوصف</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="تفاصيل المشكلة..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">التصنيف</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">الأولوية</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    <option value="low">منخفض</option>
                    <option value="normal">عادي</option>
                    <option value="high">عالي</option>
                    <option value="urgent">🔥 عاجل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">النوع</label>
                  <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                    <option value="corrective">إصلاح</option>
                    <option value="preventive">وقائية</option>
                    <option value="inspection">فحص</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">التكلفة المتوقعة (ر.س)</label>
                  <input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">العقار</label>
                <select value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <option value="">— اختر —</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">الفني المسؤول</label>
                <select value={form.technician_id} onChange={e => setForm({ ...form, technician_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <option value="">— بدون —</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` — ${t.specialty}` : ""}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">اسم مقدّم الطلب</label>
                  <input value={form.reporter_name} onChange={e => setForm({ ...form, reporter_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="مستأجر / موظف" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">جوال</label>
                  <input value={form.reporter_phone} onChange={e => setForm({ ...form, reporter_phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" dir="ltr" placeholder="05xxxxxxxx" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">موعد التنفيذ</label>
                <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm({ ...form, scheduled_for: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition">إلغاء</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 px-4 py-2 rounded-lg font-medium transition">
                  {submitting ? "جارٍ الحفظ..." : "إنشاء"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-t-2xl md:rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4 gap-2">
              <div>
                <div className="font-mono text-xs text-slate-500">{selected.ticket_number}</div>
                <h2 className="text-xl font-bold mt-1">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_CFG[selected.status].color}`}>{STATUS_CFG[selected.status].label}</span>
              <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_CFG[selected.priority].color}`}>
                {selected.priority === "urgent" && "🔥 "}{PRIORITY_CFG[selected.priority].label}
              </span>
            </div>

            {selected.description && (
              <div className="mb-4">
                <div className="text-xs text-slate-400 mb-1">الوصف</div>
                <div className="text-sm bg-slate-800/50 rounded-lg p-3">{selected.description}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><div className="text-xs text-slate-400">العقار</div><div>{propTitle(selected.property_id)}</div></div>
              <div><div className="text-xs text-slate-400">الفني</div><div>{techName(selected.technician_id)}</div></div>
              <div><div className="text-xs text-slate-400">التصنيف</div><div>{CATEGORY_OPTIONS.find(c => c.value === selected.category)?.label || "—"}</div></div>
              <div><div className="text-xs text-slate-400">أُنشئ</div><div>{fmtDateTime(selected.created_at)}</div></div>
              {selected.started_at   && <div><div className="text-xs text-slate-400">بدأ</div><div>{fmtDateTime(selected.started_at)}</div></div>}
              {selected.completed_at && <div><div className="text-xs text-slate-400">أُغلق</div><div>{fmtDateTime(selected.completed_at)}</div></div>}
              {selected.reporter_name && <div><div className="text-xs text-slate-400">مقدّم الطلب</div><div>{selected.reporter_name}{selected.reporter_phone ? ` — ${selected.reporter_phone}` : ""}</div></div>}
              {selected.estimated_cost != null && <div><div className="text-xs text-slate-400">التكلفة المتوقعة</div><div>{selected.estimated_cost} ر.س</div></div>}
            </div>

            {/* Quick assign */}
            {selected.status !== "completed" && selected.status !== "cancelled" && (
              <div className="mb-4">
                <div className="text-xs text-slate-400 mb-1">تعيين فني</div>
                <select
                  value={selected.technician_id || ""}
                  onChange={(e) => assignTech(selected.id, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— اختر فني —</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}{t.specialty ? ` — ${t.specialty}` : ""}</option>)}
                </select>
              </div>
            )}

            {/* Status actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {selected.status !== "in_progress" && selected.status !== "completed" && selected.status !== "cancelled" && (
                <button onClick={() => updateStatus(selected.id, "in_progress")} className="bg-amber-600 hover:bg-amber-500 px-3 py-2 rounded-lg text-sm">ابدأ التنفيذ</button>
              )}
              {selected.status === "in_progress" && (
                <button onClick={() => updateStatus(selected.id, "on_hold")} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm">تعليق</button>
              )}
              {selected.status !== "completed" && selected.status !== "cancelled" && (
                <button
                  onClick={() => {
                    const r = prompt("ملخص ما تم إنجازه:");
                    if (r !== null) updateStatus(selected.id, "completed", r || undefined);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg text-sm"
                >
                  إغلاق كمكتمل
                </button>
              )}
              {selected.status !== "cancelled" && selected.status !== "completed" && (
                <button onClick={() => updateStatus(selected.id, "cancelled")} className="bg-red-900/50 hover:bg-red-900 text-red-300 px-3 py-2 rounded-lg text-sm">إلغاء</button>
              )}
            </div>

            {selected.resolution && (
              <div className="mb-3">
                <div className="text-xs text-emerald-400 mb-1">الحل</div>
                <div className="text-sm bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-3">{selected.resolution}</div>
              </div>
            )}

            <button
              onClick={() => deleteOrder(selected.id)}
              className="w-full bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> حذف نهائياً
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
