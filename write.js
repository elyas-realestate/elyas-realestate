const fs = require('fs');
const path = require('path');

// نقرأ الملف الحالي ونضيف CalendarTab فيه
const currentFile = fs.readFileSync(path.join(__dirname, 'app', 'dashboard', 'content', 'page.tsx'), 'utf8');

// نبني CalendarTab
const calendarTab = `
// ====== CALENDAR TAB ======
const platformColors: Record<string, string> = {
  "X (تويتر)": "bg-blue-500",
  "Instagram": "bg-pink-500",
  "TikTok": "bg-gray-100 text-black",
  "Snapchat": "bg-yellow-400 text-black",
  "LinkedIn": "bg-blue-700",
  "Threads": "bg-gray-400",
  "متعدد": "bg-purple-500",
};

const platformDots: Record<string, string> = {
  "X (تويتر)": "bg-blue-500",
  "Instagram": "bg-pink-500",
  "TikTok": "bg-white",
  "Snapchat": "bg-yellow-400",
  "LinkedIn": "bg-blue-700",
  "Threads": "bg-gray-400",
  "متعدد": "bg-purple-500",
};

const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function CalendarTab({ refreshKey, onDraftsCreated }: { refreshKey: number; onDraftsCreated: () => void }) {
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [allDrafts, setAllDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignDate, setAssignDate] = useState("");
  const [assignTime, setAssignTime] = useState("09:00");
  const [assignDraftId, setAssignDraftId] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copiedId, setCopiedId] = useState("");
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => { loadPosts(); }, [refreshKey]);

  async function loadPosts() {
    const [postsRes, draftsRes] = await Promise.all([
      supabase.from("content").select("*").not("scheduled_date", "is", null).order("scheduled_date", { ascending: true }),
      supabase.from("content").select("*").is("scheduled_date", null).order("created_at", { ascending: false }),
    ]);
    setPosts(postsRes.data || []);
    setAllDrafts(draftsRes.data || []);
    setLoading(false);
  }

  function getMonthDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
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
    let filtered = posts.filter(p => p.scheduled_date === dateStr);
    if (filterPlatform !== "all") filtered = filtered.filter(p => p.main_channel === filterPlatform);
    if (filterStatus !== "all") filtered = filtered.filter(p => p.status === filterStatus);
    return filtered;
  }

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + (dir * 7));
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
    await supabase.from("content").update({ status }).eq("id", id);
    loadPosts();
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
    const monthPosts = posts.filter(p => {
      const d = new Date(p.scheduled_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    let csv = "\\uFEFF" + "التاريخ,الوقت,المنصة,الصيغة,الحالة,المحتوى\\n";
    monthPosts.forEach(p => {
      const text = (p.main_text || "").replace(/"/g, '""').replace(/\\n/g, " ");
      csv += p.scheduled_date + "," + (p.scheduled_time || "") + "," + (p.main_channel || "") + "," + (p.content_format || "") + "," + (p.status || "") + ",\\"" + text + "\\"\\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "content-plan-" + year + "-" + String(month + 1).padStart(2, "0") + ".csv";
    a.click(); URL.revokeObjectURL(url);
  }

  const today = new Date();
  const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  const monthPostsCount = posts.filter(p => { const d = new Date(p.scheduled_date); return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth(); }).length;

  if (loading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h3 className="text-xl font-bold mb-1">الخطة الشهرية</h3><p className="text-gray-400 text-sm">خطط لمحتواك على تقويم بصري — اسحب المسودات وحدد مواعيد النشر</p></div>
        <div className="flex items-center gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 text-sm bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition">📥 تصدير Excel</button>
          <button onClick={() => { setShowAssign(true); setAssignDate(""); }} className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition"><Plus size={14} /> جدولة مسودة</button>
        </div>
      </div>

      {/* التنقل والفلاتر */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="bg-gray-900 border border-gray-800 w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition">→</button>
          <h4 className="font-bold text-lg min-w-[160px] text-center">{view === "month" ? arabicMonths[currentDate.getMonth()] + " " + currentDate.getFullYear() : "الأسبوع"}</h4>
          <button onClick={() => navigate(1)} className="bg-gray-900 border border-gray-800 w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition">←</button>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs text-blue-400 hover:text-blue-300 transition">اليوم</button>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
            <option value="all">كل المنصات</option>
            <option value="X (تويتر)">X</option><option value="Instagram">Instagram</option><option value="TikTok">TikTok</option><option value="Snapchat">Snapchat</option><option value="LinkedIn">LinkedIn</option><option value="Threads">Threads</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500">
            <option value="all">كل الحالات</option><option value="مسودة">مسودة</option><option value="جاهز">جاهز</option><option value="منشور">منشور</option>
          </select>
          <div className="flex bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <button onClick={() => setView("month")} className={"px-3 py-2 text-xs transition " + (view === "month" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}>شهري</button>
            <button onClick={() => setView("week")} className={"px-3 py-2 text-xs transition " + (view === "week" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}>أسبوعي</button>
          </div>
          <span className="text-xs text-gray-500">{monthPostsCount} منشور</span>
        </div>
      </div>

      {/* العرض الشهري */}
      {view === "month" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-800">
            {arabicDays.map(d => (<div key={d} className="px-2 py-3 text-center text-xs font-bold text-gray-500 border-l border-gray-800 last:border-l-0">{d}</div>))}
          </div>
          <div className="grid grid-cols-7">
            {getMonthDays().map((day, idx) => {
              const dateStr = day ? getDateStr(day) : "";
              const dayPosts = day ? getPostsForDate(dateStr) : [];
              const isToday = dateStr === todayStr;
              return (
                <div key={idx} onClick={() => { if (day) { setSelectedDay(dateStr); setSelectedPost(null); } }} className={"min-h-[100px] border-l border-b border-gray-800 last:border-l-0 p-1.5 cursor-pointer transition " + (day ? "hover:bg-gray-800/50" : "bg-gray-950/50") + (selectedDay === dateStr ? " bg-blue-900/10" : "")}>
                  {day && (
                    <>
                      <div className={"text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full " + (isToday ? "bg-blue-600 text-white" : "text-gray-400")}>{day}</div>
                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map(p => (
                          <div key={p.id} onClick={e => { e.stopPropagation(); setSelectedPost(p); setSelectedDay(dateStr); }} className={"text-xs px-1.5 py-1 rounded truncate cursor-pointer transition hover:opacity-80 " + (platformColors[p.main_channel] || "bg-gray-700")}>
                            {p.main_text?.substring(0, 25)}
                          </div>
                        ))}
                        {dayPosts.length > 3 && <div className="text-xs text-gray-500 text-center">+{dayPosts.length - 3}</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* العرض الأسبوعي */}
      {view === "week" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7">
            {getWeekDays().map((d, idx) => {
              const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
              const dayPosts = getPostsForDate(dateStr);
              const isToday = dateStr === todayStr;
              return (
                <div key={idx} className={"border-l border-gray-800 last:border-l-0 min-h-[400px] " + (isToday ? "bg-blue-900/5" : "")}>
                  <div className={"px-3 py-3 border-b border-gray-800 text-center " + (isToday ? "bg-blue-900/20" : "")}>
                    <div className="text-xs text-gray-500">{arabicDays[d.getDay()]}</div>
                    <div className={"text-lg font-bold " + (isToday ? "text-blue-400" : "text-gray-300")}>{d.getDate()}</div>
                  </div>
                  <div className="p-2 space-y-2">
                    {dayPosts.map(p => (
                      <div key={p.id} onClick={() => { setSelectedPost(p); setSelectedDay(dateStr); }} className="bg-gray-800 rounded-lg p-2 cursor-pointer hover:bg-gray-700 transition">
                        <div className="flex items-center gap-1 mb-1">
                          <div className={"w-2 h-2 rounded-full " + (platformDots[p.main_channel] || "bg-gray-500")}></div>
                          <span className="text-xs text-gray-500">{p.scheduled_time || ""}</span>
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-3">{p.main_text}</p>
                      </div>
                    ))}
                    <button onClick={() => { setShowAssign(true); setAssignDate(dateStr); }} className="w-full text-center text-xs text-gray-600 hover:text-blue-400 py-2 transition">+ إضافة</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* تفاصيل المنشور المحدد */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={"text-xs px-2 py-1 rounded " + (platformColors[selectedPost.main_channel] || "bg-gray-700")}>{selectedPost.main_channel}</span>
                <select value={selectedPost.status} onChange={e => { updatePostStatus(selectedPost.id, e.target.value); setSelectedPost({ ...selectedPost, status: e.target.value }); }} className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:outline-none">
                  <option value="مسودة">مسودة</option><option value="جاهز">جاهز</option><option value="منشور">منشور</option>
                </select>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="text-xs text-gray-500 mb-3">{selectedPost.scheduled_date} — {selectedPost.scheduled_time || "بدون وقت"}</div>
            {editingPost?.id === selectedPost.id ? (
              <div><textarea value={editText} onChange={e => setEditText(e.target.value)} rows={6} className="w-full bg-gray-800 border border-blue-500 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none mb-3" /><div className="flex gap-2"><button onClick={() => savePostEdit(selectedPost.id)} className="text-sm bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition">حفظ</button><button onClick={() => setEditingPost(null)} className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">إلغاء</button></div></div>
            ) : (
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-4">{selectedPost.main_text}</p>
            )}
            {editingPost?.id !== selectedPost.id && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setEditingPost(selectedPost); setEditText(selectedPost.main_text); }} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg flex items-center gap-1 transition"><Pencil size={12} /> تعديل</button>
                <button onClick={() => copyText(selectedPost.id, selectedPost.main_text)} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg flex items-center gap-1 transition">{copiedId === selectedPost.id ? <><Check size={12} className="text-green-400" /> نُسخ</> : <><Copy size={12} /> نسخ</>}</button>
                <button onClick={() => unschedulePost(selectedPost.id)} className="text-xs bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 px-3 py-2 rounded-lg transition">إلغاء الجدولة</button>
                <button onClick={() => deletePost(selectedPost.id)} className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-2 rounded-lg transition">حذف</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة جدولة مسودة */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAssign(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg">جدولة مسودة</h4>
              <button onClick={() => setShowAssign(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            {allDrafts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد مسودات — أنتج محتوى أولاً من مصنع المحتوى أو خبير المحتوى</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">اختر المسودة</label>
                  <select value={assignDraftId} onChange={e => setAssignDraftId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">اختر مسودة...</option>
                    {allDrafts.map(d => (<option key={d.id} value={d.id}>{(d.main_channel || "") + " — " + (d.main_text || "").substring(0, 50)}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-400 mb-2">تاريخ النشر</label><input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-sm text-gray-400 mb-2">وقت النشر</label><input type="time" value={assignTime} onChange={e => setAssignTime(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500" /></div>
                </div>
                <button onClick={assignDraft} disabled={!assignDraftId || !assignDate} className={"w-full py-3 rounded-lg font-bold transition " + (assignDraftId && assignDate ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 text-gray-500")}>جدولة المسودة</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`;

// نستبدل ComingSoon للتقويم بالتبويب الفعلي
let updated = currentFile;

// نضيف CalendarTab قبل // ====== COMING SOON
const comingSoonIndex = updated.indexOf('// ====== COMING SOON');
if (comingSoonIndex > -1) {
  updated = updated.slice(0, comingSoonIndex) + calendarTab + '\n' + updated.slice(comingSoonIndex);
}

// نستبدل استدعاء التقويم القديم
updated = updated.replace(
  '{activeTab === "calendar" && <ComingSoon title="الخطة الشهرية" desc="تقويم بصري يعرض كل المحتوى المجدول — أضف المنشورات وحدد تاريخ النشر وصدّرها كـ Excel" />}',
  '{activeTab === "calendar" && <CalendarTab refreshKey={draftsRefresh} onDraftsCreated={() => setDraftsRefresh(r => r + 1)} />}'
);

fs.writeFileSync(path.join(__dirname, 'app', 'dashboard', 'content', 'page.tsx'), updated, 'utf8');
console.log('Done! Calendar tab added.');
console.log('Restart: taskkill /f /im node.exe && npm run dev');