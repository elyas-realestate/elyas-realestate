"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import {
  arabicMonths,
  providers,
  saudiEvents,
  riyadhTrendingAreas,
  marketTopics,
} from "../constants";
import type { BrokerIdentity } from "@/types/database";
import { Loader2, Sparkles, Check, Copy } from "lucide-react";

export default function TrendsTab({
  onSendToFactory,
}: {
  onSendToFactory: (idea: string) => void;
}) {
  const [activeSection, setActiveSection] = useState("events");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [identity, setIdentity] = useState<BrokerIdentity | null>(null);
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("broker_identity")
        .select("*")
        .limit(1)
        .single();
      if (data) setIdentity(data as BrokerIdentity);
    })();
  }, []);

  async function generateIdeas(topic: string) {
    setGenerating(true);
    setGeneratedIdeas([]);
    const identityInfo = identity
      ? "اسم الوسيط: " +
        identity.broker_name +
        "\nالتخصص: " +
        identity.specialization +
        "\nالمنطقة: " +
        (identity.coverage_areas || []).join("، ")
      : "";
    const systemPrompt =
      "أنت خبير محتوى عقاري سعودي. مهمتك توليد أفكار محتوى إبداعية ومتنوعة للسوشال ميديا.\n\nهوية الوسيط:\n" +
      identityInfo;
    const userPrompt =
      "ولّد 8 أفكار محتوى عقاري متنوعة مرتبطة بهذا الموضوع:\n" +
      topic +
      "\n\nلكل فكرة اكتب:\n- عنوان الفكرة\n- وصف مختصر (سطر واحد)\n- المنصة المقترحة\n- الصيغة المقترحة (تغريدة/ريلز/كاروسيل)\n\nرقّم الأفكار من 1 إلى 8.";
    try {
      const res = await fetch("/api/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          provider: aiProvider,
          model: aiModel,
        }),
      });
      const data = await res.json();
      if (data.result) {
        const ideas = data.result
          .split(/\n\d+[.)]\s*/g)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 20);
        setGeneratedIdeas(ideas.length > 0 ? ideas : [data.result]);
      }
    } catch {
      setGeneratedIdeas(["حدث خطأ في التوليد"]);
    }
    setGenerating(false);
  }

  function copyIdea(idx: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 2000);
  }

  const sections = [
    { id: "events", label: "مناسبات الشهر", icon: "📅" },
    { id: "market", label: "أخبار السوق", icon: "📊" },
    { id: "areas", label: "أحياء صاعدة", icon: "📍" },
    { id: "generate", label: "توليد أفكار AI", icon: "🤖" },
  ];

  const trendColor: Record<string, string> = {
    "صاعد بقوة": "text-green-400 bg-green-900/30",
    "صاعد": "text-green-300 bg-green-900/20",
    "مستقر مرتفع": "text-[#C6914C] bg-[rgba(198,145,76,0.1)]",
    "مستقر": "text-[#9A9AA0] bg-[#1C1C22]",
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-bold mb-1">
          ترندات ومناسبات عقارية
        </h3>
        <p className="text-[#9A9AA0] text-xs sm:text-sm hidden sm:block">
          أفكار محتوى مرتبطة بالسوق والمناسبات
        </p>
      </div>

      {/* Mobile: dropdown */}
      <div className="md:hidden mb-4">
        <select
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium focus:outline-none"
          style={{
            background: "#16161A",
            border: "1px solid rgba(198,145,76,0.25)",
            color: "#F5F5F5",
          }}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: tab buttons */}
      <div className="hidden md:flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition whitespace-nowrap " +
              (activeSection === s.id
                ? "bg-[#C6914C] text-white"
                : "bg-[#16161A] border border-[rgba(198,145,76,0.12)] text-[#9A9AA0] hover:text-white")
            }
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* مناسبات الشهر */}
      {activeSection === "events" && (
        <div>
          <div className="md:hidden mb-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{
                background: "#16161A",
                border: "1px solid rgba(198,145,76,0.15)",
                color: "#F5F5F5",
              }}
            >
              {arabicMonths.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden md:flex gap-2 mb-4 overflow-x-auto pb-2">
            {arabicMonths.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMonth(idx + 1)}
                className={
                  "px-3 py-2 rounded-lg text-xs transition whitespace-nowrap " +
                  (selectedMonth === idx + 1
                    ? "bg-[#C6914C] text-white"
                    : "bg-[#16161A] border border-[rgba(198,145,76,0.12)] text-[#9A9AA0] hover:text-white")
                }
              >
                {m}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(saudiEvents[selectedMonth] || []).map((event, idx) => (
              <div
                key={idx}
                className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 hover:border-[#C6914C] transition"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={
                      "text-xs px-2 py-1 rounded " +
                      (event.type === "مناسبة"
                        ? "bg-purple-900/30 text-purple-400"
                        : "bg-[rgba(198,145,76,0.1)] text-[#C6914C]")
                    }
                  >
                    {event.type}
                  </span>
                  <span className="text-xs text-[#5A5A62]">{event.date}</span>
                </div>
                <h4 className="font-bold mb-2">{event.title}</h4>
                <p className="text-[#9A9AA0] text-sm mb-4">
                  {event.contentIdea}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSendToFactory(event.contentIdea)}
                    className="text-xs bg-[#C6914C] hover:bg-[#A6743A] px-3 py-1.5 rounded-lg transition"
                  >
                    أرسل لمصنع المحتوى
                  </button>
                  <button
                    onClick={() =>
                      generateIdeas(event.title + " — " + event.contentIdea)
                    }
                    className="text-xs bg-[#1C1C22] hover:bg-[#2A2A32] px-3 py-1.5 rounded-lg transition"
                  >
                    ولّد أفكار AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* أخبار السوق */}
      {activeSection === "market" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketTopics.map((topic, idx) => (
            <div
              key={idx}
              className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 hover:border-[#C6914C] transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{topic.icon}</span>
                <h4 className="font-bold">{topic.title}</h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSendToFactory(topic.title)}
                  className="text-xs bg-[#C6914C] hover:bg-[#A6743A] px-3 py-1.5 rounded-lg transition"
                >
                  أرسل لمصنع المحتوى
                </button>
                <button
                  onClick={() => generateIdeas(topic.title)}
                  className="text-xs bg-[#1C1C22] hover:bg-[#2A2A32] px-3 py-1.5 rounded-lg transition"
                >
                  ولّد أفكار AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* أحياء صاعدة */}
      {activeSection === "areas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riyadhTrendingAreas.map((area, idx) => (
            <div
              key={idx}
              className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 hover:border-[#C6914C] transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">{area.name}</h4>
                <span
                  className={
                    "text-xs px-2 py-1 rounded " +
                    (trendColor[area.trend] || "bg-[#1C1C22] text-[#9A9AA0]")
                  }
                >
                  {area.trend}
                </span>
              </div>
              <p className="text-[#9A9AA0] text-sm mb-3">{area.reason}</p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onSendToFactory("محتوى عن " + area.name + " — " + area.reason)
                  }
                  className="text-xs bg-[#C6914C] hover:bg-[#A6743A] px-3 py-1.5 rounded-lg transition"
                >
                  أرسل لمصنع المحتوى
                </button>
                <button
                  onClick={() =>
                    generateIdeas(area.name + " في الرياض — " + area.reason)
                  }
                  className="text-xs bg-[#1C1C22] hover:bg-[#2A2A32] px-3 py-1.5 rounded-lg transition"
                >
                  ولّد أفكار AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* توليد أفكار AI */}
      {activeSection === "generate" && (
        <div>
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-4 sm:p-5 mb-6">
            <h4 className="font-bold text-[#C6914C] text-sm mb-4">
              توليد أفكار محتوى بالذكاء الاصطناعي
            </h4>
            <div className="flex gap-2 mb-4 flex-wrap">
              <select
                value={aiProvider}
                onChange={(e) => {
                  setAiProvider(e.target.value);
                  const prov = providers.find((p) => p.id === e.target.value);
                  if (prov) setAiModel(prov.models[0].id);
                }}
                className="flex-1 bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C6914C]"
                style={{ minWidth: 100 }}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="flex-1 bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C6914C]"
                style={{ minWidth: 120 }}
              >
                {providers
                  .find((p) => p.id === aiProvider)
                  ?.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="اكتب موضوع أو ترند..."
                className="flex-1 bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTopic.trim())
                    generateIdeas(customTopic);
                }}
              />
              <button
                onClick={() => {
                  if (customTopic.trim()) generateIdeas(customTopic);
                }}
                disabled={generating || !customTopic.trim()}
                className={
                  "w-full sm:w-auto px-5 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 " +
                  (generating
                    ? "bg-[#2A2A32] text-[#9A9AA0]"
                    : "bg-[#C6914C] hover:bg-[#A6743A] text-white")
                }
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> جاري
                    التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> ولّد أفكار
                  </>
                )}
              </button>
            </div>
          </div>

          {generating && (
            <div className="text-center py-12">
              <Loader2
                size={40}
                className="text-[#C6914C] animate-spin mx-auto mb-4"
              />
              <p className="text-[#9A9AA0]">
                الذكاء الاصطناعي يولّد أفكار محتوى...
              </p>
            </div>
          )}

          {generatedIdeas.length > 0 && !generating && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm mb-2">
                {generatedIdeas.length} فكرة محتوى
              </h4>
              {generatedIdeas.map((idea, idx) => (
                <div
                  key={idx}
                  className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-4 hover:border-[rgba(198,145,76,0.15)] transition"
                >
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                    {idea}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onSendToFactory(idea.split("\n")[0])
                      }
                      className="text-xs bg-[#C6914C] hover:bg-[#A6743A] px-3 py-1.5 rounded-lg transition"
                    >
                      أرسل لمصنع المحتوى
                    </button>
                    <button
                      onClick={() => copyIdea(idx, idea)}
                      className="text-xs bg-[#1C1C22] hover:bg-[#2A2A32] px-3 py-1.5 rounded-lg transition"
                    >
                      {copiedIdx === idx ? "نُسخ ✓" : "نسخ"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
