"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Plus, Search, Copy } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Content() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", content_pillar: "", content_goal: "", audience: "",
    topic: "", main_text: "", content_format: "", main_channel: "",
    target_publish_date: "", status: "فكرة",
  });

  useEffect(() => { loadContent(); }, []);

  async function loadContent() {
    const { data } = await supabase.from("content").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  function handleChange(e: any) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    await supabase.from("content").insert([{ ...form }]);
    setForm({ title: "", content_pillar: "", content_goal: "", audience: "", topic: "", main_text: "", content_format: "", main_channel: "", target_publish_date: "", status: "فكرة" });
    setShowAdd(false);
    loadContent();
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  const statusColor: any = {
    "فكرة": "bg-gray-800 text-gray-400",
    "كتابة": "bg-blue-900/30 text-blue-400",
    "مراجعة": "bg-yellow-900/30 text-yellow-400",
    "جاهز": "bg-green-900/30 text-green-400",
    "منشور": "bg-purple-900/30 text-purple-400",
  };

  const filtered = items.filter(i =>
    i.title?.includes(search) || i.topic?.includes(search)
  );

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white">back</Link>
          <h1 className="text-xl font-bold">Content</h1>
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
              <label className="block text-sm text-gray-400 mb-2">Pillar</label>
              <select name="content_pillar" value={form.content_pillar} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option>تعليمي</option>
                <option>تسويقي</option>
                <option>إلهامي</option>
                <option>ترفيهي</option>
                <option>إخباري</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Platform</label>
              <select name="main_channel" value={form.main_channel} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option>X</option>
                <option>Instagram</option>
                <option>TikTok</option>
                <option>Threads</option>
                <option>LinkedIn</option>
                <option>Snapchat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Format</label>
              <select name="content_format" value={form.content_format} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                <option>نص</option>
                <option>صورة</option>
                <option>فيديو</option>
                <option>ريلز</option>
                <option>كاروسيل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500">
                <option>فكرة</option>
                <option>كتابة</option>
                <option>مراجعة</option>
                <option>جاهز</option>
                <option>منشور</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Publish Date</label>
              <input name="target_publish_date" value={form.target_publish_date} onChange={handleChange} type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Topic</label>
              <input name="topic" value={form.topic} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Content Text</label>
              <textarea name="main_text" value={form.main_text} onChange={handleChange} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2 flex gap-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition">Cancel</button>
            </div>
          </form>
        )}

        <div className="relative mb-6 max-w-md">
          <Search size={18} className="absolute right-3 top-3 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg pr-10 pl-4 py-3 focus:outline-none focus:border-blue-500" />
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-20">No content yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className={"text-xs px-2 py-1 rounded " + (statusColor[item.status] || "bg-gray-800 text-gray-400")}>
                    {item.status}
                  </span>
                  <span className="text-xs text-gray-500">{item.main_channel}</span>
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                {item.topic && <p className="text-gray-400 text-sm mb-3">{item.topic}</p>}
                {item.main_text && (
                  <div className="relative">
                    <p className="text-gray-500 text-xs bg-gray-800 rounded p-2 line-clamp-3">{item.main_text}</p>
                    <button onClick={() => copyText(item.main_text)} className="absolute top-1 left-1 text-gray-500 hover:text-white">
                      <Copy size={14} />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <span className="text-xs text-gray-500">{item.content_pillar}</span>
                  <span className="text-xs text-gray-500">{item.content_format}</span>
                  {item.target_publish_date && <span className="text-xs text-gray-500">{item.target_publish_date}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}