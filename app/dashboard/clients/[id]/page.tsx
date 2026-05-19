"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  MapPin,
  StickyNote,
  Pencil,
  Trash2,
  MessageSquare,
  PhoneCall,
  MapPinned,
  Send,
  Plus,
  X,
  Check,
  TrendingUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../../components/Breadcrumb";

// ── Category config ──────────────────────────────────────────────────────
const CAT_CFG: Record<string, { color: string; bg: string }> = {
  مشتري: { color: "var(--success)", bg: "rgba(74,222,128,0.1)" },
  مستثمر: { color: "var(--purple-ai)", bg: "rgba(167,139,250,0.1)" },
  مالك: { color: "var(--gold-2)", bg: "var(--gold-bg)" },
  مستأجر: { color: "var(--warning)", bg: "rgba(250,204,21,0.1)" },
  "وسيط عقاري": { color: "var(--info-2)", bg: "rgba(56,189,248,0.1)" },
};

// ── Activity type config ─────────────────────────────────────────────────
const ACT_CFG: Record<
  string,
  { label: string; color: string; icon: import("lucide-react").LucideIcon }
> = {
  واتساب: { label: "واتساب", color: "var(--success)", icon: MessageSquare },
  مكالمة: { label: "مكالمة", color: "var(--info-2)", icon: PhoneCall },
  زيارة: { label: "زيارة ميدانية", color: "var(--warning)", icon: MapPinned },
  عرض: { label: "إرسال عرض", color: "var(--gold-2)", icon: Send },
  ملاحظة: { label: "ملاحظة", color: "var(--purple-ai)", icon: StickyNote },
};

// ── Lead score ───────────────────────────────────────────────────────────
interface ClientLite {
  id?: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  category?: string | null;
  city?: string | null;
  district?: string | null;
  notes?: string | null;
  sentiment?: string | null;
  budget?: string | number | null;
  code?: string | null;
  created_at?: string | null;
}

function leadScore(c: ClientLite): number {
  let s = 0;
  if (c.full_name) s += 10;
  if (c.phone) s += 25;
  if (c.city) s += 15;
  if (c.district) s += 10;
  if (c.notes) s += 15 + (c.notes.length > 60 ? 10 : 0);
  if (c.budget) s += 15;
  if (c.category === "مشتري" || c.category === "مستثمر") s += 10;
  return Math.min(s, 100);
}

function scoreColor(s: number) {
  if (s >= 75) return "var(--success)";
  if (s >= 45) return "var(--warning)";
  return "var(--danger)";
}

function WAIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Format date ──────────────────────────────────────────────────────────
function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400)
    return `اليوم، ${date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 172800) return "أمس";
  return date.toLocaleDateString("ar-SA", {
    month: "short",
    day: "numeric",
    year: diff > 86400 * 300 ? "numeric" : undefined,
  });
}

// ════════════════════════════════════════════════════════════════════════
export default function ClientProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [client, setClient] = useState<ClientLite | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>([]);
  const [hasActTable, setHasActTable] = useState(true);
  const [loading, setLoading] = useState(true);

  // editing
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // new activity
  const [showAddAct, setShowAddAct] = useState(false);
  const [actForm, setActForm] = useState({ type: "واتساب", note: "" });
  const [addingAct, setAddingAct] = useState(false);

  useEffect(() => {
    if (id) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadAll() {
    const [{ data: c }, actRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (!c) {
      router.push("/dashboard/clients");
      return;
    }
    setClient(c);
    // ملاحظة: budget قد يأتي عبر join مع property_requests، لذا cast آمن
    const withBudget = c as typeof c & { budget?: string | number | null };
    setEditForm({
      full_name: c.full_name || "",
      phone: c.phone || "",
      category: c.category || "",
      city: c.city || "",
      district: c.district || "",
      notes: c.notes || "",
      budget: String(withBudget.budget ?? ""),
    });

    if (actRes.error?.message?.includes("does not exist") || actRes.error?.code === "42P01") {
      setHasActTable(false);
    } else {
      setActivities(actRes.data || []);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("clients")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(editForm as any)
      .eq("id", id);
    if (error) {
      toast.error("حدث خطأ");
      setSaving(false);
      return;
    }
    toast.success("تم الحفظ");
    setSaving(false);
    setEditMode(false);
    setClient((p) => (p ? { ...p, ...editForm } : p));
  }

  async function handleDelete() {
    if (!confirm(`حذف عميل "${client?.full_name || ""}"؟`)) return;
    await supabase.from("clients").delete().eq("id", id);
    toast.success("تم الحذف");
    router.push("/dashboard/clients");
  }

  async function handleAddActivity() {
    if (!actForm.note.trim()) {
      toast.error("أدخل ملاحظة");
      return;
    }
    setAddingAct(true);
    const { error } = await supabase.from("client_activities").insert([
      {
        client_id: id,
        type: actForm.type,
        note: actForm.note,
      },
    ]);
    if (error) {
      toast.error("حدث خطأ أثناء الإضافة");
      setAddingAct(false);
      return;
    }
    toast.success("تمت إضافة النشاط");
    setActForm({ type: "واتساب", note: "" });
    setShowAddAct(false);
    setAddingAct(false);
    // reload activities
    const { data } = await supabase
      .from("client_activities")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(30);
    setActivities(data || []);
  }

  const inp =
    "w-full bg-[var(--bg-surface-2)] border border-[var(--gold-bg-hover)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--gold-2)] transition";

  if (loading)
    return (
      <div dir="rtl" className="mx-auto max-w-4xl">
        <div className="skeleton mb-6 h-8 w-48 rounded" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );

  if (!client) return null;

  const score = leadScore(client);
  const cfg = CAT_CFG[client.category || ""];

  return (
    <div dir="rtl" className="max-w-5xl">
      <Breadcrumb
        crumbs={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "العملاء", href: "/dashboard/clients" },
          { label: client.full_name || "" },
        ]}
      />

      {/* ── Page header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/clients"
            className="flex items-center justify-center rounded-xl no-underline transition"
            style={{
              width: 36,
              height: 36,
              background: "var(--gold-bg-soft)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)",
            }}
          >
            <ArrowRight size={16} />
          </Link>
          <div>
            <h2 className="font-cairo font-bold" style={{ fontSize: 20 }}>
              {client.full_name}
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-faint)" }}>ملف العميل الكامل</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm transition"
              style={{
                background: "var(--gold-bg-soft)",
                color: "var(--gold-2)",
                border: "1px solid var(--gold-bg-hover)",
              }}
            >
              <Pencil size={14} /> تعديل
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm transition"
            style={{
              background: "rgba(248,113,113,0.08)",
              color: "var(--danger)",
              border: "1px solid rgba(248,113,113,0.15)",
            }}
          >
            <Trash2 size={14} /> حذف
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Left: Profile + actions ── */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="card-luxury p-5">
            <div className="mb-5 flex flex-col items-center text-center">
              <div
                className="font-cairo mb-3 flex items-center justify-center rounded-2xl font-black"
                style={{
                  width: 64,
                  height: 64,
                  background: cfg?.bg || "var(--gold-bg)",
                  color: cfg?.color || "var(--gold-2)",
                  fontSize: 28,
                }}
              >
                {client.full_name?.charAt(0)}
              </div>
              <h3 className="font-cairo font-bold" style={{ fontSize: 18 }}>
                {client.full_name}
              </h3>
              {client.category && (
                <span
                  className="status-pill mt-1"
                  style={{ fontSize: 11, background: cfg?.bg, color: cfg?.color }}
                >
                  {client.category}
                </span>
              )}
              {client.code && (
                <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                  {client.code}
                </p>
              )}
            </div>

            {/* Lead score */}
            <div
              className="mb-4 rounded-xl p-3"
              style={{ background: "rgba(198,145,76,0.04)", border: "1px solid var(--gold-bg)" }}
            >
              <div className="mb-2 flex justify-between">
                <span style={{ fontSize: 12, color: "var(--text-soft)" }}>Lead Score</span>
                <span
                  className="font-cairo font-bold"
                  style={{ color: scoreColor(score), fontSize: 14 }}
                >
                  {score}/100
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "var(--overlay-soft)" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    width: score + "%",
                    background: scoreColor(score),
                    transition: "width 1s",
                  }}
                />
              </div>
              <p style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 6 }}>
                {score >= 75
                  ? "عميل واعد جداً — تابع بشكل دوري"
                  : score >= 45
                    ? "اهتمام متوسط — يحتاج مزيداً من التواصل"
                    : "اهتمام منخفض — أكمل بياناته أولاً"}
              </p>
            </div>

            {!editMode ? (
              <div className="space-y-2">
                {client.phone && (
                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "var(--bg-surface-1)" }}
                  >
                    <Phone size={14} style={{ color: "var(--gold-2)" }} />
                    <a
                      href={`tel:${client.phone}`}
                      className="flex-1 text-sm no-underline"
                      style={{ color: "var(--text-strong)", direction: "ltr" }}
                    >
                      {client.phone}
                    </a>
                  </div>
                )}
                {(client.city || client.district) && (
                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "var(--bg-surface-1)" }}
                  >
                    <MapPin size={14} style={{ color: "var(--gold-2)" }} />
                    <p className="text-sm">
                      {[client.district, client.city].filter(Boolean).join(" — ")}
                    </p>
                  </div>
                )}
                {client.budget && (
                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "var(--bg-surface-1)" }}
                  >
                    <TrendingUp size={14} style={{ color: "var(--purple-ai)" }} />
                    <div>
                      <p style={{ fontSize: 10, color: "var(--text-faint)" }}>الميزانية</p>
                      <p
                        className="font-cairo text-sm font-bold"
                        style={{ color: "var(--purple-ai)" }}
                      >
                        {client.budget}
                      </p>
                    </div>
                  </div>
                )}
                {client.notes && (
                  <div className="rounded-xl p-3" style={{ background: "var(--bg-surface-1)" }}>
                    <p style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 4 }}>
                      ملاحظات
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
                      {client.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "الاسم", key: "full_name" },
                  { label: "الجوال", key: "phone", dir: "ltr" },
                  { label: "المدينة", key: "city" },
                  { label: "الحي", key: "district" },
                  { label: "الميزانية", key: "budget" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-xs text-[var(--text-soft)]">{f.label}</label>
                    <input
                      value={(editForm as Record<string, string>)[f.key]}
                      onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      dir={(f as { dir?: string }).dir}
                      className={inp}
                      style={{ color: "var(--text-strong)", padding: "10px 14px" }}
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-soft)]">الفئة</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                    className={inp}
                    style={{ color: "var(--text-strong)", padding: "10px 14px" }}
                  >
                    <option value="">اختر...</option>
                    {Object.keys(CAT_CFG).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-soft)]">ملاحظات</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    className={inp}
                    style={{ color: "var(--text-strong)" }}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-gold flex-1 py-2.5 text-sm disabled:opacity-50"
                  >
                    {saving ? (
                      "..."
                    ) : (
                      <>
                        <Check size={14} style={{ display: "inline", marginLeft: 4 }} /> حفظ
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="btn-ghost px-3 py-2.5 text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card-luxury p-4">
            <p
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              إجراءات سريعة
            </p>
            <div className="space-y-2">
              {client.phone && (
                <a
                  href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold no-underline transition"
                  style={{
                    background: "rgba(22,163,74,0.12)",
                    color: "var(--success)",
                    border: "1px solid rgba(22,163,74,0.2)",
                  }}
                >
                  <WAIcon /> فتح واتساب
                </a>
              )}
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold no-underline transition"
                  style={{
                    background: "rgba(56,189,248,0.08)",
                    color: "var(--info-2)",
                    border: "1px solid rgba(56,189,248,0.15)",
                  }}
                >
                  <PhoneCall size={14} /> اتصال مباشر
                </a>
              )}
              <button
                onClick={() => {
                  setActForm({ type: "زيارة", note: "" });
                  setShowAddAct(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition"
                style={{
                  background: "rgba(250,204,21,0.08)",
                  color: "var(--warning)",
                  border: "1px solid rgba(250,204,21,0.15)",
                }}
              >
                <MapPinned size={14} /> جدولة زيارة
              </button>
              <button
                onClick={() => {
                  setActForm({ type: "عرض", note: "" });
                  setShowAddAct(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition"
                style={{
                  background: "var(--gold-bg-soft)",
                  color: "var(--gold-2)",
                  border: "1px solid var(--gold-bg-hover)",
                }}
              >
                <Send size={14} /> إرسال عرض
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Timeline ── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Timeline header */}
          <div className="card-luxury p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={15} style={{ color: "var(--gold-2)" }} />
                <h3 className="font-cairo font-bold" style={{ fontSize: 15 }}>
                  سجل النشاطات
                </h3>
                {activities.length > 0 && (
                  <span className="status-pill gold" style={{ fontSize: 10, padding: "1px 8px" }}>
                    {activities.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowAddAct((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition"
                style={{
                  background: showAddAct ? "var(--bg-surface-2)" : "var(--gold-bg)",
                  color: showAddAct ? "var(--text-soft)" : "var(--gold-2)",
                  border: "1px solid var(--gold-bg-hover)",
                }}
              >
                {showAddAct ? (
                  <>
                    <X size={13} /> إلغاء
                  </>
                ) : (
                  <>
                    <Plus size={13} /> تسجيل نشاط
                  </>
                )}
              </button>
            </div>

            {/* Add activity form */}
            {showAddAct && (
              <div
                className="fade-up mb-5 rounded-xl p-4"
                style={{ background: "rgba(198,145,76,0.04)", border: "1px solid var(--gold-bg)" }}
              >
                <div className="mb-3 grid grid-cols-2 gap-3">
                  {Object.entries(ACT_CFG).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setActForm((f) => ({ ...f, type: key }))}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
                      style={{
                        background:
                          actForm.type === key ? val.color + "20" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${actForm.type === key ? val.color + "50" : "var(--overlay-soft)"}`,
                        color: actForm.type === key ? val.color : "#7A7A82",
                      }}
                    >
                      <val.icon size={13} />
                      {val.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={actForm.note}
                  onChange={(e) => setActForm((f) => ({ ...f, note: e.target.value }))}
                  rows={3}
                  placeholder="سجّل ما حدث في هذا التواصل..."
                  className="mb-3 w-full rounded-xl px-4 py-3 text-sm transition focus:outline-none"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--gold-bg-hover)",
                    color: "var(--text-strong)",
                    resize: "none",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddActivity}
                    disabled={addingAct}
                    className="btn-gold flex-1 px-5 py-2 text-sm disabled:opacity-50"
                  >
                    {addingAct ? "جاري الحفظ..." : "حفظ النشاط"}
                  </button>
                  <button
                    onClick={() => setShowAddAct(false)}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Timeline entries */}
            {!hasActTable ? (
              <div
                className="rounded-xl py-8 text-center"
                style={{
                  background: "rgba(198,145,76,0.03)",
                  border: "1px dashed var(--gold-bg-hover)",
                }}
              >
                <Clock size={32} className="mx-auto mb-3" style={{ color: "var(--border-1)" }} />
                <p style={{ color: "var(--text-soft)", fontSize: 14, marginBottom: 6 }}>
                  سجل النشاطات يحتاج إعداداً
                </p>
                <p
                  style={{
                    color: "var(--text-faint)",
                    fontSize: 12,
                    maxWidth: 320,
                    margin: "0 auto",
                  }}
                >
                  شغّل ملف{" "}
                  <code style={{ color: "var(--gold-2)", fontSize: 11 }}>
                    supabase/002_client_activities.sql
                  </code>{" "}
                  في Supabase لتفعيل هذه الميزة.
                </p>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-10 text-center" style={{ color: "var(--text-faint)" }}>
                <MessageSquare
                  size={28}
                  className="mx-auto mb-2"
                  style={{ color: "var(--border-1)" }}
                />
                <p style={{ fontSize: 13 }}>لا يوجد سجل نشاطات بعد</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>ابدأ بتسجيل أول تواصل مع هذا العميل</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div
                  className="absolute"
                  style={{
                    top: 8,
                    bottom: 8,
                    right: 19,
                    width: 2,
                    background: "var(--gold-bg)",
                    borderRadius: 999,
                  }}
                />

                <div className="space-y-5">
                  {activities.map((act, i) => {
                    const cfg = ACT_CFG[act.type] || ACT_CFG["ملاحظة"];
                    const Icon = cfg.icon;
                    return (
                      <div key={act.id || i} className="flex items-start gap-4 pr-1">
                        {/* Dot */}
                        <div
                          className="relative z-10 flex flex-shrink-0 items-center justify-center rounded-full"
                          style={{
                            width: 36,
                            height: 36,
                            background: cfg.color + "15",
                            border: `2px solid ${cfg.color}40`,
                          }}
                        >
                          <Icon size={15} style={{ color: cfg.color }} />
                        </div>
                        {/* Content */}
                        <div
                          className="flex-1 pb-5"
                          style={{
                            borderBottom:
                              i < activities.length - 1 ? "1px solid var(--gold-bg-soft)" : "none",
                          }}
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span
                              className="font-medium"
                              style={{ fontSize: 13, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
                              {formatDate(act.created_at)}
                            </span>
                          </div>
                          <p
                            className="leading-relaxed"
                            style={{ fontSize: 13, color: "var(--text-soft)" }}
                          >
                            {act.note}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
