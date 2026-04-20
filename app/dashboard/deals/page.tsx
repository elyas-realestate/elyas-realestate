"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useRef } from "react";
import { Plus, Search, X, LayoutGrid, List, ChevronLeft, ChevronRight, GripVertical, Download } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";
import { formatSAR } from "@/lib/format";
import { exportToCSV, DEALS_EXPORT_HEADERS } from "@/lib/export";

// ── المراحل بالترتيب ──
const STAGES = [
  { id: "استفسار",  color: "#71717A", bg: "rgba(113,113,122,0.12)", light: "rgba(113,113,122,0.06)" },
  { id: "معاينة",   color: "#C6914C", bg: "rgba(198,145,76,0.12)",  light: "rgba(198,145,76,0.06)"  },
  { id: "تفاوض",    color: "#EAB308", bg: "rgba(234,179,8,0.12)",   light: "rgba(234,179,8,0.06)"   },
  { id: "توقيع",    color: "#A78BFA", bg: "rgba(167,139,250,0.12)", light: "rgba(167,139,250,0.06)" },
  { id: "مكتملة",   color: "#4ADE80", bg: "rgba(74,222,128,0.12)",  light: "rgba(74,222,128,0.06)"  },
  { id: "ملغاة",    color: "#F87171", bg: "rgba(248,113,113,0.12)", light: "rgba(248,113,113,0.06)" },
];

const PRIORITY_COLOR: Record<string, string> = {
  "منخفض": "#52525B", "متوسط": "#C6914C", "مرتفع": "#EAB308", "عاجل": "#F87171",
};

export default function Deals() {
  const [deals, setDeals]         = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [view, setView]           = useState<"kanban" | "list">("kanban");
  const [dragging, setDragging]   = useState<string | null>(null);
  const [dragOver, setDragOver]   = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", deal_type: "", property_id: "", current_stage: "استفسار",
    target_value: "", expected_commission: "", priority: "متوسط",
    summary: "", next_action: "", expected_close_date: "",
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [d, p] = await Promise.all([
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, title"),
    ]);
    setDeals(d.data || []);
    setProperties(p.data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("deals").insert([{
      title: form.title,
      deal_type: form.deal_type || null,
      property_id: form.property_id || null,
      current_stage: form.current_stage,
      target_value: form.target_value ? Number(form.target_value) : null,
      expected_commission: form.expected_commission ? Number(form.expected_commission) : null,
      priority: form.priority || null,
      summary: form.summary || null,
      next_action: form.next_action || null,
      expected_close_date: form.expected_close_date || null,
    }]);
    if (error) { toast.error("فشل الحفظ"); return; }
    toast.success("تمت إضافة الصفقة بنجاح");
    setShowAdd(false);
    setForm({ title: "", deal_type: "", property_id: "", current_stage: "استفسار", target_value: "", expected_commission: "", priority: "متوسط", summary: "", next_action: "", expected_close_date: "" });
    loadAll();
  }

  async function moveStage(dealId: string, stage: string) {
    await supabase.from("deals").update({ current_stage: stage }).eq("id", dealId);
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, current_stage: stage } : d));
  }

  // Drag & Drop
  function onDragStart(dealId: string) { setDragging(dealId); }
  function onDragEnd() { setDragging(null); setDragOver(null); }
  function onDragOver(e: React.DragEvent, stageId: string) { e.preventDefault(); setDragOver(stageId); }
  async function onDrop(stageId: string) {
    if (!dragging || dragging === stageId) return;
    const deal = deals.find(d => d.id === dragging);
    if (!deal || deal.current_stage === stageId) { setDragging(null); setDragOver(null); return; }
    await moveStage(dragging, stageId);
    toast.success(`نُقلت "${deal.title}" إلى ${stageId}`);
    setDragging(null);
    setDragOver(null);
  }

  const filtered = deals.filter(d =>
    !search || d.title?.includes(search) || d.deal_type?.includes(search)
  );

  const totalValue = deals.filter(d => d.current_stage === "مكتملة").reduce((s, d) => s + (d.target_value || 0), 0);
  const pipelineValue = deals.filter(d => !["مكتملة","ملغاة"].includes(d.current_stage)).reduce((s, d) => s + (d.target_value || 0), 0);

  const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C] text-[#F5F5F5]";

  if (loading) return (
    <div dir="rtl" className="p-4">
      <div className="skeleton h-8 rounded w-36 mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-xl mb-3" />
      ))}
    </div>
  );

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الصفقات" }]} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">الصفقات</h2>
          <p className="text-sm" style={{ color: "#5A5A62" }}>
            {deals.length} صفقة · pipeline{" "}
            <span style={{ color: "#C6914C" }}>{formatSAR(pipelineValue, { short: true })}</span>
            {" "}· مكتملة{" "}
            <span style={{ color: "#4ADE80" }}>{formatSAR(totalValue, { short: true })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div style={{ display: "flex", background: "#1C1C22", border: "1px solid rgba(198,145,76,0.12)", borderRadius: 9, padding: 3, gap: 2 }}>
            <button
              onClick={() => setView("kanban")}
              style={{ padding: "6px 10px", borderRadius: 7, background: view === "kanban" ? "rgba(198,145,76,0.15)" : "transparent", color: view === "kanban" ? "#C6914C" : "#5A5A62", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, transition: "all 0.2s" }}
            >
              <LayoutGrid size={14} /> كانبان
            </button>
            <button
              onClick={() => setView("list")}
              style={{ padding: "6px 10px", borderRadius: 7, background: view === "list" ? "rgba(198,145,76,0.15)" : "transparent", color: view === "list" ? "#C6914C" : "#5A5A62", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, transition: "all 0.2s" }}
            >
              <List size={14} /> قائمة
            </button>
          </div>
          <button
            onClick={() => exportToCSV(filtered, DEALS_EXPORT_HEADERS, "صفقات")}
            disabled={filtered.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9A9AA0", fontSize: 13, cursor: "pointer" }}
            title="تصدير إلى Excel / CSV"
          >
            <Download size={14} />
            تصدير
          </button>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-sm"
            style={{ background: showAdd ? "#1C1C22" : "linear-gradient(135deg, #C6914C, #A6743A)", color: showAdd ? "#9A9AA0" : "#0A0A0C", border: showAdd ? "1px solid rgba(198,145,76,0.15)" : "none" }}
          >
            {showAdd ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> صفقة جديدة</>}
          </button>
        </div>
      </div>

      {/* ── Add Form ── */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 mb-6">
          <h3 className="font-bold mb-4" style={{ color: "#C6914C", fontSize: 12, letterSpacing: 1 }}>صفقة جديدة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">عنوان الصفقة *</label>
              <input name="title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required className={inp} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">نوع الصفقة</label>
              <select className={inp} value={form.deal_type} onChange={e => setForm(f => ({...f, deal_type: e.target.value}))}>
                <option value="">اختر...</option>
                <option>بيع</option><option>إيجار</option><option>استثمار</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">المرحلة</label>
              <select className={inp} value={form.current_stage} onChange={e => setForm(f => ({...f, current_stage: e.target.value}))}>
                {STAGES.map(s => <option key={s.id}>{s.id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">العقار</label>
              <select className={inp} value={form.property_id} onChange={e => setForm(f => ({...f, property_id: e.target.value}))}>
                <option value="">اختر...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الأولوية</label>
              <select className={inp} value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                <option>منخفض</option><option>متوسط</option><option>مرتفع</option><option>عاجل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">قيمة الصفقة (ر.س)</label>
              <input type="number" className={inp} dir="ltr" value={form.target_value} onChange={e => setForm(f => ({...f, target_value: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>العمولة المتوقعة (ر.س)</span>
                {form.target_value && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {[2, 2.5, 3].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, expected_commission: String(Math.round(Number(f.target_value) * pct / 100)) }))}
                        style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(198,145,76,0.1)", border: "1px solid rgba(198,145,76,0.2)", color: "#C6914C", cursor: "pointer" }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}
              </label>
              <input type="number" className={inp} dir="ltr" value={form.expected_commission} onChange={e => setForm(f => ({...f, expected_commission: e.target.value}))} placeholder="أو اختر نسبة أعلاه" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">تاريخ الإغلاق المتوقع</label>
              <input type="date" className={inp} value={form.expected_close_date} onChange={e => setForm(f => ({...f, expected_close_date: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الإجراء التالي</label>
              <input className={inp} value={form.next_action} onChange={e => setForm(f => ({...f, next_action: e.target.value}))} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">ملخص</label>
              <textarea rows={2} className={inp} value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="bg-[#C6914C] px-6 py-2.5 rounded-lg font-bold text-sm text-[#0A0A0C]">حفظ</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2.5 rounded-lg text-sm" style={{ background: "#1C1C22", color: "#9A9AA0" }}>إلغاء</button>
            </div>
          </div>
        </form>
      )}

      {/* ── Search ── */}
      <div className="relative mb-5">
        <Search size={16} className="absolute right-3 top-3.5 text-[#9A9AA0]" />
        <input
          type="text" placeholder="ابحث عن صفقة..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-[#C6914C] text-[#F5F5F5]"
        />
      </div>

      {/* ══════════════ KANBAN VIEW ══════════════ */}
      {view === "kanban" ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, minHeight: 500 }}>
          {STAGES.map(stage => {
            const stageDeals = filtered.filter(d => d.current_stage === stage.id);
            const stageValue = stageDeals.reduce((s, d) => s + (d.target_value || 0), 0);
            const isDragTarget = dragOver === stage.id;
            return (
              <div
                key={stage.id}
                onDragOver={e => onDragOver(e, stage.id)}
                onDrop={() => onDrop(stage.id)}
                style={{
                  minWidth: 240, width: 240, flexShrink: 0,
                  background: isDragTarget ? stage.light : "#0F0F12",
                  border: `1px solid ${isDragTarget ? stage.color + "40" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 14,
                  transition: "all 0.2s",
                  display: "flex", flexDirection: "column",
                }}
              >
                {/* Column header */}
                <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${stage.color}18` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>{stage.id}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#52525B", background: "#18181B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 99, padding: "2px 8px" }}>
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <div style={{ fontSize: 11, color: "#52525B" }}>
                      {formatSAR(stageValue, { short: true })}
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 520 }}>
                  {stageDeals.map(deal => (
                    <KanbanCard
                      key={deal.id}
                      deal={deal}
                      stages={STAGES}
                      onMove={moveStage}
                      onDragStart={() => onDragStart(deal.id)}
                      onDragEnd={onDragEnd}
                      isDragging={dragging === deal.id}
                    />
                  ))}
                  {stageDeals.length === 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, fontSize: 12, color: isDragTarget ? stage.color : "#3A3A42" }}>
                      {isDragTarget ? "أفلت هنا ↓" : "لا توجد صفقات"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ══════════════ LIST VIEW ══════════════ */
        filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg mb-4" style={{ color: "#9A9AA0" }}>لا توجد صفقات بعد</p>
            <button onClick={() => setShowAdd(true)} className="px-6 py-3 rounded-xl font-bold text-sm text-[#0A0A0C]" style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)" }}>
              أضف أول صفقة
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(deal => {
              const stage = STAGES.find(s => s.id === deal.current_stage);
              return (
                <div key={deal.id} style={{ background: "#16161A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage?.color || "#52525B", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#E4E4E7" }}>{deal.title}</div>
                    {deal.next_action && <div style={{ fontSize: 11, color: "#52525B", marginTop: 2 }}>{deal.next_action}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: stage?.color || "#52525B", background: stage?.bg || "transparent", padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>{deal.current_stage || "—"}</span>
                  {deal.target_value && <span style={{ fontSize: 13, fontWeight: 600, color: "#4ADE80", whiteSpace: "nowrap" }}>{formatSAR(deal.target_value, { short: true })}</span>}
                  {deal.priority && <span style={{ fontSize: 11, color: PRIORITY_COLOR[deal.priority] || "#52525B", whiteSpace: "nowrap" }}>{deal.priority}</span>}
                  {/* Quick stage nav */}
                  <div style={{ display: "flex", gap: 4, marginRight: "auto" }}>
                    {STAGES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => moveStage(deal.id, s.id)}
                        title={s.id}
                        style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: deal.current_stage === s.id ? s.color : "#27272A",
                          border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s",
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ── مكوّن بطاقة الكانبان ──
function KanbanCard({ deal, stages, onMove, onDragStart, onDragEnd, isDragging }: {
  deal: any; stages: typeof STAGES;
  onMove: (id: string, stage: string) => void;
  onDragStart: () => void; onDragEnd: () => void;
  isDragging: boolean;
}) {
  const currentIdx = stages.findIndex(s => s.id === deal.current_stage);
  const prevStage  = currentIdx > 0 ? stages[currentIdx - 1] : null;
  const nextStage  = currentIdx < stages.length - 1 ? stages[currentIdx + 1] : null;
  const daysLeft   = deal.expected_close_date
    ? Math.ceil((new Date(deal.expected_close_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: isDragging ? "#1C1C22" : "#16161A",
        border: `1px solid ${isDragging ? "rgba(198,145,76,0.3)" : "rgba(255,255,255,0.05)"}`,
        borderRadius: 10,
        padding: "12px 12px 10px",
        cursor: "grab",
        opacity: isDragging ? 0.6 : 1,
        transition: "all 0.15s",
        userSelect: "none",
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <GripVertical size={13} style={{ color: "#3A3A42", flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#E4E4E7", lineHeight: 1.3, flex: 1 }}>{deal.title}</span>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {deal.deal_type && (
          <span style={{ fontSize: 10, color: "#9A9AA0", background: "#1C1C22", padding: "2px 7px", borderRadius: 5 }}>{deal.deal_type}</span>
        )}
        {deal.priority && (
          <span style={{ fontSize: 10, color: PRIORITY_COLOR[deal.priority] || "#52525B", background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: 5 }}>{deal.priority}</span>
        )}
        {deal.target_value && (
          <span style={{ fontSize: 10, color: "#4ADE80", background: "rgba(74,222,128,0.06)", padding: "2px 7px", borderRadius: 5 }}>
            {formatSAR(deal.target_value, { short: true })}
          </span>
        )}
      </div>

      {/* Due date */}
      {daysLeft !== null && (
        <div style={{ fontSize: 10, color: daysLeft < 0 ? "#F87171" : daysLeft <= 3 ? "#EAB308" : "#52525B", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span>{daysLeft < 0 ? `⚠ تأخر ${Math.abs(daysLeft)} يوم` : daysLeft === 0 ? "⚠ اليوم" : `📅 ${daysLeft} يوم`}</span>
        </div>
      )}

      {/* Next action */}
      {deal.next_action && (
        <div style={{ fontSize: 10, color: "#5A5A62", marginBottom: 8, lineHeight: 1.4 }}>{deal.next_action}</div>
      )}

      {/* Stage navigation */}
      <div style={{ display: "flex", gap: 5, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
        {prevStage && (
          <button
            onClick={() => onMove(deal.id, prevStage.id)}
            style={{ flex: 1, fontSize: 10, color: prevStage.color, background: prevStage.light, border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}
          >
            <ChevronRight size={10} /> {prevStage.id}
          </button>
        )}
        {nextStage && (
          <button
            onClick={() => onMove(deal.id, nextStage.id)}
            style={{ flex: 1, fontSize: 10, color: nextStage.color, background: nextStage.light, border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}
          >
            {nextStage.id} <ChevronLeft size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
