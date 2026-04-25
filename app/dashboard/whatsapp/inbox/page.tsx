"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  ArrowRight, MessageCircle, Send, Search, RefreshCw, Settings,
  Bot, User, Clock, CheckCircle2, AlertCircle, Phone, Loader2,
} from "lucide-react";

type Message = {
  id: string;
  contact_phone: string;
  contact_name: string | null;
  direction: "inbound" | "outbound";
  message_type: string;
  body_text: string | null;
  status: string;
  ai_intent: string | null;
  ai_replied: boolean;
  created_at: string;
};

type Conversation = {
  contact_phone: string;
  contact_name: string | null;
  last_message: string;
  last_at: string;
  unread_inbound: number;
  total: number;
};

export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (selected) loadThread(selected);
  }, [selected]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  async function load() {
    setLoading(true); setError("");
    try {
      // أحدث 200 رسالة، نجمعها كمحادثات (1 لكل رقم)
      const { data, error: e } = await supabase
        .from("whatsapp_messages")
        .select("contact_phone, contact_name, direction, body_text, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (e) throw new Error(e.message);

      const map = new Map<string, Conversation>();
      for (const m of (data || []) as Message[]) {
        if (!map.has(m.contact_phone)) {
          map.set(m.contact_phone, {
            contact_phone: m.contact_phone,
            contact_name: m.contact_name,
            last_message: m.body_text || "",
            last_at: m.created_at,
            unread_inbound: 0,
            total: 0,
          });
        }
        const c = map.get(m.contact_phone)!;
        c.total++;
        if (m.direction === "inbound") c.unread_inbound++;
      }
      setConversations(Array.from(map.values()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }

  async function loadThread(phone: string) {
    setLoadingThread(true);
    try {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("contact_phone", phone)
        .order("created_at", { ascending: true })
        .limit(200);
      setThread((data || []) as Message[]);
    } catch (e) {
      console.error(e);
    }
    setLoadingThread(false);
  }

  async function handleSend() {
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selected, text: reply.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "فشل الإرسال");

      if (json.mode === "wa_me") {
        // فتح wa.me في تبويب جديد
        window.open(json.waMeUrl, "_blank");
        toast.info("Meta API غير مفعَّل — فُتحت محادثة WhatsApp في تبويب جديد");
      } else {
        toast.success("تم الإرسال");
      }
      setReply("");
      await loadThread(selected);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ");
    }
    setSending(false);
  }

  const filteredConvs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return conversations.filter(c => {
      if (!q) return true;
      return (
        c.contact_phone.includes(q) ||
        (c.contact_name || "").toLowerCase().includes(q) ||
        c.last_message.toLowerCase().includes(q)
      );
    });
  }, [conversations, filter]);

  return (
    <div>
      <Link href="/dashboard"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 12 }}>
        <ArrowRight size={12} /> الداشبورد
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <MessageCircle size={20} style={{ color: "#34D399" }} /> WhatsApp — المحادثات
          </h1>
          <p style={{ fontSize: 13, color: "#71717A" }}>
            {conversations.length} محادثة • سجل واردة وصادرة
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/dashboard/whatsapp/settings"
            style={btnSecondary("#A78BFA", "rgba(124,58,237,0.08)")}>
            <Settings size={13} /> إعدادات Meta
          </Link>
          <button onClick={load}
            style={btnSecondary("#A1A1AA", "rgba(255,255,255,0.04)")}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            تحديث
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <AlertCircle size={14} style={{ color: "#F87171", display: "inline", marginInlineEnd: 8 }} />
          <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14, height: "calc(100vh - 220px)", minHeight: 500 }}>
        {/* محادثات */}
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#52525B" }} />
              <input
                placeholder="بحث رقم أو اسم..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 30px 8px 12px", background: "#18181B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, color: "#E4E4E7", fontSize: 12, fontFamily: "'Tajawal', sans-serif", outline: "none" }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 16, textAlign: "center", color: "#52525B", fontSize: 12 }}>جاري التحميل...</div>
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#52525B" }}>
                <MessageCircle size={28} style={{ color: "#3F3F46", marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>لا محادثات بعد</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>تظهر هنا لما يبدأ العملاء بمراسلتك على WhatsApp</div>
              </div>
            ) : (
              filteredConvs.map(c => (
                <button key={c.contact_phone}
                  onClick={() => setSelected(c.contact_phone)}
                  style={{
                    width: "100%", textAlign: "right", padding: "11px 12px",
                    background: selected === c.contact_phone ? "rgba(52,211,153,0.06)" : "transparent",
                    border: "none", borderBottom: "1px solid rgba(255,255,255,0.03)",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 9,
                    fontFamily: "'Tajawal', sans-serif",
                  }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={14} style={{ color: "#34D399" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#E4E4E7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.contact_name || c.contact_phone}
                    </div>
                    <div style={{ fontSize: 11, color: "#71717A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                      {c.last_message || "..."}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, fontSize: 10, color: "#52525B" }}>
                    {timeAgo(c.last_at)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#52525B", textAlign: "center", flexDirection: "column", gap: 8 }}>
              <MessageCircle size={36} style={{ color: "#3F3F46" }} />
              <div style={{ fontSize: 14 }}>اختر محادثة من القائمة</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Phone size={15} style={{ color: "#34D399" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7" }}>
                    {conversations.find(c => c.contact_phone === selected)?.contact_name || selected}
                  </div>
                  <div style={{ fontSize: 11, color: "#71717A", direction: "ltr" }}>+{selected}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, background: "#0A0A0C" }}>
                {loadingThread ? (
                  <div style={{ textAlign: "center", color: "#52525B", padding: 20 }}>
                    <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "#34D399" }} />
                  </div>
                ) : thread.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#52525B", padding: 20, fontSize: 12 }}>
                    لا رسائل بعد
                  </div>
                ) : (
                  thread.map(m => (
                    <div key={m.id} style={{
                      display: "flex",
                      justifyContent: m.direction === "inbound" ? "flex-start" : "flex-end",
                    }}>
                      <div style={{
                        maxWidth: "70%",
                        padding: "9px 13px",
                        borderRadius: m.direction === "inbound" ? "10px 10px 10px 3px" : "10px 10px 3px 10px",
                        background: m.direction === "inbound" ? "#18181B" : "rgba(52,211,153,0.15)",
                        border: m.direction === "outbound" ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(255,255,255,0.05)",
                      }}>
                        <div style={{ fontSize: 13, color: "#E4E4E7", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {m.body_text}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 10, color: "#52525B", justifyContent: m.direction === "inbound" ? "flex-start" : "flex-end" }}>
                          {m.ai_replied && m.direction === "inbound" && <Bot size={10} style={{ color: "#A78BFA" }} />}
                          <span>{new Date(m.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                          {m.direction === "outbound" && (
                            <span style={{ color: m.status === "read" ? "#34D399" : m.status === "delivered" ? "#60A5FA" : "#71717A" }}>
                              {m.status === "read" ? "✓✓" : m.status === "delivered" ? "✓✓" : m.status === "failed" ? "✗" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Composer */}
              <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="اكتب الرد... (Enter للإرسال، Shift+Enter لسطر جديد)"
                  disabled={sending}
                  style={{ flex: 1, padding: "9px 12px", background: "#18181B", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none", resize: "none" }}
                />
                <button onClick={handleSend} disabled={!reply.trim() || sending}
                  style={{
                    padding: "0 14px", borderRadius: 8,
                    background: reply.trim() ? "linear-gradient(135deg, #34D399, #10B981)" : "#3F3F46",
                    color: reply.trim() ? "#0A0A0C" : "#71717A",
                    border: "none", cursor: reply.trim() && !sending ? "pointer" : "not-allowed",
                    fontFamily: "'Tajawal', sans-serif",
                    display: "flex", alignItems: "center", gap: 5, opacity: sending ? 0.6 : 1,
                  }}>
                  {sending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function btnSecondary(fg: string, bg: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
    background: bg, border: `1px solid ${fg}30`, color: fg,
    fontSize: 12, cursor: "pointer", fontFamily: "'Tajawal', sans-serif", textDecoration: "none", fontWeight: 600,
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `${min}د`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}س`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}ي`;
  return new Date(iso).toLocaleDateString("ar-SA");
}
