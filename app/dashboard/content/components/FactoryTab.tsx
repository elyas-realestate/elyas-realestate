"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import { providers, modes } from "../constants";
import ModelSelector from "./ModelSelector";
import type { BrokerIdentity, Property } from "@/types/database";
import {
  Plus,
  Trash2,
  Play,
  Loader2,
  Check,
  Factory,
  Copy,
} from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";

type QueueItem = {
  id: string;
  propertyId: string;
  propertyLabel: string;
  contentGoal: string;
  platform: string;
  contentFormat: string;
  writingTone: string;
  contentLanguage: string;
  postCount: string;
  mode: string;
  provider: string;
  model: string;
  provider2: string;
  model2: string;
};

type ResultGroup = {
  queueItem: QueueItem;
  posts: string[];
  posts2?: string[];
  draft?: string;
};

export default function FactoryTab({
  onDraftsCreated,
}: {
  onDraftsCreated: () => void;
}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [identity, setIdentity] = useState<BrokerIdentity | null>(null);
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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [propsRes, idRes] = await Promise.all([
      supabase
        .from("properties")
        .select(
          "id, title, district, city, price, offer_type, sub_category, land_area, rooms, description"
        )
        .order("created_at", { ascending: false }),
      supabase.from("broker_identity").select("*").limit(1).single(),
    ]);
    setProperties((propsRes.data as Property[]) || []);
    if (idRes.data) setIdentity(idRes.data as BrokerIdentity);
    setLoading(false);
  }

  function addToQueue() {
    if (
      !contentGoal ||
      !platform ||
      !contentFormat ||
      !writingTone ||
      !contentLanguage
    ) {
      setShowErrors(true);
      setError("اختر جميع الخيارات المطلوبة");
      return;
    }
    setShowErrors(false);
    setError("");
    const prop = properties.find((p) => p.id === selectedProperty);
    setQueue((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        propertyId: selectedProperty,
        propertyLabel: prop
          ? prop.title + " — " + prop.district
          : "محتوى عام",
        contentGoal,
        platform,
        contentFormat,
        writingTone,
        contentLanguage,
        postCount,
        mode: aiMode,
        provider: aiProvider,
        model: aiModel,
        provider2: aiProvider2,
        model2: aiModel2,
      },
    ]);
    setPlatform("");
    setContentFormat("");
    setPostCount("1");
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function copyPost(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
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
      const prop = properties.find((p) => p.id === item.propertyId);
      const propInfo = prop
        ? `عقار: ${prop.title}\nالنوع: ${prop.sub_category} — ${prop.offer_type}\nالموقع: ${prop.district}، ${prop.city}\nالمساحة: ${prop.land_area || "غير محدد"} م²\nالغرف: ${prop.rooms || "غير محدد"}\nالسعر: ${prop.price ? prop.price.toLocaleString() + " ريال" : "غير محدد"}\nالوصف: ${prop.description || "لا يوجد وصف"}`
        : "لا يوجد عقار محدد — اكتب محتوى عقاري عام";
      const identityInfo = identity
        ? `اسم الوسيط: ${identity.broker_name}\nالتخصص: ${identity.specialization}\nمناطق التغطية: ${(identity.coverage_areas || []).join("، ")}\nالجمهور المستهدف: ${(identity.target_audiences || []).join("، ")}\nكلمات البراند: ${(identity.brand_keywords || []).join("، ")}\nعبارات يتجنبها: ${(identity.avoid_phrases || []).join("، ")}\nالنبذة: ${identity.bio_short || ""}`
        : "";
      const systemPrompt = `أنت خبير محتوى عقاري متخصص في السوق السعودي.\n\nهوية الوسيط:\n${identityInfo}\n\nالقواعد:\n- المحتوى يتحدث عن الوسيط بصيغة الغائب\n- لا تكتب "أول تغريدة" أو ما يوحي ببداية جديدة\n- نبرة الكتابة: ${item.writingTone}\n- لغة المحتوى: ${item.contentLanguage}\n- اجعل كل منشور مختلف عن الآخر\n- أضف هاشتاقات مناسبة\n- اجعل الافتتاحية قوية وجاذبة\n- الطول يناسب المنصة المختارة`;
      const userPrompt = `اكتب ${item.postCount} منشور لمنصة ${item.platform} بصيغة ${item.contentFormat}.\n\nمعلومات العقار:\n${propInfo}\n\nالهدف: ${item.contentGoal}\n\nاكتب كل منشور مفصولاً بسطر فارغ ورقم المنشور.`;

      try {
        const res = await fetch("/api/ai-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt,
            userPrompt,
            provider: item.provider,
            model: item.model,
            mode: item.mode,
            provider2: item.provider2,
            model2: item.model2,
          }),
        });
        const data = await res.json();
        if (data.error) {
          allGroups.push({ queueItem: item, posts: ["خطأ: " + data.error] });
        } else {
          const parsePosts = (text: string) =>
            text
              .split(/\n\d+\.\s*\n|\n\d+[.)]\s*/g)
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 20);
          const posts = parsePosts(data.result);
          const group: ResultGroup = {
            queueItem: item,
            posts: posts.length > 0 ? posts : [data.result],
          };
          if (data.result2) {
            const posts2 = parsePosts(data.result2);
            group.posts2 = posts2.length > 0 ? posts2 : [data.result2];
          }
          if (data.draft) group.draft = data.draft;
          allGroups.push(group);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "خطأ غير معروف";
        allGroups.push({ queueItem: item, posts: ["خطأ: " + msg] });
      }
    }

    setResultGroups(allGroups);
    setQueue([]);
    const drafts: Record<string, string>[] = [];
    allGroups.forEach((group) => {
      group.posts.forEach((post) => {
        if (!post.startsWith("خطأ"))
          drafts.push({
            title: post.substring(0, 50) + "...",
            main_text: post,
            content_goal: group.queueItem.contentGoal,
            main_channel: group.queueItem.platform,
            content_format: group.queueItem.contentFormat,
            status: "مسودة",
          });
      });
      if (group.posts2)
        group.posts2.forEach((post) => {
          if (!post.startsWith("خطأ"))
            drafts.push({
              title: post.substring(0, 50) + "...",
              main_text: post,
              content_goal: group.queueItem.contentGoal,
              main_channel: group.queueItem.platform,
              content_format: group.queueItem.contentFormat,
              status: "مسودة",
            });
        });
    });
    if (drafts.length > 0) {
      await supabase.from("content").insert(drafts);
      setDraftsSaved(true);
      onDraftsCreated();
    }
    setGenerating(false);
  }

  if (loading) return <SkeletonList count={4} />;

  const totalPosts = queue.reduce(
    (sum, q) => sum + parseInt(q.postCount),
    0
  );
  const modelName = (pid: string, mid: string) =>
    providers.find((p) => p.id === pid)?.models.find((m) => m.id === mid)
      ?.name || mid;

  const selectClass =
    "w-full bg-[#1C1C22] rounded-lg px-4 py-3 focus:outline-none text-sm border";
  const labelClass = (has: boolean) =>
    "block text-sm mb-2 " + (showErrors && !has ? "text-red-400" : "text-[#9A9AA0]");
  const borderClass = (has: boolean) =>
    showErrors && !has
      ? "border-red-500"
      : "border-[rgba(198,145,76,0.15)] focus:border-[#C6914C]";

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">مصنع المحتوى</h3>
        <p className="text-[#9A9AA0] text-sm">
          أضف طلبات المحتوى للقائمة ثم انتجها دفعة واحدة — تُحفظ تلقائياً
          كمسودات
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Sidebar: Content Request Form ─── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-[#C6914C] text-sm">
              إضافة طلب محتوى
            </h4>

            {/* Property */}
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">
                العقار <span className="text-[#5A5A62]">(اختياري)</span>
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className={`${selectClass} border-[rgba(198,145,76,0.15)] focus:border-[#C6914C]`}
              >
                <option value="">محتوى عام — بدون عقار محدد</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.district}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className={labelClass(!!contentGoal)}>الهدف *</label>
              <select
                value={contentGoal}
                onChange={(e) => setContentGoal(e.target.value)}
                className={`${selectClass} ${borderClass(!!contentGoal)}`}
              >
                <option value="">اختر الهدف...</option>
                <option value="زيادة المبيعات">زيادة المبيعات</option>
                <option value="زيادة التفاعل">زيادة التفاعل</option>
                <option value="بناء الثقة والوعي">بناء الثقة والوعي</option>
                <option value="تعليم الجمهور">تعليم الجمهور</option>
                <option value="جذب عملاء جدد">جذب عملاء جدد</option>
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className={labelClass(!!platform)}>المنصة *</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={`${selectClass} ${borderClass(!!platform)}`}
              >
                <option value="">اختر المنصة...</option>
                <option value="X (تويتر)">X (تويتر)</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Snapchat">Snapchat</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Threads">Threads</option>
              </select>
            </div>

            {/* Format */}
            <div>
              <label className={labelClass(!!contentFormat)}>
                صيغة المحتوى *
              </label>
              <select
                value={contentFormat}
                onChange={(e) => setContentFormat(e.target.value)}
                className={`${selectClass} ${borderClass(!!contentFormat)}`}
              >
                <option value="">اختر الصيغة...</option>
                <option value="تغريدة / نص قصير">تغريدة / نص قصير</option>
                <option value="نص طويل (كابشن)">نص طويل (كابشن)</option>
                <option value="سكريبت ريلز / فيديو قصير">
                  سكريبت ريلز / فيديو قصير
                </option>
                <option value="كاروسيل (شرائح)">كاروسيل (شرائح)</option>
                <option value="ثريد (سلسلة تغريدات)">
                  ثريد (سلسلة تغريدات)
                </option>
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className={labelClass(!!writingTone)}>
                نبرة الكتابة *
              </label>
              <select
                value={writingTone}
                onChange={(e) => setWritingTone(e.target.value)}
                className={`${selectClass} ${borderClass(!!writingTone)}`}
              >
                <option value="">اختر النبرة...</option>
                <option value="احترافي وبشري — واثق بدون تعالي">
                  احترافي وبشري
                </option>
                <option value="رسمي ومهني">رسمي ومهني</option>
                <option value="ودي وقريب من الناس">ودي وقريب</option>
                <option value="تحفيزي وملهم">تحفيزي وملهم</option>
                <option value="تعليمي وتثقيفي">تعليمي وتثقيفي</option>
                <option value="جريء ومباشر">جريء ومباشر</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className={labelClass(!!contentLanguage)}>
                لغة المحتوى *
              </label>
              <select
                value={contentLanguage}
                onChange={(e) => setContentLanguage(e.target.value)}
                className={`${selectClass} ${borderClass(!!contentLanguage)}`}
              >
                <option value="">اختر اللغة...</option>
                <option value="عربي فصيح سلس">عربي فصيح سلس</option>
                <option value="عربي فصيح رسمي">عربي فصيح رسمي</option>
                <option value="لهجة سعودية بيضاء">لهجة سعودية بيضاء</option>
                <option value="مزيج فصحى ولهجة">مزيج فصحى ولهجة</option>
              </select>
            </div>

            {/* Post count */}
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">
                عدد المنشورات
              </label>
              <select
                value={postCount}
                onChange={(e) => setPostCount(e.target.value)}
                className={`${selectClass} border-[rgba(198,145,76,0.15)] focus:border-[#C6914C]`}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ModelSelector
            label="إعدادات الذكاء الاصطناعي"
            showMode={true}
            mode={aiMode}
            setMode={setAiMode}
            provider={aiProvider}
            setProvider={setAiProvider}
            model={aiModel}
            setModel={setAiModel}
            provider2={aiProvider2}
            setProvider2={setAiProvider2}
            model2={aiModel2}
            setModel2={setAiModel2}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={addToQueue}
            className="w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 bg-[#2A2A32] hover:bg-[#2A2A32] text-white"
          >
            <Plus size={18} /> إضافة للقائمة
          </button>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-sm">
                قائمة المحتوى ({queue.length} طلب — {totalPosts} منشور)
              </h4>
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1C1C22] rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-[rgba(198,145,76,0.1)] text-[#C6914C] px-2 py-0.5 rounded">
                        {item.platform}
                      </span>
                      <span className="text-xs bg-[#2A2A32] text-gray-300 px-2 py-0.5 rounded">
                        {item.contentFormat}
                      </span>
                      <span className="text-xs text-[#5A5A62]">
                        {item.postCount} منشور
                      </span>
                    </div>
                    <p className="text-xs text-[#9A9AA0] mt-1 truncate">
                      {item.propertyLabel} — {item.contentGoal}
                    </p>
                    <p className="text-xs text-[#5A5A62] mt-0.5">
                      {modes.find((m) => m.id === item.mode)?.name} •{" "}
                      {modelName(item.provider, item.model)}
                      {item.mode !== "single"
                        ? " + " + modelName(item.provider2, item.model2)
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromQueue(item.id)}
                    className="text-[#5A5A62] hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={generateAll}
                disabled={generating}
                className={
                  "w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 " +
                  (generating
                    ? "bg-[#2A2A32] text-[#9A9AA0]"
                    : "bg-[#C6914C] hover:bg-[#A6743A] text-white")
                }
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> جاري
                    الإنتاج...
                  </>
                ) : (
                  <>
                    <Play size={18} /> إنتاج الكل ({totalPosts} منشور)
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ─── Main: Results ─── */}
        <div className="lg:col-span-2">
          {resultGroups.length === 0 && !generating && queue.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Factory size={48} className="text-[#3A3A42] mb-4" />
              <p className="text-[#5A5A62]">
                أضف طلبات المحتوى للقائمة ثم اضغط &quot;إنتاج الكل&quot;
              </p>
            </div>
          )}
          {resultGroups.length === 0 &&
            queue.length > 0 &&
            !generating && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-[#9A9AA0] font-bold text-lg">
                  {queue.length} طلب — {totalPosts} منشور
                </p>
              </div>
            )}
          {generating && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2
                size={56}
                className="text-[#C6914C] animate-spin mb-6"
              />
              <p className="text-white font-bold text-lg mb-2">
                جاري إنتاج المحتوى...
              </p>
              <p className="text-[#9A9AA0]">
                الطلب {progress.current} من {progress.total}
              </p>
              <div className="w-64 bg-[#1C1C22] rounded-full h-2 mt-4">
                <div
                  className="bg-[#C6914C] h-2 rounded-full transition-all duration-500"
                  style={{
                    width:
                      (progress.current / progress.total) * 100 + "%",
                  }}
                />
              </div>
            </div>
          )}
          {resultGroups.length > 0 && !generating && (
            <div className="space-y-6">
              {draftsSaved && (
                <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 flex items-center gap-3">
                  <Check size={20} className="text-green-400" />
                  <p className="text-green-400 text-sm">
                    تم حفظ جميع المنشورات كمسودات تلقائياً
                  </p>
                </div>
              )}
              {resultGroups.map((group, gIdx) => (
                <div
                  key={gIdx}
                  className="border border-[rgba(198,145,76,0.12)] rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-3 bg-[#16161A] border-b border-[rgba(198,145,76,0.12)] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-[rgba(198,145,76,0.1)] text-[#C6914C] px-2 py-1 rounded">
                        {group.queueItem.platform}
                      </span>
                      <span className="text-xs text-[#9A9AA0]">
                        {group.queueItem.contentFormat}
                      </span>
                      <span className="text-xs text-[#5A5A62]">
                        {modelName(
                          group.queueItem.provider,
                          group.queueItem.model
                        )}
                        {group.queueItem.mode !== "single"
                          ? " + " +
                            modelName(
                              group.queueItem.provider2,
                              group.queueItem.model2
                            )
                          : ""}
                      </span>
                    </div>
                    <span className="text-xs text-green-400">
                      ✓ {group.posts.length}
                      {group.posts2
                        ? " + " + group.posts2.length
                        : ""}{" "}
                      منشور
                    </span>
                  </div>
                  {group.queueItem.mode === "compare" && group.posts2 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-800">
                      <div>
                        <div className="px-4 py-2 bg-gray-800/50 text-xs text-center font-bold text-[#9A9AA0]">
                          {modelName(
                            group.queueItem.provider,
                            group.queueItem.model
                          )}
                        </div>
                        <div className="divide-y divide-gray-800">
                          {group.posts.map((post, pIdx) => {
                            const key = "a" + gIdx + "-" + pIdx;
                            return (
                              <div key={pIdx} className="p-4">
                                <div className="flex justify-between mb-2">
                                  <span className="text-xs text-[#5A5A62]">
                                    منشور {pIdx + 1}
                                  </span>
                                  <button
                                    onClick={() => copyPost(key, post)}
                                    className="text-xs"
                                  >
                                    {copiedKey === key ? (
                                      <span className="text-green-400">
                                        نُسخ ✓
                                      </span>
                                    ) : (
                                      <span className="text-[#5A5A62] hover:text-white">
                                        نسخ
                                      </span>
                                    )}
                                  </button>
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                  {post}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="px-4 py-2 bg-gray-800/50 text-xs text-center font-bold text-[#9A9AA0]">
                          {modelName(
                            group.queueItem.provider2,
                            group.queueItem.model2
                          )}
                        </div>
                        <div className="divide-y divide-gray-800">
                          {group.posts2.map((post, pIdx) => {
                            const key = "b" + gIdx + "-" + pIdx;
                            return (
                              <div key={pIdx} className="p-4">
                                <div className="flex justify-between mb-2">
                                  <span className="text-xs text-[#5A5A62]">
                                    منشور {pIdx + 1}
                                  </span>
                                  <button
                                    onClick={() => copyPost(key, post)}
                                    className="text-xs"
                                  >
                                    {copiedKey === key ? (
                                      <span className="text-green-400">
                                        نُسخ ✓
                                      </span>
                                    ) : (
                                      <span className="text-[#5A5A62] hover:text-white">
                                        نسخ
                                      </span>
                                    )}
                                  </button>
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                  {post}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {group.draft && (
                        <div className="p-4 bg-yellow-900/10 border-b border-[rgba(198,145,76,0.12)]">
                          <p className="text-xs text-yellow-400 mb-2">
                            المسودة الأولى (قبل المراجعة):
                          </p>
                          <p className="text-[#9A9AA0] text-xs leading-relaxed whitespace-pre-wrap line-clamp-3">
                            {group.draft}
                          </p>
                        </div>
                      )}
                      {group.posts.map((post, pIdx) => {
                        const key = gIdx + "-" + pIdx;
                        return (
                          <div
                            key={pIdx}
                            className="p-4 hover:bg-[#16161A]/50"
                          >
                            <div className="flex justify-between mb-2">
                              <span className="text-xs text-[#5A5A62]">
                                منشور {pIdx + 1}
                              </span>
                              <button
                                onClick={() => copyPost(key, post)}
                                className="text-xs"
                              >
                                {copiedKey === key ? (
                                  <span className="text-green-400">
                                    نُسخ ✓
                                  </span>
                                ) : (
                                  <span className="text-[#5A5A62] hover:text-white">
                                    نسخ
                                  </span>
                                )}
                              </button>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                              {post}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
