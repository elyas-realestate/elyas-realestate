"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Sparkles, Factory, MessageSquare, Calendar, TrendingUp, Settings, Copy, Check, Loader2, Plus, Trash2, Play, Pencil, Save, X, FileText } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tabs = [
  { id: "identity", label: "هوية الوسيط", icon: Settings, desc: "إعدادات الهوية والأسلوب" },
  { id: "factory", label: "مصنع المحتوى", icon: Factory, desc: "إنتاج دفعات محتوى مرتبطة بعقاراتك" },
  { id: "drafts", label: "المسودات", icon: FileText, desc: "المحتوى المحفوظ والجاهز للنشر" },
  { id: "expert", label: "خبير المحتوى", icon: MessageSquare, desc: "من الفكرة إلى المحتوى الجاهز" },
  { id: "calendar", label: "الخطة الشهرية", icon: Calendar, desc: "تقويم بصري لجدولة المحتوى" },
  { id: "trends", label: "ترندات ومناسبات", icon: TrendingUp, desc: "أفكار مرتبطة بأحداث السوق" },
];

// ====== IDENTITY TAB ======
function IdentityTab() {
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadIdentity(); }, []);

  async function loadIdentity() {
    const { data } = await supabase.from("broker_identity").select("*").limit(1).single();
    if (data) setIdentity(data);
    else setIdentity({
      broker_name: "إلياس الدخيل", fal_license: "", specialization: "وساطة وتسويق عقاري",
      coverage_areas: ["الرياض"], target_audiences: ["مالك عقار", "مشتري", "مستأجر", "مستثمر"],
      brand_keywords: ["وسيط مرخص", "الرياض", "عقارات"], avoid_phrases: ["سمسار", "فرصة لا تعوض", "حصرياً"],
      bio_short: "", bio_long: "",
    });
    setLoading(false);
  }

  function handleChange(field: string, value: any) { setIdentity((prev: any) => ({ ...prev, [field]: value })); }
  function handleArrayChange(field: string, value: string) {
    const arr = value.split("،").map((s: string) => s.trim()).filter(Boolean);
    setIdentity((prev: any) => ({ ...prev, [field]: arr }));
  }

  async function handleSave() {
    setSaving(true);
    if (identity.id) {
      await supabase.from("broker_identity").update({
        broker_name: identity.broker_name, fal_license: identity.fal_license, specialization: identity.specialization,
        coverage_areas: identity.coverage_areas, target_audiences: identity.target_audiences,
        brand_keywords: identity.brand_keywords, avoid_phrases: identity.avoid_phrases,
        bio_short: identity.bio_short, bio_long: identity.bio_long, updated_at: new Date().toISOString(),
      }).eq("id", identity.id);
    } else {
      const { data } = await supabase.from("broker_identity").insert([identity]).select().single();
      if (data) setIdentity(data);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;
  if (!identity) return null;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">هوية الوسيط</h3>
        <p className="text-gray-400 text-sm">هذه المعلومات تُستخدم تلقائياً في كل محتوى يُنتج بالذكاء الاصطناعي — عبّئها مرة واحدة بدقة.</p>
      </div>
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h4 className="font-bold text-blue-400 mb-2">المعلومات الأساسية</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-gray-400 mb-2">اسم الوسيط</label><input value={identity.broker_name || ""} onChange={e => handleChange("broker_name", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
            <div><label className="block text-sm text-gray-400 mb-2">رقم رخصة فال</label><input value={identity.fal_license || ""} onChange={e => handleChange("fal_license", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="أدخل رقم الرخصة" /></div>
          </div>
          <div><label className="block text-sm text-gray-400 mb-2">التخصص</label><input value={identity.specialization || ""} onChange={e => handleChange("specialization", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">مناطق التغطية <span className="text-gray-600">(افصل بفاصلة عربية ،)</span></label><input value={(identity.coverage_areas || []).join("، ")} onChange={e => handleArrayChange("coverage_areas", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">الجمهور المستهدف <span className="text-gray-600">(افصل بفاصلة عربية ،)</span></label><input value={(identity.target_audiences || []).join("، ")} onChange={e => handleArrayChange("target_audiences", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">كلمات مفتاحية للبراند <span className="text-gray-600">(افصل بفاصلة عربية ،)</span></label><input value={(identity.brand_keywords || []).join("، ")} onChange={e => handleArrayChange("brand_keywords", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">عبارات تتجنبها <span className="text-gray-600">(افصل بفاصلة عربية ،)</span></label><input value={(identity.avoid_phrases || []).join("، ")} onChange={e => handleArrayChange("avoid_phrases", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h4 className="font-bold text-blue-400 mb-2">النبذة التعريفية</h4>
          <div><label className="block text-sm text-gray-400 mb-2">نبذة قصيرة</label><textarea value={identity.bio_short || ""} onChange={e => handleChange("bio_short", e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="وسيط عقاري مرخص في الرياض..." /></div>
          <div><label className="block text-sm text-gray-400 mb-2">نبذة تفصيلية</label><textarea value={identity.bio_long || ""} onChange={e => handleChange("bio_long", e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="اكتب نبذة تفصيلية..." /></div>
        </div>
        <button onClick={handleSave} disabled={saving} className={"px-8 py-3 rounded-lg font-bold text-lg transition " + (saved ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700")}>{saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ الهوية"}</button>
      </div>
    </div>
  );
}

// ====== EDITABLE POST COMPONENT ======
function EditablePost({ text, postIndex, groupLabel, onSave, onCopy }: { text: string; postIndex: number; groupLabel: string; onSave: (newText: string) => void; onCopy: (text: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      textareaRef.current.focus();
    }
  }, [editing]);

  function handleCopy() {
    const t = editing ? editText : text;
    navigator.clipboard.writeText(t);
    onCopy(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    onSave(editText);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCancel() {
    setEditText(text);
    setEditing(false);
  }

  return (
    <div className="p-4 hover:bg-gray-900/50 transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs text-gray-500">منشور {postIndex + 1}</span>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition"><Save size={12} /><span>حفظ</span></button>
              <button onClick={handleCancel} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition"><X size={12} /><span>إلغاء</span></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition"><Pencil size={12} /><span>تعديل</span></button>
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs transition">
                {copied ? <><Check size={12} className="text-green-400" /><span className="text-green-400">نُسخ</span></> : <><Copy size={12} className="text-gray-500" /><span className="text-gray-500 hover:text-white">نسخ</span></>}
              </button>
              {saved && <span className="text-xs text-green-400">✓ حُفظ</span>}
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea ref={textareaRef} value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-gray-800 border border-blue-500 rounded-lg px-4 py-3 text-sm text-gray-200 leading-relaxed focus:outline-none resize-none" />
      ) : (
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      )}
    </div>
  );
}

// ====== FACTORY TAB ======
type QueueItem = {
  id: string; propertyId: string; propertyLabel: string; contentGoal: string;
  platform: string; contentFormat: string; writingTone: string; contentLanguage: string; postCount: string;
};
type ResultGroup = { queueItem: QueueItem; posts: string[]; };

function FactoryTab({ onDraftsCreated }: { onDraftsCreated: () => void }) {
  const [properties, setProperties] = useState<any[]>([]);
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [resultGroups, setResultGroups] = useState<ResultGroup[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const [draftsSaved, setDraftsSaved] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState("");
  const [contentGoal, setContentGoal] = useState("");
  const [platform, setPlatform] = useState("");
  const [contentFormat, setContentFormat] = useState("");
  const [writingTone, setWritingTone] = useState("");
  const [contentLanguage, setContentLanguage] = useState("");
  const [postCount, setPostCount] = useState("1");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [propsRes, idRes] = await Promise.all([
      supabase.from("properties").select("id, title, district, city, price, offer_type, sub_category, land_area, rooms, description").order("created_at", { ascending: false }),
      supabase.from("broker_identity").select("*").limit(1).single(),
    ]);
    setProperties(propsRes.data || []);
    if (idRes.data) setIdentity(idRes.data);
    setLoading(false);
  }

  function addToQueue() {
    if (!contentGoal || !platform || !contentFormat || !writingTone || !contentLanguage) {
      setShowErrors(true); setError("اختر جميع الخيارات المطلوبة"); return;
    }
    setShowErrors(false); setError("");
    const prop = properties.find(p => p.id === selectedProperty);
    const item: QueueItem = {
      id: Date.now().toString(), propertyId: selectedProperty,
      propertyLabel: prop ? prop.title + " — " + prop.district : "محتوى عام",
      contentGoal, platform, contentFormat, writingTone, contentLanguage, postCount,
    };
    setQueue(prev => [...prev, item]);
    setPlatform(""); setContentFormat(""); setPostCount("1");
  }

  function removeFromQueue(id: string) { setQueue(prev => prev.filter(q => q.id !== id)); }

  async function updateDraft(groupIdx: number, postIdx: number, newText: string) {
    const newGroups = [...resultGroups];
    newGroups[groupIdx].posts[postIdx] = newText;
    setResultGroups(newGroups);
    const group = newGroups[groupIdx];
    await supabase.from("content").update({ main_text: newText }).match({
      main_channel: group.queueItem.platform,
      content_format: group.queueItem.contentFormat,
      main_text: resultGroups[groupIdx].posts[postIdx],
    });
  }

  async function generateAll() {
    if (queue.length === 0) return;
    setGenerating(true);
    setResultGroups([]);
    setDraftsSaved(false);
    setProgress({ current: 0, total: queue.length });

    const allGroups: ResultGroup[] = [];

    for (let i = 0; i < queue.length; i++) {
      setProgress({ current: i + 1, total: queue.length });
      const item = queue[i];
      const prop = properties.find(p => p.id === item.propertyId);
      const propInfo = prop ? `عقار: ${prop.title}\nالنوع: ${prop.sub_category} — ${prop.offer_type}\nالموقع: ${prop.district}، ${prop.city}\nالمساحة: ${prop.land_area || "غير محدد"} م²\nالغرف: ${prop.rooms || "غير محدد"}\nالسعر: ${prop.price ? prop.price.toLocaleString() + " ريال" : "غير محدد"}\nالوصف: ${prop.description || "لا يوجد وصف"}` : "لا يوجد عقار محدد — اكتب محتوى عقاري عام";
      const identityInfo = identity ? `اسم الوسيط: ${identity.broker_name}\nالتخصص: ${identity.specialization}\nمناطق التغطية: ${(identity.coverage_areas || []).join("، ")}\nالجمهور المستهدف: ${(identity.target_audiences || []).join("، ")}\nكلمات البراند: ${(identity.brand_keywords || []).join("، ")}\nعبارات يتجنبها: ${(identity.avoid_phrases || []).join("، ")}\nالنبذة: ${identity.bio_short || ""}` : "";

      const systemPrompt = `أنت خبير محتوى عقاري متخصص في السوق السعودي. مهمتك كتابة منشورات سوشال ميديا احترافية.\n\nهوية الوسيط:\n${identityInfo}\n\nالقواعد الصارمة:\n- المحتوى يتحدث عن الوسيط بصيغة الغائب (لا يتحدث عن نفسه) إلا إذا كان الأسلوب يتطلب غير ذلك\n- لا تكتب "أول تغريدة" أو ما يوحي ببداية جديدة — الحساب قديم ومعروف\n- نبرة الكتابة: ${item.writingTone}\n- لغة المحتوى: ${item.contentLanguage}\n- اجعل كل منشور مختلف عن الآخر في الأسلوب والافتتاحية\n- أضف هاشتاقات مناسبة لكل منشور\n- اجعل الافتتاحية قوية وجاذبة (هوك)\n- أضف CTA مناسب عند الحاجة\n- الطول يناسب المنصة المختارة\n- لا تضف معلومات غير مذكورة عن العقار`;

      const userPrompt = `اكتب ${item.postCount} منشور لمنصة ${item.platform} بصيغة ${item.contentFormat}.\n\nمعلومات العقار:\n${propInfo}\n\nالهدف: ${item.contentGoal}\n\nاكتب كل منشور مفصولاً بسطر فارغ ورقم المنشور. مثال:\n1.\n[نص المنشور]\n\n2.\n[نص المنشور]\n\nوهكذا حتى منشور رقم ${item.postCount}.`;

      try {
        const res = await fetch("/api/ai-content", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemPrompt, userPrompt }),
        });
        const data = await res.json();
        if (data.error) {
          allGroups.push({ queueItem: item, posts: ["خطأ: " + data.error] });
        } else {
          const posts = data.result.split(/\n\d+\.\s*\n|\n\d+[\.\)]\s*/g).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
          allGroups.push({ queueItem: item, posts: posts.length > 0 ? posts : [data.result] });
        }
      } catch (err: any) {
        allGroups.push({ queueItem: item, posts: ["خطأ في الاتصال: " + err.message] });
      }
    }

    setResultGroups(allGroups);
    setQueue([]);

    // حفظ تلقائي كمسودات
    const drafts: any[] = [];
    allGroups.forEach(group => {
      group.posts.forEach((post, idx) => {
        if (!post.startsWith("خطأ")) {
          drafts.push({
            title: post.substring(0, 50) + "...",
            main_text: post,
            content_goal: group.queueItem.contentGoal,
            main_channel: group.queueItem.platform,
            content_format: group.queueItem.contentFormat,
            status: "مسودة",
          });
        }
      });
    });
    if (drafts.length > 0) {
      await supabase.from("content").insert(drafts);
      setDraftsSaved(true);
      onDraftsCreated();
    }

    setGenerating(false);
  }

  if (loading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;
  const totalPosts = queue.reduce((sum, q) => sum + parseInt(q.postCount), 0);

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">مصنع المحتوى</h3>
        <p className="text-gray-400 text-sm">أضف طلبات المحتوى للقائمة ثم انتجها كلها دفعة واحدة — تُحفظ تلقائياً كمسودات</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-blue-400 text-sm">إضافة طلب محتوى</h4>
            <div><label className="block text-sm text-gray-400 mb-2">العقار <span className="text-gray-600">(اختياري)</span></label><select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"><option value="">محتوى عام — بدون عقار محدد</option>{properties.map(p => (<option key={p.id} value={p.id}>{p.title} — {p.district}</option>))}</select></div>
            <div><label className={"block text-sm mb-2 " + (showErrors && !contentGoal ? "text-red-400" : "text-gray-400")}>الهدف *</label><select value={contentGoal} onChange={e => setContentGoal(e.target.value)} className={"w-full bg-gray-800 rounded-lg px-4 py-3 focus:outline-none text-sm border " + (showErrors && !contentGoal ? "border-red-500" : "border-gray-700 focus:border-blue-500")}><option value="">اختر الهدف...</option><option value="زيادة المبيعات">زيادة المبيعات</option><option value="زيادة التفاعل">زيادة التفاعل</option><option value="بناء الثقة والوعي">بناء الثقة والوعي</option><option value="تعليم الجمهور">تعليم الجمهور</option><option value="جذب عملاء جدد">جذب عملاء جدد</option></select></div>
            <div><label className={"block text-sm mb-2 " + (showErrors && !platform ? "text-red-400" : "text-gray-400")}>المنصة *</label><select value={platform} onChange={e => setPlatform(e.target.value)} className={"w-full bg-gray-800 rounded-lg px-4 py-3 focus:outline-none text-sm border " + (showErrors && !platform ? "border-red-500" : "border-gray-700 focus:border-blue-500")}><option value="">اختر المنصة...</option><option value="X (تويتر)">X (تويتر)</option><option value="Instagram">Instagram</option><option value="TikTok">TikTok</option><option value="Snapchat">Snapchat</option><option value="LinkedIn">LinkedIn</option><option value="Threads">Threads</option></select></div>
            <div><label className={"block text-sm mb-2 " + (showErrors && !contentFormat ? "text-red-400" : "text-gray-400")}>صيغة المحتوى *</label><select value={contentFormat} onChange={e => setContentFormat(e.target.value)} className={"w-full bg-gray-800 rounded-lg px-4 py-3 focus:outline-none text-sm border " + (showErrors && !contentFormat ? "border-red-500" : "border-gray-700 focus:border-blue-500")}><option value="">اختر الصيغة...</option><option value="تغريدة / نص قصير">تغريدة / نص قصير</option><option value="نص طويل (كابشن)">نص طويل (كابشن)</option><option value="سكريبت ريلز / فيديو قصير">سكريبت ريلز / فيديو قصير</option><option value="كاروسيل (شرائح)">كاروسيل (شرائح)</option><option value="ثريد (سلسلة تغريدات)">ثريد (سلسلة تغريدات)</option></select></div>
            <div><label className={"block text-sm mb-2 " + (showErrors && !writingTone ? "text-red-400" : "text-gray-400")}>نبرة الكتابة *</label><select value={writingTone} onChange={e => setWritingTone(e.target.value)} className={"w-full bg-gray-800 rounded-lg px-4 py-3 focus:outline-none text-sm border " + (showErrors && !writingTone ? "border-red-500" : "border-gray-700 focus:border-blue-500")}><option value="">اختر النبرة...</option><option value="احترافي وبشري — واثق بدون تعالي">احترافي وبشري</option><option value="رسمي ومهني">رسمي ومهني</option><option value="ودي وقريب من الناس">ودي وقريب</option><option value="تحفيزي وملهم">تحفيزي وملهم</option><option value="تعليمي وتثقيفي">تعليمي وتثقيفي</option><option value="جريء ومباشر">جريء ومباشر</option></select></div>
            <div><label className={"block text-sm mb-2 " + (showErrors && !contentLanguage ? "text-red-400" : "text-gray-400")}>لغة المحتوى *</label><select value={contentLanguage} onChange={e => setContentLanguage(e.target.value)} className={"w-full bg-gray-800 rounded-lg px-4 py-3 focus:outline-none text-sm border " + (showErrors && !contentLanguage ? "border-red-500" : "border-gray-700 focus:border-blue-500")}><option value="">اختر اللغة...</option><option value="عربي فصيح سلس">عربي فصيح سلس</option><option value="عربي فصيح رسمي">عربي فصيح رسمي</option><option value="لهجة سعودية بيضاء">لهجة سعودية بيضاء</option><option value="مزيج فصحى ولهجة">مزيج فصحى ولهجة</option></select></div>
            <div><label className="block text-sm text-gray-400 mb-2">عدد المنشورات</label><select value={postCount} onChange={e => setPostCount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm">{Array.from({ length: 20 }, (_, i) => i + 1).map(n => (<option key={n} value={String(n)}>{n}</option>))}</select></div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={addToQueue} className="w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white"><Plus size={18} /> إضافة للقائمة</button>
          </div>

          {queue.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-sm">قائمة المحتوى ({queue.length} طلب — {totalPosts} منشور)</h4>
              {queue.map(item => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">{item.platform}</span>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{item.contentFormat}</span>
                      <span className="text-xs text-gray-500">{item.postCount} منشور</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate">{item.propertyLabel} — {item.contentGoal}</p>
                  </div>
                  <button onClick={() => removeFromQueue(item.id)} className="text-gray-500 hover:text-red-400 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={generateAll} disabled={generating} className={"w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 " + (generating ? "bg-gray-700 text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                {generating ? <><Loader2 size={18} className="animate-spin" /> جاري الإنتاج...</> : <><Play size={18} /> إنتاج الكل ({totalPosts} منشور)</>}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {resultGroups.length === 0 && !generating && queue.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Factory size={48} className="text-gray-700 mb-4" />
              <p className="text-gray-500">أضف طلبات المحتوى للقائمة ثم اضغط "إنتاج الكل"</p>
              <p className="text-gray-600 text-sm mt-2">يمكنك إضافة طلبات لمنصات مختلفة وإنتاجها دفعة واحدة</p>
            </div>
          )}

          {resultGroups.length === 0 && queue.length > 0 && !generating && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-400 font-bold text-lg">{queue.length} طلب في القائمة — {totalPosts} منشور</p>
              <p className="text-gray-600 text-sm mt-2">اضغط "إنتاج الكل" لبدء الإنتاج</p>
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 size={56} className="text-blue-400 animate-spin mb-6" />
              <p className="text-white font-bold text-lg mb-2">جاري إنتاج المحتوى...</p>
              <p className="text-gray-400">الطلب {progress.current} من {progress.total}</p>
              <div className="w-64 bg-gray-800 rounded-full h-2 mt-4">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: (progress.current / progress.total * 100) + "%" }}></div>
              </div>
              <p className="text-gray-600 text-sm mt-4">قد يستغرق بضع دقائق حسب عدد المنشورات</p>
            </div>
          )}

          {resultGroups.length > 0 && !generating && (
            <div className="space-y-6">
              {draftsSaved && (
                <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 flex items-center gap-3">
                  <Check size={20} className="text-green-400" />
                  <p className="text-green-400 text-sm">تم حفظ جميع المنشورات كمسودات تلقائياً — يمكنك مراجعتها في تبويب "المسودات"</p>
                </div>
              )}
              {resultGroups.map((group, gIdx) => (
                <div key={gIdx} className="border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{group.queueItem.platform}</span>
                      <span className="text-xs text-gray-400">{group.queueItem.contentFormat}</span>
                    </div>
                    <span className="text-xs text-green-400">✓ {group.posts.length} منشور</span>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {group.posts.map((post, pIdx) => (
                      <EditablePost
                        key={pIdx}
                        text={post}
                        postIndex={pIdx}
                        groupLabel={group.queueItem.platform}
                        onSave={async (newText) => {
                          const newGroups = [...resultGroups];
                          const oldText = newGroups[gIdx].posts[pIdx];
                          newGroups[gIdx].posts[pIdx] = newText;
                          setResultGroups(newGroups);
                          await supabase.from("content").update({ main_text: newText }).eq("main_text", oldText).eq("status", "مسودة");
                        }}
                        onCopy={() => {}}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== DRAFTS TAB ======
function DraftsTab({ refreshKey }: { refreshKey: number }) {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState("");
  const [editText, setEditText] = useState("");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => { loadDrafts(); }, [refreshKey]);

  async function loadDrafts() {
    const { data } = await supabase.from("content").select("*").order("created_at", { ascending: false });
    setDrafts(data || []);
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

  const filtered = drafts.filter(d => filter === "all" || d.status === filter);
  const statusCounts = {
    all: drafts.length,
    "مسودة": drafts.filter(d => d.status === "مسودة").length,
    "جاهز": drafts.filter(d => d.status === "جاهز").length,
    "منشور": drafts.filter(d => d.status === "منشور").length,
  };

  if (loading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">المسودات</h3>
        <p className="text-gray-400 text-sm">جميع المحتوى المُنتج — عدّل، انسخ، أو غيّر الحالة</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[["all", "الكل"], ["مسودة", "مسودة"], ["جاهز", "جاهز"], ["منشور", "منشور"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className={"px-4 py-2 rounded-lg text-sm transition " + (filter === val ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}>
            {label} ({statusCounts[val as keyof typeof statusCounts] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">لا يوجد محتوى بعد — انتج محتوى من مصنع المحتوى</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(draft => (
            <div key={draft.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {draft.main_channel && <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{draft.main_channel}</span>}
                  {draft.content_format && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{draft.content_format}</span>}
                  <select value={draft.status} onChange={e => updateStatus(draft.id, e.target.value)} className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500">
                    <option value="مسودة">مسودة</option>
                    <option value="جاهز">جاهز</option>
                    <option value="منشور">منشور</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  {editingId === draft.id ? (
                    <>
                      <button onClick={() => saveEdit(draft.id)} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"><Save size={12} /> حفظ</button>
                      <button onClick={() => setEditingId("")} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"><X size={12} /> إلغاء</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(draft.id); setEditText(draft.main_text); }} className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1"><Pencil size={12} /> تعديل</button>
                      <button onClick={() => copyText(draft.id, draft.main_text)} className="text-xs flex items-center gap-1">{copiedId === draft.id ? <><Check size={12} className="text-green-400" /><span className="text-green-400">نُسخ</span></> : <><Copy size={12} className="text-gray-500" /><span className="text-gray-500 hover:text-white">نسخ</span></>}</button>
                      <button onClick={() => deleteDraft(draft.id)} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"><Trash2 size={12} /> حذف</button>
                    </>
                  )}
                </div>
              </div>
              {editingId === draft.id ? (
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={5} className="w-full bg-gray-800 border border-blue-500 rounded-lg px-4 py-3 text-sm text-gray-200 leading-relaxed focus:outline-none" />
              ) : (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{draft.main_text}</p>
              )}
              <div className="flex gap-2 mt-3 text-xs text-gray-600">
                {draft.content_goal && <span>{draft.content_goal}</span>}
                {draft.created_at && <span>{new Date(draft.created_at).toLocaleDateString("ar-SA")}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====== COMING SOON ======
function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-6"><Sparkles size={32} className="text-blue-400" /></div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-md">{desc}</p>
      <span className="mt-4 text-xs bg-blue-900/30 text-blue-400 px-4 py-2 rounded-full">قريباً — المرحلة التالية</span>
    </div>
  );
}

// ====== MAIN ======
export default function ContentAI() {
  const [activeTab, setActiveTab] = useState("factory");
  const [draftsRefresh, setDraftsRefresh] = useState(0);

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">وكيل المحتوى العقاري</h2>
        <p className="text-gray-400 text-sm">منصة ذكاء اصطناعي متكاملة لصناعة المحتوى العقاري — من الفكرة إلى النشر</p>
      </div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={"flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition whitespace-nowrap " + (activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700")}>
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>
      {activeTab === "identity" && <IdentityTab />}
      {activeTab === "factory" && <FactoryTab onDraftsCreated={() => setDraftsRefresh(r => r + 1)} />}
      {activeTab === "drafts" && <DraftsTab refreshKey={draftsRefresh} />}
      {activeTab === "expert" && <ComingSoon title="خبير المحتوى" desc="أعطه فكرة أو موضوع ← يسألك عن الجمهور والهدف ← يكتب لك محتوى كامل جاهز للنشر" />}
      {activeTab === "calendar" && <ComingSoon title="الخطة الشهرية" desc="تقويم بصري يعرض كل المحتوى المجدول — أضف المنشورات وحدد تاريخ النشر وصدّرها كـ Excel" />}
      {activeTab === "trends" && <ComingSoon title="ترندات ومناسبات" desc="اقتراحات محتوى مرتبطة بأخبار السوق العقاري والمناسبات" />}
    </div>
  );
}
