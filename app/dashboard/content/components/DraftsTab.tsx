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

  const filtered = drafts.filter((d) => filter === "all" || d.status === filter);
  const sc: Record<string, number> = {
    all: drafts.length,
    مسودة: drafts.filter((d) => d.status === "مسودة").length,
    جاهز: drafts.filter((d) => d.status === "جاهز").length,
    منشور: drafts.filter((d) => d.status === "منشور").length,
  };

  if (loading) return <SkeletonList count={4} />;

  return (
    <div>
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold">المسودات</h3>
        <p className="text-sm text-[var(--text-soft)]">
          جميع المحتوى المُنتج — عدّل، انسخ، أو غيّر الحالة
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
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
              "rounded-lg px-4 py-2 text-sm transition " +
              (filter === v
                ? "bg-[var(--gold-2)] text-white"
                : "border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] text-[var(--text-soft)] hover:text-[var(--text-strong)]")
            }
          >
            {l} ({sc[v] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-[var(--text-faint)]">لا يوجد محتوى بعد</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-5 transition hover:border-[var(--gold-bg-hover)]"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {d.main_channel && (
                    <span className="rounded bg-[var(--gold-bg)] px-2 py-1 text-xs text-[var(--gold-2)]">
                      {d.main_channel}
                    </span>
                  )}
                  {d.content_format && (
                    <span className="rounded bg-[var(--bg-surface-2)] px-2 py-1 text-xs text-[var(--text-soft)]">
                      {d.content_format}
                    </span>
                  )}
                  <select
                    value={d.status || ""}
                    onChange={(e) => updateStatus(d.id, e.target.value)}
                    className="rounded border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-2 py-1 text-xs focus:border-[var(--gold-2)] focus:outline-none"
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
                        className="flex items-center gap-1 text-xs text-green-400"
                      >
                        <Save size={12} /> حفظ
                      </button>
                      <button
                        onClick={() => setEditingId("")}
                        className="flex items-center gap-1 text-xs text-[var(--text-faint)]"
                      >
                        <X size={12} /> إلغاء
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(d.id);
                          setEditText(d.main_text || "");
                        }}
                        className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--gold-2)]"
                      >
                        <Pencil size={12} /> تعديل
                      </button>
                      <button onClick={() => copyText(d.id, d.main_text || "")} className="text-xs">
                        {copiedId === d.id ? (
                          <span className="text-green-400">نُسخ ✓</span>
                        ) : (
                          <span className="text-[var(--text-faint)] hover:text-[var(--text-strong)]">
                            نسخ
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => deleteDraft(d.id)}
                        className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-red-400"
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
                  className="w-full rounded-lg border border-[var(--gold-2)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm text-gray-200 focus:outline-none"
                />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                  {d.main_text}
                </p>
              )}
              <div className="mt-3 flex gap-2 text-xs text-[var(--text-faint)]">
                {d.content_goal && <span>{d.content_goal}</span>}
                {d.created_at && <span>{new Date(d.created_at).toLocaleDateString("ar-SA")}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
