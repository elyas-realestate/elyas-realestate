"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Megaphone, GitCompare, Plus, X, Edit3, Check, Trash2,
  Instagram, Twitter, Play, Pause, CheckCircle2, Clock,
  AlertCircle, TrendingUp, Users, DollarSign, Printer,
  ChevronDown, ChevronUp, Copy,
} from "lucide-react";
import { toast } from "sonner";
import SARIcon from "../../components/SARIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric" });
}
function fmtNum(n: number) {
  return (n || 0).toLocaleString("ar-SA");
}
function daysLeft(end: string | null) {
  if (!end) return null;
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return diff;
}

// ── Platforms ────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "انستقرام", label: "إنستقرام", color: "#E1306C" },
  { id: "تويتر",    label: "تويتر / X", color: "#1DA1F2" },
  { id: "سناب",     label: "سناب شات",  color: "#FFFC00" },
  { id: "تيك توك",  label: "تيك توك",   color: "#EE1D52" },
  { id: "يوتيوب",   label: "يوتيوب",    color: "#FF0000" },
  { id: "واتساب",   label: "واتساب",    color: "#25D366" },
  { id: "إعلان مدفوع", label: "إعلان مدفوع", color: "#C6914C" },
];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  "مسودة":   { color: "#9A9AA0", bg: "rgba(154,154,160,0.08)", icon: Clock        },
  "نشطة":    { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",   icon: Play         },
  "منتهية":  { color: "#C6914C", bg: "rgba(198,145,76,0.1)",   icon: CheckCircle2 },
  "موقوفة":  { color: "#F87171", bg: "rgba(248,113,113,0.1)",  icon: Pause        },
};

const STATUSES = ["مسودة", "نشطة", "منتهية", "موقوفة"];

const inp  = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#3A3A42] focus:outline-none focus:border-[#C6914C] transition";
const lbl  = "block text-xs font-semibold text-[#9A9AA0] mb-2 tracking-wide";

// ══════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS TAB
// ══════════════════════════════════════════════════════════════════════════════
function CampaignsTab() {
  const [campaigns, setCampaigns]     = useState<any[]>([]);
  const [properties, setProperties]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [form, setForm] = useState({
    title: "", property_id: "", platforms: [] as string[],
    budget: "", start_date: "", end_date: "", status: "مسودة",
    leads_count: "0", notes: "",
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [c, p] = await Promise.all([
      supabase.from("campaigns").select("*, properties(title)").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, title").eq("is_published", true),
    ]);
    if (c.error?.message?.includes("does not exist")) { setMissingTable(true); setLoading(false); return; }
    setCampaigns(c.data || []);
    setProperties(p.data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({ title: "", property_id: "", platforms: [], budget: "", start_date: "", end_date: "", status: "مسودة", leads_count: "0", notes: "" });
    setEditId(null);
  }

  function startEdit(c: any) {
    setForm({
      title:        c.title || "",
      property_id:  c.property_id || "",
      platforms:    c.platforms || [],
      budget:       String(c.budget || ""),
      start_date:   c.start_date || "",
      end_date:     c.end_date || "",
      status:       c.status || "مسودة",
      leads_count:  String(c.leads_count || 0),
      notes:        c.notes || "",
    });
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function togglePlatform(p: string) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }));
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("أدخل اسم الحملة"); return; }
    setSaving(true);
    const payload = {
      title:        form.title.trim(),
      property_id:  form.property_id || null,
      platforms:    form.platforms,
      budget:       form.budget ? Number(form.budget) : null,
      start_date:   form.start_date || null,
      end_date:     form.end_date || null,
      status:       form.status,
      leads_count:  Number(form.leads_count) || 0,
      notes:        form.notes.trim() || null,
    };
    const { error } = editId
      ? await supabase.from("campaigns").update(payload).eq("id", editId)
      : await supabase.from("campaigns").insert([payload]);
    setSaving(false);
    if (error) { toast.error("فشل الحفظ: " + error.message); return; }
    toast.success(editId ? "تم تحديث الحملة" : "تمت إضافة الحملة");
    resetForm(); setShowForm(false); loadAll();
  }

  async function deleteCampaign(id: string) {
    if (!confirm("هل تريد حذف هذه الحملة؟")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    toast.success("تم حذف الحملة");
    loadAll();
  }

  async function quickStatus(id: string, status: string) {
    await supabase.from("campaigns").update({ status }).eq("id", id);
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }

  // ── KPIs ──
  const kpi = useMemo(() => ({
    total:   campaigns.length,
    active:  campaigns.filter(c => c.status === "نشطة").length,
    leads:   campaigns.reduce((s, c) => s + (c.leads_count || 0), 0),
    budget:  campaigns.filter(c => c.status === "نشطة").reduce((s, c) => s + (c.budget || 0), 0),
  }), [campaigns]);

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>;

  if (missingTable) return (
    <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <Megaphone size={26} style={{ color: "#C6914C" }} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F5", marginBottom: 10 }}>يلزم تفعيل جدول الحملات</h3>
      <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8, marginBottom: 16 }}>
        شغّل <code style={{ background: "#1C1C22", padding: "2px 8px", borderRadius: 6, color: "#C6914C" }}>supabase/004_campaigns.sql</code> في Supabase
      </p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الحملات", value: kpi.total,          icon: Megaphone,  color: "#C6914C" },
          { label: "حملات نشطة",     value: kpi.active,         icon: Play,        color: "#4ADE80" },
          { label: "إجمالي العملاء", value: fmtNum(kpi.leads),  icon: Users,       color: "#A78BFA" },
          { label: "الميزانية النشطة", value: fmtNum(kpi.budget) + " ﷼", icon: DollarSign, color: "#FACC15" },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize: 11, color: "#5A5A62" }}>{k.label}</p>
              <k.icon size={15} style={{ color: k.color }} />
            </div>
            <p className="font-cairo font-bold" style={{ fontSize: 20, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.18)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#C6914C", letterSpacing: 1 }}>
              {editId ? "تعديل الحملة" : "حملة جديدة"}
            </h3>
            <button onClick={() => { resetForm(); setShowForm(false); }} style={{ background: "none", border: "none", color: "#5A5A62", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>اسم الحملة *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} placeholder="مثال: حملة رمضان — فلل الرياض" />
              </div>
              <div>
                <label className={lbl}>العقار المرتبط</label>
                <select value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))} className={inp}>
                  <option value="">بدون عقار محدد</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={lbl}>المنصات</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(pl => (
                  <button key={pl.id} type="button" onClick={() => togglePlatform(pl.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                    style={{
                      background: form.platforms.includes(pl.id) ? pl.color + "22" : "#1C1C22",
                      border: "1px solid " + (form.platforms.includes(pl.id) ? pl.color : "rgba(198,145,76,0.1)"),
                      color:  form.platforms.includes(pl.id) ? pl.color : "#5A5A62",
                    }}>
                    {pl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>الميزانية (ريال)</label>
                <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className={inp} placeholder="0" dir="ltr" />
              </div>
              <div>
                <label className={lbl}>تاريخ البدء</label>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inp} dir="ltr" />
              </div>
              <div>
                <label className={lbl}>تاريخ الانتهاء</label>
                <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inp} dir="ltr" />
              </div>
              <div>
                <label className={lbl}>عدد العملاء</label>
                <input type="number" value={form.leads_count} onChange={e => setForm(f => ({ ...f, leads_count: e.target.value }))} className={inp} placeholder="0" dir="ltr" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>الحالة</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map(s => {
                    const cfg = STATUS_CFG[s];
                    return (
                      <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                        style={{
                          background: form.status === s ? cfg.bg : "#1C1C22",
                          border: "1px solid " + (form.status === s ? cfg.color : "rgba(198,145,76,0.08)"),
                          color: form.status === s ? cfg.color : "#5A5A62",
                        }}>
                        <cfg.icon size={11} /> {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={lbl}>ملاحظات</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} placeholder="هدف الحملة، ملاحظات..." />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-[#0A0A0C] transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)", fontSize: 14 }}>
                <Check size={16} />
                {saving ? "جاري الحفظ..." : editId ? "تحديث الحملة" : "إضافة الحملة"}
              </button>
              <button onClick={() => { resetForm(); setShowForm(false); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ background: "#1C1C22", color: "#9A9AA0", border: "1px solid rgba(198,145,76,0.1)" }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition"
          style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)", color: "#0A0A0C", fontSize: 14 }}>
          <Plus size={16} /> حملة جديدة
        </button>
      )}

      {/* Campaigns list */}
      {campaigns.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <Megaphone size={36} style={{ color: "rgba(198,145,76,0.25)", margin: "0 auto 12px" }} />
          <p style={{ color: "#5A5A62", fontSize: 14 }}>لا توجد حملات بعد — أضف أول حملة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const cfg  = STATUS_CFG[c.status] || STATUS_CFG["مسودة"];
            const Icon = cfg.icon;
            const days = daysLeft(c.end_date);
            return (
              <div key={c.id} className="rounded-2xl p-5 transition-all"
                style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate" style={{ fontSize: 14, color: "#E5E5E5" }}>{c.title}</p>
                      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5"
                        style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600 }}>
                        <Icon size={10} /> {c.status}
                      </span>
                    </div>
                    {c.properties?.title && (
                      <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 3 }}>🏠 {c.properties.title}</p>
                    )}

                    {/* Platforms */}
                    {c.platforms?.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {c.platforms.map((pl: string) => {
                          const plCfg = PLATFORMS.find(p => p.id === pl);
                          return (
                            <span key={pl} className="px-2 py-0.5 rounded-md text-xs"
                              style={{ background: plCfg ? plCfg.color + "18" : "#1C1C22", color: plCfg?.color || "#9A9AA0", border: "1px solid " + (plCfg ? plCfg.color + "33" : "transparent") }}>
                              {pl}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ fontSize: 11, color: "#5A5A62" }}>
                      {c.start_date && <span>من: {fmtDate(c.start_date)}</span>}
                      {c.end_date   && <span>إلى: {fmtDate(c.end_date)}</span>}
                      {days !== null && c.status === "نشطة" && (
                        <span style={{ color: days < 3 ? "#F87171" : days < 7 ? "#FACC15" : "#4ADE80" }}>
                          {days > 0 ? `${days} يوم متبقي` : "انتهت"}
                        </span>
                      )}
                      {c.budget > 0 && (
                        <span className="flex items-center gap-1">
                          <SARIcon size={10} color="secondary" /> {fmtNum(c.budget)}
                        </span>
                      )}
                      {c.leads_count > 0 && <span>👤 {c.leads_count} عميل</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                    {/* Quick status */}
                    {c.status !== "نشطة" && (
                      <button onClick={() => quickStatus(c.id, "نشطة")} title="تفعيل"
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                        style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ADE80" }}>
                        <Play size={13} />
                      </button>
                    )}
                    {c.status === "نشطة" && (
                      <button onClick={() => quickStatus(c.id, "موقوفة")} title="إيقاف"
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                        style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }}>
                        <Pause size={13} />
                      </button>
                    )}
                    <button onClick={() => startEdit(c)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                      style={{ background: "rgba(198,145,76,0.06)", border: "1px solid rgba(198,145,76,0.12)", color: "#C6914C" }}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteCampaign(c.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl transition"
                      style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)", color: "#F87171" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {c.notes && <p style={{ fontSize: 12, color: "#5A5A62", marginTop: 10, fontStyle: "italic" }}>"{c.notes}"</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPARISON TAB
// ══════════════════════════════════════════════════════════════════════════════
const COMPARE_FIELDS: { key: string; label: string; format?: (v: any) => string }[] = [
  { key: "offer_type",    label: "نوع العرض" },
  { key: "main_category", label: "التصنيف" },
  { key: "sub_category",  label: "النوع" },
  { key: "city",          label: "المدينة" },
  { key: "district",      label: "الحي" },
  { key: "price",         label: "السعر (ريال)", format: v => v ? Number(v).toLocaleString("ar-SA") : "—" },
  { key: "land_area",     label: "مساحة الأرض م²", format: v => v ? v + " م²" : "—" },
  { key: "built_area",    label: "مسطح البناء م²", format: v => v ? v + " م²" : "—" },
  { key: "rooms",         label: "الغرف", format: v => v ?? "—" },
  { key: "bathrooms",     label: "دورات المياه", format: v => v ?? "—" },
  { key: "floors",        label: "الأدوار", format: v => v ?? "—" },
  { key: "ad_license_number", label: "رقم الترخيص", format: v => v || "—" },
];

function ComparisonTab() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selected, setSelected]     = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    supabase.from("properties").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setProperties(data || []); setLoading(false); });
  }, []);

  const selectedProps = properties.filter(p => selected.includes(p.id));

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  }

  function copyComparison() {
    if (selectedProps.length === 0) return;
    const lines: string[] = ["مقارنة العقارات — وسيط برو", ""];
    COMPARE_FIELDS.forEach(f => {
      const vals = selectedProps.map(p => {
        const v = p[f.key];
        return f.format ? f.format(v) : (v ?? "—");
      });
      lines.push(`${f.label}: ${vals.join(" | ")}`);
    });
    navigator.clipboard.writeText(lines.join("\n")).then(() => toast.success("تم نسخ المقارنة"));
  }

  const filtered = properties.filter(p =>
    !search || p.title?.includes(search) || p.district?.includes(search) || p.city?.includes(search)
  );

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-5">
      <p style={{ fontSize: 13, color: "#5A5A62" }}>اختر حتى 3 عقارات لمقارنتها جانباً إلى جانب</p>

      {/* Search + property picker */}
      <div className="rounded-2xl p-4" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={inp}
          placeholder="ابحث عن عقار..."
          style={{ marginBottom: 12 }}
        />
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {filtered.map(p => {
            const isSel = selected.includes(p.id);
            const disabled = !isSel && selected.length >= 3;
            return (
              <button key={p.id} onClick={() => !disabled && toggle(p.id)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-right transition"
                style={{
                  background: isSel ? "rgba(198,145,76,0.1)" : "rgba(255,255,255,0.02)",
                  border: "1px solid " + (isSel ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.06)"),
                  opacity: disabled ? 0.35 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}>
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ width: 22, height: 22, background: isSel ? "#C6914C" : "#2A2A32", border: "1px solid " + (isSel ? "#C6914C" : "rgba(198,145,76,0.15)") }}>
                  {isSel && <Check size={12} style={{ color: "#0A0A0C" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                  <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: isSel ? "#C6914C" : "#E5E5E5" }}>{p.title || "بدون عنوان"}</p>
                  <p style={{ fontSize: 11, color: "#5A5A62" }}>{p.city} — {p.district} | {p.offer_type}</p>
                </div>
                {p.price && (
                  <span style={{ fontSize: 12, color: "#C6914C", fontWeight: 700, flexShrink: 0 }}>
                    {Number(p.price).toLocaleString("ar-SA")} ﷼
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      {selectedProps.length >= 2 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(198,145,76,0.15)" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${selectedProps.length}, 1fr)`, background: "#1A1208" }}>
            <div style={{ padding: "14px 16px", fontSize: 11, color: "#5A5A62", fontWeight: 700, letterSpacing: 1 }}>المعيار</div>
            {selectedProps.map((p, i) => (
              <div key={p.id} style={{ padding: "14px 16px", borderRight: i < selectedProps.length - 1 ? "1px solid rgba(198,145,76,0.08)" : undefined }}>
                <p className="font-semibold truncate" style={{ fontSize: 12, color: "#C6914C", lineHeight: 1.3 }}>{p.title || "بدون عنوان"}</p>
                <button onClick={() => toggle(p.id)} style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", fontSize: 10, marginTop: 4, padding: 0 }}>
                  إزالة ×
                </button>
              </div>
            ))}
          </div>

          {/* Field rows */}
          {COMPARE_FIELDS.map((f, ri) => {
            const vals = selectedProps.map(p => {
              const v = p[f.key];
              return f.format ? f.format(v) : (v ?? "—");
            });
            const allSame = vals.every(v => v === vals[0]);
            return (
              <div key={f.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: `160px repeat(${selectedProps.length}, 1fr)`,
                  background: ri % 2 === 0 ? "rgba(198,145,76,0.02)" : "#16161A",
                  borderTop: "1px solid rgba(198,145,76,0.06)",
                }}>
                <div style={{ padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#5A5A62" }}>{f.label}</div>
                {vals.map((v, i) => (
                  <div key={i}
                    style={{
                      padding: "12px 16px",
                      fontSize: 13, color: v === "—" ? "#3A3A44" : allSame ? "#E5E5E5" : "#C6914C",
                      fontWeight: allSame ? 400 : 700,
                      borderRight: i < vals.length - 1 ? "1px solid rgba(198,145,76,0.06)" : undefined,
                    }}>
                    {f.key === "price" && v !== "—" ? (
                      <span className="flex items-center gap-1">
                        <SARIcon size={10} color="secondary" /> {v}
                      </span>
                    ) : v}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Copy button */}
          <div style={{ padding: "14px 16px", background: "#1A1208", borderTop: "1px solid rgba(198,145,76,0.1)", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={copyComparison}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition"
              style={{ background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", fontSize: 13, fontWeight: 600 }}>
              <Copy size={14} /> نسخ المقارنة
            </button>
          </div>
        </div>
      )}

      {selectedProps.length === 1 && (
        <div className="rounded-2xl py-10 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <p style={{ color: "#5A5A62", fontSize: 13 }}>اختر عقاراً آخر لبدء المقارنة (2-3 عقارات)</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "campaigns",   label: "الحملات التسويقية", icon: Megaphone   },
  { id: "comparison",  label: "مقارنة العقارات",   icon: GitCompare  },
];

export default function MarketingPage() {
  const [tab, setTab] = useState("campaigns");

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">التسويق</h2>
        <p style={{ color: "#5A5A62", fontSize: 13 }}>إدارة الحملات التسويقية ومقارنة العقارات</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition"
            style={{
              background: tab === t.id ? "rgba(198,145,76,0.12)" : "#16161A",
              border: "1px solid " + (tab === t.id ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.09)"),
              color:  tab === t.id ? "#C6914C" : "#5A5A62",
              fontSize: 13, fontWeight: 600,
            }}>
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "campaigns"  && <CampaignsTab  />}
      {tab === "comparison" && <ComparisonTab />}
    </div>
  );
}
