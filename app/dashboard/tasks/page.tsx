"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  CheckCircle,
  Circle,
  List,
  LayoutGrid,
  Calendar,
  Clock,
  AlertTriangle,
  CheckSquare,
  Trash2,
  Pencil,
  X,
  Save,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "../../components/Breadcrumb";

const taskTypes = ["مكالمة", "اجتماع", "معاينة", "متابعة", "توثيق", "أخرى"];
const priorities = ["منخفض", "متوسط", "مرتفع", "عاجل"];
const statuses = ["جديد", "قيد التنفيذ", "قيد المراجعة", "مكتملة"];

const priorityConfig: Record<string, { color: string; bg: string; dot: string }> = {
  منخفض: {
    color: "text-[var(--text-soft)]",
    bg: "bg-[rgba(154,154,160,0.1)]",
    dot: "bg-[var(--text-soft)]",
  },
  متوسط: { color: "text-yellow-400", bg: "bg-[rgba(250,204,21,0.1)]", dot: "bg-yellow-400" },
  مرتفع: { color: "text-orange-400", bg: "bg-[rgba(251,146,60,0.1)]", dot: "bg-orange-400" },
  عاجل: { color: "text-red-400", bg: "bg-[rgba(248,113,113,0.1)]", dot: "bg-red-400" },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  جديد: { color: "text-[var(--gold-2)]", bg: "bg-[rgba(193,141,74,0.1)]" },
  "قيد التنفيذ": { color: "text-[var(--gold-2)]", bg: "bg-[var(--gold-bg)]" },
  "قيد المراجعة": { color: "text-purple-400", bg: "bg-[rgba(192,132,252,0.1)]" },
  مكتملة: { color: "text-green-400", bg: "bg-[rgba(74,222,128,0.1)]" },
};

const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const arabicDaysShort = ["أحد", "إثن", "ثلث", "أرب", "خمس", "جمع", "سبت"];
const arabicMonths = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export default function TasksPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban" | "calendar">("kanban");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.innerWidth < 768) setView("list");
  }, []);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [form, setForm] = useState({
    title: "",
    task_type: "",
    priority: "متوسط",
    due_date: "",
    notes: "",
    status: "جديد",
  });

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true });
    setTasks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, [loadTasks]);

  function resetForm() {
    setForm({
      title: "",
      task_type: "",
      priority: "متوسط",
      due_date: "",
      notes: "",
      status: "جديد",
    });
    setEditingId("");
  }

  function openEdit(task: {
    id: string;
    title: string | null;
    task_type: string | null;
    description: string | null;
    due_date: string | null;
    due_time?: string | null;
    priority: string | null;
    status: string | null;
    notes: string | null;
    related_property_id?: string | null;
    related_client_id?: string | null;
  }) {
    setForm({
      title: task.title || "",
      task_type: task.task_type || "",
      priority: task.priority || "متوسط",
      due_date: task.due_date || "",
      notes: task.notes || "",
      status: task.status || "جديد",
    });
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
    await supabase
      .from("tasks")
      .update({ status, completion_percent: status === "مكتملة" ? 100 : 0 })
      .eq("id", id);
    loadTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm("حذف هذه المهمة؟")) return;
    await supabase.from("tasks").delete().eq("id", id);
    toast.success("تم حذف المهمة");
    loadTasks();
  }

  async function toggleDone(task: { id: string; status: string | null }) {
    const newStatus = task.status === "مكتملة" ? "جديد" : "مكتملة";
    await supabase
      .from("tasks")
      .update({ status: newStatus, completion_percent: newStatus === "مكتملة" ? 100 : 0 })
      .eq("id", task.id);
    if (newStatus === "مكتملة") toast.success("أحسنت! تم إنجاز المهمة ✓");
    loadTasks();
  }

  const filtered = tasks.filter((t) => {
    if (search && !t.title?.includes(search) && !t.notes?.includes(search)) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterType !== "all" && t.task_type !== filterType) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    new: tasks.filter((t) => t.status === "جديد").length,
    inProgress: tasks.filter((t) => t.status === "قيد التنفيذ").length,
    done: tasks.filter((t) => t.status === "مكتملة").length,
    overdue: tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "مكتملة"
    ).length,
  };

  function isOverdue(task: { due_date: string | null; status: string | null }) {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== "مكتملة";
  }

  function formatDate(d: string) {
    if (!d) return "";
    const date = new Date(d);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "اليوم";
    if (date.toDateString() === tomorrow.toDateString()) return "غداً";
    return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  }

  // Calendar helpers
  function getMonthDays() {
    const y = calendarDate.getFullYear(),
      m = calendarDate.getMonth();
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
    const y = calendarDate.getFullYear(),
      m = String(calendarDate.getMonth() + 1).padStart(2, "0"),
      d = String(day).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function getTasksForDate(dateStr: string) {
    return filtered.filter((t) => t.due_date === dateStr);
  }

  const todayStr =
    new Date().getFullYear() +
    "-" +
    String(new Date().getMonth() + 1).padStart(2, "0") +
    "-" +
    String(new Date().getDate()).padStart(2, "0");

  if (loading)
    return (
      <div dir="rtl" className="p-4">
        <div className="mb-6 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 flex-1 rounded-xl" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton mb-3 h-16 rounded-xl" />
        ))}
      </div>
    );

  return (
    <div dir="rtl">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "المهام" }]} />
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-2xl font-bold">المهام</h2>
          <p style={{ color: "var(--text-faint)", fontSize: 14 }}>تتبع مهامك ومتابعاتك العقارية</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--bg-page)] transition"
          style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))" }}
        >
          <Plus size={16} /> مهمة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {[
          { label: "الإجمالي", value: stats.total, color: "var(--gold-2)", icon: CheckSquare },
          { label: "جديدة", value: stats.new, color: "var(--gold-2)", icon: Circle },
          { label: "قيد التنفيذ", value: stats.inProgress, color: "var(--gold-2)", icon: Clock },
          { label: "مكتملة", value: stats.done, color: "var(--success)", icon: CheckCircle },
          { label: "متأخرة", value: stats.overdue, color: "var(--danger)", icon: AlertTriangle },
        ].map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 rounded-xl p-2 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
          >
            <s.icon size={16} className="sm:h-5 sm:w-5" style={{ color: s.color }} />
            <div className="text-center sm:text-right">
              <div className="text-lg font-bold sm:text-xl" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: "var(--text-faint)", fontSize: 11 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
        <div className="relative w-full sm:min-w-0 sm:flex-1" style={{ minWidth: 0 }}>
          <Search
            size={16}
            className="absolute top-3 right-3"
            style={{ color: "var(--text-faint)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المهام..."
            className="w-full rounded-lg py-2.5 pr-10 pl-4 text-sm focus:outline-none"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-strong)",
            }}
          />
        </div>
        <div className="flex flex-1 gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="flex-1 rounded-lg px-2 py-2.5 text-xs focus:outline-none sm:text-sm"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-strong)",
              minWidth: 0,
            }}
          >
            <option value="all">كل الأولويات</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 rounded-lg px-2 py-2.5 text-xs focus:outline-none sm:text-sm"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-strong)",
              minWidth: 0,
            }}
          >
            <option value="all">كل الأنواع</option>
            {taskTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div
            className="flex flex-shrink-0 overflow-hidden rounded-lg"
            style={{ border: "1px solid var(--gold-bg)" }}
          >
            {(
              [
                ["list", "قائمة", List],
                ["kanban", "كانبان", LayoutGrid],
                ["calendar", "تقويم", Calendar],
              ] as [string, string, import("lucide-react").LucideIcon][]
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setView(id as "list" | "calendar")}
                className="flex items-center gap-1 px-2 py-2 text-xs transition sm:px-3"
                style={{
                  background: view === id ? "var(--gold-bg-hover)" : "var(--bg-surface-1)",
                  color: view === id ? "var(--gold-2)" : "var(--text-faint)",
                }}
              >
                <Icon size={14} />
                <span className="ml-1 hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ LIST VIEW ═══ */}
      {view === "list" && (
        <div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center" style={{ color: "var(--text-faint)" }}>
              <CheckSquare
                size={40}
                className="mx-auto mb-3"
                style={{ color: "var(--border-1)" }}
              />
              <p>لا توجد مهام</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="space-y-2 md:hidden">
                {filtered.map((task) => {
                  const pColorMap: Record<string, string> = {
                    عاجل: "var(--danger)",
                    مرتفع: "#FB923C",
                    متوسط: "var(--warning)",
                    منخفض: "var(--text-soft)",
                  };
                  const pColor = pColorMap[task.priority] || "var(--text-faint)";
                  const overdue = isOverdue(task);
                  return (
                    <div
                      key={task.id}
                      className="flex gap-3 rounded-xl p-4"
                      style={{
                        background: "var(--bg-surface-1)",
                        borderRight: `3px solid ${pColor}`,
                        border: `1px solid var(--gold-bg)`,
                        borderRightWidth: 3,
                        borderRightColor: pColor,
                      }}
                    >
                      <button onClick={() => toggleDone(task)} className="mt-0.5 flex-shrink-0">
                        {task.status === "مكتملة" ? (
                          <CheckCircle size={22} style={{ color: "var(--success)" }} />
                        ) : (
                          <Circle size={22} style={{ color: "var(--text-faint)" }} />
                        )}
                      </button>
                      <div className="min-w-0 flex-1" onClick={() => openEdit(task)}>
                        <p
                          className={
                            "mb-1 text-sm font-medium " +
                            (task.status === "مكتملة" ? "line-through" : "")
                          }
                          style={{
                            color:
                              task.status === "مكتملة" ? "var(--text-faint)" : "var(--text-strong)",
                          }}
                        >
                          {task.title}
                        </p>
                        {task.notes && (
                          <p
                            className="mb-2 line-clamp-2 text-xs"
                            style={{ color: "var(--text-faint)" }}
                          >
                            {task.notes}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {task.task_type && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs"
                              style={{
                                background: "var(--gold-bg-soft)",
                                color: "var(--text-soft)",
                              }}
                            >
                              {task.task_type}
                            </span>
                          )}
                          {task.priority && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ background: pColor + "18", color: pColor }}
                            >
                              {task.priority}
                            </span>
                          )}
                          {task.due_date && (
                            <span
                              className={"text-xs font-medium " + (overdue ? "text-red-400" : "")}
                              style={{ color: overdue ? undefined : "var(--text-faint)" }}
                            >
                              {overdue ? "⚠ " : ""}
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col gap-2">
                        <select
                          value={task.status}
                          onChange={(e) => updateStatus(task.id, e.target.value)}
                          className={
                            "rounded-lg border-0 px-2 py-1 text-xs focus:outline-none " +
                            (statusConfig[task.status]?.color || "") +
                            " " +
                            (statusConfig[task.status]?.bg || "")
                          }
                          style={{ background: undefined, fontSize: 11 }}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(task)}
                            style={{ color: "var(--text-faint)", padding: 4 }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            style={{ color: "var(--text-faint)", padding: 4 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div
                className="hidden overflow-hidden rounded-xl md:block"
                style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ minWidth: 560 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--gold-bg-soft)" }}>
                        {["", "المهمة", "النوع", "الأولوية", "التاريخ", "الحالة", ""].map(
                          (h, i) => (
                            <th
                              key={i}
                              className="px-4 py-3 text-right text-xs font-medium"
                              style={{ color: "var(--text-faint)" }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((task) => (
                        <tr
                          key={task.id}
                          className="transition"
                          style={{ borderBottom: "1px solid rgba(198,145,76,0.05)" }}
                        >
                          <td className="w-10 px-4 py-3">
                            <button onClick={() => toggleDone(task)}>
                              {task.status === "مكتملة" ? (
                                <CheckCircle size={20} style={{ color: "var(--success)" }} />
                              ) : (
                                <Circle size={20} style={{ color: "var(--text-faint)" }} />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                "text-sm font-medium " +
                                (task.status === "مكتملة" ? "line-through" : "")
                              }
                              style={{
                                color:
                                  task.status === "مكتملة"
                                    ? "var(--text-faint)"
                                    : "var(--text-strong)",
                              }}
                            >
                              {task.title}
                            </span>
                            {task.notes && (
                              <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                                {task.notes}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--text-soft)" }}>
                            {task.task_type || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {task.priority && (
                              <span
                                className={
                                  "rounded-lg px-2 py-1 text-xs " +
                                  (priorityConfig[task.priority]?.color || "") +
                                  " " +
                                  (priorityConfig[task.priority]?.bg || "")
                                }
                              >
                                {task.priority}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                "text-xs " + (isOverdue(task) ? "font-medium text-red-400" : "")
                              }
                              style={{ color: isOverdue(task) ? undefined : "var(--text-soft)" }}
                            >
                              {formatDate(task.due_date) || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={task.status}
                              onChange={(e) => updateStatus(task.id, e.target.value)}
                              className={
                                "rounded-lg border-0 px-2 py-1 text-xs focus:outline-none " +
                                (statusConfig[task.status]?.color || "") +
                                " " +
                                (statusConfig[task.status]?.bg || "")
                              }
                              style={{ background: undefined }}
                            >
                              {statuses.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEdit(task)}
                                style={{ color: "var(--text-faint)" }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                style={{ color: "var(--text-faint)" }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
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
        <div className="kanban-board" style={{ minHeight: 400 }}>
          <style>{`
            .kanban-board { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; }
            .kanban-col { flex-shrink: 0; min-width: 220px; width: calc(25% - 12px); }
            @media (max-width: 767px) {
              .kanban-board { flex-direction: column; overflow-x: visible; }
              .kanban-col { width: 100% !important; min-width: 0 !important; }
            }
          `}</style>
          {statuses.map((status) => {
            const statusTasks = filtered.filter((t) => t.status === status);
            const conf = statusConfig[status];
            return (
              <div
                key={status}
                className="kanban-col rounded-xl"
                style={{
                  background: "var(--bg-deep)",
                  border: "1px solid var(--gold-bg-soft)",
                  padding: 12,
                }}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: conf?.color.includes("C18D4A")
                          ? "var(--gold-2)"
                          : conf?.color.includes("C9A84C") || conf?.color.includes("C6914C")
                            ? "var(--gold-2)"
                            : conf?.color.includes("purple")
                              ? "#C084FC"
                              : "var(--success)",
                      }}
                    ></div>
                    <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                      {status}
                    </span>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ background: "var(--gold-bg-soft)", color: "var(--text-faint)" }}
                  >
                    {statusTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      className="cursor-pointer rounded-xl p-3 transition"
                      style={{
                        background: "var(--bg-surface-1)",
                        border: "1px solid var(--gold-bg-soft)",
                      }}
                      onClick={() => openEdit(task)}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4
                          className="flex-1 text-sm font-medium"
                          style={{ color: "var(--text-strong)" }}
                        >
                          {task.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDone(task);
                          }}
                        >
                          {task.status === "مكتملة" ? (
                            <CheckCircle size={16} style={{ color: "var(--success)" }} />
                          ) : (
                            <Circle size={16} style={{ color: "var(--text-faint)" }} />
                          )}
                        </button>
                      </div>
                      {task.notes && (
                        <p className="mb-2 text-xs" style={{ color: "var(--text-faint)" }}>
                          {task.notes}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {task.task_type && (
                          <span
                            className="rounded px-1.5 py-0.5 text-xs"
                            style={{ background: "var(--gold-bg-soft)", color: "var(--text-soft)" }}
                          >
                            {task.task_type}
                          </span>
                        )}
                        {task.priority && (
                          <span
                            className={
                              "rounded px-1.5 py-0.5 text-xs " +
                              (priorityConfig[task.priority]?.bg || "")
                            }
                            style={{
                              color: priorityConfig[task.priority]?.color.replace("text-", ""),
                            }}
                          >
                            {task.priority}
                          </span>
                        )}
                        {task.due_date && (
                          <span
                            className={"text-xs " + (isOverdue(task) ? "text-red-400" : "")}
                            style={{ color: isOverdue(task) ? undefined : "var(--text-faint)" }}
                          >
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      resetForm();
                      setForm((f) => ({ ...f, status }));
                      setShowForm(true);
                    }}
                    className="w-full rounded-lg py-2 text-xs transition"
                    style={{ color: "var(--text-faint)", border: "1px dashed var(--gold-bg)" }}
                  >
                    + إضافة مهمة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === "calendar" && (
        <div className="overflow-x-auto">
          <div
            className="overflow-hidden rounded-xl"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--gold-bg)",
              minWidth: 360,
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid var(--gold-bg-soft)" }}
            >
              <button
                onClick={() => {
                  const d = new Date(calendarDate);
                  d.setMonth(d.getMonth() - 1);
                  setCalendarDate(d);
                }}
                style={{ color: "var(--text-soft)" }}
              >
                <ChevronRight size={20} />
              </button>
              <span className="font-bold">
                {arabicMonths[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </span>
              <button
                onClick={() => {
                  const d = new Date(calendarDate);
                  d.setMonth(d.getMonth() + 1);
                  setCalendarDate(d);
                }}
                style={{ color: "var(--text-soft)" }}
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            <div
              className="grid grid-cols-7"
              style={{ borderBottom: "1px solid var(--gold-bg-soft)" }}
            >
              {arabicDays.map((d, i) => (
                <div
                  key={d}
                  className="py-2 text-center font-medium"
                  style={{ color: "var(--text-faint)", fontSize: 11 }}
                >
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
                  <div
                    key={idx}
                    className="cal-cell p-1"
                    style={{
                      borderLeft: "1px solid rgba(198,145,76,0.05)",
                      borderBottom: "1px solid rgba(198,145,76,0.05)",
                      background: item.current ? "transparent" : "var(--shadow-overlay)",
                      minHeight: 64,
                    }}
                  >
                    <div
                      className="cal-day-num mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: isToday ? "var(--gold-2)" : "transparent",
                        color: isToday
                          ? "var(--bg-page)"
                          : item.current
                            ? "var(--text-soft)"
                            : "var(--border-1)",
                        fontSize: 11,
                      }}
                    >
                      {item.day}
                    </div>
                    {dayTasks.slice(0, 1).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openEdit(t)}
                        className="cal-task mb-0.5 cursor-pointer truncate rounded px-1 py-0.5 text-xs"
                        style={{
                          background: "var(--gold-bg)",
                          color: t.status === "مكتملة" ? "var(--text-faint)" : "var(--text-strong)",
                          fontSize: 9,
                        }}
                      >
                        <span className="hidden sm:inline">{t.title}</span>
                        <span className="sm:hidden">●</span>
                      </div>
                    ))}
                    {dayTasks.length > 1 && (
                      <div style={{ color: "var(--text-faint)", fontSize: 9 }}>
                        +{dayTasks.length - 1}
                      </div>
                    )}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            setShowForm(false);
            resetForm();
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg-hover)" }}
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingId ? "تعديل المهمة" : "مهمة جديدة"}</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                style={{ color: "var(--text-faint)" }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm" style={{ color: "var(--text-soft)" }}>
                  عنوان المهمة *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--gold-bg-hover)",
                    color: "var(--text-strong)",
                  }}
                  placeholder="مثال: متابعة عميل حي النرجس"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm" style={{ color: "var(--text-soft)" }}>
                    النوع
                  </label>
                  <select
                    value={form.task_type}
                    onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--gold-bg-hover)",
                      color: "var(--text-strong)",
                    }}
                  >
                    <option value="">اختر...</option>
                    {taskTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm" style={{ color: "var(--text-soft)" }}>
                    الأولوية
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--gold-bg-hover)",
                      color: "var(--text-strong)",
                    }}
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm" style={{ color: "var(--text-soft)" }}>
                    تاريخ الاستحقاق
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--gold-bg-hover)",
                      color: "var(--text-strong)",
                    }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm" style={{ color: "var(--text-soft)" }}>
                    الحالة
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--gold-bg-hover)",
                      color: "var(--text-strong)",
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm" style={{ color: "var(--text-soft)" }}>
                  ملاحظات
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--gold-bg-hover)",
                    color: "var(--text-strong)",
                  }}
                  placeholder="تفاصيل إضافية..."
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold text-[var(--bg-page)] transition"
                style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))" }}
              >
                <Save size={18} /> {editingId ? "حفظ التعديلات" : "إضافة المهمة"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    deleteTask(editingId);
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-xl px-4 py-3 transition"
                  style={{ background: "rgba(248,113,113,0.1)", color: "var(--danger)" }}
                >
                  حذف
                </button>
              )}
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-xl px-6 py-3 transition"
                style={{ background: "var(--bg-surface-2)", color: "var(--text-soft)" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
