"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  ArrowRight,
  Megaphone,
  Check,
  X,
  Copy,
  ExternalLink,
  RefreshCw,
  Twitter,
  Instagram,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";

type QueueItem = {
  id: string;
  property_id: string | null;
  channel: string;
  content: string;
  hashtags: string[] | null;
  status: string;
  generated_at: string;
  generated_by_model: string | null;
  published_url: string | null;
  rejection_reason: string | null;
  property?: { title: string; city?: string; district?: string };
};

const CHANNEL_META: Record<
  string,
  { label: string; icon: typeof Twitter; color: string; shareUrl: (text: string) => string }
> = {
  twitter: {
    label: "تويتر / X",
    icon: Twitter,
    color: "#1DA1F2",
    shareUrl: (text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
  instagram: {
    label: "إنستجرام",
    icon: Instagram,
    color: "#E4405F",
    shareUrl: () => "https://www.instagram.com/", // IG لا يدعم share مباشر — نسخ + فتح
  },
  whatsapp: {
    label: "واتساب",
    icon: MessageCircle,
    color: "var(--whatsapp)",
    shareUrl: (text) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
  },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "بانتظار المراجعة", color: "var(--gold-1)", bg: "rgba(232,184,109,0.10)" },
  approved: { label: "معتمد", color: "var(--info)", bg: "rgba(96,165,250,0.10)" },
  rejected: { label: "مرفوض", color: "var(--danger)", bg: "rgba(239,68,68,0.10)" },
  published: { label: "منشور", color: "var(--success)", bg: "rgba(74,222,128,0.10)" },
};

export default function MarketingQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      let q = supabase
        .from("marketing_queue")
        .select(
          "id, property_id, channel, content, hashtags, status, generated_at, generated_by_model, published_url, rejection_reason"
        )
        .order("generated_at", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data, error: e } = await q;
      if (e) throw new Error(e.message);

      const queueItems = (data || []) as QueueItem[];

      // اجلب عناوين العقارات
      const propIds = Array.from(
        new Set(queueItems.map((i) => i.property_id).filter(Boolean) as string[])
      );
      const propsMap = new Map<string, { title: string; city?: string; district?: string }>();
      if (propIds.length > 0) {
        const { data: props } = await supabase
          .from("properties")
          .select("id, title, city, district")
          .in("id", propIds);
        (props || []).forEach(
          (p: { id: string; title: string; city?: string; district?: string }) => {
            propsMap.set(p.id, { title: p.title, city: p.city, district: p.district });
          }
        );
      }

      setItems(
        queueItems.map((i) => ({
          ...i,
          property: i.property_id ? propsMap.get(i.property_id) : undefined,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }

  async function approve(id: string) {
    setBusy(id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error: e } = await supabase
        .from("marketing_queue")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: userData.user?.id,
        })
        .eq("id", id);
      if (e) throw new Error(e.message);
      toast.success("تم الاعتماد");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(null);
  }

  async function reject(id: string) {
    const reason = prompt("سبب الرفض (اختياري):");
    if (reason === null) return;
    setBusy(id);
    try {
      const { error: e } = await supabase
        .from("marketing_queue")
        .update({ status: "rejected", rejection_reason: reason || null })
        .eq("id", id);
      if (e) throw new Error(e.message);
      toast.success("تم الرفض");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(null);
  }

  async function markPublished(id: string, url?: string) {
    setBusy(id);
    try {
      const { error: e } = await supabase
        .from("marketing_queue")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          published_url: url || null,
        })
        .eq("id", id);
      if (e) throw new Error(e.message);
      toast.success("تم تسجيله كمنشور");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(null);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا المنشور نهائياً؟")) return;
    setBusy(id);
    try {
      const { error: e } = await supabase.from("marketing_queue").delete().eq("id", id);
      if (e) throw new Error(e.message);
      toast.success("تم الحذف");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(null);
  }

  function copyContent(content: string, hashtags: string[] | null) {
    const full =
      hashtags && hashtags.length > 0
        ? content + (content.includes("#") ? "" : "\n\n" + hashtags.map((h) => `#${h}`).join(" "))
        : content;
    navigator.clipboard.writeText(full);
    toast.success("نُسخ المحتوى");
  }

  const counts = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [items]);

  return (
    <div>
      <Link
        href="/dashboard/ai-employees"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          color: "var(--text-ghost)",
          marginBottom: 12,
        }}
      >
        <ArrowRight size={12} /> موظفو AI
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Megaphone size={20} style={{ color: "var(--gold-2)" }} /> قائمة منشورات التسويق
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-ghost)" }}>
            راجع المنشورات التي ولّدها موظف التسويق، اعتمدها، وانشرها على القنوات المناسبة
          </p>
        </div>
        <button
          onClick={load}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 9,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--overlay-mid)",
            color: "var(--text-muted)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          <RefreshCw
            size={13}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
          تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Status filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {["all", "pending", "approved", "published", "rejected"].map((s) => {
          const isActive = statusFilter === s;
          const m = STATUS_META[s] || {
            label: "الكل",
            color: "var(--text-muted)",
            bg: "rgba(255,255,255,0.04)",
          };
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "8px 14px",
                borderRadius: 9,
                background: isActive ? m.bg : "transparent",
                border: `1px solid ${isActive ? m.color + "55" : "var(--overlay-mid)"}`,
                color: isActive ? m.color : "var(--text-ghost)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              {s === "all" ? "الكل" : m.label}
              {counts[s] !== undefined && s !== "all" && (
                <span style={{ marginInlineStart: 6, fontSize: 10, opacity: 0.7 }}>
                  ({counts[s]})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          <AlertCircle
            size={14}
            style={{ color: "var(--danger)", display: "inline", marginInlineEnd: 8 }}
          />
          <span style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2
            size={26}
            style={{ color: "var(--gold-2)", animation: "spin 1s linear infinite" }}
          />
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            background: "var(--bg-deep)",
            border: "1px solid var(--overlay-mid)",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
          }}
        >
          <Megaphone size={32} style={{ color: "var(--border-1)", marginBottom: 10 }} />
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>
            لا منشورات بعد
          </div>
          <div style={{ fontSize: 12, color: "var(--text-ghost)" }}>
            موظف التسويق يولّد المنشورات يومياً 10ص. تأكد أن لديك عقارات منشورة في آخر 7 أيام.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 14,
          }}
        >
          {items.map((item) => {
            const channel = CHANNEL_META[item.channel] || {
              label: item.channel,
              icon: Megaphone,
              color: "var(--text-muted)",
              shareUrl: () => "",
            };
            const status = STATUS_META[item.status] || STATUS_META.pending;
            const Icon = channel.icon;
            const isBusy = busy === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: "var(--bg-deep)",
                  border: `1px solid ${status.color}22`,
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: `${channel.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={14} style={{ color: channel.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-on-dark)", fontWeight: 600 }}>
                        {channel.label}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-disabled)" }}>
                        {new Date(item.generated_at).toLocaleString("ar-SA", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: status.color,
                      background: status.bg,
                      padding: "3px 8px",
                      borderRadius: 5,
                    }}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Property */}
                {item.property && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-ghost)",
                      padding: "6px 10px",
                      background: "var(--bg-surface-2)",
                      borderRadius: 7,
                    }}
                  >
                    📍 {item.property.title}{" "}
                    {item.property.district ? `— ${item.property.district}` : ""}
                  </div>
                )}

                {/* Content */}
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    padding: "10px 12px",
                    background: "var(--bg-page)",
                    borderRadius: 8,
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  {item.content}
                </div>

                {/* Hashtags */}
                {item.hashtags && item.hashtags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {item.hashtags.map((h) => (
                      <span
                        key={h}
                        style={{
                          fontSize: 10,
                          color: channel.color,
                          background: `${channel.color}15`,
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        #{h}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rejection reason */}
                {item.status === "rejected" && item.rejection_reason && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--danger)",
                      padding: "6px 10px",
                      background: "rgba(239,68,68,0.06)",
                      borderRadius: 7,
                    }}
                  >
                    سبب الرفض: {item.rejection_reason}
                  </div>
                )}

                {/* Published URL */}
                {item.status === "published" && item.published_url && (
                  <a
                    href={item.published_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "var(--success)",
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={11} /> عرض المنشور
                  </a>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                  <button
                    onClick={() => copyContent(item.content, item.hashtags)}
                    style={btnSm("var(--text-muted)", "rgba(255,255,255,0.04)")}
                  >
                    <Copy size={11} /> نسخ
                  </button>

                  {item.status === "pending" && (
                    <>
                      <button
                        onClick={() => approve(item.id)}
                        disabled={isBusy}
                        style={btnSm("var(--info)", "rgba(96,165,250,0.1)")}
                      >
                        <Check size={11} /> اعتماد
                      </button>
                      <button
                        onClick={() => reject(item.id)}
                        disabled={isBusy}
                        style={btnSm("var(--danger)", "rgba(239,68,68,0.06)")}
                      >
                        <X size={11} /> رفض
                      </button>
                    </>
                  )}

                  {(item.status === "approved" || item.status === "pending") &&
                    channel.shareUrl !== undefined && (
                      <a
                        href={channel.shareUrl(item.content)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => markPublished(item.id, channel.shareUrl(item.content))}
                        style={btnSm(channel.color, `${channel.color}10`)}
                      >
                        <ExternalLink size={11} /> فتح + نشر
                      </a>
                    )}

                  {item.status !== "published" && (
                    <button
                      onClick={() => markPublished(item.id)}
                      disabled={isBusy}
                      style={btnSm("var(--success)", "rgba(74,222,128,0.08)")}
                    >
                      <CheckCircle2 size={11} /> تم النشر
                    </button>
                  )}

                  <button
                    onClick={() => remove(item.id)}
                    disabled={isBusy}
                    style={btnSm("var(--danger)", "rgba(239,68,68,0.04)")}
                  >
                    <Trash2 size={11} />
                  </button>
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
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 10px",
    borderRadius: 7,
    background: bg,
    border: `1px solid ${fg}30`,
    color: fg,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "'Tajawal', sans-serif",
    fontWeight: 600,
    textDecoration: "none",
  };
}
