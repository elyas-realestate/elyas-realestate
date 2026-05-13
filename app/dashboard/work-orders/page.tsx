"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import {
  Wrench,
  Plus,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  User,
  Building2,
  Calendar,
  Flame,
  ChevronRight,
  Filter,
  Trash2,
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
type Property = { id: string; title: string };
type Asset = { id: string; name: string };

const STATUS_CFG: Record<WorkOrder["status"], { label: string; color: string; icon: any }> = {
  open: {
    label: "مفتوح",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    icon: AlertCircle,
  },
  assigned: {
    label: "مُسنَد",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    icon: User,
  },
  in_progress: {
    label: "قيد التنفيذ",
    color: "text-[var(--gold-1)] bg-[var(--gold-2)]/10 border-[var(--gold-bg-hover)]",
    icon: Clock,
  },
  on_hold: {
    label: "مُعلَّق",
    color: "text-[var(--text-faint)] bg-slate-500/10 border-slate-500/30",
    icon: PauseCircle,
  },
  completed: {
    label: "مكتمل",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    icon: CheckCircle2,
  },
  cancelled: { label: "ملغي", color: "text-red-400 bg-red-500/10 border-red-500/30", icon: X },
};

const PRIORITY_CFG: Record<WorkOrder["priority"], { label: string; color: string }> = {
  low: { label: "منخفض", color: "text-[var(--text-faint)] bg-slate-500/10 border-slate-500/30" },
  normal: { label: "عادي", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  high: {
    label: "عالي",
    color: "text-[var(--gold-1)] bg-[var(--gold-2)]/10 border-[var(--gold-bg-hover)]",
  },
  urgent: { label: "عاجل", color: "text-red-400 bg-red-500/10 border-red-500/30" },
};

const CATEGORY_OPTIONS = [
  { value: "plumbing", label: "سباكة" },
  { value: "electrical", label: "كهرباء" },
  { value: "hvac", label: "تكييف" },
  { value: "cleaning", label: "نظافة" },
  { value: "safety", label: "سلامة" },
  { value: "other", label: "أخرى" },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [woRes, techRes, propRes, assetRes] = await Promise.all([
      supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
      supabase
        .from("technicians")
        .select("id, name, specialty")
        .eq("is_active", true)
        .order("name"),
      supabase.from("properties").select("id, title").order("title").limit(200),
      supabase.from("assets").select("id, name").order("name"),
    ]);

    if (woRes.error) toast.error("فشل التحميل: " + woRes.error.message);
    else setOrders((woRes.data || []) as WorkOrder[]);

    setTechnicians((techRes.data || []) as Technician[]);
    setProperties((propRes.data || []) as Property[]);
    setAssets((assetRes.data || []) as Asset[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("العنوان مطلوب");
      return;
    }
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const payload = {
      tenant_id: user?.id,
      reported_by: user?.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category || null,
      priority: form.priority,
      kind: form.kind,
      property_id: form.property_id || null,
      asset_id: form.asset_id || null,
      technician_id: form.technician_id || null,
      reporter_name: form.reporter_name.trim() || null,
      reporter_phone: form.reporter_phone.trim() || null,
      scheduled_for: form.scheduled_for || null,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      status: form.technician_id ? "assigned" : "open",
    };

    const { error } = await supabase.from("work_orders").insert(payload);
    if (error) toast.error("فشل الإنشاء: " + error.message);
    else {
      toast.success("تم إنشاء أمر العمل");
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        category: "plumbing",
        priority: "normal",
        kind: "corrective",
        property_id: "",
        asset_id: "",
        technician_id: "",
        reporter_name: "",
        reporter_phone: "",
        scheduled_for: "",
        estimated_cost: "",
      });
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
      if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, status } : prev));
    }
  }

  async function assignTech(id: string, technician_id: string) {
    const { error } = await supabase
      .from("work_orders")
      .update({ technician_id, status: "assigned" })
      .eq("id", id);
    if (error) toast.error("فشل التعيين");
    else {
      toast.success("تم التعيين");
      loadAll();
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm("حذف أمر العمل نهائياً؟")) return;
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) toast.error("فشل الحذف");
    else {
      toast.success("تم الحذف");
      setSelected(null);
      loadAll();
    }
  }

  const filtered = orders.filter((o) =>
    statusFilter === "all" ? true : o.status === statusFilter
  );

  const stats = {
    open: orders.filter((o) => o.status === "open").length,
    in_progress: orders.filter((o) => o.status === "in_progress" || o.status === "assigned").length,
    completed: orders.filter((o) => o.status === "completed").length,
    urgent: orders.filter(
      (o) => o.priority === "urgent" && o.status !== "completed" && o.status !== "cancelled"
    ).length,
  };

  function techName(id: string | null): string {
    if (!id) return "—";
    return technicians.find((t) => t.id === id)?.name || "—";
  }
  function propTitle(id: string | null): string {
    if (!id) return "—";
    return properties.find((p) => p.id === id)?.title || "—";
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-strong)]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb
          crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "أوامر العمل" }]}
        />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Wrench className="h-7 w-7 text-[var(--gold-1)]" />
              أوامر العمل والصيانة
            </h1>
            <p className="mt-1 text-sm text-[var(--text-faint)]">
              إدارة طلبات الصيانة — من الفتح حتى الإغلاق
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-medium transition hover:bg-[var(--gold-2)]"
          >
            <Plus className="h-4 w-4" /> أمر عمل جديد
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
            <div className="text-xs text-[var(--text-faint)]">مفتوح</div>
          </div>
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4">
            <div className="text-2xl font-bold text-[var(--gold-1)]">{stats.in_progress}</div>
            <div className="text-xs text-[var(--text-faint)]">قيد التنفيذ</div>
          </div>
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4">
            <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
            <div className="text-xs text-[var(--text-faint)]">مكتمل</div>
          </div>
          <div
            className={`rounded-xl border p-4 ${stats.urgent > 0 ? "border-red-500/30 bg-red-950/30" : "border-[var(--gold-bg)] bg-[var(--bg-surface-1)]"}`}
          >
            <div
              className={`flex items-center gap-1 text-2xl font-bold ${stats.urgent > 0 ? "text-red-400" : "text-[var(--text-faint)]"}`}
            >
              {stats.urgent > 0 && <Flame className="h-5 w-5" />}
              {stats.urgent}
            </div>
            <div className="text-xs text-[var(--text-faint)]">عاجل</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 shrink-0 text-[var(--text-faint)]" />
          {["all", ...Object.keys(STATUS_CFG)].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition ${
                statusFilter === s
                  ? "bg-amber-600 text-white"
                  : "border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] text-[var(--text-faint)] hover:bg-[var(--bg-surface-2)]"
              }`}
            >
              {s === "all" ? "الكل" : STATUS_CFG[s as WorkOrder["status"]].label}
              {s !== "all" && ` (${orders.filter((o) => o.status === s).length})`}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="py-12 text-center text-[var(--text-faint)]">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-12 text-center">
            <Wrench className="mx-auto mb-3 h-12 w-12 text-slate-600" />
            <p className="text-[var(--text-faint)]">
              لا يوجد أوامر عمل {statusFilter !== "all" ? "بهذه الحالة" : "بعد"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((o) => {
              const sCfg = STATUS_CFG[o.status];
              const pCfg = PRIORITY_CFG[o.priority];
              const Icon = sCfg.icon;
              return (
                <div
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4 transition hover:border-[var(--gold-bg-hover)]"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border ${sCfg.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-[var(--text-faint)]">
                          {o.ticket_number}
                        </span>
                        <span className={`rounded border px-2 py-0.5 text-xs ${sCfg.color}`}>
                          {sCfg.label}
                        </span>
                        <span className={`rounded border px-2 py-0.5 text-xs ${pCfg.color}`}>
                          {o.priority === "urgent" && "🔥 "}
                          {pCfg.label}
                        </span>
                        {o.kind !== "corrective" && (
                          <span className="rounded border border-[var(--gold-bg-hover)] px-2 py-0.5 text-xs text-[var(--text-faint)]">
                            {o.kind === "preventive" ? "وقائية" : "فحص"}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-semibold">{o.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-faint)]">
                        {o.property_id && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {propTitle(o.property_id)}
                          </span>
                        )}
                        {o.technician_id && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {techName(o.technician_id)}
                          </span>
                        )}
                        {o.scheduled_for && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {fmtDate(o.scheduled_for)}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="my-6 w-full max-w-2xl rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Plus className="h-5 w-5 text-[var(--gold-1)]" /> أمر عمل جديد
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded p-1 hover:bg-[var(--bg-surface-2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">العنوان *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  required
                  placeholder="مثال: تسريب في حمام الشقة 3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">الوصف</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  placeholder="تفاصيل المشكلة..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-soft)]">التصنيف</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-soft)]">الأولوية</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  >
                    <option value="low">منخفض</option>
                    <option value="normal">عادي</option>
                    <option value="high">عالي</option>
                    <option value="urgent">🔥 عاجل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-soft)]">النوع</label>
                  <select
                    value={form.kind}
                    onChange={(e) => setForm({ ...form, kind: e.target.value as any })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                  >
                    <option value="corrective">إصلاح</option>
                    <option value="preventive">وقائية</option>
                    <option value="inspection">فحص</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-soft)]">
                    التكلفة المتوقعة (ر.س)
                  </label>
                  <input
                    type="number"
                    value={form.estimated_cost}
                    onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">العقار</label>
                <select
                  value={form.property_id}
                  onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                >
                  <option value="">— اختر —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">الفني المسؤول</label>
                <select
                  value={form.technician_id}
                  onChange={(e) => setForm({ ...form, technician_id: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                >
                  <option value="">— بدون —</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.specialty ? ` — ${t.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-soft)]">
                    اسم مقدّم الطلب
                  </label>
                  <input
                    value={form.reporter_name}
                    onChange={(e) => setForm({ ...form, reporter_name: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                    placeholder="مستأجر / موظف"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-soft)]">جوال</label>
                  <input
                    value={form.reporter_phone}
                    onChange={(e) => setForm({ ...form, reporter_phone: e.target.value })}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                    dir="ltr"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">موعد التنفيذ</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 transition hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-amber-600 px-4 py-2 font-medium transition hover:bg-[var(--gold-2)] disabled:bg-slate-700"
                >
                  {submitting ? "جارٍ الحفظ..." : "إنشاء"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6 md:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs text-[var(--text-faint)]">
                  {selected.ticket_number}
                </div>
                <h2 className="mt-1 text-xl font-bold">{selected.title}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded p-1 hover:bg-[var(--bg-surface-2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <span
                className={`rounded border px-2 py-0.5 text-xs ${STATUS_CFG[selected.status].color}`}
              >
                {STATUS_CFG[selected.status].label}
              </span>
              <span
                className={`rounded border px-2 py-0.5 text-xs ${PRIORITY_CFG[selected.priority].color}`}
              >
                {selected.priority === "urgent" && "🔥 "}
                {PRIORITY_CFG[selected.priority].label}
              </span>
            </div>

            {selected.description && (
              <div className="mb-4">
                <div className="mb-1 text-xs text-[var(--text-faint)]">الوصف</div>
                <div className="rounded-lg bg-[var(--bg-surface-2)]/50 p-3 text-sm">
                  {selected.description}
                </div>
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-[var(--text-faint)]">العقار</div>
                <div>{propTitle(selected.property_id)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-faint)]">الفني</div>
                <div>{techName(selected.technician_id)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-faint)]">التصنيف</div>
                <div>
                  {CATEGORY_OPTIONS.find((c) => c.value === selected.category)?.label || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-faint)]">أُنشئ</div>
                <div>{fmtDateTime(selected.created_at)}</div>
              </div>
              {selected.started_at && (
                <div>
                  <div className="text-xs text-[var(--text-faint)]">بدأ</div>
                  <div>{fmtDateTime(selected.started_at)}</div>
                </div>
              )}
              {selected.completed_at && (
                <div>
                  <div className="text-xs text-[var(--text-faint)]">أُغلق</div>
                  <div>{fmtDateTime(selected.completed_at)}</div>
                </div>
              )}
              {selected.reporter_name && (
                <div>
                  <div className="text-xs text-[var(--text-faint)]">مقدّم الطلب</div>
                  <div>
                    {selected.reporter_name}
                    {selected.reporter_phone ? ` — ${selected.reporter_phone}` : ""}
                  </div>
                </div>
              )}
              {selected.estimated_cost != null && (
                <div>
                  <div className="text-xs text-[var(--text-faint)]">التكلفة المتوقعة</div>
                  <div>{selected.estimated_cost} ر.س</div>
                </div>
              )}
            </div>

            {/* Quick assign */}
            {selected.status !== "completed" && selected.status !== "cancelled" && (
              <div className="mb-4">
                <div className="mb-1 text-xs text-[var(--text-faint)]">تعيين فني</div>
                <select
                  value={selected.technician_id || ""}
                  onChange={(e) => assignTech(selected.id, e.target.value)}
                  className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm"
                >
                  <option value="">— اختر فني —</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.specialty ? ` — ${t.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status actions */}
            <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {selected.status !== "in_progress" &&
                selected.status !== "completed" &&
                selected.status !== "cancelled" && (
                  <button
                    onClick={() => updateStatus(selected.id, "in_progress")}
                    className="rounded-lg bg-amber-600 px-3 py-2 text-sm hover:bg-[var(--gold-2)]"
                  >
                    ابدأ التنفيذ
                  </button>
                )}
              {selected.status === "in_progress" && (
                <button
                  onClick={() => updateStatus(selected.id, "on_hold")}
                  className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
                >
                  تعليق
                </button>
              )}
              {selected.status !== "completed" && selected.status !== "cancelled" && (
                <button
                  onClick={() => {
                    const r = prompt("ملخص ما تم إنجازه:");
                    if (r !== null) updateStatus(selected.id, "completed", r || undefined);
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500"
                >
                  إغلاق كمكتمل
                </button>
              )}
              {selected.status !== "cancelled" && selected.status !== "completed" && (
                <button
                  onClick={() => updateStatus(selected.id, "cancelled")}
                  className="rounded-lg bg-red-900/50 px-3 py-2 text-sm text-red-300 hover:bg-red-900"
                >
                  إلغاء
                </button>
              )}
            </div>

            {selected.resolution && (
              <div className="mb-3">
                <div className="mb-1 text-xs text-emerald-400">الحل</div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/30 p-3 text-sm">
                  {selected.resolution}
                </div>
              </div>
            )}

            <button
              onClick={() => deleteOrder(selected.id)}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-400 hover:bg-red-900/40"
            >
              <Trash2 className="h-4 w-4" /> حذف نهائياً
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
