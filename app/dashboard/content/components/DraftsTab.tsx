"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { ContentDraft } from "@/types/database";
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";

export default function DraftsTab({ refreshKey }: { refreshKey: number }) {
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState("");
  const [editText, setEditText] = useState("");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    loadDrafts();
  }, [refreshKey]);

  async function loadDrafts() {
    const { data } = await supabase
      .from("content")
      .select("*")
      .order("created_at", { ascending: false });
    setDrafts((data as ContentDraft[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("content").update({ status }).eq("id", id);
    loadDrafts();
  }

  async function saveEdit(id: string) {
    await supabase.from("content").update({ main_text: editText }).eq("id", id);
    setEditingId("");
    loadDrafts();
  }

  async function deleteDraft(id: string) {
    if (!confirm("حذف هذا المحتوى؟")) return;
    await supabase.from("content").delete().eq("id", id);
    loadDrafts();
  }

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  }

  const filtered = drafts.filter(
    (d) => filter === "all" || d.status === filter
  );
  const sc: Record<string, number> = {
    all: drafts.length,
    "مسودة": drafts.filter((d) => d.status === "مسودة").length,
    "جاهز": drafts.filter((d) => d.status === "جاهز").length,
    "منشور": drafts.filter((d) => d.status === "منشور").length,
  };

  if (loading) return <SkeletonList count={4} />;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">المسودات</h3>
        <p className="text-[#9A9AA0] text-sm">
          جميع المحتوى المُنتج — عدّل، انسخ، أو غيّر الحالة
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          [
            ["all", "الكل"],
            ["مسودة", "مسودة"],
            ["جاهز", "جاهز"],
            ["منشور", "منشور"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={
              "px-4 py-2 rounded-lg text-sm transition " +
              (filter === v
                ? "bg-[#C6914C] text-white"
                : "bg-[#16161A] border border-[rgba(198,145,76,0.12)] text-[#9A9AA0] hover:text-white")
            }
          >
            {l} ({sc[v] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#5A5A62]">
          لا يوجد محتوى بعد
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 hover:border-[rgba(198,145,76,0.15)] transition"
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {d.main_channel && (
                    <span className="text-xs bg-[rgba(198,145,76,0.1)] text-[#C6914C] px-2 py-1 rounded">
                      {d.main_channel}
                    </span>
                  )}
                  {d.content_format && (
                    <span className="text-xs bg-[#1C1C22] text-[#9A9AA0] px-2 py-1 rounded">
                      {d.content_format}
                    </span>
                  )}
                  <select
                    value={d.status}
                    onChange={(e) => updateStatus(d.id, e.target.value)}
                    className="text-xs bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded px-2 py-1 focus:outline-none focus:border-[#C6914C]"
                  >
                    <option value="مسودة">مسودة</option>
                    <option value="جاهز">جاهز</option>
                    <option value="منشور">منشور</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  {editingId === d.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(d.id)}
                        className="text-xs text-green-400 flex items-center gap-1"
                      >
                        <Save size={12} /> حفظ
                      </button>
                      <button
                        onClick={() => setEditingId("")}
                        className="text-xs text-[#5A5A62] flex items-center gap-1"
                      >
                        <X size={12} /> إلغاء
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(d.id);
                          setEditText(d.main_text);
                        }}
                        className="text-xs text-[#5A5A62] hover:text-[#C6914C] flex items-center gap-1"
                      >
                        <Pencil size={12} /> تعديل
                      </button>
                      <button
                        onClick={() => copyText(d.id, d.main_text)}
                        className="text-xs"
                      >
                        {copiedId === d.id ? (
                          <span className="text-green-400">نُسخ ✓</span>
                        ) : (
                          <span className="text-[#5A5A62] hover:text-white">
                            نسخ
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => deleteDraft(d.id)}
                        className="text-xs text-[#5A5A62] hover:text-red-400 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> حذف
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingId === d.id ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={5}
                  className="w-full bg-[#1C1C22] border border-[#C6914C] rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none"
                />
              ) : (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {d.main_text}
                </p>
              )}
              <div className="flex gap-2 mt-3 text-xs text-[#5A5A62]">
                {d.content_goal && <span>{d.content_goal}</span>}
                {d.created_at && (
                  <span>
                    {new Date(d.created_at).toLocaleDateString("ar-SA")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
