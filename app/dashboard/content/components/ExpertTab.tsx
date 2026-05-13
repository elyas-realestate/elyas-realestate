"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-browser";
import { providers } from "../constants";
import type { BrokerIdentity, ChatMessage } from "@/types/database";
import { MessageSquare, Send, RefreshCw } from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";

export default function ExpertTab({ onDraftsCreated }: { onDraftsCreated: () => void }) {
  const [identity, setIdentity] = useState<BrokerIdentity | null>(null);
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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("broker_identity").select("*").limit(1).single();
      if (data) setIdentity(data as BrokerIdentity);
      setInitLoading(false);
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  function getSystemPrompt() {
    const id = identity;
    const info = id
      ? `اسم الوسيط: ${id.broker_name}\nالتخصص: ${id.specialization}\nمناطق التغطية: ${(id.coverage_areas || []).join("، ")}\nالجمهور: ${(id.target_audiences || []).join("، ")}\nكلمات البراند: ${(id.brand_keywords || []).join("، ")}\nعبارات يتجنبها: ${(id.avoid_phrases || []).join("، ")}\nالنبذة: ${id.bio_short || ""}`
      : "";
    return `أنت "خبير المحتوى العقاري" — وكيل ذكاء اصطناعي متخصص في كتابة المحتوى للسوق العقاري السعودي.\n\nهوية الوسيط:\n${info}\n\nدورك: تستقبل أفكار وتحولها لمحتوى جاهز للنشر. تسأل عن الجمهور والهدف إذا لم يُحدد. تكتب محتوى كامل جاهز للنسخ. تقترح هوكات بديلة. تقيّم وتحسّن النصوص.\n\nالقواعد: المحتوى يتحدث عن الوسيط بصيغة الغائب. لا تكتب "أول تغريدة". أضف هاشتاقات. افتتاحية قوية. كن مباشراً. عند كتابة محتوى نهائي ضعه بين === في بداية ونهاية كل منشور.`;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMsgs: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: getSystemPrompt(),
          messages: newMsgs.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          provider: aiProvider,
          model: aiModel,
        }),
      });
      const data = await res.json();
      const aText = data.result || "حدث خطأ، حاول مرة أخرى.";
      const aMsg: ChatMessage = { role: "assistant", content: aText };

      const blocks = aText.split("===").filter((_: string, i: number) => i % 2 === 1);
      if (blocks.length > 0) {
        await supabase.from("content").insert(
          blocks.map((b: string) => ({
            title: b.trim().substring(0, 50) + "...",
            main_text: b.trim(),
            content_goal: "خبير المحتوى",
            main_channel: "متعدد",
            content_format: "نص",
            status: "مسودة",
          }))
        );
        aMsg.savedAsDraft = true;
        onDraftsCreated();
      }
      setMessages((prev) => [...prev, aMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      setMessages((prev) => [...prev, { role: "assistant", content: "خطأ: " + msg }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function copyMsg(idx: number, text: string) {
    navigator.clipboard.writeText(text.replace(/===/g, "").trim());
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 2000);
  }

  async function saveDraft(idx: number, text: string) {
    const clean = text.replace(/===/g, "").trim();
    await supabase.from("content").insert([
      {
        title: clean.substring(0, 50) + "...",
        main_text: clean,
        content_goal: "خبير المحتوى",
        main_channel: "متعدد",
        content_format: "نص",
        status: "مسودة",
      },
    ]);
    setSavedIdx(idx);
    setTimeout(() => setSavedIdx(-1), 2000);
    onDraftsCreated();
  }

  if (initLoading) return <SkeletonList count={4} />;

  return (
    <div>
      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold">خبير المحتوى</h3>
          <p className="hidden text-xs text-[var(--text-soft)] sm:block">
            أعطه فكرة — يكتب محتوى جاهز للنشر
          </p>
        </div>
        <select
          value={aiProvider}
          onChange={(e) => {
            setAiProvider(e.target.value);
            const prov = providers.find((p) => p.id === e.target.value);
            if (prov) setAiModel(prov.models[0].id);
          }}
          className="rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] px-2 py-2 text-xs focus:border-[var(--gold-2)] focus:outline-none"
          style={{ minWidth: 90 }}
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
          className="rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] px-2 py-2 text-xs focus:border-[var(--gold-2)] focus:outline-none"
          style={{ minWidth: 110 }}
        >
          {providers
            .find((p) => p.id === aiProvider)
            ?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] px-3 py-2 text-xs text-[var(--text-soft)] transition hover:text-[var(--text-strong)]"
          >
            <RefreshCw size={12} /> <span className="hidden sm:inline">جديدة</span>
          </button>
        )}
      </div>

      {/* Chat Container */}
      <div
        className="overflow-hidden rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]"
        style={{
          height: "calc(100svh - 280px)",
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:space-y-4 sm:p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <MessageSquare size={40} className="mb-3 text-[var(--border-1)]" />
              <p className="mb-1 text-sm font-bold text-[var(--text-soft)]">
                مرحباً، أنا خبير المحتوى العقاري
              </p>
              <p className="mb-5 max-w-xs text-xs text-[var(--text-faint)]">
                أعطني فكرة أو موضوع وسأكتب لك محتوى جاهز للنشر
              </p>
              <div className="flex w-full flex-col flex-wrap gap-2 sm:flex-row sm:justify-center">
                {[
                  "تغريدة عن نصائح للمشتري الجديد",
                  "محتوى عن أهمية الوسيط المرخص",
                  "سكريبت ريلز عن حي النرجس",
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2 text-right text-xs text-[var(--text-soft)] transition hover:text-[var(--text-strong)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={"flex " + (msg.role === "user" ? "justify-start" : "justify-end")}
            >
              <div className="max-w-[90%] sm:max-w-[85%]">
                <div
                  className={
                    "rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap sm:px-4 sm:py-3 " +
                    (msg.role === "user"
                      ? "rounded-tr-sm bg-[var(--bg-surface-2)] text-gray-200"
                      : "rounded-tl-sm border border-[var(--gold-bg-hover)] bg-[var(--gold-bg-soft)] text-gray-200")
                  }
                >
                  {msg.content}
                </div>
                {msg.role === "assistant" && (
                  <div className="mt-1.5 mr-1 flex items-center gap-3">
                    <button onClick={() => copyMsg(idx, msg.content)} className="text-xs">
                      {copiedIdx === idx ? (
                        <span className="text-green-400">نُسخ ✓</span>
                      ) : (
                        <span className="text-[var(--text-faint)] hover:text-[var(--text-strong)]">
                          نسخ
                        </span>
                      )}
                    </button>
                    <button onClick={() => saveDraft(idx, msg.content)} className="text-xs">
                      {savedIdx === idx ? (
                        <span className="text-green-400">حُفظ ✓</span>
                      ) : (
                        <span className="text-[var(--text-faint)] hover:text-[var(--text-strong)]">
                          حفظ كمسودة
                        </span>
                      )}
                    </button>
                    {msg.savedAsDraft && <span className="text-xs text-green-600">✓ تلقائي</span>}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-tl-sm border border-[var(--gold-bg-hover)] bg-[var(--gold-bg-soft)] px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold-2)]" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold-2)]"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-[var(--gold-2)]"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--gold-bg)] p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب فكرتك..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-3 py-2.5 text-sm text-gray-200 focus:border-[var(--gold-2)] focus:outline-none"
              style={{ maxHeight: 120 }}
              dir="rtl"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition " +
                (input.trim() && !loading
                  ? "bg-[var(--gold-2)] text-white hover:bg-[var(--gold-3)]"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-faint)]")
              }
            >
              <Send size={16} style={{ transform: "scaleX(-1)" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
