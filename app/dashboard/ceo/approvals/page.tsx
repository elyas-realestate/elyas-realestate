"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Crown, ChevronLeft, RefreshCw, ShieldCheck, ShieldAlert, ShieldX,
  Loader2, CheckCircle2, XCircle, Clock, Info, AlertTriangle, Bot,
} from "lucide-react";
import { DEPARTMENT_META } from "@/lib/org-constants";

type EmployeeMini = { code: string; name: string; department: string } | null;

type Approval = {
  id: string;
  tenant_id: string;
  raised_by_kind: string;
  raised_by_id: string;
  severity: "info" | "warning" | "critical";
  type: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  pending_action: Record<string, unknown>;
  approval_kind: "info_only" | "pre_action" | "post_action";
  status: "pending" | "approved" | "rejected" | "modified";
  ceo_decision: string | null;
  decided_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
  employee: EmployeeMini;
};

const SEVERITY_META: Record<string, { color: string; bg: string; label: string }> = {
  info:     { color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  label: "معلومة" },
  warning:  { color: "#E8B86D", bg: "rgba(232,184,109,0.10)", label: "تحذير" },
  critical: { color: "#F87171", bg: "rgba(239,68,68,0.10)",   label: "حرج" },
};

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: "#FBBF24", bg: "rgba(251,191,36,0.10)",  label: "قيد المراجعة" },
  approved: { color: "#4ADE80", bg: "rgba(74,222,128,0.10)",  label: "موافَق" },
  rejected: { color: "#F87171", bg: "rgba(239,68,68,0.10)",   label: "مرفوض" },
  modified: { color: "#A78BFA", bg: "rgba(167,139,250,0.10)", label: "معدَّل" },
};

export default function CEOApprovalsPage() {
  const [items, setItems] = useState<Approval[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/org/approvals?status=${filter}&limit=100`);
      const text = await r.text();
      let j: { items?: unknown[]; error?: string } = {};
      try { j = text ? JSON.parse(text) : {}; } catch { /* ignore parse error */ }
      if (!r.ok) {
        throw new Error(j.error || `الخادم رجع ${r.status}${text ? `: ${text.slice(0, 120)}` : " (استجابة فارغة)"}`);
      }
      setItems((j.items || []) as Approval[]);
    } catch (e) {
      console.warn("[ceo/approvals] load failed:", e);
      toast.error(e instanceof Error ? e.message : "خطأ في التحميل");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, decision: "approved" | "rejected" | "modified") {
    const note = (noteDraft[id] || "").trim();
    if (decision === "modified" && !note) {
      toast.error("اكتب ملاحظة التعديل أولاً");
      return;
    }
    setBusyId(id);
    try {
      const r = await fetch(`/api/org/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      const text = await r.text();
      let j: { error?: string } = {};
      try { j = text ? JSON.parse(text) : {}; } catch { /* ignore */ }
      if (!r.ok) throw new Error(j.error || `الخادم رجع ${r.status}${text ? `: ${text.slice(0, 120)}` : ""}`);
      toast.success(decision === "approved" ? "تم الاعتماد" : decision === "rejected" ? "تم الرفض" : "تم التعديل");
      setExpandedId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = items.filter(i => i.status === "pending").length;

  return (
    <div style={{ direction: "rtl", padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/ceo" style={{ color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={18} />
            <span style={{ fontSize: 13 }}>لوحة CEO</span>
          </Link>
          <div style={{ width: 1, height: 20, background: "#374151" }} />
          <ShieldCheck size={26} color="#FBBF24" />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>
              بوابات الموافقة
            </h1>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
              قرارات حرجة من الموظفين تنتظر اعتمادك
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.30)",
            color: "#60A5FA", fontSize: 13, cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      {/* Stats + Filters */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center",
      }}>
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          background: pendingCount > 0 ? "rgba(251,191,36,0.10)" : "rgba(74,222,128,0.10)",
          border: `1px solid ${pendingCount > 0 ? "rgba(251,191,36,0.30)" : "rgba(74,222,128,0.30)"}`,
          color: pendingCount > 0 ? "#FBBF24" : "#4ADE80",
          fontSize: 13, fontWeight: 600,
        }}>
          {pendingCount > 0 ? `${pendingCount} قرار ينتظر اعتمادك` : "لا توجد طلبات معلَّقة"}
        </div>

        <div style={{ display: "flex", gap: 6, marginRight: "auto" }}>
          {(["pending", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 14px", borderRadius: 8,
                background: filter === f ? "rgba(167,139,250,0.15)" : "transparent",
                border: `1px solid ${filter === f ? "rgba(167,139,250,0.30)" : "#374151"}`,
                color: filter === f ? "#A78BFA" : "#9CA3AF",
                fontSize: 12, cursor: "pointer", fontWeight: 600,
              }}
            >
              {f === "pending" ? "المعلَّقة" : "الكل"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto" }} />
          <p style={{ marginTop: 8, fontSize: 13 }}>جاري التحميل...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center",
          background: "rgba(255,255,255,0.02)",
          border: "1px dashed #374151", borderRadius: 12,
          color: "#6B7280",
        }}>
          <ShieldCheck size={48} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: 14, margin: 0 }}>
            {filter === "pending" ? "كل شيء تحت السيطرة. لا توجد طلبات معلَّقة." : "لا توجد طلبات في الأرشيف."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(item => {
            const sev = SEVERITY_META[item.severity] || SEVERITY_META.info;
            const stat = STATUS_META[item.status] || STATUS_META.pending;
            const dept = item.employee?.department ? DEPARTMENT_META[item.employee.department as keyof typeof DEPARTMENT_META] : null;
            const isExpanded = expandedId === item.id;
            const action = (item.pending_action || {}) as Record<string, unknown>;
            const summary = typeof action.summary === "string" ? action.summary : "";
            const tags = Array.isArray(action.tags) ? action.tags as string[] : [];
            const verdictReason = typeof action.verdict_reason === "string" ? action.verdict_reason : "";
            const amount = typeof action.amount_sar === "number" ? action.amount_sar : null;

            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${item.status === "pending" ? sev.color + "40" : "#374151"}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  opacity: item.is_expired && item.status === "pending" ? 0.6 : 1,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: 16, cursor: "pointer",
                    display: "flex", alignItems: "flex-start", gap: 12,
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: 8,
                    background: sev.bg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.severity === "critical" ? (
                      <ShieldAlert size={18} color={sev.color} />
                    ) : item.severity === "warning" ? (
                      <AlertTriangle size={18} color={sev.color} />
                    ) : (
                      <Info size={18} color={sev.color} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#F9FAFB", margin: 0 }}>
                        {item.title}
                      </h3>
                      <span style={{
                        fontSize: 10, padding: "2px 6px", borderRadius: 4,
                        background: stat.bg, color: stat.color, fontWeight: 600,
                      }}>
                        {stat.label}
                      </span>
                      {item.is_expired && item.status === "pending" && (
                        <span style={{
                          fontSize: 10, padding: "2px 6px", borderRadius: 4,
                          background: "rgba(239,68,68,0.10)", color: "#F87171", fontWeight: 600,
                        }}>
                          منتهي
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0", lineHeight: 1.5 }}>
                      {item.description}
                    </p>

                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280", marginTop: 6, flexWrap: "wrap" }}>
                      {item.employee && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Bot size={12} color={dept?.color || "#6B7280"} />
                          <span style={{ color: dept?.color || "#6B7280" }}>{item.employee.name}</span>
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} />
                        {new Date(item.created_at).toLocaleString("ar-SA", {
                          dateStyle: "short", timeStyle: "short",
                        })}
                      </span>
                      {amount !== null && (
                        <span style={{ color: "#FBBF24", fontWeight: 600 }}>
                          {amount.toLocaleString("ar-SA")} ر.س
                        </span>
                      )}
                      {tags.length > 0 && (
                        <span>التصنيفات: {tags.join("، ")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div style={{
                    padding: 16, borderTop: "1px solid #1F2937",
                    background: "rgba(0,0,0,0.20)",
                  }}>
                    {summary && (
                      <div style={{ marginBottom: 12 }}>
                        <h4 style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 6px 0", fontWeight: 700 }}>
                          ملخّص الإجراء المعلَّق
                        </h4>
                        <div style={{
                          padding: 12, borderRadius: 8,
                          background: "rgba(255,255,255,0.03)", border: "1px solid #1F2937",
                          fontSize: 13, color: "#E5E7EB", lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}>
                          {summary}
                        </div>
                      </div>
                    )}

                    {verdictReason && (
                      <div style={{ marginBottom: 12 }}>
                        <h4 style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 6px 0", fontWeight: 700 }}>
                          سبب الإحالة
                        </h4>
                        <div style={{
                          padding: 10, borderRadius: 6,
                          background: sev.bg, border: `1px solid ${sev.color}40`,
                          fontSize: 12, color: sev.color, fontWeight: 500,
                        }}>
                          {verdictReason}
                        </div>
                      </div>
                    )}

                    {action.payload != null && typeof action.payload === "object" && Object.keys(action.payload as Record<string, unknown>).length > 0 && (
                      <details style={{ marginBottom: 12 }}>
                        <summary style={{
                          cursor: "pointer", fontSize: 11, color: "#9CA3AF",
                          fontWeight: 700, padding: "6px 0",
                        }}>
                          الحمولة الكاملة (JSON)
                        </summary>
                        <pre style={{
                          padding: 10, borderRadius: 6,
                          background: "#0B1220", border: "1px solid #1F2937",
                          fontSize: 11, color: "#9CA3AF", overflow: "auto",
                          fontFamily: "monospace",
                        }}>
                          {JSON.stringify(action.payload, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Decided already */}
                    {item.status !== "pending" && item.ceo_decision && (
                      <div style={{
                        padding: 10, borderRadius: 6,
                        background: stat.bg, border: `1px solid ${stat.color}30`,
                        marginBottom: 8,
                      }}>
                        <div style={{ fontSize: 11, color: stat.color, fontWeight: 700, marginBottom: 4 }}>
                          قرارك ({item.decided_at ? new Date(item.decided_at).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" }) : ""}):
                        </div>
                        <div style={{ fontSize: 13, color: "#E5E7EB" }}>
                          {item.ceo_decision}
                        </div>
                      </div>
                    )}

                    {/* Decision form */}
                    {item.status === "pending" && (
                      <>
                        <textarea
                          value={noteDraft[item.id] || ""}
                          onChange={e => setNoteDraft({ ...noteDraft, [item.id]: e.target.value })}
                          placeholder="ملاحظة (اختيارية للموافقة/الرفض، إلزامية للتعديل)..."
                          rows={2}
                          style={{
                            width: "100%", padding: 10, borderRadius: 6,
                            background: "#0B1220", border: "1px solid #1F2937",
                            color: "#E5E7EB", fontSize: 13, resize: "vertical",
                            fontFamily: "inherit", direction: "rtl",
                            marginBottom: 10,
                          }}
                        />
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() => decide(item.id, "approved")}
                            disabled={busyId === item.id}
                            style={{
                              padding: "8px 16px", borderRadius: 6,
                              background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.40)",
                              color: "#4ADE80", fontSize: 13, fontWeight: 600,
                              cursor: busyId === item.id ? "wait" : "pointer",
                              display: "flex", alignItems: "center", gap: 6,
                            }}
                          >
                            <CheckCircle2 size={14} />
                            اعتماد
                          </button>
                          <button
                            onClick={() => decide(item.id, "rejected")}
                            disabled={busyId === item.id}
                            style={{
                              padding: "8px 16px", borderRadius: 6,
                              background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)",
                              color: "#F87171", fontSize: 13, fontWeight: 600,
                              cursor: busyId === item.id ? "wait" : "pointer",
                              display: "flex", alignItems: "center", gap: 6,
                            }}
                          >
                            <XCircle size={14} />
                            رفض
                          </button>
                          <button
                            onClick={() => decide(item.id, "modified")}
                            disabled={busyId === item.id}
                            style={{
                              padding: "8px 16px", borderRadius: 6,
                              background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.30)",
                              color: "#A78BFA", fontSize: 13, fontWeight: 600,
                              cursor: busyId === item.id ? "wait" : "pointer",
                              display: "flex", alignItems: "center", gap: 6,
                            }}
                          >
                            <ShieldX size={14} />
                            تعديل
                          </button>
                          {busyId === item.id && (
                            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#9CA3AF", fontSize: 12 }}>
                              <Loader2 size={12} className="animate-spin" />
                              جاري...
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
