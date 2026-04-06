"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search, CheckCircle, Circle, List, LayoutGrid, Calendar, Filter, Clock, AlertTriangle, CheckSquare, Trash2, Pencil, X, Save, ChevronRight, ChevronLeft } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const taskTypes = ["مكالمة", "اجتماع", "معاينة", "متابعة", "توثيق", "أخرى"];
const priorities = ["منخفض", "متوسط", "مرتفع", "عاجل"];
const statuses = ["جديد", "قيد التنفيذ", "قيد المراجعة", "مكتملة"];

const priorityConfig: Record<string, { color: string; bg: string; dot: string }> = {
  "منخفض": { color: "text-[#9A9AA0]", bg: "bg-[rgba(154,154,160,0.1)]", dot: "bg-[#9A9AA0]" },
  "متوسط": { color: "text-yellow-400", bg: "bg-[rgba(250,204,21,0.1)]", dot: "bg-yellow-400" },
  "مرتفع": { color: "text-orange-400", bg: "bg-[rgba(251,146,60,0.1)]", dot: "bg-orange-400" },
  "عاجل": { color: "text-red-400", bg: "bg-[rgba(248,113,113,0.1)]", dot: "bg-red-400" },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  "جديد": { color: "text-blue-400", bg: "bg-[rgba(96,165,250,0.1)]" },
  "قيد التنفيذ": { color: "text-[#C6914C]", bg: "bg-[rgba(198,145,76,0.1)]" },
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
    } else {
      await supabase.from("tasks").insert([{ ...form, completion_percent: 0 }]);
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
    loadTasks();
  }

  async function toggleDone(task: any) {
    const newStatus = task.status === "مكتملة" ? "جديد" : "مكتملة";
    await supabase.from("tasks").update({ status: newStatus, completion_percent: newStatus === "مكتملة" ? 100 : 0 }).eq("id", task.id);
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

  if (loading) return <div style={{ color:'#C6914C' }} className="text-center py-20">جاري التحميل...</div>;

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">المهام</h2>
          <p style={{ color:'#5A5A62', fontSize:14 }}>تتبع مهامك ومتابعاتك العقارية</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-[#0A0A0C] text-sm" style={{ background:'linear-gradient(135deg, #C6914C, #A6743A)' }}>
          <Plus size={16} /> مهمة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "الإجمالي", value: stats.total, color: "#C6914C", icon: CheckSquare },
          { label: "جديدة", value: stats.new, color: "#60A5FA", icon: Circle },
          { label: "قيد التنفيذ", value: stats.inProgress, color: "#C6914C", icon: Clock },
          { label: "مكتملة", value: stats.done, color: "#4ADE80", icon: CheckCircle },
          { label: "متأخرة", value: stats.overdue, color: "#F87171", icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)' }}>
            <s.icon size={20} style={{ color: s.color }} />
            <div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div style={{ color:'#5A5A62', fontSize:12 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1" style={{ minWidth: 160 }}>
          <Search size={16} className="absolute right-3 top-3" style={{ color:'#5A5A62' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="w-full rounded-lg pr-10 pl-4 py-2.5 text-sm focus:outline-none" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)', color:'#F5F5F5' }} />
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)', color:'#F5F5F5' }}>
          <option value="all">كل الأولويات</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)', color:'#F5F5F5' }}>
          <option value="all">كل الأنواع</option>
          {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex rounded-lg overflow-hidden" style={{ border:'1px solid rgba(198,145,76,0.12)' }}>
          {([["list","قائمة",List],["kanban","كانبان",LayoutGrid],["calendar","تقويم",Calendar]] as [string,string,any][]).map(([id,label,Icon]) => (
            <button key={id} onClick={() => setView(id as any)} className="flex items-center gap-1.5 px-3 py-2 text-xs transition" style={{ background: view === id ? 'rgba(198,145,76,0.15)' : '#16161A', color: view === id ? '#C6914C' : '#5A5A62' }}>
              <Icon size={14} /><span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ LIST VIEW ═══ */}
      {view === "list" && (
        <div className="rounded-xl overflow-hidden" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)' }}>
          <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(198,145,76,0.08)' }}>
                {["","المهمة","النوع","الأولوية","التاريخ","الحالة",""].map((h,i) => (
                  <th key={i} className="text-right px-4 py-3 text-xs font-medium" style={{ color:'#5A5A62' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16" style={{ color:'#5A5A62' }}>لا توجد مهام</td></tr>
              ) : filtered.map(task => (
                <tr key={task.id} className="transition" style={{ borderBottom:'1px solid rgba(198,145,76,0.05)' }}>
                  <td className="px-4 py-3 w-10">
                    <button onClick={() => toggleDone(task)}>
                      {task.status === "مكتملة" ? <CheckCircle size={20} style={{ color:'#4ADE80' }} /> : <Circle size={20} style={{ color:'#5A5A62' }} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={"text-sm font-medium " + (task.status === "مكتملة" ? "line-through" : "")} style={{ color: task.status === "مكتملة" ? '#5A5A62' : '#F5F5F5' }}>{task.title}</span>
                    {task.notes && <p className="text-xs mt-0.5" style={{ color:'#5A5A62' }}>{task.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color:'#9A9AA0' }}>{task.task_type || "—"}</td>
                  <td className="px-4 py-3">
                    {task.priority && (
                      <span className={"text-xs px-2 py-1 rounded-lg " + (priorityConfig[task.priority]?.color || "") + " " + (priorityConfig[task.priority]?.bg || "")}>{task.priority}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={"text-xs " + (isOverdue(task) ? "text-red-400 font-medium" : "")} style={{ color: isOverdue(task) ? undefined : '#9A9AA0' }}>{formatDate(task.due_date) || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)} className={"text-xs px-2 py-1 rounded-lg border-0 focus:outline-none " + (statusConfig[task.status]?.color || "") + " " + (statusConfig[task.status]?.bg || "")} style={{ background: undefined }}>
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(task)} style={{ color:'#5A5A62' }}><Pencil size={14} /></button>
                      <button onClick={() => deleteTask(task.id)} style={{ color:'#5A5A62' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ═══ KANBAN VIEW ═══ */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-3" style={{ minHeight:400 }}>
          {statuses.map(status => {
            const statusTasks = filtered.filter(t => t.status === status);
            const conf = statusConfig[status];
            return (
              <div key={status} className="rounded-xl flex-shrink-0" style={{ background:'#111114', border:'1px solid rgba(198,145,76,0.08)', padding:12, minWidth:220, width:'calc(25% - 12px)' }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: conf?.color.includes('blue') ? '#60A5FA' : conf?.color.includes('C9A84C') ? '#C6914C' : conf?.color.includes('purple') ? '#C084FC' : '#4ADE80' }}></div>
                    <span className="text-sm font-bold" style={{ color:'#F5F5F5' }}>{status}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'rgba(198,145,76,0.08)', color:'#5A5A62' }}>{statusTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map(task => (
                    <div key={task.id} className="rounded-xl p-3 transition cursor-pointer" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.08)' }} onClick={() => openEdit(task)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium flex-1" style={{ color:'#F5F5F5' }}>{task.title}</h4>
                        <button onClick={e => { e.stopPropagation(); toggleDone(task); }}>
                          {task.status === "مكتملة" ? <CheckCircle size={16} style={{ color:'#4ADE80' }} /> : <Circle size={16} style={{ color:'#5A5A62' }} />}
                        </button>
                      </div>
                      {task.notes && <p className="text-xs mb-2" style={{ color:'#5A5A62' }}>{task.notes}</p>}
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.task_type && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background:'rgba(198,145,76,0.06)', color:'#9A9AA0' }}>{task.task_type}</span>}
                        {task.priority && <span className={"text-xs px-1.5 py-0.5 rounded " + (priorityConfig[task.priority]?.bg || "")} style={{ color: priorityConfig[task.priority]?.color.replace('text-','') }}>{task.priority}</span>}
                        {task.due_date && <span className={"text-xs " + (isOverdue(task) ? "text-red-400" : "")} style={{ color: isOverdue(task) ? undefined : '#5A5A62' }}>{formatDate(task.due_date)}</span>}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { resetForm(); setForm(f => ({...f, status})); setShowForm(true); }} className="w-full py-2 rounded-lg text-xs transition" style={{ color:'#5A5A62', border:'1px dashed rgba(198,145,76,0.12)' }}>+ إضافة مهمة</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === "calendar" && (
        <div className="rounded-xl overflow-hidden" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.12)' }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom:'1px solid rgba(198,145,76,0.08)' }}>
            <button onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() - 1); setCalendarDate(d); }} style={{ color:'#9A9AA0' }}><ChevronRight size={20} /></button>
            <span className="font-bold">{arabicMonths[calendarDate.getMonth()]} {calendarDate.getFullYear()}</span>
            <button onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() + 1); setCalendarDate(d); }} style={{ color:'#9A9AA0' }}><ChevronLeft size={20} /></button>
          </div>
          <div className="grid grid-cols-7" style={{ borderBottom:'1px solid rgba(198,145,76,0.08)' }}>
            {arabicDays.map((d, i) => (
              <div key={d} className="text-center py-2 font-medium" style={{ color:'#5A5A62', fontSize: 11 }}>
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
                <div key={idx} className="cal-cell p-1" style={{ borderLeft:'1px solid rgba(198,145,76,0.05)', borderBottom:'1px solid rgba(198,145,76,0.05)', background: item.current ? 'transparent' : 'rgba(10,10,12,0.5)', minHeight: 72 }}>
                  <div className="cal-day-num text-xs font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full" style={{ background: isToday ? '#C6914C' : 'transparent', color: isToday ? '#0A0A0C' : item.current ? '#9A9AA0' : '#3A3A42', fontSize: 11 }}>{item.day}</div>
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} onClick={() => openEdit(t)} className="cal-task text-xs rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer" style={{ background: 'rgba(198,145,76,0.1)', color: t.status === "مكتملة" ? '#5A5A62' : '#F5F5F5', fontSize: 10 }}>{t.title}</div>
                  ))}
                  {dayTasks.length > 2 && <div style={{ color:'#5A5A62', fontSize: 10 }}>+{dayTasks.length - 2}</div>}
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
      )}

      {/* ═══ FORM MODAL ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="rounded-2xl max-w-lg w-full p-6" style={{ background:'#16161A', border:'1px solid rgba(198,145,76,0.15)' }} dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{editingId ? "تعديل المهمة" : "مهمة جديدة"}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} style={{ color:'#5A5A62' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color:'#9A9AA0' }}>عنوان المهمة *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'#1C1C22', border:'1px solid rgba(198,145,76,0.15)', color:'#F5F5F5' }} placeholder="مثال: متابعة عميل حي النرجس" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color:'#9A9AA0' }}>النوع</label>
                  <select value={form.task_type} onChange={e => setForm({...form, task_type: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'#1C1C22', border:'1px solid rgba(198,145,76,0.15)', color:'#F5F5F5' }}>
                    <option value="">اختر...</option>
                    {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color:'#9A9AA0' }}>الأولوية</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'#1C1C22', border:'1px solid rgba(198,145,76,0.15)', color:'#F5F5F5' }}>
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color:'#9A9AA0' }}>تاريخ الاستحقاق</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'#1C1C22', border:'1px solid rgba(198,145,76,0.15)', color:'#F5F5F5' }} />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color:'#9A9AA0' }}>الحالة</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'#1C1C22', border:'1px solid rgba(198,145,76,0.15)', color:'#F5F5F5' }}>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color:'#9A9AA0' }}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none" style={{ background:'#1C1C22', border:'1px solid rgba(198,145,76,0.15)', color:'#F5F5F5' }} placeholder="تفاصيل إضافية..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-[#0A0A0C]" style={{ background:'linear-gradient(135deg, #C6914C, #A6743A)' }}>
                <Save size={18} /> {editingId ? "حفظ التعديلات" : "إضافة المهمة"}
              </button>
              {editingId && <button onClick={() => { deleteTask(editingId); setShowForm(false); resetForm(); }} className="px-4 py-3 rounded-xl transition" style={{ background:'rgba(248,113,113,0.1)', color:'#F87171' }}>حذف</button>}
              <button onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-3 rounded-xl transition" style={{ background:'#1C1C22', color:'#9A9AA0' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
