"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  ArrowRight, MessageCircle, Send, Check, X, Edit3, RefreshCw,
  AlertCircle, Loader2, Phone, Sparkles, Trash2, Clock,
} from "lucide-react";

type FollowupItem = {
  id: string;
  client_id: string | null;
  channel: string;
  message: string;
  reason: string | null;
  status: string;
  generated_at: string;
  generated_by_model: string | null;
  client?: { full_name: string; phone?: string; sentiment?: string };
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "بانتظار الإرسال", color: "#E8B86D", bg: "rgba(232,184,109,0.10)" },
  sent:    { label: "أُرسل",            color: "#4ADE80", bg: "rgba(74,222,128,0.10)"  },
  skipped: { label: "تم تخطّيه",        color: "#71717A", bg: "rgba(113,113,122,0.10)" },
  expired: { label: "منتهي الصلاحية",   color: "#52525B", bg: "rgba(82,82,91,0.08)"     },
};

export default function FollowupsPage() {
  const [items, setItems] = useState<FollowupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    setLoading(true);
    try {
      let q = supabase
        .from("followup_queue")
        .select("id, client_id, channel, message, reason, status, generated_at, generated_by_model")
        .order("generated_at", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data } = await q;
      const queue = (data || []) as FollowupItem[];

      const clientIds = Array.from(new Set(queue.map(i => i.client_id).filter(Boolean) as string[]));
      const clientMap = new Map<string, { full_name: string; phone?: string; sentiment?: string }>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from("clients")
          .select("id, full_name, phone, sentiment")
          .in("id", clientIds);
        (clients || []).forEach((c: { id: string; full_name: string; phone?: string; sentiment?: string }) => {
          clientMap.set(c.id, { full_name: c.full_name, phone: c.phone, sentiment: c.sentiment });
        });
      }

      setItems(queue.map(i => ({
        ...i,
        client: i.client_id ? clientMap.get(i.client_id) : undefined,
      })));
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }

  async function send(item: FollowupItem) {
    if (!item.client?.phone) {
      toast.error("لا يوجد رقم جوال للعميل");
      return;
    }
    setBusy(item.id);
    try {
      // أرسل عبر whatsapp endpoint
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: item.client.phone, text: item.message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "فشل الإرسال");

      // إذا wa_me فقط، افتح الرابط
      if (json.mode === "wa_me" && json.waMeUrl) {
        window.open(json.waMeUrl, "_blank");
      }

      // ضع كـ "sent"
      const { data: userData } = await supabase.auth.getUser();
      await supabase
        .from("followup_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), sent_by: userData.user?.id })
        .eq("id", item.id);

      toast.success(json.mode === "meta" ? "تم الإرسال عبر Meta API" : "فُتحت محادثة WhatsApp");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(null);
  }

  async function skip(id: string) {
    setBusy(id);
    try {
      const { error: e } = await supabase
        .from("followup_queue")
        .update({ status: "skipped" })
        .eq("id", id);
      if (e) throw new Error(e.message);
      toast.success("تم التخطّي");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(null);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه المتابعة؟")) return;
    setBusy(id);
    try {
      await supabase.from("followup_queue").delete().eq("id", id);
      toast.success("تم الحذف");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(editingId);
    try {
      const { error: e } = await supabase
        .from("followup_queue")
        .update({ message: editText })
        .eq("id", editingId);
      if (e) throw new Error(e.message);
      toast.success("تم الحفظ");
      setEditingId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(null);
  }

  const counts = useMemo(() => {
    return items.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  return (
    <div>
      <Link href="/dashboard/clients"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 12 }}>
        <ArrowRight size={12} /> العملاء
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <MessageCircle size={20} style={{ color: "#34D399" }} /> رسائل المتابعة (موظف المتابعة)
          </h1>
          <p style={{ fontSize: 13, color: "#71717A" }}>
            رسائل واتساب مولَّدة تلقائياً للعملاء الباردين — راجع، عدّل، وأرسل
          </p>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#A1A1AA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {["all", "pending", "sent", "skipped"].map(s => {
          const isActive = statusFilter === s;
          const m = STATUS_META[s] || { label: "الكل", color: "#A1A1AA", bg: "rgba(255,255,255,0.04)" };
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: "8px 14px", borderRadius: 9,
                background: isActive ? m.bg : "transparent",
                border: `1px solid ${isActive ? m.color + "55" : "rgba(255,255,255,0.06)"}`,
                color: isActive ? m.color : "#71717A",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
              }}>
              {s === "all" ? "الكل" : m.label}
              {counts[s] !== undefined && s !== "all" && <span style={{ marginInlineStart: 6, fontSize: 10, opacity: 0.7 }}>({counts[s]})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 size={26} style={{ color: "#34D399", animation: "spin 1s linear infinite" }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <MessageCircle size={32} style={{ color: "#3F3F46", marginBottom: 10 }} />
          <div style={{ fontSize: 14, color: "#A1A1AA", marginBottom: 4 }}>لا متابعات بعد</div>
          <div style={{ fontSize: 12, color: "#71717A" }}>
            موظف المتابعة يولّد الرسائل يومياً 6م للعملاء الباردين الذين لم تتواصل معهم منذ 14+ يوم.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(item => {
            const status = STATUS_META[item.status] || STATUS_META.pending;
            const isBusy = busy === item.id;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} style={{
                background: "#0F0F12", border: `1px solid ${status.color}22`,
                borderRadius: 12, padding: 16,
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Phone size={14} style={{ color: "#34D399" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7" }}>
                        {item.client?.full_name || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "#71717A", direction: "ltr", textAlign: "right" }}>
                        {item.client?.phone || "بدون رقم"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.client?.sentiment === "cold" && (
                      <span style={{ fontSize: 10, color: "#60A5FA", background: "rgba(96,165,250,0.1)", padding: "3px 7px", borderRadius: 5 }}>
                        ❄ بارد
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, color: status.color, background: status.bg, padding: "3px 8px", borderRadius: 5 }}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                {item.reason && (
                  <div style={{ fontSize: 11, color: "#71717A", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                    <Sparkles size={11} style={{ color: "#A78BFA" }} /> {item.reason}
                  </div>
                )}

                {/* Message */}
                {isEditing ? (
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={5}
                    style={{
                      width: "100%", padding: "12px 14px", marginBottom: 10,
                      background: "#18181B", border: "1px solid rgba(52,211,153,0.3)",
                      borderRadius: 9, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif",
                      outline: "none", resize: "vertical",
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 13, color: "#D4D4D8", lineHeight: 1.8, whiteSpace: "pre-wrap", padding: "12px 14px", background: "#18181B", borderRadius: 9, marginBottom: 10 }}>
                    {item.message}
                  </div>
                )}

                {/* Meta */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 10, color: "#52525B", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={10} /> {new Date(item.generated_at).toLocaleString("ar-SA")}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} disabled={isBusy} style={btnSm("#4ADE80", "rgba(74,222,128,0.1)")}>
                          <Check size={11} /> حفظ
                        </button>
                        <button onClick={() => setEditingId(null)} style={btnSm("#A1A1AA", "rgba(255,255,255,0.04)")}>
                          <X size={11} /> إلغاء
                        </button>
                      </>
                    ) : item.status === "pending" ? (
                      <>
                        <button onClick={() => { setEditingId(item.id); setEditText(item.message); }} style={btnSm("#A78BFA", "rgba(124,58,237,0.08)")}>
                          <Edit3 size={11} /> تعديل
                        </button>
                        <button onClick={() => skip(item.id)} disabled={isBusy} style={btnSm("#71717A", "rgba(113,113,122,0.08)")}>
                          <X size={11} /> تخطٍّ
                        </button>
                        <button onClick={() => send(item)} disabled={isBusy || !item.client?.phone} style={btnSm("#34D399", "rgba(52,211,153,0.12)")}>
                          {isBusy ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={11} />}
                          إرسال
                        </button>
                      </>
                    ) : null}
                    <button onClick={() => remove(item.id)} disabled={isBusy} style={btnSm("#F87171", "rgba(239,68,68,0.04)")}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function btnSm(fg: string, bg: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: 7,
    background: bg, border: `1px solid ${fg}30`, color: fg,
    fontSize: 11, cursor: "pointer", fontFamily: "'Tajawal', sans-serif", fontWeight: 600,
    textDecoration: "none",
  };
}
