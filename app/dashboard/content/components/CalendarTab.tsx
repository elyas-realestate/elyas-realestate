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
import {
  Calendar,
  Plus,
  X,
  Pencil,
  Copy,
  Check,
  Save,
  Trash2,
} from "lucide-react";
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
    if (typeof window !== "undefined" && window.innerWidth < 768)
      setView("agenda");
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
      supabase.from("content").select("*").not("scheduled_date", "is", null).order("scheduled_date", { ascending: true }),
      supabase.from("content").select("*").is("scheduled_date", null).order("created_at", { ascending: false }),
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
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
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
    if (filterPlatform !== "all") filtered = filtered.filter((p) => p.main_channel === filterPlatform);
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
    await supabase.from("content").update({ scheduled_date: assignDate, scheduled_time: assignTime || "09:00" }).eq("id", assignDraftId);
    setShowAssign(false); setAssignDraftId(""); setAssignDate(""); setAssignTime("09:00");
    loadPosts(); onDraftsCreated();
  }

  async function unschedulePost(id: string) {
    await supabase.from("content").update({ scheduled_date: null, scheduled_time: null }).eq("id", id);
    setSelectedPost(null); loadPosts(); onDraftsCreated();
  }

  async function updatePostStatus(id: string, status: string) {
    await supabase.from("content").update({ status }).eq("id", id); loadPosts();
  }

  async function savePostEdit(id: string) {
    await supabase.from("content").update({ main_text: editText }).eq("id", id);
    setEditingPost(null); setEditText(""); loadPosts();
  }

  async function deletePost(id: string) {
    if (!confirm("حذف هذا المحتوى؟")) return;
    await supabase.from("content").delete().eq("id", id);
    setSelectedPost(null); loadPosts(); onDraftsCreated();
  }

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text); setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  }

  function exportExcel() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPosts = posts.filter((p) => { const d = new Date(p.scheduled_date!); return d.getFullYear() === year && d.getMonth() === month; });
    let csv = "\uFEFF" + "التاريخ,الوقت,المنصة,الصيغة,الحالة,المحتوى\n";
    monthPosts.forEach((p) => {
      const text = (p.main_text || "").replace(/"/g, '""').replace(/\n/g, " ");
      csv += p.scheduled_date + "," + (p.scheduled_time || "") + "," + (p.main_channel || "") + "," + (p.content_format || "") + "," + (p.status || "") + ',"' + text + '"\n';
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
  const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  const monthPostsCount = posts.filter((p) => { const d = new Date(p.scheduled_date!); return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth(); }).length;

  if (loading) return <SkeletonList count={4} />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-xl font-bold mb-1">الخطة الشهرية</h3>
          <p className="text-[#9A9AA0] text-sm hidden sm:block">خطط لمحتواك على تقويم بصري</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} className="hidden sm:flex items-center gap-2 text-sm bg-[#16161A] border border-[rgba(198,145,76,0.12)] px-3 py-2 rounded-lg text-[#9A9AA0] hover:text-white transition">📥 تصدير</button>
          <button onClick={() => { setShowAssign(true); setAssignDate(""); }} className="flex items-center gap-2 text-sm bg-[#C6914C] hover:bg-[#A6743A] px-3 py-2 rounded-lg text-white transition"><Plus size={14} /> <span>جدولة</span></button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] w-8 h-8 rounded-lg flex items-center justify-center text-[#9A9AA0]">→</button>
          <h4 className="font-bold text-sm min-w-[130px] text-center">{view === "week" ? "الأسبوع" : arabicMonths[currentDate.getMonth()] + " " + currentDate.getFullYear()}</h4>
          <button onClick={() => navigate(1)} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] w-8 h-8 rounded-lg flex items-center justify-center text-[#9A9AA0]">←</button>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs text-[#C6914C]">اليوم</button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#C6914C]" style={{ color: "#F5F5F5" }}>
            <option value="all">كل المنصات</option>
            <option value="X (تويتر)">X</option><option value="Instagram">Instagram</option><option value="TikTok">TikTok</option><option value="Snapchat">Snapchat</option><option value="LinkedIn">LinkedIn</option><option value="Threads">Threads</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#C6914C]" style={{ color: "#F5F5F5" }}>
            <option value="all">كل الحالات</option><option value="مسودة">مسودة</option><option value="جاهز">جاهز</option><option value="منشور">منشور</option>
          </select>
          <div className="flex bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg overflow-hidden">
            <button onClick={() => setView("month")} className={"px-2 py-1.5 text-xs transition " + (view === "month" ? "bg-[#C6914C] text-white" : "text-[#9A9AA0]")}>شهري</button>
            <button onClick={() => setView("week")} className={"px-2 py-1.5 text-xs transition " + (view === "week" ? "bg-[#C6914C] text-white" : "text-[#9A9AA0]")}>أسبوعي</button>
            <button onClick={() => setView("agenda")} className={"px-2 py-1.5 text-xs transition " + (view === "agenda" ? "bg-[#C6914C] text-white" : "text-[#9A9AA0]")}>قائمة</button>
          </div>
          <span className="text-xs text-[#5A5A62]">{monthPostsCount} منشور</span>
        </div>
      </div>

      {/* Monthly View */}
      {view === "month" && (
        <div className="overflow-x-auto">
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl overflow-hidden" style={{ minWidth: 420 }}>
            <div className="grid grid-cols-7 border-b border-[rgba(198,145,76,0.12)]">
              {arabicDays.map((d, i) => (
                <div key={d} className="px-1 py-2 sm:px-2 sm:py-3 text-center text-xs font-bold text-[#5A5A62] border-l border-[rgba(198,145,76,0.12)] last:border-l-0">
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
                  <div key={idx} onClick={() => { if (item.current) { setSelectedDay(dateStr); setSelectedPost(null); } }} className={"min-h-[70px] sm:min-h-[100px] border-l border-b border-[rgba(198,145,76,0.12)] last:border-l-0 p-1 sm:p-1.5 cursor-pointer transition " + (item.current ? "hover:bg-[#1C1C22]/50" : "bg-gray-950/30") + (selectedDay === dateStr ? " bg-[rgba(193,141,74,0.06)]" : "")}>
                    <div className={"text-xs font-bold mb-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full " + (isToday ? "bg-[#C6914C] text-white" : item.current ? "text-[#9A9AA0]" : "text-[#3A3A42]")}>{item.day}</div>
                    {item.current && (
                      <div className="space-y-0.5">
                        {dayPosts.slice(0, 2).map((p) => (
                          <div key={p.id} onClick={(e) => { e.stopPropagation(); setSelectedPost(p); setSelectedDay(dateStr); }} className={"text-xs px-1 py-0.5 rounded truncate cursor-pointer transition hover:opacity-80 " + (platformColors[p.main_channel || ""] || "bg-[#2A2A32]")}>
                            <span className="hidden sm:inline">{p.main_text?.substring(0, 20)}</span>
                            <span className="sm:hidden">●</span>
                          </div>
                        ))}
                        {dayPosts.length > 2 && <div className="text-xs text-[#5A5A62] text-center">+{dayPosts.length - 2}</div>}
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
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl overflow-hidden" style={{ minWidth: 500 }}>
            <div className="grid grid-cols-7">
              {getWeekDays().map((d, idx) => {
                const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
                const dayPosts = getPostsForDate(dateStr);
                const isToday = dateStr === todayStr;
                return (
                  <div key={idx} className={"border-l border-[rgba(198,145,76,0.12)] last:border-l-0 min-h-[300px] " + (isToday ? "bg-[rgba(193,141,74,0.04)]" : "")}>
                    <div className={"px-1 py-2 border-b border-[rgba(198,145,76,0.12)] text-center " + (isToday ? "bg-[rgba(198,145,76,0.08)]" : "")}>
                      <div className="text-xs text-[#5A5A62]"><span className="hidden sm:inline">{arabicDays[d.getDay()]}</span><span className="sm:hidden">{arabicDaysShort[d.getDay()]}</span></div>
                      <div className={"text-base font-bold " + (isToday ? "text-[#C6914C]" : "text-gray-300")}>{d.getDate()}</div>
                    </div>
                    <div className="p-1 sm:p-2 space-y-1 sm:space-y-2">
                      {dayPosts.map((p) => (
                        <div key={p.id} onClick={() => { setSelectedPost(p); setSelectedDay(dateStr); }} className="bg-[#1C1C22] rounded p-1 sm:p-2 cursor-pointer hover:bg-[#2A2A32] transition">
                          <div className="flex items-center gap-1 mb-1"><div className={"w-2 h-2 rounded-full flex-shrink-0 " + (platformDots[p.main_channel || ""] || "bg-gray-500")} /><span className="text-xs text-[#5A5A62] hidden sm:inline">{p.scheduled_time || ""}</span></div>
                          <p className="text-xs text-gray-300 line-clamp-2">{p.main_text}</p>
                        </div>
                      ))}
                      <button onClick={() => { setShowAssign(true); setAssignDate(dateStr); }} className="w-full text-center text-xs text-[#5A5A62] hover:text-[#C6914C] py-1 transition">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Agenda View */}
      {view === "agenda" && (() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const agendaDays: { dateStr: string; dayPosts: ContentDraft[] }[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(i).padStart(2, "0");
          const dayPosts = getPostsForDate(dateStr);
          if (dayPosts.length > 0) agendaDays.push({ dateStr, dayPosts });
        }
        return (
          <div className="space-y-3">
            {agendaDays.length === 0 && (
              <div className="text-center py-16 text-[#5A5A62]">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p>لا يوجد محتوى مجدول هذا الشهر</p>
                <button onClick={() => { setShowAssign(true); setAssignDate(""); }} className="mt-4 text-sm text-[#C6914C] hover:underline">+ جدولة محتوى</button>
              </div>
            )}
            {agendaDays.map(({ dateStr, dayPosts }) => {
              const d = new Date(dateStr);
              const isToday = dateStr === todayStr;
              const dayLabel = arabicDays[d.getDay()] + " " + d.getDate() + " " + arabicMonths[d.getMonth()];
              return (
                <div key={dateStr} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl overflow-hidden">
                  <div className={"flex items-center gap-3 px-4 py-2.5 border-b border-[rgba(198,145,76,0.12)] " + (isToday ? "bg-[rgba(198,145,76,0.08)]" : "")}>
                    <span className={"text-sm font-bold " + (isToday ? "text-[#C6914C]" : "text-gray-300")}>{dayLabel}</span>
                    {isToday && <span className="text-xs bg-[#C6914C] text-white px-2 py-0.5 rounded-full">اليوم</span>}
                    <span className="text-xs text-[#5A5A62] mr-auto">{dayPosts.length} منشور</span>
                  </div>
                  <div className="divide-y divide-[rgba(198,145,76,0.08)]">
                    {dayPosts.map((p) => (
                      <div key={p.id} onClick={() => setSelectedPost(p)} className="flex items-start gap-3 px-4 py-3 hover:bg-[#1C1C22] cursor-pointer transition">
                        <div className="flex-shrink-0 mt-1"><div className={"w-2.5 h-2.5 rounded-full " + (platformDots[p.main_channel || ""] || "bg-gray-500")} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={"text-xs px-2 py-0.5 rounded " + (platformColors[p.main_channel || ""] || "bg-[#2A2A32]")}>{p.main_channel}</span>
                            {p.scheduled_time && <span className="text-xs text-[#5A5A62]">{p.scheduled_time}</span>}
                            <span className="text-xs text-[#5A5A62]">{p.status || "مسودة"}</span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2">{p.main_text}</p>
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={"text-xs px-2 py-1 rounded " + (platformColors[selectedPost.main_channel || ""] || "bg-[#2A2A32]")}>{selectedPost.main_channel}</span>
                <select value={selectedPost.status} onChange={(e) => { updatePostStatus(selectedPost.id, e.target.value); setSelectedPost({ ...selectedPost, status: e.target.value }); }} className="text-xs bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded px-2 py-1 focus:outline-none">
                  <option value="مسودة">مسودة</option><option value="جاهز">جاهز</option><option value="منشور">منشور</option>
                </select>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-[#5A5A62] hover:text-white"><X size={18} /></button>
            </div>
            <div className="text-xs text-[#5A5A62] mb-3">{selectedPost.scheduled_date} — {selectedPost.scheduled_time || "بدون وقت"}</div>
            {editingPost?.id === selectedPost.id ? (
              <div>
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={6} className="w-full bg-[#1C1C22] border border-[#C6914C] rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => savePostEdit(selectedPost.id)} className="text-sm bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition">حفظ</button>
                  <button onClick={() => setEditingPost(null)} className="text-sm bg-[#2A2A32] px-4 py-2 rounded-lg transition">إلغاء</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-4">{selectedPost.main_text}</p>
            )}
            {editingPost?.id !== selectedPost.id && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setEditingPost(selectedPost); setEditText(selectedPost.main_text); }} className="text-xs bg-[#1C1C22] hover:bg-[#2A2A32] px-3 py-2 rounded-lg flex items-center gap-1 transition"><Pencil size={12} /> تعديل</button>
                <button onClick={() => copyText(selectedPost.id, selectedPost.main_text)} className="text-xs bg-[#1C1C22] hover:bg-[#2A2A32] px-3 py-2 rounded-lg flex items-center gap-1 transition">{copiedId === selectedPost.id ? <><Check size={12} className="text-green-400" /> نُسخ</> : <><Copy size={12} /> نسخ</>}</button>
                <button onClick={() => unschedulePost(selectedPost.id)} className="text-xs bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 px-3 py-2 rounded-lg transition">إلغاء الجدولة</button>
                <button onClick={() => deletePost(selectedPost.id)} className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-2 rounded-lg transition">حذف</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Draft Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAssign(false)}>
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-2xl max-w-md w-full p-6" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg">جدولة مسودة</h4>
              <button onClick={() => setShowAssign(false)} className="text-[#5A5A62] hover:text-white"><X size={18} /></button>
            </div>
            {allDrafts.length === 0 ? (
              <p className="text-[#5A5A62] text-center py-8">لا توجد مسودات — أنتج محتوى أولاً من مصنع المحتوى أو خبير المحتوى</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">اختر المسودة</label>
                  <select value={assignDraftId} onChange={(e) => setAssignDraftId(e.target.value)} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]">
                    <option value="">اختر مسودة...</option>
                    {allDrafts.map((d) => (<option key={d.id} value={d.id}>{(d.main_channel || "") + " — " + (d.main_text || "").substring(0, 50)}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm text-[#9A9AA0] mb-2">تاريخ النشر</label><input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" /></div>
                  <div><label className="block text-sm text-[#9A9AA0] mb-2">وقت النشر</label><input type="time" value={assignTime} onChange={(e) => setAssignTime(e.target.value)} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]" /></div>
                </div>
                <button onClick={assignDraft} disabled={!assignDraftId || !assignDate} className={"w-full py-3 rounded-lg font-bold transition " + (assignDraftId && assignDate ? "bg-[#C6914C] hover:bg-[#A6743A] text-white" : "bg-[#2A2A32] text-[#5A5A62]")}>جدولة المسودة</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
