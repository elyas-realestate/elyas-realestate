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
    await supabase.from("tasks").update({ status: newStatus, completion_percent: newStatus === "مكتملة" ? 100 : 0 }).eq("id", task.id);
    loadTasks();
  }

  const priorityColor: any = {
    "منخفض": "text-[#9A9AA0]",
    "متوسط": "text-yellow-400",
    "مرتفع": "text-orange-400",
    "عاجل": "text-red-400",
  };

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title?.includes(search);
    const matchFilter = filter === "all" || (filter === "done" ? t.status === "مكتملة" : t.status !== "مكتملة");
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">جاري التحميل...</div>;

  return (
    <div  dir="rtl">
      
      <main className="p-8">
        {showAdd && (
          <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-[#9A9AA0] mb-2">عنوان المهمة *</label>
              <input name="title" value={form.title} onChange={handleChange} required className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">نوع المهمة</label>
              <select name="task_type" value={form.task_type} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]">
                <option value="">اختر...</option>
                <option>مكالمة</option>
                <option>اجتماع</option>
                <option>معاينة</option>
                <option>متابعة</option>
                <option>توثيق</option>
                <option>أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الأولوية</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]">
                <option value="">اختر...</option>
                <option>منخفض</option>
                <option>متوسط</option>
                <option>مرتفع</option>
                <option>عاجل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">تاريخ الاستحقاق</label>
              <input name="due_date" value={form.due_date} onChange={handleChange} type="date" className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">ملاحظات</label>
              <input name="notes" value={form.notes} onChange={handleChange} className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-2 focus:outline-none focus:border-[#C9A84C]" />
            </div>
            <div className="col-span-2 flex gap-4">
              <button type="submit" className="bg-[#C9A84C] hover:bg-[#A68A3A] px-6 py-2 rounded-lg transition">حفظ</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition">إلغاء</button>
            </div>
          </form>
        )}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute right-3 top-3 text-[#9A9AA0]" />
            <input type="text" placeholder="ابحث عن مهمة..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-lg pr-10 pl-4 py-3 focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <div className="flex gap-2">
            {[["all","الكل"],["pending","قيد التنفيذ"],["done","مكتملة"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} className={"px-4 py-2 rounded-lg text-sm transition " + (filter === val ? "bg-[#C9A84C]" : "bg-[#16161A] border border-[rgba(201,168,76,0.12)] hover:bg-[#1C1C22]")}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-[#9A9AA0] text-center py-20">لا توجد مهام</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(task => (
              <div key={task.id} className={"bg-[#16161A] border rounded-xl p-5 flex items-center gap-4 transition " + (task.status === "مكتملة" ? "border-[rgba(201,168,76,0.15)] opacity-60" : "border-[rgba(201,168,76,0.12)] hover:border-[#C9A84C]")}>
                <button onClick={() => toggleDone(task)} className="flex-shrink-0">
                  {task.status === "مكتملة"
                    ? <CheckCircle size={24} className="text-green-400" />
                    : <Circle size={24} className="text-[#5A5A62] hover:text-[#C9A84C]" />
                  }
                </button>
                <div className="flex-1">
                  <h3 className={"font-medium " + (task.status === "مكتملة" ? "line-through text-[#5A5A62]" : "")}>{task.title}</h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-[#5A5A62]">{task.task_type}</span>
                    {task.due_date && <span className="text-xs text-[#5A5A62]">{task.due_date}</span>}
                    {task.notes && <span className="text-xs text-[#5A5A62]">{task.notes}</span>}
                  </div>
                </div>
                {task.priority && (
                  <span className={"text-xs font-medium " + (priorityColor[task.priority] || "text-[#9A9AA0]")}>
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