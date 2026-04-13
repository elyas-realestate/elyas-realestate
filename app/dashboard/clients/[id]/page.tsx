"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Phone, MapPin, StickyNote, Pencil, Trash2,
  MessageSquare, PhoneCall, MapPinned, Send, Plus, X, Check,
  TrendingUp, Clock, Building2, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../../components/Breadcrumb";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Category config ──────────────────────────────────────────────────────
const CAT_CFG: Record<string, { color: string; bg: string }> = {
  "مشتري":      { color: "#4ADE80", bg: "rgba(74,222,128,0.1)"  },
  "مستثمر":     { color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  "مالك":       { color: "#C6914C", bg: "rgba(198,145,76,0.1)"  },
  "مستأجر":     { color: "#FACC15", bg: "rgba(250,204,21,0.1)"  },
  "وسيط عقاري": { color: "#38BDF8", bg: "rgba(56,189,248,0.1)"  },
};

// ── Activity type config ─────────────────────────────────────────────────
const ACT_CFG: Record<string, { label: string; color: string; icon: any }> = {
  "واتساب":      { label: "واتساب",       color: "#4ADE80", icon: MessageSquare },
  "مكالمة":      { label: "مكالمة",       color: "#38BDF8", icon: PhoneCall     },
  "زيارة":       { label: "زيارة ميدانية", color: "#FACC15", icon: MapPinned     },
  "عرض":         { label: "إرسال عرض",    color: "#C6914C", icon: Send          },
  "ملاحظة":      { label: "ملاحظة",       color: "#A78BFA", icon: StickyNote    },
};

// ── Lead score ───────────────────────────────────────────────────────────
function leadScore(c: any): number {
  let s = 0;
  if (c.full_name) s += 10;
  if (c.phone)     s += 25;
  if (c.city)      s += 15;
  if (c.district)  s += 10;
  if (c.notes)     s += 15 + (c.notes.length > 60 ? 10 : 0);
  if (c.budget)    s += 15;
  if (c.category === "مشتري" || c.category === "مستثمر") s += 10;
  return Math.min(s, 100);
}

function scoreColor(s: number) {
  if (s >= 75) return "#4ADE80";
  if (s >= 45) return "#FACC15";
  return "#F87171";
}

function WAIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ── Format date ──────────────────────────────────────────────────────────
function formatDate(d: string) {
  const date = new Date(d);
  const now  = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60)    return "الآن";
  if (diff < 3600)  return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `اليوم، ${date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff < 172800) return "أمس";
  return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric", year: diff > 86400 * 300 ? "numeric" : undefined });
}

// ════════════════════════════════════════════════════════════════════════
export default function ClientProfile() {
  const params = useParams();
  const router = useRouter();
  const id     = params?.id as string;

  const [client, setClient]   = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [hasActTable, setHasActTable] = useState(true);
  const [loading, setLoading] = useState(true);

  // editing
  const [editMode, setEditMode]   = useState(false);
  const [editForm, setEditForm]   = useState<any>({});
  const [saving, setSaving]       = useState(false);

  // new activity
  const [showAddAct, setShowAddAct] = useState(false);
  const [actForm, setActForm] = useState({ type: "واتساب", note: "" });
  const [addingAct, setAddingAct] = useState(false);

  useEffect(() => { if (id) loadAll(); }, [id]);

  async function loadAll() {
    const [{ data: c }, actRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("client_activities").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(30),
    ]);

    if (!c) { router.push("/dashboard/clients"); return; }
    setClient(c);
    setEditForm({
      full_name: c.full_name || "", phone: c.phone || "",
      category:  c.category  || "", city:  c.city  || "",
      district:  c.district  || "", notes: c.notes || "",
      budget:    c.budget    || "",
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
    const { error } = await supabase.from("clients").update(editForm).eq("id", id);
    if (error) { toast.error("حدث خطأ"); setSaving(false); return; }
    toast.success("تم الحفظ");
    setSaving(false);
    setEditMode(false);
    setClient((p: any) => ({ ...p, ...editForm }));
  }

  async function handleDelete() {
    if (!confirm(`حذف عميل "${client.full_name}"؟`)) return;
    await supabase.from("clients").delete().eq("id", id);
    toast.success("تم الحذف");
    router.push("/dashboard/clients");
  }

  async function handleAddActivity() {
    if (!actForm.note.trim()) { toast.error("أدخل ملاحظة"); return; }
    setAddingAct(true);
    const { error } = await supabase.from("client_activities").insert([{
      client_id: id,
      type:      actForm.type,
      note:      actForm.note,
    }]);
    if (error) { toast.error("حدث خطأ أثناء الإضافة"); setAddingAct(false); return; }
    toast.success("تمت إضافة النشاط");
    setActForm({ type: "واتساب", note: "" });
    setShowAddAct(false);
    setAddingAct(false);
    // reload activities
    const { data } = await supabase.from("client_activities").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(30);
    setActivities(data || []);
  }

  const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C] transition";

  if (loading) return (
    <div dir="rtl" className="max-w-4xl mx-auto">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="skeleton h-64 rounded-xl" />
        <div className="lg:col-span-2 skeleton h-64 rounded-xl" />
      </div>
    </div>
  );

  if (!client) return null;

  const score = leadScore(client);
  const cfg   = CAT_CFG[client.category];

  return (
    <div dir="rtl" className="max-w-5xl">
      <Breadcrumb crumbs={[
        { label: "لوحة التحكم", href: "/dashboard" },
        { label: "العملاء",     href: "/dashboard/clients" },
        { label: client.full_name },
      ]} />

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/clients" className="flex items-center justify-center rounded-xl no-underline transition"
            style={{ width: 36, height: 36, background: "rgba(198,145,76,0.06)", border: "1px solid rgba(198,145,76,0.12)", color: "#9A9AA0" }}>
            <ArrowRight size={16} />
          </Link>
          <div>
            <h2 className="font-cairo font-bold" style={{ fontSize: 20 }}>{client.full_name}</h2>
            <p style={{ fontSize: 12, color: "#5A5A62" }}>ملف العميل الكامل</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition"
              style={{ background: "rgba(198,145,76,0.08)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.2)" }}>
              <Pencil size={14} /> تعديل
            </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition"
            style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", border: "1px solid rgba(248,113,113,0.15)" }}>
            <Trash2 size={14} /> حذف
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left: Profile + actions ── */}
        <div className="space-y-4">

          {/* Profile card */}
          <div className="card-luxury p-5">
            <div className="flex flex-col items-center text-center mb-5">
              <div
                className="flex items-center justify-center rounded-2xl font-cairo font-black mb-3"
                style={{ width: 64, height: 64, background: cfg?.bg || "rgba(198,145,76,0.1)", color: cfg?.color || "#C6914C", fontSize: 28 }}
              >
                {client.full_name?.charAt(0)}
              </div>
              <h3 className="font-cairo font-bold" style={{ fontSize: 18 }}>{client.full_name}</h3>
              {client.category && (
                <span className="status-pill mt-1" style={{ fontSize: 11, background: cfg?.bg, color: cfg?.color }}>
                  {client.category}
                </span>
              )}
              {client.code && <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 4 }}>{client.code}</p>}
            </div>

            {/* Lead score */}
            <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.1)" }}>
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: 12, color: "#9A9AA0" }}>Lead Score</span>
                <span className="font-cairo font-bold" style={{ color: scoreColor(score), fontSize: 14 }}>{score}/100</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.05)" }}>
                <div style={{ height: "100%", borderRadius: 999, width: score + "%", background: scoreColor(score), transition: "width 1s" }} />
              </div>
              <p style={{ fontSize: 10, color: "#5A5A62", marginTop: 6 }}>
                {score >= 75 ? "عميل واعد جداً — تابع بشكل دوري" : score >= 45 ? "اهتمام متوسط — يحتاج مزيداً من التواصل" : "اهتمام منخفض — أكمل بياناته أولاً"}
              </p>
            </div>

            {!editMode ? (
              <div className="space-y-2">
                {client.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#16161A" }}>
                    <Phone size={14} style={{ color: "#C6914C" }} />
                    <a href={`tel:${client.phone}`} className="text-sm no-underline flex-1" style={{ color: "#F5F5F5", direction: "ltr" }}>{client.phone}</a>
                  </div>
                )}
                {(client.city || client.district) && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#16161A" }}>
                    <MapPin size={14} style={{ color: "#C6914C" }} />
                    <p className="text-sm">{[client.district, client.city].filter(Boolean).join(" — ")}</p>
                  </div>
                )}
                {client.budget && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#16161A" }}>
                    <TrendingUp size={14} style={{ color: "#A78BFA" }} />
                    <div>
                      <p style={{ fontSize: 10, color: "#5A5A62" }}>الميزانية</p>
                      <p className="font-cairo font-bold text-sm" style={{ color: "#A78BFA" }}>{client.budget}</p>
                    </div>
                  </div>
                )}
                {client.notes && (
                  <div className="p-3 rounded-xl" style={{ background: "#16161A" }}>
                    <p style={{ fontSize: 10, color: "#5A5A62", marginBottom: 4 }}>ملاحظات</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#9A9AA0" }}>{client.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "الاسم",     key: "full_name" },
                  { label: "الجوال",    key: "phone",    dir: "ltr" },
                  { label: "المدينة",   key: "city"      },
                  { label: "الحي",      key: "district"  },
                  { label: "الميزانية", key: "budget"    },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-[#9A9AA0] mb-1">{f.label}</label>
                    <input value={editForm[f.key]} onChange={e => setEditForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                      dir={(f as any).dir} className={inp} style={{ color: "#F5F5F5", padding: "10px 14px" }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-[#9A9AA0] mb-1">الفئة</label>
                  <select value={editForm.category} onChange={e => setEditForm((p: any) => ({ ...p, category: e.target.value }))} className={inp} style={{ color: "#F5F5F5", padding: "10px 14px" }}>
                    <option value="">اختر...</option>
                    {Object.keys(CAT_CFG).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#9A9AA0] mb-1">ملاحظات</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} rows={3} className={inp} style={{ color: "#F5F5F5" }} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving} className="btn-gold flex-1 py-2.5 text-sm disabled:opacity-50">
                    {saving ? "..." : <><Check size={14} style={{ display: "inline", marginLeft: 4 }} /> حفظ</>}
                  </button>
                  <button onClick={() => setEditMode(false)} className="btn-ghost px-3 py-2.5 text-sm">إلغاء</button>
                </div>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card-luxury p-4">
            <p style={{ fontSize: 12, color: "#5A5A62", marginBottom: 10, fontWeight: 600 }}>إجراءات سريعة</p>
            <div className="space-y-2">
              {client.phone && (
                <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl no-underline font-bold text-sm transition"
                  style={{ background: "rgba(22,163,74,0.12)", color: "#4ADE80", border: "1px solid rgba(22,163,74,0.2)" }}>
                  <WAIcon /> فتح واتساب
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl no-underline font-bold text-sm transition"
                  style={{ background: "rgba(56,189,248,0.08)", color: "#38BDF8", border: "1px solid rgba(56,189,248,0.15)" }}>
                  <PhoneCall size={14} /> اتصال مباشر
                </a>
              )}
              <button onClick={() => { setActForm({ type: "زيارة", note: "" }); setShowAddAct(true); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl font-bold text-sm transition"
                style={{ background: "rgba(250,204,21,0.08)", color: "#FACC15", border: "1px solid rgba(250,204,21,0.15)" }}>
                <MapPinned size={14} /> جدولة زيارة
              </button>
              <button onClick={() => { setActForm({ type: "عرض", note: "" }); setShowAddAct(true); }}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl font-bold text-sm transition"
                style={{ background: "rgba(198,145,76,0.08)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.15)" }}>
                <Send size={14} /> إرسال عرض
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Timeline ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Timeline header */}
          <div className="card-luxury p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock size={15} style={{ color: "#C6914C" }} />
                <h3 className="font-cairo font-bold" style={{ fontSize: 15 }}>سجل النشاطات</h3>
                {activities.length > 0 && (
                  <span className="status-pill gold" style={{ fontSize: 10, padding: "1px 8px" }}>{activities.length}</span>
                )}
              </div>
              <button
                onClick={() => setShowAddAct(v => !v)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition font-medium"
                style={{ background: showAddAct ? "#1C1C22" : "rgba(198,145,76,0.1)", color: showAddAct ? "#9A9AA0" : "#C6914C", border: "1px solid rgba(198,145,76,0.2)" }}
              >
                {showAddAct ? <><X size={13} /> إلغاء</> : <><Plus size={13} /> تسجيل نشاط</>}
              </button>
            </div>

            {/* Add activity form */}
            {showAddAct && (
              <div className="mb-5 p-4 rounded-xl fade-up" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.12)" }}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {Object.entries(ACT_CFG).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setActForm(f => ({ ...f, type: key }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition"
                      style={{
                        background: actForm.type === key ? val.color + "20" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${actForm.type === key ? val.color + "50" : "rgba(255,255,255,0.05)"}`,
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
                  onChange={e => setActForm(f => ({ ...f, note: e.target.value }))}
                  rows={3}
                  placeholder="سجّل ما حدث في هذا التواصل..."
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition mb-3"
                  style={{ background: "#1C1C22", border: "1px solid rgba(198,145,76,0.15)", color: "#F5F5F5", resize: "none" }}
                />
                <div className="flex gap-2">
                  <button onClick={handleAddActivity} disabled={addingAct} className="btn-gold px-5 py-2 text-sm flex-1 disabled:opacity-50">
                    {addingAct ? "جاري الحفظ..." : "حفظ النشاط"}
                  </button>
                  <button onClick={() => setShowAddAct(false)} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
                </div>
              </div>
            )}

            {/* Timeline entries */}
            {!hasActTable ? (
              <div className="text-center py-8 rounded-xl" style={{ background: "rgba(198,145,76,0.03)", border: "1px dashed rgba(198,145,76,0.15)" }}>
                <Clock size={32} className="mx-auto mb-3" style={{ color: "#3A3A42" }} />
                <p style={{ color: "#9A9AA0", fontSize: 14, marginBottom: 6 }}>سجل النشاطات يحتاج إعداداً</p>
                <p style={{ color: "#5A5A62", fontSize: 12, maxWidth: 320, margin: "0 auto" }}>
                  شغّل ملف <code style={{ color: "#C6914C", fontSize: 11 }}>supabase/002_client_activities.sql</code> في Supabase لتفعيل هذه الميزة.
                </p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-10" style={{ color: "#5A5A62" }}>
                <MessageSquare size={28} className="mx-auto mb-2" style={{ color: "#3A3A42" }} />
                <p style={{ fontSize: 13 }}>لا يوجد سجل نشاطات بعد</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>ابدأ بتسجيل أول تواصل مع هذا العميل</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute" style={{ top: 8, bottom: 8, right: 19, width: 2, background: "rgba(198,145,76,0.1)", borderRadius: 999 }} />

                <div className="space-y-5">
                  {activities.map((act, i) => {
                    const cfg = ACT_CFG[act.type] || ACT_CFG["ملاحظة"];
                    const Icon = cfg.icon;
                    return (
                      <div key={act.id || i} className="flex items-start gap-4 pr-1">
                        {/* Dot */}
                        <div
                          className="flex items-center justify-center rounded-full flex-shrink-0 relative z-10"
                          style={{ width: 36, height: 36, background: cfg.color + "15", border: `2px solid ${cfg.color}40` }}
                        >
                          <Icon size={15} style={{ color: cfg.color }} />
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-5" style={{ borderBottom: i < activities.length - 1 ? "1px solid rgba(198,145,76,0.06)" : "none" }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium" style={{ fontSize: 13, color: cfg.color }}>{cfg.label}</span>
                            <span style={{ fontSize: 11, color: "#5A5A62" }}>{formatDate(act.created_at)}</span>
                          </div>
                          <p className="leading-relaxed" style={{ fontSize: 13, color: "#9A9AA0" }}>{act.note}</p>
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
