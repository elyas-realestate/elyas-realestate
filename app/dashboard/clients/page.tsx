"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Plus, Search, X, Phone, MapPin, StickyNote, Pencil, Trash2,
  Users, TrendingUp, ChevronLeft, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const emptyForm = { full_name: "", phone: "", category: "", city: "", district: "", notes: "", budget: "" };

// ── Category config ──────────────────────────────────────────────────────
const CAT_CFG: Record<string, { color: string; bg: string; dot: string }> = {
  "مشتري":      { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  dot: "#4ADE80"  },
  "مستثمر":     { color: "#A78BFA", bg: "rgba(167,139,250,0.1)", dot: "#A78BFA"  },
  "مالك":       { color: "#C6914C", bg: "rgba(198,145,76,0.1)",  dot: "#C6914C"  },
  "مستأجر":     { color: "#FACC15", bg: "rgba(250,204,21,0.1)",  dot: "#FACC15"  },
  "وسيط عقاري": { color: "#38BDF8", bg: "rgba(56,189,248,0.1)",  dot: "#38BDF8"  },
};

// ── Lead score (0–100) ───────────────────────────────────────────────────
function leadScore(c: any): number {
  let s = 0;
  if (c.full_name)  s += 10;
  if (c.phone)      s += 25;
  if (c.city)       s += 15;
  if (c.district)   s += 10;
  if (c.notes)      s += 15 + (c.notes.length > 60 ? 10 : 0);
  if (c.budget)     s += 15;
  if (c.category === "مشتري" || c.category === "مستثمر") s += 10;
  return Math.min(s, 100);
}

function scoreColor(s: number) {
  if (s >= 75) return "#4ADE80";
  if (s >= 45) return "#FACC15";
  return "#F87171";
}

// ── WhatsApp icon ────────────────────────────────────────────────────────
function WAIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────
export default function Clients() {
  const [clients, setClients]   = useState<any[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ ...emptyForm });
  const [activeTab, setActiveTab] = useState("الكل");

  // drawer
  const [selected, setSelected] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [saving, setSaving]     = useState(false);

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    const { error } = await supabase.from("clients").insert([{ ...form }]);
    if (error) { toast.error("حدث خطأ أثناء الإضافة"); return; }
    toast.success("تمت إضافة العميل بنجاح");
    setForm({ ...emptyForm });
    setShowAdd(false);
    loadClients();
  }

  async function handleSaveEdit() {
    setSaving(true);
    const { error } = await supabase.from("clients").update(editForm).eq("id", selected.id);
    if (error) { toast.error("حدث خطأ"); setSaving(false); return; }
    toast.success("تم تحديث بيانات العميل");
    setSaving(false);
    setEditMode(false);
    const updated = { ...selected, ...editForm };
    setSelected(updated);
    setClients(prev => prev.map(c => c.id === selected.id ? updated : c));
  }

  async function handleDelete() {
    if (!confirm(`هل أنت متأكد من حذف "${selected.full_name}"؟`)) return;
    await supabase.from("clients").delete().eq("id", selected.id);
    toast.success("تم حذف العميل");
    setClients(prev => prev.filter(c => c.id !== selected.id));
    setSelected(null);
  }

  function openDrawer(client: any) {
    setSelected(client);
    setEditForm({
      full_name: client.full_name || "", phone: client.phone || "",
      category:  client.category || "", city:  client.city  || "",
      district:  client.district || "", notes: client.notes || "",
      budget:    client.budget   || "",
    });
    setEditMode(false);
  }

  // ── Category counts ─────────────────────────────────────────────────
  const catCounts = useMemo(() => {
    const c: Record<string, number> = { "الكل": clients.length };
    clients.forEach(cl => { if (cl.category) c[cl.category] = (c[cl.category] || 0) + 1; });
    return c;
  }, [clients]);

  const tabs = ["الكل", ...Object.keys(CAT_CFG).filter(k => catCounts[k])];

  // ── Filtered list ───────────────────────────────────────────────────
  const filtered = useMemo(() =>
    clients.filter(c => {
      const matchSearch = !search || c.full_name?.includes(search) || c.phone?.includes(search);
      const matchTab    = activeTab === "الكل" || c.category === activeTab;
      return matchSearch && matchTab;
    }),
    [clients, search, activeTab]
  );

  // ── Sort by score ───────────────────────────────────────────────────
  const sorted = useMemo(() => [...filtered].sort((a, b) => leadScore(b) - leadScore(a)), [filtered]);

  const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C] transition";

  if (loading) return (
    <div dir="rtl">
      <div className="skeleton h-8 rounded w-40 mb-6" />
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl mb-3" />)}
    </div>
  );

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "العملاء" }]} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="font-cairo font-bold" style={{ fontSize: 22 }}>إدارة العملاء</h2>
          <p style={{ color: "#5A5A62", fontSize: 13, marginTop: 2 }}>
            {clients.length} عميل — مرتّبون حسب درجة الاهتمام
          </p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-sm"
          style={{
            background: showAdd ? "#1C1C22" : "linear-gradient(135deg, #C6914C, #A6743A)",
            color: showAdd ? "#9A9AA0" : "#0A0A0C",
            border: showAdd ? "1px solid rgba(198,145,76,0.15)" : "none",
          }}
        >
          {showAdd ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> إضافة عميل</>}
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "إجمالي العملاء",   value: clients.length,                                                  color: "#C6914C", icon: Users      },
          { label: "مشترين ومستثمرين", value: (catCounts["مشتري"] || 0) + (catCounts["مستثمر"] || 0),          color: "#4ADE80", icon: TrendingUp  },
          { label: "لديهم ميزانية",    value: clients.filter(c => c.budget).length,                           color: "#A78BFA", icon: TrendingUp  },
          { label: "درجة عالية (75+)", value: clients.filter(c => leadScore(c) >= 75).length,                 color: "#FACC15", icon: Users       },
        ].map(s => (
          <div key={s.label} className="card-luxury p-4">
            <div className="font-cairo font-bold" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#5A5A62", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Add form ── */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="card-luxury p-5 mb-6 fade-up">
          <h3 className="font-cairo font-bold mb-4" style={{ color: "#C6914C", fontSize: 13, letterSpacing: 1 }}>عميل جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الاسم الكامل *</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required className={inp} style={{ color: "#F5F5F5" }} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">رقم الجوال</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inp} style={{ color: "#F5F5F5" }} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الفئة *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required className={inp} style={{ color: "#F5F5F5" }}>
                <option value="">اختر...</option>
                {Object.keys(CAT_CFG).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">المدينة</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inp} style={{ color: "#F5F5F5" }} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الحي</label>
              <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className={inp} style={{ color: "#F5F5F5" }} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الميزانية التقريبية</label>
              <input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className={inp} style={{ color: "#F5F5F5" }} placeholder="مثال: 1,200,000 ر.س" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inp} style={{ color: "#F5F5F5" }} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-gold px-6 py-2.5 text-sm">حفظ</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost px-6 py-2.5 text-sm">إلغاء</button>
            </div>
          </div>
        </form>
      )}

      {/* ── Search + Filter tabs ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-3.5" style={{ color: "#5A5A62" }} />
          <input
            type="text" placeholder="ابحث بالاسم أو الجوال..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none transition"
            style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", color: "#F5F5F5" }}
          />
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition flex-shrink-0"
            style={{
              background: activeTab === tab ? "rgba(198,145,76,0.12)" : "rgba(198,145,76,0.04)",
              color: activeTab === tab ? "#C6914C" : "#7A7A82",
              border: `1px solid ${activeTab === tab ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.08)"}`,
            }}
          >
            {tab !== "الكل" && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_CFG[tab]?.dot || "#C6914C" }} />
            )}
            {tab}
            <span style={{ fontSize: 11, opacity: 0.7 }}>({catCounts[tab] || 0})</span>
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <Users size={40} className="mx-auto mb-3" style={{ color: "#3A3A42" }} />
          <p className="mb-4" style={{ color: "#9A9AA0" }}>لا يوجد عملاء</p>
          <button onClick={() => setShowAdd(true)} className="btn-gold px-6 py-3 text-sm">أضف أول عميل</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(client => {
            const score = leadScore(client);
            const cfg   = CAT_CFG[client.category];
            return (
              <div
                key={client.id}
                className="card-luxury p-5 cursor-pointer group"
                onClick={() => openDrawer(client)}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* Avatar initial */}
                    <div
                      className="flex items-center justify-center rounded-xl font-cairo font-bold flex-shrink-0"
                      style={{ width: 38, height: 38, background: cfg?.bg || "rgba(198,145,76,0.1)", color: cfg?.color || "#C6914C", fontSize: 16 }}
                    >
                      {client.full_name?.charAt(0) || "؟"}
                    </div>
                    <div>
                      <p className="font-cairo font-bold" style={{ fontSize: 14, color: "#F5F5F5", lineHeight: 1.2 }}>{client.full_name}</p>
                      {client.code && <p style={{ fontSize: 10, color: "#5A5A62" }}>{client.code}</p>}
                    </div>
                  </div>
                  {/* Lead score badge */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="font-cairo font-bold"
                      style={{ fontSize: 16, color: scoreColor(score), lineHeight: 1 }}
                    >
                      {score}
                    </div>
                    <div style={{ fontSize: 9, color: "#5A5A62", marginTop: 1 }}>نقطة</div>
                  </div>
                </div>

                {/* Score bar */}
                <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.05)", marginBottom: 12 }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    background: scoreColor(score),
                    width: score + "%",
                  }} />
                </div>

                {/* Category + details */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {client.category && (
                    <span className="status-pill" style={{ fontSize: 10, padding: "2px 8px", background: cfg?.bg || "rgba(198,145,76,0.1)", color: cfg?.color || "#C6914C" }}>
                      {client.category}
                    </span>
                  )}
                  {client.budget && (
                    <span style={{ fontSize: 11, color: "#A78BFA" }}>{client.budget}</span>
                  )}
                </div>

                {client.phone && (
                  <p style={{ fontSize: 12, color: "#7A7A82", direction: "ltr", textAlign: "right" }}>{client.phone}</p>
                )}
                {(client.city || client.district) && (
                  <p style={{ fontSize: 12, color: "#5A5A62" }}>
                    <MapPin size={11} style={{ display: "inline", marginLeft: 3 }} />
                    {[client.district, client.city].filter(Boolean).join(" — ")}
                  </p>
                )}
                {client.notes && (
                  <p className="mt-2 line-clamp-1" style={{ fontSize: 11, color: "#5A5A62" }}>{client.notes}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(198,145,76,0.07)" }}>
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="flex items-center gap-1 no-underline text-xs font-medium transition"
                    style={{ color: "#C6914C" }}
                    onClick={e => e.stopPropagation()}
                  >
                    فتح الملف <ChevronLeft size={12} />
                  </Link>
                  {client.phone && (
                    <a
                      href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 no-underline text-xs transition"
                      style={{ color: "#5A5A62" }}
                      onClick={e => e.stopPropagation()}
                    >
                      <WAIcon /> واتساب
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ QUICK DRAWER ═══ */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} onClick={() => setSelected(null)} />
          <div
            className="fixed top-0 left-0 bottom-0 z-50 overflow-y-auto fade-up"
            style={{ width: "min(420px, 100vw)", background: "#0D0D10", borderRight: "1px solid rgba(198,145,76,0.12)" }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0"
              style={{ background: "#0D0D10", borderBottom: "1px solid rgba(198,145,76,0.1)" }}
            >
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition"
                    style={{ background: "rgba(198,145,76,0.08)", color: "#C6914C" }}>
                    <Pencil size={13} /> تعديل
                  </button>
                )}
                <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition"
                  style={{ background: "rgba(248,113,113,0.08)", color: "#F87171" }}>
                  <Trash2 size={13} /> حذف
                </button>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: "#5A5A62", background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              {!editMode ? (
                <div className="space-y-4">
                  {/* Profile header */}
                  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "rgba(198,145,76,0.05)", border: "1px solid rgba(198,145,76,0.1)" }}>
                    <div
                      className="flex items-center justify-center rounded-xl font-cairo font-black flex-shrink-0"
                      style={{ width: 52, height: 52, background: CAT_CFG[selected.category]?.bg || "rgba(198,145,76,0.1)", color: CAT_CFG[selected.category]?.color || "#C6914C", fontSize: 22 }}
                    >
                      {selected.full_name?.charAt(0) || "؟"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-cairo font-bold" style={{ fontSize: 18, color: "#F5F5F5" }}>{selected.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {selected.category && (
                          <span className="status-pill" style={{ fontSize: 10, padding: "2px 8px", background: CAT_CFG[selected.category]?.bg, color: CAT_CFG[selected.category]?.color }}>
                            {selected.category}
                          </span>
                        )}
                        {selected.code && <span style={{ fontSize: 11, color: "#5A5A62" }}>{selected.code}</span>}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-cairo font-bold" style={{ fontSize: 20, color: scoreColor(leadScore(selected)) }}>{leadScore(selected)}</div>
                      <div style={{ fontSize: 9, color: "#5A5A62" }}>Lead Score</div>
                    </div>
                  </div>

                  {/* Info */}
                  {selected.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#16161A" }}>
                      <Phone size={15} style={{ color: "#C6914C" }} />
                      <a href={`tel:${selected.phone}`} className="text-sm no-underline flex-1" style={{ color: "#F5F5F5", direction: "ltr" }}>{selected.phone}</a>
                    </div>
                  )}
                  {(selected.city || selected.district) && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#16161A" }}>
                      <MapPin size={15} style={{ color: "#C6914C" }} />
                      <p className="text-sm">{[selected.district, selected.city].filter(Boolean).join(" — ")}</p>
                    </div>
                  )}
                  {selected.budget && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#16161A" }}>
                      <TrendingUp size={15} style={{ color: "#A78BFA" }} />
                      <div>
                        <p style={{ fontSize: 11, color: "#5A5A62" }}>الميزانية</p>
                        <p className="font-cairo font-bold text-sm" style={{ color: "#A78BFA" }}>{selected.budget}</p>
                      </div>
                    </div>
                  )}
                  {selected.notes && (
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#16161A" }}>
                      <StickyNote size={15} style={{ color: "#C6914C", marginTop: 2, flexShrink: 0 }} />
                      <p className="text-sm leading-relaxed" style={{ color: "#9A9AA0" }}>{selected.notes}</p>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {selected.phone && (
                      <a
                        href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl no-underline font-bold text-sm transition"
                        style={{ background: "#16A34A", color: "#fff" }}
                      >
                        <WAIcon /> واتساب
                      </a>
                    )}
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl no-underline font-bold text-sm transition"
                        style={{ background: "rgba(198,145,76,0.1)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.2)" }}>
                        <Phone size={14} /> اتصال
                      </a>
                    )}
                  </div>

                  {/* Full profile link */}
                  <Link
                    href={`/dashboard/clients/${selected.id}`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl no-underline text-sm font-bold transition"
                    style={{ background: "rgba(198,145,76,0.06)", border: "1px solid rgba(198,145,76,0.12)", color: "#C6914C" }}
                  >
                    <MessageCircle size={14} />
                    فتح الملف الكامل مع السجل
                    <ChevronLeft size={13} />
                  </Link>
                </div>
              ) : (
                /* Edit mode */
                <div className="space-y-4">
                  {[
                    { label: "الاسم الكامل", key: "full_name", type: "text" },
                    { label: "رقم الجوال",   key: "phone",     type: "tel", dir: "ltr" },
                    { label: "المدينة",       key: "city",      type: "text" },
                    { label: "الحي",          key: "district",  type: "text" },
                    { label: "الميزانية",     key: "budget",    type: "text" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm text-[#9A9AA0] mb-2">{f.label}</label>
                      <input
                        type={f.type} dir={(f as any).dir}
                        value={(editForm as any)[f.key]}
                        onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className={inp} style={{ color: "#F5F5F5" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">الفئة</label>
                    <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className={inp} style={{ color: "#F5F5F5" }}>
                      <option value="">اختر...</option>
                      {Object.keys(CAT_CFG).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">ملاحظات</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} className={inp} style={{ color: "#F5F5F5" }} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSaveEdit} disabled={saving} className="btn-gold flex-1 py-3 text-sm disabled:opacity-50">
                      {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </button>
                    <button onClick={() => setEditMode(false)} className="btn-ghost px-4 py-3 text-sm">إلغاء</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
