"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Sparkles, Factory, MessageSquare, Calendar, TrendingUp, Settings, Copy, Check, Loader2, Plus, Trash2, Play, Pencil, Save, X, FileText, Send, RefreshCw, Cpu } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tabs = [
  { id: "identity", label: "هوية الوسيط", icon: Settings, desc: "إعدادات الهوية والأسلوب" },
  { id: "factory", label: "مصنع المحتوى", icon: Factory, desc: "إنتاج دفعات محتوى مرتبطة بعقاراتك" },
  { id: "expert", label: "خبير المحتوى", icon: MessageSquare, desc: "من الفكرة إلى المحتوى الجاهز" },
  { id: "drafts", label: "المسودات", icon: FileText, desc: "المحتوى المحفوظ والجاهز للنشر" },
  { id: "calendar", label: "الخطة الشهرية", icon: Calendar, desc: "تقويم بصري لجدولة المحتوى" },
  { id: "trends", label: "ترندات ومناسبات", icon: TrendingUp, desc: "أفكار مرتبطة بأحداث السوق" },
];

const providers = [
  { id: "openai", name: "OpenAI", desc: "صانعة ChatGPT — أشهر نماذج الذكاء الاصطناعي", models: [
    { id: "gpt-4o", name: "GPT-4o", desc: "الأقوى والأشمل" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "سريع واقتصادي، جودة جيدة" },
    { id: "gpt-4.1", name: "GPT-4.1", desc: "أحدث إصدار من OpenAI" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", desc: "نسخة خفيفة وأرخص من 4.1" },
  ]},
  { id: "anthropic", name: "Anthropic", desc: "صانعة Claude — ممتاز في الفهم والكتابة العربية", models: [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", desc: "ممتاز في الكتابة والفهم العربي" },
    { id: "claude-haiku-4.5-20251001", name: "Claude Haiku 4.5", desc: "سريع جداً وأرخص" },
  ]},
  { id: "google", name: "Google", desc: "صانعة Gemini — قوي في المحتوى متعدد اللغات", models: [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "الأقوى من Google" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "سريع واقتصادي" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", desc: "مستقر وأرخص" },
  ]},
];

const modes = [
  { id: "single", name: "نموذج واحد", desc: "نموذج واحد يكتب المحتوى — الأسرع والأوفر" },
  { id: "chain", name: "دمج (تتابع)", desc: "نموذج يكتب + نموذج ثاني يراجع ويحسّن — جودة أعلى" },
  { id: "compare", name: "مقارنة", desc: "نفس الطلب لنموذجين — تشوف النتيجتين وتختار الأفضل" },
];

const needsKey: Record<string, string> = { openai: "OPENAI_API_KEY", anthropic: "ANTHROPIC_API_KEY", google: "GOOGLE_API_KEY" };

// ====== MODEL SELECTOR COMPONENT ======
function ModelSelector({ label, provider, setProvider, model, setModel, showMode, mode, setMode, provider2, setProvider2, model2, setModel2 }: any) {  const currentProvider = providers.find(p => p.id === provider);
  const currentProvider2 = providers.find(p => p.id === provider2);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1"><Cpu size={14} className="text-blue-400" /><h4 className="font-bold text-blue-400 text-sm">{label || "إعدادات النموذج"}</h4></div>

      {showMode && setMode && (
        <div>
          <label className="block text-xs text-gray-500 mb-2">وضع التشغيل</label>
          <div className="space-y-1">
            {modes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} className={"w-full text-right px-3 py-2 rounded-lg text-sm transition flex items-center justify-between " + (mode === m.id ? "bg-blue-600/20 border border-blue-500/30 text-blue-400" : "bg-gray-800 border border-gray-700 text-gray-400 hover:text-white")}>
                <span>{m.name}</span><span className="text-xs text-gray-500">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-2">{mode === "chain" ? "شركة النموذج الكاتب" : mode === "compare" ? "شركة النموذج الأول" : "مزود الخدمة"}</label>
        <select value={provider} onChange={e => { setProvider(e.target.value); const prov = providers.find(p => p.id === e.target.value); if (prov) setModel(prov.models[0].id); }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          {providers.map(p => (<option key={p.id} value={p.id}>{p.name} — {p.desc}</option>))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-2">{mode === "chain" ? "النموذج الكاتب" : mode === "compare" ? "النموذج الأول" : "النموذج"}</label>
        <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          {currentProvider?.models.map(m => (<option key={m.id} value={m.id}>{m.name} — {m.desc}</option>))}
        </select>
      </div>

      {(mode === "chain" || mode === "compare") && setProvider2 && setModel2 && (
        <>
          <div className="border-t border-gray-700 pt-3">
            <label className="block text-xs text-gray-500 mb-2">{mode === "chain" ? "شركة النموذج المراجع" : "شركة النموذج الثاني"}</label>
            <select value={provider2} onChange={e => { setProvider2(e.target.value); const prov = providers.find(p => p.id === e.target.value); if (prov && setModel2) setModel2(prov.models[0].id); }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              {providers.map(p => (<option key={p.id} value={p.id}>{p.name} — {p.desc}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">{mode === "chain" ? "النموذج المراجع" : "النموذج الثاني"}</label>
            <select value={model2} onChange={e => setModel2(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              {currentProvider2?.models.map(m => (<option key={m.id} value={m.id}>{m.name} — {m.desc}</option>))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}

// ====== IDENTITY TAB ======
function IdentityTab() {
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { loadIdentity(); }, []);
  async function loadIdentity() { const { data } = await supabase.from("broker_identity").select("*").limit(1).single(); if (data) setIdentity(data); else setIdentity({ broker_name: "إلياس الدخيل", fal_license: "", specialization: "وساطة وتسويق عقاري", coverage_areas: ["الرياض"], target_audiences: ["مالك عقار", "مشتري", "مستأجر", "مستثمر"], brand_keywords: ["وسيط مرخص", "الرياض", "عقارات"], avoid_phrases: ["سمسار", "فرصة لا تعوض", "حصرياً"], bio_short: "", bio_long: "" }); setLoading(false); }
  function handleChange(field: string, value: any) { setIdentity((prev: any) => ({ ...prev, [field]: value })); }
  function handleArrayChange(field: string, value: string) { setIdentity((prev: any) => ({ ...prev, [field]: value.split("،").map((s: string) => s.trim()).filter(Boolean) })); }
  async function handleSave() { setSaving(true); if (identity.id) { await supabase.from("broker_identity").update({ broker_name: identity.broker_name, fal_license: identity.fal_license, specialization: identity.specialization, coverage_areas: identity.coverage_areas, target_audiences: identity.target_audiences, brand_keywords: identity.brand_keywords, avoid_phrases: identity.avoid_phrases, bio_short: identity.bio_short, bio_long: identity.bio_long, updated_at: new Date().toISOString() }).eq("id", identity.id); } else { const { data } = await supabase.from("broker_identity").insert([identity]).select().single(); if (data) setIdentity(data); } setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  if (loading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;
  if (!identity) return null;
  return (
    <div className="max-w-3xl">
      <div className="mb-6"><h3 className="text-xl font-bold mb-2">هوية الوسيط</h3><p className="text-gray-400 text-sm">هذه المعلومات تُستخدم تلقائياً في كل محتوى يُنتج — عبّئها مرة واحدة بدقة.</p></div>
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h4 className="font-bold text-blue-400 mb-2">المعلومات الأساسية</h4>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-gray-400 mb-2">اسم الوسيط</label><input value={identity.broker_name || ""} onChange={e => handleChange("broker_name", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div><div><label className="block text-sm text-gray-400 mb-2">رقم رخصة فال</label><input value={identity.fal_license || ""} onChange={e => handleChange("fal_license", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="أدخل رقم الرخصة" /></div></div>
          <div><label className="block text-sm text-gray-400 mb-2">التخصص</label><input value={identity.specialization || ""} onChange={e => handleChange("specialization", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">مناطق التغطية <span className="text-gray-600">(افصل بفاصلة عربية ،)</span></label><input value={(identity.coverage_areas || []).join("، ")} onChange={e => handleArrayChange("coverage_areas", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">الجمهور المستهدف <span className="text-gray-600">(افصل بفاصلة عربية ،)</span></label><input value={(identity.target_audiences || []).join("، ")} onChange={e => handleArrayChange("target_audiences", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">كلمات مفتاحية للبراند <span className="text-gray-600">(افصل بفاصلة عربية ،)</span></label><input value={(identity.brand_keywords || []).join("، ")} onChange={e => handleArrayChange("brand_keywords", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm text-gray-400 mb-2">عبارات تتجنبها <span className="text-gray-600">(افصل بفاصلة عربية ،)</span></label><input value={(identity.avoid_phrases || []).join("، ")} onChange={e => handleArrayChange("avoid_phrases", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" /></div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5"><h4 className="font-bold text-blue-400 mb-2">النبذة التعريفية</h4><div><label className="block text-sm text-gray-400 mb-2">نبذة قصيرة</label><textarea value={identity.bio_short || ""} onChange={e => handleChange("bio_short", e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="وسيط عقاري مرخص في الرياض..." /></div><div><label className="block text-sm text-gray-400 mb-2">نبذة تفصيلية</label><textarea value={identity.bio_long || ""} onChange={e => handleChange("bio_long", e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="اكتب نبذة تفصيلية..." /></div></div>
        <button onClick={handleSave} disabled={saving} className={"px-8 py-3 rounded-lg font-bold text-lg transition " + (saved ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700")}>{saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ الهوية"}</button>
      </div>
    </div>
  );
}

// ====== FACTORY TAB ======
type QueueItem = { id: string; propertyId: string; propertyLabel: string; contentGoal: string; platform: string; contentFormat: string; writingTone: string; contentLanguage: string; postCount: string; mode: string; provider: string; model: string; provider2: string; model2: string; };
type ResultGroup = { queueItem: QueueItem; posts: string[]; posts2?: string[]; draft?: string; };

function FactoryTab({ onDraftsCreated }: { onDraftsCreated: () => void }) {
  const [properties, setProperties] = useState<any[]>([]);
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [resultGroups, setResultGroups] = useState<ResultGroup[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [draftsSaved, setDraftsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  const [selectedProperty, setSelectedProperty] = useState("");
  const [contentGoal, setContentGoal] = useState("");
  const [platform, setPlatform] = useState("");
  const [contentFormat, setContentFormat] = useState("");
  const [writingTone, setWritingTone] = useState("");
  const [contentLanguage, setContentLanguage] = useState("");
  const [postCount, setPostCount] = useState("1");
  const [aiMode, setAiMode] = useState("single");
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiProvider2, setAiProvider2] = useState("anthropic");
  const [aiModel2, setAiModel2] = useState("claude-sonnet-4-20250514");

  useEffect(() => { loadData(); }, []);
  async function loadData() { const [propsRes, idRes] = await Promise.all([supabase.from("properties").select("id, title, district, city, price, offer_type, sub_category, land_area, rooms, description").order("created_at", { ascending: false }), supabase.from("broker_identity").select("*").limit(1).single()]); setProperties(propsRes.data || []); if (idRes.data) setIdentity(idRes.data); setLoading(false); }

  function addToQueue() {
    if (!contentGoal || !platform || !contentFormat || !writingTone || !contentLanguage) { setShowErrors(true); setError("اختر جميع الخيارات المطلوبة"); return; }
    setShowErrors(false); setError("");
    const prop = properties.find(p => p.id === selectedProperty);
    setQueue(prev => [...prev, { id: Date.now().toString(), propertyId: selectedProperty, propertyLabel: prop ? prop.title + " — " + prop.district : "محتوى عام", contentGoal, platform, contentFormat, writingTone, contentLanguage, postCount, mode: aiMode, provider: aiProvider, model: aiModel, provider2: aiProvider2, model2: aiModel2 }]);
    setPlatform(""); setContentFormat(""); setPostCount("1");
  }

  function removeFromQueue(id: string) { setQueue(prev => prev.filter(q => q.id !== id)); }
  function copyPost(key: string, text: string) { navigator.clipboard.writeText(text); setCopiedKey(key); setTimeout(() => setCopiedKey(""), 2000); }

  async function generateAll() {
    if (queue.length === 0) return;
    setGenerating(true); setResultGroups([]); setDraftsSaved(false); setProgress({ current: 0, total: queue.length });
    const allGroups: ResultGroup[] = [];

    for (let i = 0; i < queue.length; i++) {
      setProgress({ current: i + 1, total: queue.length });
      const item = queue[i];
      const prop = properties.find(p => p.id === item.propertyId);
      const propInfo = prop ? `عقار: ${prop.title}\nالنوع: ${prop.sub_category} — ${prop.offer_type}\nالموقع: ${prop.district}، ${prop.city}\nالمساحة: ${prop.land_area || "غير محدد"} م²\nالغرف: ${prop.rooms || "غير محدد"}\nالسعر: ${prop.price ? prop.price.toLocaleString() + " ريال" : "غير محدد"}\nالوصف: ${prop.description || "لا يوجد وصف"}` : "لا يوجد عقار محدد — اكتب محتوى عقاري عام";
      const identityInfo = identity ? `اسم الوسيط: ${identity.broker_name}\nالتخصص: ${identity.specialization}\nمناطق التغطية: ${(identity.coverage_areas || []).join("، ")}\nالجمهور المستهدف: ${(identity.target_audiences || []).join("، ")}\nكلمات البراند: ${(identity.brand_keywords || []).join("، ")}\nعبارات يتجنبها: ${(identity.avoid_phrases || []).join("، ")}\nالنبذة: ${identity.bio_short || ""}` : "";
      const systemPrompt = `أنت خبير محتوى عقاري متخصص في السوق السعودي.\n\nهوية الوسيط:\n${identityInfo}\n\nالقواعد:\n- المحتوى يتحدث عن الوسيط بصيغة الغائب\n- لا تكتب "أول تغريدة" أو ما يوحي ببداية جديدة\n- نبرة الكتابة: ${item.writingTone}\n- لغة المحتوى: ${item.contentLanguage}\n- اجعل كل منشور مختلف عن الآخر\n- أضف هاشتاقات مناسبة\n- اجعل الافتتاحية قوية وجاذبة\n- الطول يناسب المنصة المختارة`;
      const userPrompt = `اكتب ${item.postCount} منشور لمنصة ${item.platform} بصيغة ${item.contentFormat}.\n\nمعلومات العقار:\n${propInfo}\n\nالهدف: ${item.contentGoal}\n\nاكتب كل منشور مفصولاً بسطر فارغ ورقم المنشور.`;

      try {
        const res = await fetch("/api/ai-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemPrompt, userPrompt, provider: item.provider, model: item.model, mode: item.mode, provider2: item.provider2, model2: item.model2 }) });
        const data = await res.json();
        if (data.error) { allGroups.push({ queueItem: item, posts: ["خطأ: " + data.error] }); }
        else {
          const parsePosts = (text: string) => text.split(/\n\d+\.\s*\n|\n\d+[\.\)]\s*/g).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
          const posts = parsePosts(data.result);
          const group: ResultGroup = { queueItem: item, posts: posts.length > 0 ? posts : [data.result] };
          if (data.result2) { const posts2 = parsePosts(data.result2); group.posts2 = posts2.length > 0 ? posts2 : [data.result2]; }
          if (data.draft) group.draft = data.draft;
          allGroups.push(group);
        }
      } catch (err: any) { allGroups.push({ queueItem: item, posts: ["خطأ: " + err.message] }); }
    }

    setResultGroups(allGroups); setQueue([]);
    const drafts: any[] = [];
    allGroups.forEach(group => {
      group.posts.forEach(post => { if (!post.startsWith("خطأ")) drafts.push({ title: post.substring(0, 50) + "...", main_text: post, content_goal: group.queueItem.contentGoal, main_channel: group.queueItem.platform, content_format: group.queueItem.contentFormat, status: "مسودة" }); });
      if (group.posts2) group.posts2.forEach(post => { if (!post.startsWith("خطأ")) drafts.push({ title: post.substring(0, 50) + "...", main_text: post, content_goal: group.queueItem.contentGoal, main_channel: group.queueItem.platform, content_format: group.queueItem.contentFormat, status: "مسودة" }); });
    });
    if (drafts.length > 0) { await supabase.from("content").insert(drafts); setDraftsSaved(true); onDraftsCreated(); }
    setGenerating(false);
  }

  if (loading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;
  const totalPosts = queue.reduce((sum, q) => sum + parseInt(q.postCount), 0);
  const providerName = (pid: string) => providers.find(p => p.id === pid)?.name || pid;
  const modelName = (pid: string, mid: string) => providers.find(p => p.id === pid)?.models.find(m => m.id === mid)?.name || mid;

  return (
    <div>
      <div className="mb-6"><h3 className="text-xl font-bold mb-2">مصنع المحتوى</h3><p className="text-gray-400 text-sm">أضف طلبات المحتوى للقائمة ثم انتجها دفعة واحدة — تُحفظ تلقائياً كمسودات</p></div>
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
          </div>

          <ModelSelector label="إعدادات الذكاء الاصطناعي" showMode={true} mode={aiMode} setMode={setAiMode} provider={aiProvider} setProvider={setAiProvider} model={aiModel} setModel={setAiModel} provider2={aiProvider2} setProvider2={setAiProvider2} model2={aiModel2} setModel2={setAiModel2} />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={addToQueue} className="w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white"><Plus size={18} /> إضافة للقائمة</button>

          {queue.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-sm">قائمة المحتوى ({queue.length} طلب — {totalPosts} منشور)</h4>
              {queue.map(item => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">{item.platform}</span><span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{item.contentFormat}</span><span className="text-xs text-gray-500">{item.postCount} منشور</span></div><p className="text-xs text-gray-400 mt-1 truncate">{item.propertyLabel} — {item.contentGoal}</p><p className="text-xs text-gray-600 mt-0.5">{modes.find(m => m.id === item.mode)?.name} • {modelName(item.provider, item.model)}{item.mode !== "single" ? " + " + modelName(item.provider2, item.model2) : ""}</p></div>
                  <button onClick={() => removeFromQueue(item.id)} className="text-gray-500 hover:text-red-400 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={generateAll} disabled={generating} className={"w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 " + (generating ? "bg-gray-700 text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white")}>{generating ? <><Loader2 size={18} className="animate-spin" /> جاري الإنتاج...</> : <><Play size={18} /> إنتاج الكل ({totalPosts} منشور)</>}</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {resultGroups.length === 0 && !generating && queue.length === 0 && (<div className="flex flex-col items-center justify-center py-20 text-center"><Factory size={48} className="text-gray-700 mb-4" /><p className="text-gray-500">أضف طلبات المحتوى للقائمة ثم اضغط "إنتاج الكل"</p></div>)}
          {resultGroups.length === 0 && queue.length > 0 && !generating && (<div className="flex flex-col items-center justify-center py-20 text-center"><div className="text-6xl mb-4">📋</div><p className="text-gray-400 font-bold text-lg">{queue.length} طلب — {totalPosts} منشور</p></div>)}
          {generating && (<div className="flex flex-col items-center justify-center py-20 text-center"><Loader2 size={56} className="text-blue-400 animate-spin mb-6" /><p className="text-white font-bold text-lg mb-2">جاري إنتاج المحتوى...</p><p className="text-gray-400">الطلب {progress.current} من {progress.total}</p><div className="w-64 bg-gray-800 rounded-full h-2 mt-4"><div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: (progress.current / progress.total * 100) + "%" }}></div></div></div>)}
          {resultGroups.length > 0 && !generating && (<div className="space-y-6">
            {draftsSaved && (<div className="bg-green-900/20 border border-green-800 rounded-xl p-4 flex items-center gap-3"><Check size={20} className="text-green-400" /><p className="text-green-400 text-sm">تم حفظ جميع المنشورات كمسودات تلقائياً</p></div>)}
            {resultGroups.map((group, gIdx) => (
              <div key={gIdx} className="border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2"><span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{group.queueItem.platform}</span><span className="text-xs text-gray-400">{group.queueItem.contentFormat}</span><span className="text-xs text-gray-600">{modelName(group.queueItem.provider, group.queueItem.model)}{group.queueItem.mode !== "single" ? " + " + modelName(group.queueItem.provider2, group.queueItem.model2) : ""}</span></div>
                  <span className="text-xs text-green-400">✓ {group.posts.length}{group.posts2 ? " + " + group.posts2.length : ""} منشور</span>
                </div>
                {group.queueItem.mode === "compare" && group.posts2 ? (
                  <div className="grid grid-cols-2 divide-x divide-gray-800">
                    <div><div className="px-4 py-2 bg-gray-800/50 text-xs text-center font-bold text-gray-400">{modelName(group.queueItem.provider, group.queueItem.model)}</div><div className="divide-y divide-gray-800">{group.posts.map((post, pIdx) => { const key = "a" + gIdx + "-" + pIdx; return (<div key={pIdx} className="p-4"><div className="flex justify-between mb-2"><span className="text-xs text-gray-500">منشور {pIdx + 1}</span><button onClick={() => copyPost(key, post)} className="text-xs">{copiedKey === key ? <span className="text-green-400">نُسخ ✓</span> : <span className="text-gray-500 hover:text-white">نسخ</span>}</button></div><p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post}</p></div>); })}</div></div>
                    <div><div className="px-4 py-2 bg-gray-800/50 text-xs text-center font-bold text-gray-400">{modelName(group.queueItem.provider2, group.queueItem.model2)}</div><div className="divide-y divide-gray-800">{group.posts2.map((post, pIdx) => { const key = "b" + gIdx + "-" + pIdx; return (<div key={pIdx} className="p-4"><div className="flex justify-between mb-2"><span className="text-xs text-gray-500">منشور {pIdx + 1}</span><button onClick={() => copyPost(key, post)} className="text-xs">{copiedKey === key ? <span className="text-green-400">نُسخ ✓</span> : <span className="text-gray-500 hover:text-white">نسخ</span>}</button></div><p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post}</p></div>); })}</div></div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {group.draft && (<div className="p-4 bg-yellow-900/10 border-b border-gray-800"><p className="text-xs text-yellow-400 mb-2">المسودة الأولى (قبل المراجعة):</p><p className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap line-clamp-3">{group.draft}</p></div>)}
                    {group.posts.map((post, pIdx) => { const key = gIdx + "-" + pIdx; return (<div key={pIdx} className="p-4 hover:bg-gray-900/50"><div className="flex justify-between mb-2"><span className="text-xs text-gray-500">منشور {pIdx + 1}</span><button onClick={() => copyPost(key, post)} className="text-xs">{copiedKey === key ? <span className="text-green-400">نُسخ ✓</span> : <span className="text-gray-500 hover:text-white">نسخ</span>}</button></div><p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post}</p></div>); })}
                  </div>
                )}
              </div>
            ))}
          </div>)}
        </div>
      </div>
    </div>
  );
}

// ====== EXPERT TAB ======
type ChatMessage = { role: "user" | "assistant"; content: string; savedAsDraft?: boolean; };

function ExpertTab({ onDraftsCreated }: { onDraftsCreated: () => void }) {
  const [identity, setIdentity] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [savedIdx, setSavedIdx] = useState(-1);
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { (async () => { const { data } = await supabase.from("broker_identity").select("*").limit(1).single(); if (data) setIdentity(data); setInitLoading(false); })(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = "auto"; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px"; } }, [input]);

  function getSystemPrompt() {
    const id = identity;
    const info = id ? `اسم الوسيط: ${id.broker_name}\nالتخصص: ${id.specialization}\nمناطق التغطية: ${(id.coverage_areas || []).join("، ")}\nالجمهور: ${(id.target_audiences || []).join("، ")}\nكلمات البراند: ${(id.brand_keywords || []).join("، ")}\nعبارات يتجنبها: ${(id.avoid_phrases || []).join("، ")}\nالنبذة: ${id.bio_short || ""}` : "";
    return `أنت "خبير المحتوى العقاري" — وكيل ذكاء اصطناعي متخصص في كتابة المحتوى للسوق العقاري السعودي.\n\nهوية الوسيط:\n${info}\n\nدورك: تستقبل أفكار وتحولها لمحتوى جاهز للنشر. تسأل عن الجمهور والهدف إذا لم يُحدد. تكتب محتوى كامل جاهز للنسخ. تقترح هوكات بديلة. تقيّم وتحسّن النصوص.\n\nالقواعد: المحتوى يتحدث عن الوسيط بصيغة الغائب. لا تكتب "أول تغريدة". أضف هاشتاقات. افتتاحية قوية. كن مباشراً. عند كتابة محتوى نهائي ضعه بين === في بداية ونهاية كل منشور.`;
  }

  async function sendMessage() {
    const text = input.trim(); if (!text || loading) return;
    const newMsgs = [...messages, { role: "user" as const, content: text }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/ai-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemPrompt: getSystemPrompt(), messages: newMsgs.map(m => ({ role: m.role, content: m.content })), provider: aiProvider, model: aiModel }) });
      const data = await res.json();
      const aText = data.result || "حدث خطأ، حاول مرة أخرى.";
      const aMsg: ChatMessage = { role: "assistant", content: aText };
      const blocks = aText.split("===").filter((_: string, i: number) => i % 2 === 1);
      if (blocks.length > 0) {
        await supabase.from("content").insert(blocks.map((b: string) => ({ title: b.trim().substring(0, 50) + "...", main_text: b.trim(), content_goal: "خبير المحتوى", main_channel: "متعدد", content_format: "نص", status: "مسودة" })));
        aMsg.savedAsDraft = true; onDraftsCreated();
      }
      setMessages(prev => [...prev, aMsg]);
    } catch (err: any) { setMessages(prev => [...prev, { role: "assistant", content: "خطأ: " + err.message }]); }
    setLoading(false);
  }

  function handleKeyDown(e: any) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
  function copyMsg(idx: number, text: string) { navigator.clipboard.writeText(text.replace(/===/g, "").trim()); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(-1), 2000); }
  async function saveDraft(idx: number, text: string) { const clean = text.replace(/===/g, "").trim(); await supabase.from("content").insert([{ title: clean.substring(0, 50) + "...", main_text: clean, content_goal: "خبير المحتوى", main_channel: "متعدد", content_format: "نص", status: "مسودة" }]); setSavedIdx(idx); setTimeout(() => setSavedIdx(-1), 2000); onDraftsCreated(); }

  if (initLoading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4"><div><h3 className="text-xl font-bold mb-1">خبير المحتوى</h3><p className="text-gray-400 text-sm">أعطه فكرة — يكتب لك محتوى كامل جاهز للنشر</p></div>{messages.length > 0 && <button onClick={() => setMessages([])} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg transition"><RefreshCw size={14} /> جديدة</button>}</div>

      <div className="flex gap-3 mb-4 items-center">
        <select value={aiProvider} onChange={e => { setAiProvider(e.target.value); const prov = providers.find(p => p.id === e.target.value); if (prov) setAiModel(prov.models[0].id); }} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          {providers.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
        <select value={aiModel} onChange={e => setAiModel(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          {providers.find(p => p.id === aiProvider)?.models.map(m => (<option key={m.id} value={m.id}>{m.name} — {m.desc}</option>))}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden" style={{ height: "calc(100vh - 370px)", display: "flex", flexDirection: "column" }}>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (<div className="flex flex-col items-center justify-center h-full text-center"><MessageSquare size={48} className="text-gray-700 mb-4" /><p className="text-gray-400 font-bold mb-2">مرحباً، أنا خبير المحتوى العقاري</p><p className="text-gray-600 text-sm max-w-md mb-6">أعطني فكرة أو موضوع وسأكتب لك محتوى جاهز للنشر</p><div className="flex flex-wrap gap-2 justify-center">{["اكتب تغريدة عن نصائح للمشتري الجديد", "محتوى عن أهمية الوسيط المرخص", "سكريبت ريلز عن حي النرجس"].map((s, i) => (<button key={i} onClick={() => setInput(s)} className="text-xs bg-gray-800 border border-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-lg transition">{s}</button>))}</div></div>)}
          {messages.map((msg, idx) => (<div key={idx} className={"flex " + (msg.role === "user" ? "justify-start" : "justify-end")}><div className="max-w-[85%]"><div className={"rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap " + (msg.role === "user" ? "bg-gray-800 text-gray-200 rounded-tr-sm" : "bg-blue-900/20 border border-blue-900/30 text-gray-200 rounded-tl-sm")}>{msg.content}</div>{msg.role === "assistant" && (<div className="flex items-center gap-3 mt-2 mr-2"><button onClick={() => copyMsg(idx, msg.content)} className="text-xs">{copiedIdx === idx ? <span className="text-green-400">نُسخ ✓</span> : <span className="text-gray-600 hover:text-white">نسخ</span>}</button><button onClick={() => saveDraft(idx, msg.content)} className="text-xs">{savedIdx === idx ? <span className="text-green-400">حُفظ ✓</span> : <span className="text-gray-600 hover:text-white">حفظ كمسودة</span>}</button>{msg.savedAsDraft && <span className="text-xs text-green-600">✓ تلقائي</span>}</div>)}</div></div>))}
          {loading && (<div className="flex justify-end"><div className="bg-blue-900/20 border border-blue-900/30 rounded-2xl rounded-tl-sm px-4 py-3"><div className="flex gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div></div></div></div>)}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t border-gray-800 p-4"><div className="flex items-end gap-3"><textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="اكتب فكرتك هنا..." rows={1} className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-none" style={{ maxHeight: 120 }} dir="rtl" /><button onClick={sendMessage} disabled={!input.trim() || loading} className={"w-11 h-11 rounded-xl flex items-center justify-center transition flex-shrink-0 " + (input.trim() && !loading ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-800 text-gray-600")}><Send size={18} style={{ transform: "scaleX(-1)" }} /></button></div><p className="text-center text-xs text-gray-700 mt-2">المحتوى النهائي يُحفظ تلقائياً كمسودة</p></div>
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
  async function loadDrafts() { const { data } = await supabase.from("content").select("*").order("created_at", { ascending: false }); setDrafts(data || []); setLoading(false); }
  async function updateStatus(id: string, status: string) { await supabase.from("content").update({ status }).eq("id", id); loadDrafts(); }
  async function saveEdit(id: string) { await supabase.from("content").update({ main_text: editText }).eq("id", id); setEditingId(""); loadDrafts(); }
  async function deleteDraft(id: string) { if (!confirm("حذف هذا المحتوى؟")) return; await supabase.from("content").delete().eq("id", id); loadDrafts(); }
  function copyText(id: string, text: string) { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(""), 2000); }
  const filtered = drafts.filter(d => filter === "all" || d.status === filter);
  const sc: any = { all: drafts.length, "مسودة": drafts.filter(d => d.status === "مسودة").length, "جاهز": drafts.filter(d => d.status === "جاهز").length, "منشور": drafts.filter(d => d.status === "منشور").length };
  if (loading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;
  return (
    <div>
      <div className="mb-6"><h3 className="text-xl font-bold mb-2">المسودات</h3><p className="text-gray-400 text-sm">جميع المحتوى المُنتج — عدّل، انسخ، أو غيّر الحالة</p></div>
      <div className="flex gap-2 mb-6 flex-wrap">{[["all","الكل"],["مسودة","مسودة"],["جاهز","جاهز"],["منشور","منشور"]].map(([v,l]) => (<button key={v} onClick={() => setFilter(v)} className={"px-4 py-2 rounded-lg text-sm transition " + (filter === v ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}>{l} ({sc[v] || 0})</button>))}</div>
      {filtered.length === 0 ? <div className="text-center py-20 text-gray-500">لا يوجد محتوى بعد</div> : (
        <div className="space-y-4">{filtered.map(d => (
          <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">{d.main_channel && <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{d.main_channel}</span>}{d.content_format && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{d.content_format}</span>}<select value={d.status} onChange={e => updateStatus(d.id, e.target.value)} className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"><option value="مسودة">مسودة</option><option value="جاهز">جاهز</option><option value="منشور">منشور</option></select></div>
              <div className="flex gap-3">{editingId === d.id ? (<><button onClick={() => saveEdit(d.id)} className="text-xs text-green-400 flex items-center gap-1"><Save size={12} /> حفظ</button><button onClick={() => setEditingId("")} className="text-xs text-gray-500 flex items-center gap-1"><X size={12} /> إلغاء</button></>) : (<><button onClick={() => { setEditingId(d.id); setEditText(d.main_text); }} className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1"><Pencil size={12} /> تعديل</button><button onClick={() => copyText(d.id, d.main_text)} className="text-xs">{copiedId === d.id ? <span className="text-green-400">نُسخ ✓</span> : <span className="text-gray-500 hover:text-white">نسخ</span>}</button><button onClick={() => deleteDraft(d.id)} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"><Trash2 size={12} /> حذف</button></>)}</div>
            </div>
            {editingId === d.id ? <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={5} className="w-full bg-gray-800 border border-blue-500 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none" /> : <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{d.main_text}</p>}
            <div className="flex gap-2 mt-3 text-xs text-gray-600">{d.content_goal && <span>{d.content_goal}</span>}{d.created_at && <span>{new Date(d.created_at).toLocaleDateString("ar-SA")}</span>}</div>
          </div>
        ))}</div>
      )}
    </div>
  );
}


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
    let csv = "\uFEFF" + "التاريخ,الوقت,المنصة,الصيغة,الحالة,المحتوى\n";
    monthPosts.forEach(p => {
      const text = (p.main_text || "").replace(/"/g, '""').replace(/\n/g, " ");
      csv += p.scheduled_date + "," + (p.scheduled_time || "") + "," + (p.main_channel || "") + "," + (p.content_format || "") + "," + (p.status || "") + ",\"" + text + "\"\n";
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
            {getMonthDays().map((item, idx) => {
              const dateStr = item.current ? getDateStr(item.day) : "";
              const dayPosts = item.current ? getPostsForDate(dateStr) : [];
              const isToday = dateStr === todayStr;
              return (
                <div key={idx} onClick={() => { if (item.current) { setSelectedDay(dateStr); setSelectedPost(null); } }} className={"min-h-[100px] border-l border-b border-gray-800 last:border-l-0 p-1.5 cursor-pointer transition " + (item.current ? "hover:bg-gray-800/50" : "bg-gray-950/30") + (selectedDay === dateStr ? " bg-blue-900/10" : "")}>
                  <div className={"text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full " + (isToday ? "bg-blue-600 text-white" : item.current ? "text-gray-400" : "text-gray-700")}>{item.day}</div>
                  {item.current && (
                    <>
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


// ====== CALENDAR TAB ======
// ====== COMING SOON ======
function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (<div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-6"><Sparkles size={32} className="text-blue-400" /></div><h3 className="text-xl font-bold mb-2">{title}</h3><p className="text-gray-400 text-sm max-w-md">{desc}</p><span className="mt-4 text-xs bg-blue-900/30 text-blue-400 px-4 py-2 rounded-full">قريباً</span></div>);
}

// ====== MAIN ======
export default function ContentAI() {
  const [activeTab, setActiveTab] = useState("factory");
  const [draftsRefresh, setDraftsRefresh] = useState(0);
  return (
    <div dir="rtl">
      <div className="mb-8"><h2 className="text-2xl font-bold mb-2">وكيل المحتوى العقاري</h2><p className="text-gray-400 text-sm">منصة ذكاء اصطناعي متكاملة لصناعة المحتوى العقاري — من الفكرة إلى النشر</p></div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={"flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition whitespace-nowrap " + (activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700")}><tab.icon size={16} />{tab.label}</button>))}</div>
      {activeTab === "identity" && <IdentityTab />}
      {activeTab === "factory" && <FactoryTab onDraftsCreated={() => setDraftsRefresh(r => r + 1)} />}
      {activeTab === "expert" && <ExpertTab onDraftsCreated={() => setDraftsRefresh(r => r + 1)} />}
      {activeTab === "drafts" && <DraftsTab refreshKey={draftsRefresh} />}
      {activeTab === "calendar" && <CalendarTab refreshKey={draftsRefresh} onDraftsCreated={() => setDraftsRefresh(r => r + 1)} />}
      {activeTab === "trends" && <ComingSoon title="ترندات ومناسبات" desc="اقتراحات محتوى مرتبطة بأخبار السوق العقاري والمناسبات" />}
    </div>
  );
}
