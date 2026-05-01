"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { Plus, Search, CheckCircle, Circle, List, LayoutGrid, Calendar, Filter, Clock, AlertTriangle, CheckSquare, Trash2, Pencil, X, Save, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";


const taskTypes = ["مكالمة", "اجتماع", "معاينة", "متابعة", "توثيق", "أخرى"];
const priorities = ["منخفض", "متوسط", "مرتفع", "عاجل"];
const statuses = ["جديد", "قيد التنفيذ", "قيد المراجعة", "مكتملة"];

const priorityConfig: Record<string, { color: string; bg: string; dot: string }> = {
  "منخفض": { color: "text-[var(--text-soft)]", bg: "bg-[rgba(154,154,160,0.1)]", dot: "bg-[var(--text-soft)]" },
  "متوسط": { color: "text-yellow-400", bg: "bg-[rgba(250,204,21,0.1)]", dot: "bg-yellow-400" },
  "مرتفع": { color: "text-orange-400", bg: "bg-[rgba(251,146,60,0.1)]", dot: "bg-orange-400" },
  "عاجل": { color: "text-red-400", bg: "bg-[rgba(248,113,113,0.1)]", dot: "bg-red-400" },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  "جديد": { color: "text-[var(--gold-2)]", bg: "bg-[rgba(193,141,74,0.1)]" },
  "قيد التنفيذ": { color: "text-[var(--gold-2)]", bg: "bg-[var(--gold-bg)]" },
  "قيد المراجعة": { color: "text-purple-400", bg: "bg-[rgba(192,132,252,0.1)]" },
  "مكتملة": { color: "text-green-400", bg: "bg-[rgba(74,222,128,0.1)]" },
};

const arabicDays = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const arabicDaysShort = ["أحد","إثن","ثلث","أرب","خمس","جمع","سبت"];
const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban" | "calendar">("kanban");
  useEffect(() => {
    if (window.innerWidth < 768) setView("list");
  }, []);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [form, setForm] = useState({ title: "", task_type: "", priority: "متوسط", due_date: "", notes: "", status: "جديد" });

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    const { data } = await supabase.from("tasks").select("*").order("due_date", { ascending: true });
    setTasks(data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({ title: "", task_type: "", priority: "متوسط", due_date: "", notes: "", status: "جديد" });
    setEditingId("");
  }

  function openEdit(task: any) {
    setForm({ title: task.title || "", task_type: task.task_type || "", priority: task.priority || "متوسط", due_date: task.due_date || "", notes: task.notes || "", status: task.status || "جديد" });
    setEditingId(task.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      await supabase.from("tasks").update(form).eq("id", editingId);
      toast.success("تم تحديث المهمة");
    } else {
      await supabase.from("tasks").insert([{ ...form, completion_percent: 0 }]);
      toast.success("تمت إضافة المهمة");
    }
    setShowForm(false);
    resetForm();
    loadTasks();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("tasks").update({ status, completion_percent: status === "مكتملة" ? 100 : 0 }).eq("id", id);
    loadTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm("حذف هذه المهمة؟")) return;
    await supabase.from("tasks").delete().eq("id", id);
    toast.success("تم حذف المهمة");
    loadTasks();
  }

  async function toggleDone(task: any) {
    const newStatus = task.status === "مكتملة" ? "جديد" : "مكتملة";
    await supabase.from("tasks").update({ status: newStatus, completion_percent: newStatus === "مكتملة" ? 100 : 0 }).eq("id", task.id);
    if (newStatus === "مكتملة") toast.success("أحسنت! تم إنجاز المهمة ✓");
    loadTasks();
  }

  const filtered = tasks.filter(t => {
    if (search && !t.title?.includes(search) && !t.notes?.includes(search)) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterType !== "all" && t.task_type !== filterType) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    new: tasks.filter(t => t.status === "جديد").length,
    inProgress: tasks.filter(t => t.status === "قيد التنفيذ").length,
    done: tasks.filter(t => t.status === "مكتملة").length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "مكتملة").length,
  };

  function isOverdue(task: any) {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== "مكتملة";
  }

  function formatDate(d: string) {
    if (!d) return "";
    const date = new Date(d);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "اليوم";
    if (date.toDateString() === tomorrow.toDateString()) return "غداً";
    return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  }

  // Calendar helpers
  function getMonthDays() {
    const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const days: { day: number; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevDays - i, current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, current: true });
    let next = 1;
    while (days.length % 7 !== 0) days.push({ day: next++, current: false });
    return days;
  }

  function getDateStr(day: number) {
    const y = calendarDate.getFullYear(), m = String(calendarDate.getMonth() + 1).padStart(2, "0"), d = String(day).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function getTasksForDate(dateStr: string) {
    return filtered.filter(t => t.due_date === dateStr);
  }

  const todayStr = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + String(new Date().getDate()).padStart(2, "0");

  if (loading) return (
    <div dir="rtl" className="p-4">
      <div className="flex gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl flex-1" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-16 rounded-xl mb-3" />
      ))}
    </div>
  );

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "المهام" }]} />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">المهام</h2>
          <p style={{ color:'var(--text-faint)', fontSize:14 }}>تتبع مهامك ومتابعاتك العقارية</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-[var(--bg-page)] text-sm" style={{ background:'linear-gradient(135deg, var(--gold-2), var(--gold-3))' }}>
          <Plus size={16} /> مهمة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
        {[
          { label: "الإجمالي", value: stats.total, color: "var(--gold-2)", icon: CheckSquare },
          { label: "جديدة", value: stats.new, color: "var(--gold-2)", icon: Circle },
          { label: "قيد التنفيذ", value: stats.inProgress, color: "var(--gold-2)", icon: Clock },
          { label: "مكتملة", value: stats.done, color: "var(--success)", icon: CheckCircle },
          { label: "متأخرة", value: stats.overdue, color: "var(--danger)", icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-2 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg)' }}>
            <s.icon size={16} className="sm:w-5 sm:h-5" style={{ color: s.color }} />
            <div className="text-center sm:text-right">
              <div className="text-lg sm:text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color:'var(--text-faint)', fontSize:11 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        <div className="relative w-full sm:flex-1 sm:min-w-0" style={{ minWidth: 0 }}>
          <Search size={16} className="absolute right-3 top-3" style={{ color:'var(--text-faint)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في المهام..." className="w-full rounded-lg pr-10 pl-4 py-2.5 text-sm focus:outline-none" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg)', color:'var(--text-strong)' }} />
        </div>
        <div className="flex gap-2 flex-1">
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="flex-1 rounded-lg px-2 py-2.5 text-xs sm:text-sm focus:outline-none" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg)', color:'var(--text-strong)', minWidth: 0 }}>
            <option value="all">كل الأولويات</option>
            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="flex-1 rounded-lg px-2 py-2.5 text-xs sm:text-sm focus:outline-none" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg)', color:'var(--text-strong)', minWidth: 0 }}>
            <option value="all">كل الأنواع</option>
            {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border:'1px solid var(--gold-bg)' }}>
            {([["list","قائمة",List],["kanban","كانبان",LayoutGrid],["calendar","تقويم",Calendar]] as [string,string,any][]).map(([id,label,Icon]) => (
              <button key={id} onClick={() => setView(id as any)} className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs transition" style={{ background: view === id ? 'var(--gold-bg-hover)' : 'var(--bg-surface-1)', color: view === id ? 'var(--gold-2)' : 'var(--text-faint)' }}>
                <Icon size={14} /><span className="hidden sm:inline ml-1">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ LIST VIEW ═══ */}
      {view === "list" && (
        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color:'var(--text-faint)' }}>
              <CheckSquare size={40} className="mx-auto mb-3" style={{ color:'var(--border-1)' }} />
              <p>لا توجد مهام</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-2">
                {filtered.map(task => {
                  const pColorMap: Record<string, string> = { "عاجل":"var(--danger)","مرتفع":"#FB923C","متوسط":"var(--warning)","منخفض":"var(--text-soft)" };
                  const pColor = pColorMap[task.priority] || "var(--text-faint)";
                  const overdue = isOverdue(task);
                  return (
                    <div key={task.id} className="rounded-xl p-4 flex gap-3" style={{ background:'var(--bg-surface-1)', borderRight:`3px solid ${pColor}`, border:`1px solid var(--gold-bg)`, borderRightWidth:3, borderRightColor:pColor }}>
                      <button onClick={() => toggleDone(task)} className="flex-shrink-0 mt-0.5">
                        {task.status === "مكتملة" ? <CheckCircle size={22} style={{ color:'var(--success)' }} /> : <Circle size={22} style={{ color:'var(--text-faint)' }} />}
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => openEdit(task)}>
                        <p className={"font-medium text-sm mb-1 " + (task.status === "مكتملة" ? "line-through" : "")} style={{ color: task.status === "مكتملة" ? 'var(--text-faint)' : 'var(--text-strong)' }}>{task.title}</p>
                        {task.notes && <p className="text-xs mb-2 line-clamp-2" style={{ color:'var(--text-faint)' }}>{task.notes}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.task_type && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'var(--gold-bg-soft)', color:'var(--text-soft)' }}>{task.task_type}</span>}
                          {task.priority && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: pColor + "18", color: pColor }}>{task.priority}</span>}
                          {task.due_date && <span className={"text-xs font-medium " + (overdue ? "text-red-400" : "")} style={{ color: overdue ? undefined : 'var(--text-faint)' }}>{overdue ? "⚠ " : ""}{formatDate(task.due_date)}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)} className={"text-xs px-2 py-1 rounded-lg border-0 focus:outline-none " + (statusConfig[task.status]?.color || "") + " " + (statusConfig[task.status]?.bg || "")} style={{ background: undefined, fontSize:11 }}>
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(task)} style={{ color:'var(--text-faint)', padding:4 }}><Pencil size={13} /></button>
                          <button onClick={() => deleteTask(task.id)} style={{ color:'var(--text-faint)', padding:4 }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-xl overflow-hidden" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg)' }}>
                <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: 560 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--gold-bg-soft)' }}>
                      {["","المهمة","النوع","الأولوية","التاريخ","الحالة",""].map((h,i) => (
                        <th key={i} className="text-right px-4 py-3 text-xs font-medium" style={{ color:'var(--text-faint)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(task => (
                      <tr key={task.id} className="transition" style={{ borderBottom:'1px solid rgba(198,145,76,0.05)' }}>
                        <td className="px-4 py-3 w-10"><button onClick={() => toggleDone(task)}>{task.status === "مكتملة" ? <CheckCircle size={20} style={{ color:'var(--success)' }} /> : <Circle size={20} style={{ color:'var(--text-faint)' }} />}</button></td>
                        <td className="px-4 py-3"><span className={"text-sm font-medium " + (task.status === "مكتملة" ? "line-through" : "")} style={{ color: task.status === "مكتملة" ? 'var(--text-faint)' : 'var(--text-strong)' }}>{task.title}</span>{task.notes && <p className="text-xs mt-0.5" style={{ color:'var(--text-faint)' }}>{task.notes}</p>}</td>
                        <td className="px-4 py-3 text-xs" style={{ color:'var(--text-soft)' }}>{task.task_type || "—"}</td>
                        <td className="px-4 py-3">{task.priority && <span className={"text-xs px-2 py-1 rounded-lg " + (priorityConfig[task.priority]?.color || "") + " " + (priorityConfig[task.priority]?.bg || "")}>{task.priority}</span>}</td>
                        <td className="px-4 py-3"><span className={"text-xs " + (isOverdue(task) ? "text-red-400 font-medium" : "")} style={{ color: isOverdue(task) ? undefined : 'var(--text-soft)' }}>{formatDate(task.due_date) || "—"}</span></td>
                        <td className="px-4 py-3"><select value={task.status} onChange={e => updateStatus(task.id, e.target.value)} className={"text-xs px-2 py-1 rounded-lg border-0 focus:outline-none " + (statusConfig[task.status]?.color || "") + " " + (statusConfig[task.status]?.bg || "")} style={{ background: undefined }}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                        <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => openEdit(task)} style={{ color:'var(--text-faint)' }}><Pencil size={14} /></button><button onClick={() => deleteTask(task.id)} style={{ color:'var(--text-faint)' }}><Trash2 size={14} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ KANBAN VIEW ═══ */}
      {view === "kanban" && (
        <div className="kanban-board" style={{ minHeight:400 }}>
          <style>{`
            .kanban-board { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; }
            .kanban-col { flex-shrink: 0; min-width: 220px; width: calc(25% - 12px); }
            @media (max-width: 767px) {
              .kanban-board { flex-direction: column; overflow-x: visible; }
              .kanban-col { width: 100% !important; min-width: 0 !important; }
            }
          `}</style>
          {statuses.map(status => {
            const statusTasks = filtered.filter(t => t.status === status);
            const conf = statusConfig[status];
            return (
              <div key={status} className="kanban-col rounded-xl" style={{ background:'var(--bg-deep)', border:'1px solid var(--gold-bg-soft)', padding:12 }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: conf?.color.includes('C18D4A') ? 'var(--gold-2)' : conf?.color.includes('C9A84C') || conf?.color.includes('C6914C') ? 'var(--gold-2)' : conf?.color.includes('purple') ? '#C084FC' : 'var(--success)' }}></div>
                    <span className="text-sm font-bold" style={{ color:'var(--text-strong)' }}>{status}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'var(--gold-bg-soft)', color:'var(--text-faint)' }}>{statusTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map(task => (
                    <div key={task.id} className="rounded-xl p-3 transition cursor-pointer" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg-soft)' }} onClick={() => openEdit(task)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium flex-1" style={{ color:'var(--text-strong)' }}>{task.title}</h4>
                        <button onClick={e => { e.stopPropagation(); toggleDone(task); }}>
                          {task.status === "مكتملة" ? <CheckCircle size={16} style={{ color:'var(--success)' }} /> : <Circle size={16} style={{ color:'var(--text-faint)' }} />}
                        </button>
                      </div>
                      {task.notes && <p className="text-xs mb-2" style={{ color:'var(--text-faint)' }}>{task.notes}</p>}
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.task_type && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background:'var(--gold-bg-soft)', color:'var(--text-soft)' }}>{task.task_type}</span>}
                        {task.priority && <span className={"text-xs px-1.5 py-0.5 rounded " + (priorityConfig[task.priority]?.bg || "")} style={{ color: priorityConfig[task.priority]?.color.replace('text-','') }}>{task.priority}</span>}
                        {task.due_date && <span className={"text-xs " + (isOverdue(task) ? "text-red-400" : "")} style={{ color: isOverdue(task) ? undefined : 'var(--text-faint)' }}>{formatDate(task.due_date)}</span>}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { resetForm(); setForm(f => ({...f, status})); setShowForm(true); }} className="w-full py-2 rounded-lg text-xs transition" style={{ color:'var(--text-faint)', border:'1px dashed var(--gold-bg)' }}>+ إضافة مهمة</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === "calendar" && (
        <div className="overflow-x-auto">
          <div className="rounded-xl overflow-hidden" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg)', minWidth: 360 }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom:'1px solid var(--gold-bg-soft)' }}>
              <button onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() - 1); setCalendarDate(d); }} style={{ color:'var(--text-soft)' }}><ChevronRight size={20} /></button>
              <span className="font-bold">{arabicMonths[calendarDate.getMonth()]} {calendarDate.getFullYear()}</span>
              <button onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() + 1); setCalendarDate(d); }} style={{ color:'var(--text-soft)' }}><ChevronLeft size={20} /></button>
            </div>
            <div className="grid grid-cols-7" style={{ borderBottom:'1px solid var(--gold-bg-soft)' }}>
              {arabicDays.map((d, i) => (
                <div key={d} className="text-center py-2 font-medium" style={{ color:'var(--text-faint)', fontSize: 11 }}>
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{arabicDaysShort[i]}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getMonthDays().map((item, idx) => {
                const dateStr = item.current ? getDateStr(item.day) : "";
                const dayTasks = item.current ? getTasksForDate(dateStr) : [];
                const isToday = dateStr === todayStr;
                return (
                  <div key={idx} className="cal-cell p-1" style={{ borderLeft:'1px solid rgba(198,145,76,0.05)', borderBottom:'1px solid rgba(198,145,76,0.05)', background: item.current ? 'transparent' : 'var(--shadow-overlay)', minHeight: 64 }}>
                    <div className="cal-day-num text-xs font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full" style={{ background: isToday ? 'var(--gold-2)' : 'transparent', color: isToday ? 'var(--bg-page)' : item.current ? 'var(--text-soft)' : 'var(--border-1)', fontSize: 11 }}>{item.day}</div>
                    {dayTasks.slice(0, 1).map(t => (
                      <div key={t.id} onClick={() => openEdit(t)} className="cal-task text-xs rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer" style={{ background: 'var(--gold-bg)', color: t.status === "مكتملة" ? 'var(--text-faint)' : 'var(--text-strong)', fontSize: 9 }}>
                        <span className="hidden sm:inline">{t.title}</span>
                        <span className="sm:hidden">●</span>
                      </div>
                    ))}
                    {dayTasks.length > 1 && <div style={{ color:'var(--text-faint)', fontSize: 9 }}>+{dayTasks.length - 1}</div>}
                  </div>
                );
              })}
            </div>
            <style>{`
              @media (min-width: 640px) {
                .cal-cell { min-height: 90px !important; padding: 6px !important; }
                .cal-task { font-size: 12px !important; }
                .cal-day-num { width: 24px !important; height: 24px !important; font-size: 12px !important; }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* ═══ FORM MODAL ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="rounded-2xl max-w-lg w-full p-6" style={{ background:'var(--bg-surface-1)', border:'1px solid var(--gold-bg-hover)' }} dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{editingId ? "تعديل المهمة" : "مهمة جديدة"}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ color:'var(--text-faint)' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color:'var(--text-soft)' }}>عنوان المهمة *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'var(--bg-surface-2)', border:'1px solid var(--gold-bg-hover)', color:'var(--text-strong)' }} placeholder="مثال: متابعة عميل حي النرجس" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color:'var(--text-soft)' }}>النوع</label>
                  <select value={form.task_type} onChange={e => setForm({...form, task_type: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'var(--bg-surface-2)', border:'1px solid var(--gold-bg-hover)', color:'var(--text-strong)' }}>
                    <option value="">اختر...</option>
                    {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color:'var(--text-soft)' }}>الأولوية</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'var(--bg-surface-2)', border:'1px solid var(--gold-bg-hover)', color:'var(--text-strong)' }}>
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color:'var(--text-soft)' }}>تاريخ الاستحقاق</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'var(--bg-surface-2)', border:'1px solid var(--gold-bg-hover)', color:'var(--text-strong)' }} />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color:'var(--text-soft)' }}>الحالة</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'var(--bg-surface-2)', border:'1px solid var(--gold-bg-hover)', color:'var(--text-strong)' }}>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color:'var(--text-soft)' }}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'var(--bg-surface-2)', border:'1px solid var(--gold-bg-hover)', color:'var(--text-strong)' }} placeholder="تفاصيل إضافية..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-[var(--bg-page)]" style={{ background:'linear-gradient(135deg, var(--gold-2), var(--gold-3))' }}>
                <Save size={18} /> {editingId ? "حفظ التعديلات" : "إضافة المهمة"}
              </button>
              {editingId && <button onClick={() => { deleteTask(editingId); setShowForm(false); resetForm(); }} className="px-4 py-3 rounded-xl transition" style={{ background:'rgba(248,113,113,0.1)', color:'var(--danger)' }}>حذف</button>}
              <button onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-3 rounded-xl transition" style={{ background:'var(--bg-surface-2)', color:'var(--text-soft)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
