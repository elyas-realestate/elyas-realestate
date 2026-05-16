"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import {
  arabicDays,
  arabicDaysShort,
  arabicMonths,
  platformColors,
  platformDots,
} from "../constants";
import type { ContentDraft } from "@/types/database";
import { Calendar, Plus, X, Pencil, Copy, Check, Save, Trash2 } from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";

export default function CalendarTab({
  refreshKey,
  onDraftsCreated,
}: {
  refreshKey: number;
  onDraftsCreated: () => void;
}) {
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setView("agenda");
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ContentDraft[]>([]);
  const [allDrafts, setAllDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ContentDraft | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignDate, setAssignDate] = useState("");
  const [assignTime, setAssignTime] = useState("09:00");
  const [assignDraftId, setAssignDraftId] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copiedId, setCopiedId] = useState("");
  const [editingPost, setEditingPost] = useState<ContentDraft | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    loadPosts();
  }, [refreshKey]);

  async function loadPosts() {
    const [postsRes, draftsRes] = await Promise.all([
      supabase
        .from("content")
        .select("*")
        .not("scheduled_date", "is", null)
        .order("scheduled_date", { ascending: true }),
      supabase
        .from("content")
        .select("*")
        .is("scheduled_date", null)
        .order("created_at", { ascending: false }),
    ]);
    setPosts((postsRes.data as ContentDraft[]) || []);
    setAllDrafts((draftsRes.data as ContentDraft[]) || []);
    setLoading(false);
  }

  function getMonthDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days: { day: number; current: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, current: true });
    let nextDay = 1;
    while (days.length % 7 !== 0) days.push({ day: nextDay++, current: false });
    return days;
  }

  function getWeekDays() {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function getDateStr(day: number) {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function getPostsForDate(dateStr: string) {
    let filtered = posts.filter((p) => p.scheduled_date === dateStr);
    if (filterPlatform !== "all")
      filtered = filtered.filter((p) => p.main_channel === filterPlatform);
    if (filterStatus !== "all") filtered = filtered.filter((p) => p.status === filterStatus);
    return filtered;
  }

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === "month" || view === "agenda") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  }

  async function assignDraft() {
    if (!assignDraftId || !assignDate) return;
    await supabase
      .from("content")
      .update({ scheduled_date: assignDate, scheduled_time: assignTime || "09:00" })
      .eq("id", assignDraftId);
    setShowAssign(false);
    setAssignDraftId("");
    setAssignDate("");
    setAssignTime("09:00");
    loadPosts();
    onDraftsCreated();
  }

  async function unschedulePost(id: string) {
    await supabase
      .from("content")
      .update({ scheduled_date: null, scheduled_time: null })
      .eq("id", id);
    setSelectedPost(null);
    loadPosts();
    onDraftsCreated();
  }

  async function updatePostStatus(id: string, status: string) {
    await supabase.from("content").update({ status }).eq("id", id);
    loadPosts();
  }

  async function savePostEdit(id: string) {
    await supabase.from("content").update({ main_text: editText }).eq("id", id);
    setEditingPost(null);
    setEditText("");
    loadPosts();
  }

  async function deletePost(id: string) {
    if (!confirm("حذف هذا المحتوى؟")) return;
    await supabase.from("content").delete().eq("id", id);
    setSelectedPost(null);
    loadPosts();
    onDraftsCreated();
  }

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  }

  function exportExcel() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPosts = posts.filter((p) => {
      const d = new Date(p.scheduled_date!);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    let csv = "\uFEFF" + "التاريخ,الوقت,المنصة,الصيغة,الحالة,المحتوى\n";
    monthPosts.forEach((p) => {
      const text = (p.main_text || "").replace(/"/g, '""').replace(/\n/g, " ");
      csv +=
        p.scheduled_date +
        "," +
        (p.scheduled_time || "") +
        "," +
        (p.main_channel || "") +
        "," +
        (p.content_format || "") +
        "," +
        (p.status || "") +
        ',"' +
        text +
        '"\n';
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "content-plan-" + year + "-" + String(month + 1).padStart(2, "0") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const today = new Date();
  const todayStr =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");
  const monthPostsCount = posts.filter((p) => {
    const d = new Date(p.scheduled_date!);
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth();
  }).length;

  if (loading) return <SkeletonList count={4} />;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 text-xl font-bold">الخطة الشهرية</h3>
          <p className="hidden text-sm text-[var(--text-soft)] sm:block">
            خطط لمحتواك على تقويم بصري
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="hidden items-center gap-2 rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-soft)] transition hover:text-[var(--text-strong)] sm:flex"
          >
            📥 تصدير
          </button>
          <button
            onClick={() => {
              setShowAssign(true);
              setAssignDate("");
            }}
            className="flex items-center gap-2 rounded-lg bg-[var(--gold-2)] px-3 py-2 text-sm text-white transition hover:bg-[var(--gold-3)]"
          >
            <Plus size={14} /> <span>جدولة</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] text-[var(--text-soft)]"
          >
            →
          </button>
          <h4 className="min-w-[130px] text-center text-sm font-bold">
            {view === "week"
              ? "الأسبوع"
              : arabicMonths[currentDate.getMonth()] + " " + currentDate.getFullYear()}
          </h4>
          <button
            onClick={() => navigate(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] text-[var(--text-soft)]"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs text-[var(--gold-2)]"
          >
            اليوم
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] px-2 py-1.5 text-xs focus:border-[var(--gold-2)] focus:outline-none"
            style={{ color: "var(--text-strong)" }}
          >
            <option value="all">كل المنصات</option>
            <option value="X (تويتر)">X</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="Snapchat">Snapchat</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Threads">Threads</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] px-2 py-1.5 text-xs focus:border-[var(--gold-2)] focus:outline-none"
            style={{ color: "var(--text-strong)" }}
          >
            <option value="all">كل الحالات</option>
            <option value="مسودة">مسودة</option>
            <option value="جاهز">جاهز</option>
            <option value="منشور">منشور</option>
          </select>
          <div className="flex overflow-hidden rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]">
            <button
              onClick={() => setView("month")}
              className={
                "px-2 py-1.5 text-xs transition " +
                (view === "month" ? "bg-[var(--gold-2)] text-white" : "text-[var(--text-soft)]")
              }
            >
              شهري
            </button>
            <button
              onClick={() => setView("week")}
              className={
                "px-2 py-1.5 text-xs transition " +
                (view === "week" ? "bg-[var(--gold-2)] text-white" : "text-[var(--text-soft)]")
              }
            >
              أسبوعي
            </button>
            <button
              onClick={() => setView("agenda")}
              className={
                "px-2 py-1.5 text-xs transition " +
                (view === "agenda" ? "bg-[var(--gold-2)] text-white" : "text-[var(--text-soft)]")
              }
            >
              قائمة
            </button>
          </div>
          <span className="text-xs text-[var(--text-faint)]">{monthPostsCount} منشور</span>
        </div>
      </div>

      {/* Monthly View */}
      {view === "month" && (
        <div className="overflow-x-auto">
          <div
            className="overflow-hidden rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]"
            style={{ minWidth: 420 }}
          >
            <div className="grid grid-cols-7 border-b border-[var(--gold-bg)]">
              {arabicDays.map((d, i) => (
                <div
                  key={d}
                  className="border-l border-[var(--gold-bg)] px-1 py-2 text-center text-xs font-bold text-[var(--text-faint)] last:border-l-0 sm:px-2 sm:py-3"
                >
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{arabicDaysShort[i]}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getMonthDays().map((item, idx) => {
                const dateStr = item.current ? getDateStr(item.day) : "";
                const dayPosts = item.current ? getPostsForDate(dateStr) : [];
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.current) {
                        setSelectedDay(dateStr);
                        setSelectedPost(null);
                      }
                    }}
                    className={
                      "min-h-[70px] cursor-pointer border-b border-l border-[var(--gold-bg)] p-1 transition last:border-l-0 sm:min-h-[100px] sm:p-1.5 " +
                      (item.current ? "hover:bg-[var(--bg-surface-2)]/50" : "bg-gray-950/30") +
                      (selectedDay === dateStr ? " bg-[rgba(193,141,74,0.06)]" : "")
                    }
                  >
                    <div
                      className={
                        "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold sm:h-6 sm:w-6 " +
                        (isToday
                          ? "bg-[var(--gold-2)] text-white"
                          : item.current
                            ? "text-[var(--text-soft)]"
                            : "text-[var(--border-1)]")
                      }
                    >
                      {item.day}
                    </div>
                    {item.current && (
                      <div className="space-y-0.5">
                        {dayPosts.slice(0, 2).map((p) => (
                          <div
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPost(p);
                              setSelectedDay(dateStr);
                            }}
                            className={
                              "cursor-pointer truncate rounded px-1 py-0.5 text-xs transition hover:opacity-80 " +
                              (platformColors[p.main_channel || ""] || "bg-[var(--bg-surface-3)]")
                            }
                          >
                            <span className="hidden sm:inline">
                              {p.main_text?.substring(0, 20)}
                            </span>
                            <span className="sm:hidden">●</span>
                          </div>
                        ))}
                        {dayPosts.length > 2 && (
                          <div className="text-center text-xs text-[var(--text-faint)]">
                            +{dayPosts.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Weekly View */}
      {view === "week" && (
        <div className="overflow-x-auto">
          <div
            className="overflow-hidden rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]"
            style={{ minWidth: 500 }}
          >
            <div className="grid grid-cols-7">
              {getWeekDays().map((d, idx) => {
                const dateStr =
                  d.getFullYear() +
                  "-" +
                  String(d.getMonth() + 1).padStart(2, "0") +
                  "-" +
                  String(d.getDate()).padStart(2, "0");
                const dayPosts = getPostsForDate(dateStr);
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={idx}
                    className={
                      "min-h-[300px] border-l border-[var(--gold-bg)] last:border-l-0 " +
                      (isToday ? "bg-[rgba(193,141,74,0.04)]" : "")
                    }
                  >
                    <div
                      className={
                        "border-b border-[var(--gold-bg)] px-1 py-2 text-center " +
                        (isToday ? "bg-[var(--gold-bg-soft)]" : "")
                      }
                    >
                      <div className="text-xs text-[var(--text-faint)]">
                        <span className="hidden sm:inline">{arabicDays[d.getDay()]}</span>
                        <span className="sm:hidden">{arabicDaysShort[d.getDay()]}</span>
                      </div>
                      <div
                        className={
                          "text-base font-bold " +
                          (isToday ? "text-[var(--gold-2)]" : "text-gray-300")
                        }
                      >
                        {d.getDate()}
                      </div>
                    </div>
                    <div className="space-y-1 p-1 sm:space-y-2 sm:p-2">
                      {dayPosts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPost(p);
                            setSelectedDay(dateStr);
                          }}
                          className="cursor-pointer rounded bg-[var(--bg-surface-2)] p-1 transition hover:bg-[var(--bg-surface-3)] sm:p-2"
                        >
                          <div className="mb-1 flex items-center gap-1">
                            <div
                              className={
                                "h-2 w-2 flex-shrink-0 rounded-full " +
                                (platformDots[p.main_channel || ""] || "bg-gray-500")
                              }
                            />
                            <span className="hidden text-xs text-[var(--text-faint)] sm:inline">
                              {p.scheduled_time || ""}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs text-gray-300">{p.main_text}</p>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setShowAssign(true);
                          setAssignDate(dateStr);
                        }}
                        className="w-full py-1 text-center text-xs text-[var(--text-faint)] transition hover:text-[var(--gold-2)]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Agenda View */}
      {view === "agenda" &&
        (() => {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const agendaDays: { dateStr: string; dayPosts: ContentDraft[] }[] = [];
          for (let i = 1; i <= daysInMonth; i++) {
            const dateStr =
              year + "-" + String(month + 1).padStart(2, "0") + "-" + String(i).padStart(2, "0");
            const dayPosts = getPostsForDate(dateStr);
            if (dayPosts.length > 0) agendaDays.push({ dateStr, dayPosts });
          }
          return (
            <div className="space-y-3">
              {agendaDays.length === 0 && (
                <div className="py-16 text-center text-[var(--text-faint)]">
                  <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p>لا يوجد محتوى مجدول هذا الشهر</p>
                  <button
                    onClick={() => {
                      setShowAssign(true);
                      setAssignDate("");
                    }}
                    className="mt-4 text-sm text-[var(--gold-2)] hover:underline"
                  >
                    + جدولة محتوى
                  </button>
                </div>
              )}
              {agendaDays.map(({ dateStr, dayPosts }) => {
                const d = new Date(dateStr);
                const isToday = dateStr === todayStr;
                const dayLabel =
                  arabicDays[d.getDay()] + " " + d.getDate() + " " + arabicMonths[d.getMonth()];
                return (
                  <div
                    key={dateStr}
                    className="overflow-hidden rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]"
                  >
                    <div
                      className={
                        "flex items-center gap-3 border-b border-[var(--gold-bg)] px-4 py-2.5 " +
                        (isToday ? "bg-[var(--gold-bg-soft)]" : "")
                      }
                    >
                      <span
                        className={
                          "text-sm font-bold " +
                          (isToday ? "text-[var(--gold-2)]" : "text-gray-300")
                        }
                      >
                        {dayLabel}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-[var(--gold-2)] px-2 py-0.5 text-xs text-white">
                          اليوم
                        </span>
                      )}
                      <span className="mr-auto text-xs text-[var(--text-faint)]">
                        {dayPosts.length} منشور
                      </span>
                    </div>
                    <div className="divide-y divide-[var(--gold-bg-soft)]">
                      {dayPosts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPost(p)}
                          className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-[var(--bg-surface-2)]"
                        >
                          <div className="mt-1 flex-shrink-0">
                            <div
                              className={
                                "h-2.5 w-2.5 rounded-full " +
                                (platformDots[p.main_channel || ""] || "bg-gray-500")
                              }
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span
                                className={
                                  "rounded px-2 py-0.5 text-xs " +
                                  (platformColors[p.main_channel || ""] ||
                                    "bg-[var(--bg-surface-3)]")
                                }
                              >
                                {p.main_channel}
                              </span>
                              {p.scheduled_time && (
                                <span className="text-xs text-[var(--text-faint)]">
                                  {p.scheduled_time}
                                </span>
                              )}
                              <span className="text-xs text-[var(--text-faint)]">
                                {p.status || "مسودة"}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-sm text-gray-300">{p.main_text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={
                    "rounded px-2 py-1 text-xs " +
                    (platformColors[selectedPost.main_channel || ""] || "bg-[var(--bg-surface-3)]")
                  }
                >
                  {selectedPost.main_channel}
                </span>
                <select
                  value={selectedPost.status || ""}
                  onChange={(e) => {
                    updatePostStatus(selectedPost.id, e.target.value);
                    setSelectedPost({ ...selectedPost, status: e.target.value });
                  }}
                  className="rounded border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="مسودة">مسودة</option>
                  <option value="جاهز">جاهز</option>
                  <option value="منشور">منشور</option>
                </select>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-[var(--text-faint)] hover:text-[var(--text-strong)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-3 text-xs text-[var(--text-faint)]">
              {selectedPost.scheduled_date} — {selectedPost.scheduled_time || "بدون وقت"}
            </div>
            {editingPost?.id === selectedPost.id ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={6}
                  className="mb-3 w-full rounded-lg border border-[var(--gold-2)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm text-gray-200 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => savePostEdit(selectedPost.id)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm transition hover:bg-green-700"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setEditingPost(null)}
                    className="rounded-lg bg-[var(--bg-surface-3)] px-4 py-2 text-sm transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-200">
                {selectedPost.main_text}
              </p>
            )}
            {editingPost?.id !== selectedPost.id && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setEditingPost(selectedPost);
                    setEditText(selectedPost.main_text || "");
                  }}
                  className="flex items-center gap-1 rounded-lg bg-[var(--bg-surface-2)] px-3 py-2 text-xs transition hover:bg-[var(--bg-surface-3)]"
                >
                  <Pencil size={12} /> تعديل
                </button>
                <button
                  onClick={() => copyText(selectedPost.id, selectedPost.main_text || "")}
                  className="flex items-center gap-1 rounded-lg bg-[var(--bg-surface-2)] px-3 py-2 text-xs transition hover:bg-[var(--bg-surface-3)]"
                >
                  {copiedId === selectedPost.id ? (
                    <>
                      <Check size={12} className="text-green-400" /> نُسخ
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> نسخ
                    </>
                  )}
                </button>
                <button
                  onClick={() => unschedulePost(selectedPost.id)}
                  className="rounded-lg bg-yellow-900/30 px-3 py-2 text-xs text-yellow-400 transition hover:bg-yellow-900/50"
                >
                  إلغاء الجدولة
                </button>
                <button
                  onClick={() => deletePost(selectedPost.id)}
                  className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400 transition hover:bg-red-900/50"
                >
                  حذف
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Draft Modal */}
      {showAssign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowAssign(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-bold">جدولة مسودة</h4>
              <button
                onClick={() => setShowAssign(false)}
                className="text-[var(--text-faint)] hover:text-[var(--text-strong)]"
              >
                <X size={18} />
              </button>
            </div>
            {allDrafts.length === 0 ? (
              <p className="py-8 text-center text-[var(--text-faint)]">
                لا توجد مسودات — أنتج محتوى أولاً من مصنع المحتوى أو خبير المحتوى
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[var(--text-soft)]">اختر المسودة</label>
                  <select
                    value={assignDraftId}
                    onChange={(e) => setAssignDraftId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                  >
                    <option value="">اختر مسودة...</option>
                    {allDrafts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {(d.main_channel || "") + " — " + (d.main_text || "").substring(0, 50)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">
                      تاريخ النشر
                    </label>
                    <input
                      type="date"
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                      className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">وقت النشر</label>
                    <input
                      type="time"
                      value={assignTime}
                      onChange={(e) => setAssignTime(e.target.value)}
                      className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={assignDraft}
                  disabled={!assignDraftId || !assignDate}
                  className={
                    "w-full rounded-lg py-3 font-bold transition " +
                    (assignDraftId && assignDate
                      ? "bg-[var(--gold-2)] text-white hover:bg-[var(--gold-3)]"
                      : "bg-[var(--bg-surface-3)] text-[var(--text-faint)]")
                  }
                >
                  جدولة المسودة
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
