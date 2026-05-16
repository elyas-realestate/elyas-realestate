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
import { Loader2, Sparkles } from "lucide-react";

export default function TrendsTab({
  onSendToFactory,
}: {
  onSendToFactory: (idea: string) => void;
}) {
  const [activeSection, setActiveSection] = useState("events");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [identity, setIdentity] = useState<BrokerIdentity | null>(null);
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("broker_identity").select("*").limit(1).single();
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
    صاعد: "text-green-300 bg-green-900/20",
    "مستقر مرتفع": "text-[var(--gold-2)] bg-[var(--gold-bg)]",
    مستقر: "text-[var(--text-soft)] bg-[var(--bg-surface-2)]",
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="mb-1 text-lg font-bold sm:text-xl">ترندات ومناسبات عقارية</h3>
        <p className="hidden text-xs text-[var(--text-soft)] sm:block sm:text-sm">
          أفكار محتوى مرتبطة بالسوق والمناسبات
        </p>
      </div>

      {/* Mobile: dropdown */}
      <div className="mb-4 md:hidden">
        <select
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium focus:outline-none"
          style={{
            background: "var(--bg-surface-1)",
            border: "1px solid rgba(198,145,76,0.25)",
            color: "var(--text-strong)",
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
      <div className="mb-6 hidden gap-2 overflow-x-auto pb-2 md:flex">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm whitespace-nowrap transition " +
              (activeSection === s.id
                ? "bg-[var(--gold-2)] text-white"
                : "border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] text-[var(--text-soft)] hover:text-[var(--text-strong)]")
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
          <div className="mb-4 md:hidden">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{
                background: "var(--bg-surface-1)",
                border: "1px solid var(--gold-bg-hover)",
                color: "var(--text-strong)",
              }}
            >
              {arabicMonths.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 hidden gap-2 overflow-x-auto pb-2 md:flex">
            {arabicMonths.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMonth(idx + 1)}
                className={
                  "rounded-lg px-3 py-2 text-xs whitespace-nowrap transition " +
                  (selectedMonth === idx + 1
                    ? "bg-[var(--gold-2)] text-white"
                    : "border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] text-[var(--text-soft)] hover:text-[var(--text-strong)]")
                }
              >
                {m}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(saudiEvents[selectedMonth] || []).map((event, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-5 transition hover:border-[var(--gold-2)]"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={
                      "rounded px-2 py-1 text-xs " +
                      (event.type === "مناسبة"
                        ? "bg-purple-900/30 text-purple-400"
                        : "bg-[var(--gold-bg)] text-[var(--gold-2)]")
                    }
                  >
                    {event.type}
                  </span>
                  <span className="text-xs text-[var(--text-faint)]">{event.date}</span>
                </div>
                <h4 className="mb-2 font-bold">{event.title}</h4>
                <p className="mb-4 text-sm text-[var(--text-soft)]">{event.contentIdea}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSendToFactory(event.contentIdea)}
                    className="rounded-lg bg-[var(--gold-2)] px-3 py-1.5 text-xs transition hover:bg-[var(--gold-3)]"
                  >
                    أرسل لمصنع المحتوى
                  </button>
                  <button
                    onClick={() => generateIdeas(event.title + " — " + event.contentIdea)}
                    className="rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs transition hover:bg-[var(--bg-surface-3)]"
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {marketTopics.map((topic, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-5 transition hover:border-[var(--gold-2)]"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{topic.icon}</span>
                <h4 className="font-bold">{topic.title}</h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSendToFactory(topic.title)}
                  className="rounded-lg bg-[var(--gold-2)] px-3 py-1.5 text-xs transition hover:bg-[var(--gold-3)]"
                >
                  أرسل لمصنع المحتوى
                </button>
                <button
                  onClick={() => generateIdeas(topic.title)}
                  className="rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs transition hover:bg-[var(--bg-surface-3)]"
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {riyadhTrendingAreas.map((area, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-5 transition hover:border-[var(--gold-2)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-bold">{area.name}</h4>
                <span
                  className={
                    "rounded px-2 py-1 text-xs " +
                    (trendColor[area.trend] || "bg-[var(--bg-surface-2)] text-[var(--text-soft)]")
                  }
                >
                  {area.trend}
                </span>
              </div>
              <p className="mb-3 text-sm text-[var(--text-soft)]">{area.reason}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onSendToFactory("محتوى عن " + area.name + " — " + area.reason)}
                  className="rounded-lg bg-[var(--gold-2)] px-3 py-1.5 text-xs transition hover:bg-[var(--gold-3)]"
                >
                  أرسل لمصنع المحتوى
                </button>
                <button
                  onClick={() => generateIdeas(area.name + " في الرياض — " + area.reason)}
                  className="rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs transition hover:bg-[var(--bg-surface-3)]"
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
          <div className="mb-6 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4 sm:p-5">
            <h4 className="mb-4 text-sm font-bold text-[var(--gold-2)]">
              توليد أفكار محتوى بالذكاء الاصطناعي
            </h4>
            <div className="mb-4 flex flex-wrap gap-2">
              <select
                value={aiProvider}
                onChange={(e) => {
                  setAiProvider(e.target.value);
                  const prov = providers.find((p) => p.id === e.target.value);
                  if (prov) setAiModel(prov.models[0].id);
                }}
                className="flex-1 rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
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
                className="flex-1 rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="اكتب موضوع أو ترند..."
                className="flex-1 rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTopic.trim()) generateIdeas(customTopic);
                }}
              />
              <button
                onClick={() => {
                  if (customTopic.trim()) generateIdeas(customTopic);
                }}
                disabled={generating || !customTopic.trim()}
                className={
                  "flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-bold transition sm:w-auto " +
                  (generating
                    ? "bg-[var(--bg-surface-3)] text-[var(--text-soft)]"
                    : "bg-[var(--gold-2)] text-white hover:bg-[var(--gold-3)]")
                }
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> جاري التوليد...
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
            <div className="py-12 text-center">
              <Loader2 size={40} className="mx-auto mb-4 animate-spin text-[var(--gold-2)]" />
              <p className="text-[var(--text-soft)]">الذكاء الاصطناعي يولّد أفكار محتوى...</p>
            </div>
          )}

          {generatedIdeas.length > 0 && !generating && (
            <div className="space-y-3">
              <h4 className="mb-2 text-sm font-bold">{generatedIdeas.length} فكرة محتوى</h4>
              {generatedIdeas.map((idea, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-4 transition hover:border-[var(--gold-bg-hover)]"
                >
                  <p className="mb-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-200">
                    {idea}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSendToFactory(idea.split("\n")[0])}
                      className="rounded-lg bg-[var(--gold-2)] px-3 py-1.5 text-xs transition hover:bg-[var(--gold-3)]"
                    >
                      أرسل لمصنع المحتوى
                    </button>
                    <button
                      onClick={() => copyIdea(idx, idea)}
                      className="rounded-lg bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs transition hover:bg-[var(--bg-surface-3)]"
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
