"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-browser";
import { providers } from "../constants";
import type { BrokerIdentity, ChatMessage } from "@/types/database";
import { MessageSquare, Send, RefreshCw } from "lucide-react";
import { SkeletonList } from "@/components/ui/Skeleton";

export default function ExpertTab({
  onDraftsCreated,
}: {
  onDraftsCreated: () => void;
}) {
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
      const { data } = await supabase
        .from("broker_identity")
        .select("*")
        .limit(1)
        .single();
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
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
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

    const newMsgs: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
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

      const blocks = aText
        .split("===")
        .filter((_: string, i: number) => i % 2 === 1);
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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "خطأ: " + msg },
      ]);
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
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold">خبير المحتوى</h3>
          <p className="text-[#9A9AA0] text-xs hidden sm:block">
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
          className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#C6914C]"
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
          className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#C6914C]"
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
            className="flex items-center gap-1 text-xs text-[#9A9AA0] hover:text-white bg-[#16161A] border border-[rgba(198,145,76,0.12)] px-3 py-2 rounded-lg transition flex-shrink-0"
          >
            <RefreshCw size={12} />{" "}
            <span className="hidden sm:inline">جديدة</span>
          </button>
        )}
      </div>

      {/* Chat Container */}
      <div
        className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl overflow-hidden"
        style={{
          height: "calc(100svh - 280px)",
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageSquare size={40} className="text-[#3A3A42] mb-3" />
              <p className="text-[#9A9AA0] font-bold mb-1 text-sm">
                مرحباً، أنا خبير المحتوى العقاري
              </p>
              <p className="text-[#5A5A62] text-xs max-w-xs mb-5">
                أعطني فكرة أو موضوع وسأكتب لك محتوى جاهز للنشر
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:justify-center">
                {[
                  "تغريدة عن نصائح للمشتري الجديد",
                  "محتوى عن أهمية الوسيط المرخص",
                  "سكريبت ريلز عن حي النرجس",
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="text-xs bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] text-[#9A9AA0] hover:text-white px-3 py-2 rounded-lg transition text-right"
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
              className={
                "flex " +
                (msg.role === "user" ? "justify-start" : "justify-end")
              }
            >
              <div className="max-w-[90%] sm:max-w-[85%]">
                <div
                  className={
                    "rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed whitespace-pre-wrap " +
                    (msg.role === "user"
                      ? "bg-[#1C1C22] text-gray-200 rounded-tr-sm"
                      : "bg-[rgba(198,145,76,0.08)] border border-[rgba(198,145,76,0.15)] text-gray-200 rounded-tl-sm")
                  }
                >
                  {msg.content}
                </div>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-3 mt-1.5 mr-1">
                    <button
                      onClick={() => copyMsg(idx, msg.content)}
                      className="text-xs"
                    >
                      {copiedIdx === idx ? (
                        <span className="text-green-400">نُسخ ✓</span>
                      ) : (
                        <span className="text-[#5A5A62] hover:text-white">
                          نسخ
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => saveDraft(idx, msg.content)}
                      className="text-xs"
                    >
                      {savedIdx === idx ? (
                        <span className="text-green-400">حُفظ ✓</span>
                      ) : (
                        <span className="text-[#5A5A62] hover:text-white">
                          حفظ كمسودة
                        </span>
                      )}
                    </button>
                    {msg.savedAsDraft && (
                      <span className="text-xs text-green-600">✓ تلقائي</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-end">
              <div className="bg-[rgba(198,145,76,0.08)] border border-[rgba(198,145,76,0.15)] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#C6914C] rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-[#C6914C] rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-2 h-2 bg-[#C6914C] rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[rgba(198,145,76,0.12)] p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب فكرتك..."
              rows={1}
              className="flex-1 bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#C6914C] resize-none"
              style={{ maxHeight: 120 }}
              dir="rtl"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={
                "w-10 h-10 rounded-xl flex items-center justify-center transition flex-shrink-0 " +
                (input.trim() && !loading
                  ? "bg-[#C6914C] hover:bg-[#A6743A] text-white"
                  : "bg-[#1C1C22] text-[#5A5A62]")
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
