"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search, CheckCircle, Circle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", task_type: "", priority: "", due_date: "", notes: "",
  });

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    const { data } = await supabase.from("tasks").select("*").order("due_date", { ascending: true });
    setTasks(data || []);
    setLoading(false);
  }

  function handleChange(e: any) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    await supabase.from("tasks").insert([{ ...form, status: "جديد", completion_percent: 0 }]);
    setForm({ title: "", task_type: "", priority: "", due_date: "", notes: "" });
    setShowAdd(false);
    loadTasks();
  }

  async function toggleDone(task: any) {
    const newStatus = task.status === "مكتملة" ? "جديد" : "مكتملة";
    const newPercent = newStatus === "مكتملة" ? 100 : 0;
    await supabase.from("tasks").update({ status: newStatus, completion_percent: newPercent }).eq("id", task.id);
    loadTasks();
  }

  const priorityColor: any = {
    "منخفض": "text-gray-400",
    "متوسط": "text-yellow-400",
    "مرتفع": "text-orange-400",
    "عاجل": "text-red-400",
  };

  const filtered = tasks.filter(t => {
    const matchSearch = t.title?.includes(search);
    const matchFilter = filter === "all" || (filter === "done" ? t.status === "مكتملة" : t.status !== "مكتملة");
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white">back</Link>
          <h1 className="text-xl font-bold">Tasks</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <Plus size={18} />
          Add
        </button>
      </header>

      <main className="p-8">
        {showAdd && (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <select name="task_type" value={form.task_type} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option>مكالمة</option>
                <option>اجتماع</option>
                <option>معاينة</option>
                <option>متابعة</option>
                <option>توثيق</option>
                <option>أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option>منخفض</option>
                <option>متوسط</option>
                <option>مرتفع</option>
                <option>عاجل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Due Date</label>
              <input name="due_date" value={form.due_date} onChange={handleChange} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Notes</label>
              <input name="notes" value={form.notes} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2 flex gap-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition">Cancel</button>
            </div>
          </form>
        )}

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute right-3 top-3 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg pr-10 pl-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "done"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={"px-4 py-2 rounded-lg text-sm transition " + (filter === f ? "bg-blue-600" : "bg-gray-900 border border-gray-800 hover:bg-gray-800")}>
                {f === "all" ? "All" : f === "pending" ? "Pending" : "Done"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-20">No tasks</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(task => (
              <div key={task.id} className={"bg-gray-900 border rounded-xl p-5 flex items-center gap-4 transition " + (task.status === "مكتملة" ? "border-gray-700 opacity-60" : "border-gray-800 hover:border-blue-500")}>
                <button onClick={() => toggleDone(task)} className="flex-shrink-0">
                  {task.status === "مكتملة"
                    ? <CheckCircle size={24} className="text-green-400" />
                    : <Circle size={24} className="text-gray-500 hover:text-blue-400" />
                  }
                </button>
                <div className="flex-1">
                  <h3 className={"font-medium " + (task.status === "مكتملة" ? "line-through text-gray-500" : "")}>{task.title}</h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-gray-500">{task.task_type}</span>
                    {task.due_date && <span className="text-xs text-gray-500">{task.due_date}</span>}
                    {task.notes && <span className="text-xs text-gray-500">{task.notes}</span>}
                  </div>
                </div>
                {task.priority && (
                  <span className={"text-xs font-medium " + (priorityColor[task.priority] || "text-gray-400")}>
                    {task.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}