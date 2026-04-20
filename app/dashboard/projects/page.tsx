"use client";
import { formatSAR } from "@/lib/format";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import {
  Building2, Plus, X, Check, Edit3, Trash2, ChevronDown, ChevronUp,
  MapPin, Calendar, Users, Home, TrendingUp, LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import SARIcon from "../../components/SARIcon";


// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "م";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "ألف";
  return n.toLocaleString("ar-SA");
}

// ── Config ──────────────────────────────────────────────────────────────────
const PROJECT_STATUSES = ["قيد التطوير", "جاهز للتسليم", "مكتمل", "موقوف"];
const UNIT_TYPES       = ["شقة", "فيلا", "استوديو", "دوبلكس", "محل", "مكتب", "مستودع", "أخرى"];

const UNIT_STATUS_CFG: Record<string, { color: string; bg: string; dot: string }> = {
  "متاح":  { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  dot: "#4ADE80" },
  "محجوز": { color: "#FACC15", bg: "rgba(250,204,21,0.1)",  dot: "#FACC15" },
  "مُباع": { color: "#F87171", bg: "rgba(248,113,113,0.1)", dot: "#F87171" },
  "مؤجر":  { color: "#60A5FA", bg: "rgba(96,165,250,0.1)",  dot: "#60A5FA" },
};

const PROJECT_STATUS_CFG: Record<string, { color: string; bg: string }> = {
  "قيد التطوير":    { color: "#60A5FA", bg: "rgba(96,165,250,0.1)"  },
  "جاهز للتسليم":   { color: "#4ADE80", bg: "rgba(74,222,128,0.1)"  },
  "مكتمل":          { color: "#C6914C", bg: "rgba(198,145,76,0.1)"  },
  "موقوف":          { color: "#F87171", bg: "rgba(248,113,113,0.1)" },
};

const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#3A3A42] focus:outline-none focus:border-[#C6914C] transition";
const lbl = "block text-xs font-semibold text-[#9A9AA0] mb-2 tracking-wide";

// ══════════════════════════════════════════════════════════════════════════════
// UNIT ROW
// ══════════════════════════════════════════════════════════════════════════════
function UnitRow({ unit, onUpdated, onDeleted }: { unit: any; onUpdated: () => void; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({
    unit_number: unit.unit_number || "",
    unit_type:   unit.unit_type   || "شقة",
    floor:       String(unit.floor ?? ""),
    area:        String(unit.area  ?? ""),
    price:       String(unit.price ?? ""),
    rooms:       String(unit.rooms ?? ""),
    bathrooms:   String(unit.bathrooms ?? ""),
    status:      unit.status       || "متاح",
    client_name: unit.client_name  || "",
    notes:       unit.notes        || "",
  });

  const cfg = UNIT_STATUS_CFG[unit.status] || UNIT_STATUS_CFG["متاح"];

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("project_units").update({
      unit_number: form.unit_number,
      unit_type:   form.unit_type,
      floor:       form.floor     ? Number(form.floor)     : null,
      area:        form.area      ? Number(form.area)      : null,
      price:       form.price     ? Number(form.price)     : null,
      rooms:       form.rooms     ? Number(form.rooms)     : null,
      bathrooms:   form.bathrooms ? Number(form.bathrooms) : null,
      status:      form.status,
      client_name: form.client_name || null,
      notes:       form.notes        || null,
    }).eq("id", unit.id);
    setSaving(false);
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تم تحديث الوحدة");
    setEditing(false);
    onUpdated();
  }

  async function del() {
    if (!confirm("حذف هذه الوحدة؟")) return;
    await supabase.from("project_units").delete().eq("id", unit.id);
    toast.success("تم حذف الوحدة");
    onDeleted();
  }

  if (!editing) return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 transition"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(198,145,76,0.06)" }}>
      {/* Status dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "80px 60px 70px 80px 90px 1fr", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E5" }}>وحدة {unit.unit_number}</span>
        <span style={{ fontSize: 12, color: "#5A5A62" }}>{unit.unit_type || "—"}</span>
        <span style={{ fontSize: 12, color: "#5A5A62" }}>{unit.floor ? `دور ${unit.floor}` : "—"}</span>
        <span style={{ fontSize: 12, color: "#9A9AA0" }}>{unit.area ? unit.area + " م²" : "—"}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#C6914C" }}>{unit.price ? fmtNum(unit.price) + " ﷼" : "—"}</span>
        <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, width: "fit-content" }}>
          {unit.status}
          {unit.client_name && <span style={{ fontSize: 10, color: cfg.color, opacity: 0.7 }}>· {unit.client_name}</span>}
        </span>
      </div>

      <div className="flex gap-1.5" style={{ flexShrink: 0 }}>
        <button onClick={() => setEditing(true)}
          style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(198,145,76,0.06)", border: "1px solid rgba(198,145,76,0.12)", color: "#C6914C", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Edit3 size={11} />
        </button>
        <button onClick={del}
          style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.2)" }}>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "رقم الوحدة",    key: "unit_number", type: "text"   },
          { label: "الدور",          key: "floor",        type: "number" },
          { label: "المساحة م²",    key: "area",         type: "number" },
          { label: "السعر",          key: "price",        type: "number" },
          { label: "الغرف",          key: "rooms",        type: "number" },
          { label: "دورات المياه",   key: "bathrooms",    type: "number" },
        ].map(f => (
          <div key={f.key}>
            <label className={lbl}>{f.label}</label>
            <input type={f.type} value={(form as any)[f.key]}
              onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
              className={inp} dir="ltr" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className={lbl}>النوع</label>
          <select value={form.unit_type} onChange={e => setForm(x => ({ ...x, unit_type: e.target.value }))} className={inp}>
            {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>الحالة</label>
          <div className="flex gap-2">
            {Object.keys(UNIT_STATUS_CFG).map(s => (
              <button key={s} type="button" onClick={() => setForm(x => ({ ...x, status: s }))}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition"
                style={{
                  background: form.status === s ? UNIT_STATUS_CFG[s].bg : "#1C1C22",
                  color:  form.status === s ? UNIT_STATUS_CFG[s].color : "#5A5A62",
                  border: "1px solid " + (form.status === s ? UNIT_STATUS_CFG[s].color : "rgba(198,145,76,0.08)"),
                  cursor: "pointer",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>اسم العميل (محجوز/مُباع)</label>
          <input value={form.client_name} onChange={e => setForm(x => ({ ...x, client_name: e.target.value }))} className={inp} placeholder="اختياري" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Check size={14} /> {saving ? "..." : "حفظ"}
        </button>
        <button onClick={() => setEditing(false)}
          style={{ padding: "8px 16px", borderRadius: 12, background: "#1C1C22", color: "#9A9AA0", fontSize: 13, border: "1px solid rgba(198,145,76,0.1)", cursor: "pointer" }}>
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT CARD
// ══════════════════════════════════════════════════════════════════════════════
function ProjectCard({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  const [expanded,    setExpanded]    = useState(false);
  const [units,       setUnits]       = useState<any[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addSaving,   setAddSaving]   = useState(false);
  const [newUnit, setNewUnit] = useState({
    unit_number: "", unit_type: "شقة", floor: "", area: "", price: "",
    rooms: "", bathrooms: "", status: "متاح", client_name: "", notes: "",
  });

  const cfg = PROJECT_STATUS_CFG[project.status] || PROJECT_STATUS_CFG["قيد التطوير"];

  // Stats from loaded units
  const stats = useMemo(() => ({
    total:    units.length,
    available: units.filter(u => u.status === "متاح").length,
    reserved:  units.filter(u => u.status === "محجوز").length,
    sold:      units.filter(u => u.status === "مُباع").length,
    rented:    units.filter(u => u.status === "مؤجر").length,
    revenue:   units.filter(u => u.status === "مُباع" || u.status === "مؤجر").reduce((s, u) => s + (u.price || 0), 0),
  }), [units]);

  async function loadUnits() {
    setLoadingUnits(true);
    const { data } = await supabase.from("project_units").select("*").eq("project_id", project.id).order("unit_number");
    setUnits(data || []);
    setLoadingUnits(false);
  }

  async function toggleExpand() {
    if (!expanded && units.length === 0) await loadUnits();
    setExpanded(v => !v);
  }

  async function addUnit() {
    if (!newUnit.unit_number) { toast.error("أدخل رقم الوحدة"); return; }
    setAddSaving(true);
    const { error } = await supabase.from("project_units").insert([{
      project_id:  project.id,
      unit_number: newUnit.unit_number,
      unit_type:   newUnit.unit_type,
      floor:       newUnit.floor     ? Number(newUnit.floor)     : null,
      area:        newUnit.area      ? Number(newUnit.area)      : null,
      price:       newUnit.price     ? Number(newUnit.price)     : null,
      rooms:       newUnit.rooms     ? Number(newUnit.rooms)     : null,
      bathrooms:   newUnit.bathrooms ? Number(newUnit.bathrooms) : null,
      status:      newUnit.status,
      client_name: newUnit.client_name || null,
    }]);
    setAddSaving(false);
    if (error) { toast.error("فشل الإضافة: " + error.message); return; }
    toast.success("تمت إضافة الوحدة");
    setNewUnit({ unit_number: "", unit_type: "شقة", floor: "", area: "", price: "", rooms: "", bathrooms: "", status: "متاح", client_name: "", notes: "" });
    setShowAddUnit(false);
    loadUnits();
  }

  async function deleteProject() {
    if (!confirm(`حذف مشروع "${project.name}" وجميع وحداته؟`)) return;
    await supabase.from("projects").delete().eq("id", project.id);
    toast.success("تم حذف المشروع");
    onRefresh();
  }

  const soldPct     = stats.total > 0 ? Math.round((stats.sold     / stats.total) * 100) : 0;
  const reservedPct = stats.total > 0 ? Math.round((stats.reserved / stats.total) * 100) : 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
      {/* Header */}
      <div style={{ position: "relative" }}>
        {project.main_image && (
          <img src={project.main_image} alt={project.name}
            style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
        )}
        {!project.main_image && (
          <div style={{ height: 80, background: "linear-gradient(135deg,#1A1208,#16161A)" }} />
        )}
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#E5E5E5" }}>{project.name}</h3>
              <span className="rounded-full px-2.5 py-0.5" style={{ fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                {project.status}
              </span>
            </div>
            {(project.city || project.district) && (
              <p style={{ fontSize: 12, color: "#5A5A62", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={11} style={{ color: "#C6914C" }} />
                {[project.district, project.city].filter(Boolean).join("، ")}
              </p>
            )}
          </div>
          <button onClick={deleteProject}
            style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Trash2 size={13} />
          </button>
        </div>

        {project.description && (
          <p style={{ fontSize: 12, color: "#5A5A62", lineHeight: 1.7, marginBottom: 14 }}>{project.description}</p>
        )}

        {/* Meta */}
        <div className="flex gap-4 flex-wrap mb-4" style={{ fontSize: 11, color: "#5A5A62" }}>
          {project.developer    && <span>🏗 {project.developer}</span>}
          {project.delivery_date && <span>📅 {new Date(project.delivery_date).toLocaleDateString("ar-SA", { year: "numeric", month: "long" })}</span>}
          {project.location_url && (
            <a href={project.location_url} target="_blank" rel="noopener noreferrer"
              style={{ color: "#C6914C", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={10} /> الموقع
            </a>
          )}
        </div>

        {/* Stats pills */}
        {stats.total > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {[
              { label: "متاح",  val: stats.available, color: "#4ADE80" },
              { label: "محجوز", val: stats.reserved,  color: "#FACC15" },
              { label: "مُباع", val: stats.sold,      color: "#F87171" },
              { label: "مؤجر",  val: stats.rented,    color: "#60A5FA" },
            ].filter(s => s.val > 0).map(s => (
              <span key={s.label} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: s.color + "12", color: s.color, fontWeight: 700 }}>
                {s.val} {s.label}
              </span>
            ))}
            {stats.revenue > 0 && (
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(198,145,76,0.1)", color: "#C6914C", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                <SARIcon size={9} /> {fmtNum(stats.revenue)}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {stats.total > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="flex justify-between mb-1.5" style={{ fontSize: 10, color: "#5A5A62" }}>
              <span>نسبة المبيعات</span>
              <span style={{ color: "#C6914C" }}>{soldPct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "#2A2A32", overflow: "hidden", display: "flex" }}>
              <div style={{ width: soldPct + "%", background: "#F87171", transition: "width 0.5s" }} />
              <div style={{ width: reservedPct + "%", background: "#FACC15", transition: "width 0.5s" }} />
            </div>
            <div className="flex justify-between mt-1" style={{ fontSize: 10 }}>
              <span style={{ color: "#4ADE80" }}>إجمالي {stats.total} وحدة</span>
              <span style={{ color: "#5A5A62" }}>{stats.available} متاح</span>
            </div>
          </div>
        )}
      </div>

      {/* Toggle units */}
      <button
        onClick={toggleExpand}
        className="w-full flex items-center justify-center gap-2 py-3 transition"
        style={{
          background: "rgba(198,145,76,0.04)",
          borderTop: "1px solid rgba(198,145,76,0.08)",
          color: "#C6914C", fontSize: 12, fontWeight: 600,
          cursor: "pointer", border: "none",
        }}>
        <LayoutGrid size={14} />
        {expanded ? "إخفاء الوحدات" : `عرض الوحدات (${units.length || "جاري..."})`}
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Units panel */}
      {expanded && (
        <div style={{ padding: "16px 20px 20px" }}>
          {/* Add unit button */}
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 12, fontWeight: 600, color: "#9A9AA0" }}>
              {units.length} وحدة
            </p>
            <button onClick={() => setShowAddUnit(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition"
              style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none" }}>
              <Plus size={13} /> إضافة وحدة
            </button>
          </div>

          {/* Add unit form */}
          {showAddUnit && (
            <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.18)" }}>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { label: "رقم الوحدة *", key: "unit_number", type: "text"   },
                  { label: "الدور",         key: "floor",        type: "number" },
                  { label: "المساحة م²",   key: "area",         type: "number" },
                  { label: "السعر",         key: "price",        type: "number" },
                  { label: "الغرف",         key: "rooms",        type: "number" },
                  { label: "دورات المياه",  key: "bathrooms",    type: "number" },
                ].map(f => (
                  <div key={f.key}>
                    <label className={lbl}>{f.label}</label>
                    <input type={f.type} value={(newUnit as any)[f.key]}
                      onChange={e => setNewUnit(x => ({ ...x, [f.key]: e.target.value }))}
                      className={inp} dir="ltr" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>النوع</label>
                  <select value={newUnit.unit_type} onChange={e => setNewUnit(x => ({ ...x, unit_type: e.target.value }))} className={inp}>
                    {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>الحالة</label>
                  <div className="flex gap-2">
                    {Object.keys(UNIT_STATUS_CFG).map(s => (
                      <button key={s} type="button" onClick={() => setNewUnit(x => ({ ...x, status: s }))}
                        className="px-3 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: newUnit.status === s ? UNIT_STATUS_CFG[s].bg : "#1C1C22", color: newUnit.status === s ? UNIT_STATUS_CFG[s].color : "#5A5A62", border: "1px solid " + (newUnit.status === s ? UNIT_STATUS_CFG[s].color : "rgba(198,145,76,0.08)"), cursor: "pointer" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addUnit} disabled={addSaving}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 12, background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none" }}>
                  <Check size={14} /> {addSaving ? "جاري الإضافة..." : "إضافة"}
                </button>
                <button onClick={() => setShowAddUnit(false)}
                  style={{ padding: "8px 16px", borderRadius: 12, background: "#1C1C22", color: "#9A9AA0", fontSize: 13, border: "1px solid rgba(198,145,76,0.1)", cursor: "pointer" }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Units list */}
          {loadingUnits ? (
            <div className="text-center py-6" style={{ color: "#5A5A62", fontSize: 13 }}>جاري التحميل...</div>
          ) : units.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#5A5A62", fontSize: 13 }}>
              لا توجد وحدات — أضف أول وحدة بالزر أعلاه
            </div>
          ) : (
            <div className="space-y-2">
              {units.map(u => (
                <UnitRow key={u.id} unit={u} onUpdated={loadUnits} onDeleted={loadUnits} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ProjectsPage() {
  const [projects,      setProjects]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [missingTable,  setMissingTable]  = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", city: "الرياض", district: "",
    location_url: "", main_image: "", status: "قيد التطوير",
    delivery_date: "", developer: "",
  });

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error?.message?.includes("does not exist")) { setMissingTable(true); setLoading(false); return; }
    setProjects(data || []);
    setLoading(false);
  }

  async function addProject() {
    if (!form.name.trim()) { toast.error("أدخل اسم المشروع"); return; }
    setSaving(true);
    const { error } = await supabase.from("projects").insert([{
      name:          form.name.trim(),
      description:   form.description.trim() || null,
      city:          form.city,
      district:      form.district || null,
      location_url:  form.location_url || null,
      main_image:    form.main_image || null,
      status:        form.status,
      delivery_date: form.delivery_date || null,
      developer:     form.developer || null,
    }]);
    setSaving(false);
    if (error) { toast.error("فشل الحفظ: " + error.message); return; }
    toast.success("تم إضافة المشروع");
    setForm({ name: "", description: "", city: "الرياض", district: "", location_url: "", main_image: "", status: "قيد التطوير", delivery_date: "", developer: "" });
    setShowForm(false);
    loadProjects();
  }

  // Global KPIs
  const kpis = useMemo(() => ({
    total:       projects.length,
    active:      projects.filter(p => p.status === "قيد التطوير" || p.status === "جاهز للتسليم").length,
    completed:   projects.filter(p => p.status === "مكتمل").length,
  }), [projects]);

  if (loading) return (
    <div dir="rtl" className="space-y-4">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
      </div>
    </div>
  );

  if (missingTable) return (
    <div dir="rtl" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Building2 size={28} style={{ color: "#C6914C" }} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 12 }}>يلزم تفعيل جدول المشاريع</h2>
      <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8 }}>
        شغّل <code style={{ background: "#1C1C22", padding: "2px 8px", borderRadius: 6, color: "#C6914C" }}>supabase/006_projects.sql</code> في Supabase → SQL Editor
      </p>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">المشاريع العقارية</h2>
          <p style={{ color: "#5A5A62", fontSize: 13 }}>إدارة المشاريع ووحداتها وتتبع حالة المبيعات</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition"
          style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 14, border: "none", cursor: "pointer" }}>
          <Plus size={16} /> مشروع جديد
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي المشاريع",  val: kpis.total,     icon: Building2,  color: "#C6914C" },
          { label: "مشاريع نشطة",      val: kpis.active,    icon: TrendingUp, color: "#4ADE80" },
          { label: "مشاريع مكتملة",    val: kpis.completed, icon: Home,       color: "#A78BFA" },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize: 11, color: "#5A5A62" }}>{k.label}</p>
              <k.icon size={15} style={{ color: k.color }} />
            </div>
            <p className="font-cairo font-bold" style={{ fontSize: 26, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Add project form */}
      {showForm && (
        <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.18)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#C6914C", letterSpacing: 1 }}>مشروع جديد</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#5A5A62", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>اسم المشروع *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} placeholder="مثال: مشروع النخيل السكني" />
              </div>
              <div>
                <label className={lbl}>المطوّر</label>
                <input value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))} className={inp} placeholder="اسم شركة التطوير" />
              </div>
            </div>
            <div>
              <label className={lbl}>الوصف</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inp} placeholder="وصف مختصر للمشروع..." />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>المدينة</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>الحي</label>
                <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className={inp} placeholder="الحي..." />
              </div>
              <div>
                <label className={lbl}>موعد التسليم</label>
                <input type="date" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} className={inp} dir="ltr" />
              </div>
              <div>
                <label className={lbl}>الحالة</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>رابط الخريطة</label>
                <input value={form.location_url} onChange={e => setForm(f => ({ ...f, location_url: e.target.value }))} className={inp} placeholder="https://maps.google.com/..." dir="ltr" />
              </div>
              <div>
                <label className={lbl}>صورة المشروع (URL)</label>
                <input value={form.main_image} onChange={e => setForm(f => ({ ...f, main_image: e.target.value }))} className={inp} placeholder="https://..." dir="ltr" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={addProject} disabled={saving}
                className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 14, cursor: "pointer", border: "none" }}>
                <Check size={16} /> {saving ? "جاري الحفظ..." : "إضافة المشروع"}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "12px 20px", borderRadius: 12, background: "#1C1C22", color: "#9A9AA0", fontSize: 13, border: "1px solid rgba(198,145,76,0.1)", cursor: "pointer" }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <Building2 size={40} style={{ color: "rgba(198,145,76,0.2)", margin: "0 auto 14px", display: "block" }} />
          <p style={{ color: "#5A5A62", fontSize: 14, marginBottom: 16 }}>لا توجد مشاريع — أضف أول مشروع</p>
          <button onClick={() => setShowForm(true)}
            style={{ padding: "10px 24px", borderRadius: 12, background: "rgba(198,145,76,0.1)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + إضافة مشروع
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onRefresh={loadProjects} />
          ))}
        </div>
      )}
    </div>
  );
}
