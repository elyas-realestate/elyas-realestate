"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Sparkles, ChevronDown, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { label: "وصف عقار",     prompt: "اكتب لي وصفاً احترافياً لشقة 3 غرف في الرياض، حي النرجس، مساحة 180م²، بسعر 850,000 ريال" },
  { label: "نصيحة تسويق",  prompt: "ما أفضل طرق تسويق العقارات الفاخرة في الرياض خلال عام 2025؟" },
  { label: "حساب عمولة",   prompt: "كيف أحسب صافي ربحي من صفقة قيمتها 1,200,000 ريال وعمولتي 2.5%؟" },
  { label: "صياغة عقد",    prompt: "ما البنود الأساسية التي يجب أن يتضمنها عقد إيجار سكني في السعودية؟" },
];

const SYSTEM_PROMPT = `أنت مساعد عقاري ذكي متخصص في السوق السعودي. اسمك "وكيل برو AI".

تساعد الوسطاء العقاريين في:
- كتابة أوصاف عقارات احترافية وجذابة
- تقديم نصائح تسويقية فعّالة
- حساب العمولات والأرباح
- الإجابة عن أسئلة قانونية ومالية متعلقة بالعقارات السعودية
- تحليل السوق والتسعير
- صياغة رسائل واتساب وتواصل مع العملاء
- تقديم مشورة حول نظام الوساطة العقارية وشروط رخصة فال

ردودك:
- موجزة ومباشرة وعملية
- باللغة العربية الفصحى البسيطة
- تراعي اللوائح السعودية (هيئة العقار، فال، إيجار)
- محترفة ولكن ودية

لا تقدم نصائح قانونية ملزمة، بل أشر دائماً للاستشارة المختصة عند الحاجة.`;

export default function AIAssistant() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [pulse, setPulse]         = useState(true);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  // إيقاف النبضة بعد 5 ثوان
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // تمرير تلقائي للأسفل
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // فتح ← إعادة التركيز على الإدخال
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(text?: string) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "anthropic",
          model: "claude-haiku-4-5-20251001",
          systemPrompt: SYSTEM_PROMPT,
          messages: newMessages,
          mode: "single",
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.result }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ تعذّر الاتصال — تحقق من اتصالك بالإنترنت" }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* ─── زر العائم ─── */}
      <button
        onClick={() => setOpen(v => !v)}
        title="وكيل برو AI"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 9999,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, #8A5F2E, #6A4520)"
            : "linear-gradient(135deg, #C6914C, #A6743A)",
          border: "2px solid rgba(198,145,76,0.3)",
          boxShadow: open ? "0 4px 20px rgba(198,145,76,0.2)" : "0 4px 24px rgba(198,145,76,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {open ? (
          <ChevronDown size={20} color="#F5F5F5" />
        ) : (
          <Bot size={20} color="#0A0A0C" />
        )}

        {/* نقطة نبضة */}
        {!open && pulse && (
          <span style={{
            position: "absolute",
            top: 4, left: 4,
            width: 10, height: 10,
            borderRadius: "50%",
            background: "#4ADE80",
            animation: "ai-pulse 1.5s ease-in-out infinite",
          }} />
        )}
      </button>

      {/* ─── نافذة المحادثة ─── */}
      <div
        style={{
          position: "fixed",
          bottom: 88,
          left: 24,
          zIndex: 9998,
          width: 340,
          maxWidth: "calc(100vw - 32px)",
          height: 480,
          maxHeight: "calc(100vh - 120px)",
          background: "#0D0D10",
          border: "1px solid rgba(198,145,76,0.18)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          transformOrigin: "bottom left",
          transform: open ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        dir="rtl"
      >
        {/* رأس */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px",
          borderBottom: "1px solid rgba(198,145,76,0.1)",
          background: "rgba(198,145,76,0.04)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #C6914C, #8A5F2E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles size={16} color="#0A0A0C" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F5", lineHeight: 1.2 }}>وكيل برو AI</div>
            <div style={{ fontSize: 10, color: "#4ADE80" }}>● متاح الآن</div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="محادثة جديدة"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#5A5A62", padding: 4, borderRadius: 6 }}
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#5A5A62", padding: 4, borderRadius: 6 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* المحادثة */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.length === 0 ? (
            /* شاشة الترحيب */
            <div style={{ textAlign: "center", padding: "16px 8px" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: "rgba(198,145,76,0.08)",
                border: "1px solid rgba(198,145,76,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <Bot size={24} color="#C6914C" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E5E5", marginBottom: 6 }}>مرحباً! أنا وكيل برو AI</p>
              <p style={{ fontSize: 11, color: "#5A5A62", lineHeight: 1.6, marginBottom: 16 }}>
                مساعدك الذكي للسوق العقاري السعودي.<br />اسألني أي شيء!
              </p>

              {/* اقتراحات سريعة */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {QUICK_PROMPTS.map(q => (
                  <button
                    key={q.label}
                    onClick={() => sendMessage(q.prompt)}
                    style={{
                      background: "rgba(198,145,76,0.06)",
                      border: "1px solid rgba(198,145,76,0.15)",
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#C6914C",
                      cursor: "pointer",
                      textAlign: "right",
                      transition: "all 0.2s",
                    }}
                  >
                    {q.label} ←
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-start" : "flex-end",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "9px 13px",
                    borderRadius: msg.role === "user"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    background: msg.role === "user"
                      ? "rgba(198,145,76,0.12)"
                      : "#1C1C22",
                    border: msg.role === "user"
                      ? "1px solid rgba(198,145,76,0.2)"
                      : "1px solid rgba(255,255,255,0.06)",
                    fontSize: 12.5,
                    color: msg.role === "user" ? "#E5D5BC" : "#D5D5DC",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {/* مؤشر التحميل */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: "14px 14px 14px 4px",
                background: "#1C1C22",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", gap: 4, alignItems: "center",
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#C6914C",
                    animation: `ai-bounce 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* إدخال الرسالة */}
        <div style={{
          padding: "10px 12px",
          borderTop: "1px solid rgba(198,145,76,0.1)",
          background: "rgba(0,0,0,0.2)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="اسألني أي شيء..."
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                background: "#1C1C22",
                border: "1px solid rgba(198,145,76,0.15)",
                borderRadius: 12,
                padding: "10px 13px",
                fontSize: 12.5,
                color: "#F5F5F5",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                maxHeight: 80,
                minHeight: 40,
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38,
                borderRadius: 10,
                background: (!input.trim() || loading)
                  ? "rgba(198,145,76,0.2)"
                  : "linear-gradient(135deg, #C6914C, #A6743A)",
                border: "none",
                cursor: (!input.trim() || loading) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              <Send size={15} color={(!input.trim() || loading) ? "#5A5A62" : "#0A0A0C"} />
            </button>
          </div>
          <p style={{ fontSize: 10, color: "#3A3A42", marginTop: 6, textAlign: "center" }}>
            Enter للإرسال · Shift+Enter لسطر جديد
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ai-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        @keyframes ai-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .ai-chat-scroll::-webkit-scrollbar { width: 3px; }
        .ai-chat-scroll::-webkit-scrollbar-thumb { background: rgba(198,145,76,0.15); border-radius: 4px; }
      `}</style>
    </>
  );
}
