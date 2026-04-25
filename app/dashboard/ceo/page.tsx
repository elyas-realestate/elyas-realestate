"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { DEPARTMENT_META } from "@/lib/org-constants";
import {
  Crown, AlertTriangle, Activity, Network, RefreshCw, ChevronLeft,
  CheckCircle2, XCircle, Clock, Info, Loader2, Sparkles, Bot,
} from "lucide-react";

type Escalation = {
  id: string; severity: string; type: string; title: string;
  description: string; raised_by_kind: string; raised_by_id: string;
  status: string; created_at: string; ceo_decision?: string;
};

type ActivityLog = {
  id: string; actor_kind: string; actor_id: string; action: string;
  details: Record<string, unknown>; created_at: string;
};

type ManagerStats = {
  manager_id: string; manager_code: string; manager_name: string;
  department: string; manager_enabled: boolean;
  employee_count: number; active_directives: number;
  pending_suggestions: number; kb_items: number;
};

const SEVERITY_META: Record<string, { color: string; bg: string; icon: typeof Info; label: string }> = {
  info:     { color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  icon: Info,           label: "معلومة" },
  warning:  { color: "#E8B86D", bg: "rgba(232,184,109,0.10)", icon: AlertTriangle,  label: "تحذير" },
  critical: { color: "#F87171", bg: "rgba(239,68,68,0.10)",   icon: AlertTriangle,  label: "حرج" },
};

export default function CEODashboardPage() {
  const [managers, setManagers] = useState<ManagerStats[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, e, a] = await Promise.all([
        supabase.rpc("org_structure_for_tenant"),
        supabase.from("org_escalations").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("org_activity_log").select("*").order("created_at", { ascending: false }).limit(30),
      ]);
      setManagers((m.data || []) as ManagerStats[]);
      setEscalations((e.data || []) as Escalation[]);
      setActivity((a.data || []) as ActivityLog[]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decideEscalation(id: string, decision: "approved" | "rejected", note: string) {
    setBusyId(id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error: e } = await supabase.from("org_escalations").update({
        status: decision === "approved" ? "approved" : "rejected",
        ceo_decision: note,
        decided_by: userData.user?.id,
        decided_at: new Date().toISOString(),
      }).eq("id", id);
      if (e) throw new Error(e.message);
      toast.success(decision === "approved" ? "تمت الموافقة" : "تم الرفض");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    }
    setBusyId(null);
  }

  const pendingEscalations = escalations.filter(e => e.status === "pending");
  const totalActiveDirectives = managers.reduce((s, m) => s + m.active_directives, 0);
  const totalPendingSuggestions = managers.reduce((s, m) => s + m.pending_suggestions, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Crown size={20} style={{ color: "#E8B86D" }} /> لوحة الرئيس التنفيذي
          </h1>
          <p style={{ fontSize: 13, color: "#71717A" }}>نظرة شاملة على نشاط منظومتك التنظيمية + قرارات تنتظر موافقتك</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "rgba(232,184,109,0.08)", border: "1px solid rgba(232,184,109,0.2)", color: "#E8B86D", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 18 }}>
        <KPI label="مدراء نشطون" value={managers.filter(m => m.manager_enabled).length} icon={Network} color="#A78BFA" />
        <KPI label="توجيهات نشطة" value={totalActiveDirectives} icon={Sparkles} color="#60A5FA" />
        <KPI label="اقتراحات تنتظرك" value={totalPendingSuggestions} icon={Bot} color={totalPendingSuggestions > 0 ? "#E8B86D" : "#71717A"} highlight={totalPendingSuggestions > 0} />
        <KPI label="قرارات تنتظرك" value={pendingEscalations.length} icon={AlertTriangle} color={pendingEscalations.length > 0 ? "#F87171" : "#71717A"} highlight={pendingEscalations.length > 0} />
      </div>

      {/* Pending Escalations — أعلى أولوية */}
      {pendingEscalations.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#F87171", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> قرارات تنتظر اعتمادك ({pendingEscalations.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingEscalations.map(esc => {
              const sev = SEVERITY_META[esc.severity] || SEVERITY_META.info;
              const SevIcon = sev.icon;
              return (
                <div key={esc.id} style={{ background: "#0F0F12", border: `1px solid ${sev.color}55`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: sev.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SevIcon size={14} style={{ color: sev.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7" }}>{esc.title}</span>
                        <span style={{ fontSize: 10, color: sev.color, background: sev.bg, padding: "2px 7px", borderRadius: 4 }}>{sev.label}</span>
                        <span style={{ fontSize: 10, color: "#71717A" }}>{esc.type}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.7 }}>{esc.description}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => {
                      const note = prompt("سبب الرفض (اختياري):") || "";
                      decideEscalation(esc.id, "rejected", note);
                    }} disabled={busyId === esc.id}
                      style={{ padding: "8px 14px", borderRadius: 7, background: "rgba(239,68,68,0.06)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, cursor: "pointer", fontFamily: "'Tajawal', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                      <XCircle size={11} /> ارفض
                    </button>
                    <button onClick={() => {
                      const note = prompt("ملاحظة على الموافقة (اختياري):") || "";
                      decideEscalation(esc.id, "approved", note);
                    }} disabled={busyId === esc.id}
                      style={{ padding: "8px 14px", borderRadius: 7, background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'Tajawal', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={11} /> اعتمد
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manager status grid */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <Network size={14} /> حالة الأقسام
      </h2>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 size={26} style={{ color: "#E8B86D", animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, marginBottom: 22 }}>
          {managers.map(m => {
            const dept = DEPARTMENT_META[m.department];
            const Icon = dept?.icon || Bot;
            return (
              <Link key={m.manager_id} href={`/dashboard/organization/manager/${m.manager_id}`}
                style={{ background: "#0F0F12", border: `1px solid ${dept?.color}22`, borderRadius: 11, padding: 14, textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: dept?.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} style={{ color: dept?.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E4E4E7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.manager_name}</div>
                  <div style={{ fontSize: 10, color: "#71717A", marginTop: 3, display: "flex", gap: 8 }}>
                    <span>{m.employee_count} موظف</span>
                    <span>•</span>
                    <span>{m.active_directives} توجيه</span>
                    {m.pending_suggestions > 0 && (
                      <>
                        <span>•</span>
                        <span style={{ color: "#E8B86D" }}>{m.pending_suggestions} تنتظرك</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronLeft size={12} style={{ color: "#52525B", flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Recent activity feed */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <Activity size={14} /> آخر أنشطة المنظومة
      </h2>
      {activity.length === 0 ? (
        <div style={{ background: "#0F0F12", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 10, padding: 24, textAlign: "center", color: "#52525B", fontSize: 12 }}>
          لا نشاط مسجَّل بعد — يبدأ الموظفون بتسجيل الإجراءات لما يشغّلون مهامهم اليومية
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {activity.slice(0, 15).map(a => (
            <div key={a.id} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={11} style={{ color: "#A78BFA" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#D4D4D8" }}>{translateAction(a.action)}</div>
                <div style={{ fontSize: 10, color: "#52525B", marginTop: 2 }}>
                  <span style={{ color: "#71717A" }}>{a.actor_kind}</span> • {summarizeDetails(a.details)}
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#52525B", flexShrink: 0 }}>{timeAgo(a.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, icon: Icon, color, highlight }: { label: string; value: number; icon: typeof Crown; color: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? `${color}10` : "#0F0F12",
      border: `1px solid ${highlight ? color + "55" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 11, padding: "12px 14px",
    }}>
      <Icon size={14} style={{ color, marginBottom: 6 }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#52525B", marginTop: 4 }}>{label}</div>
    </div>
  );
}

const ACTION_TRANSLATIONS: Record<string, string> = {
  generated_marketing_posts:    "ولّد منشورات تسويق",
  generated_followup_messages:  "ولّد رسائل متابعة",
  generated_weekly_insight:     "أنتج تقرير أسبوعي",
  auto_replied_whatsapp:        "ردّ على رسالة واتساب",
  triggered_suggestions:        "ولّدت اقتراحات للفريق",
};

function translateAction(action: string): string {
  return ACTION_TRANSLATIONS[action] || action;
}

function summarizeDetails(d: Record<string, unknown>): string {
  if (!d) return "";
  const parts: string[] = [];
  if (typeof d.inserted === "number") parts.push(`${d.inserted} عنصر`);
  if (typeof d.directives_applied === "number") parts.push(`${d.directives_applied} توجيه`);
  if (typeof d.kb_items_loaded === "number" && d.kb_items_loaded > 0) parts.push(`${d.kb_items_loaded} KB`);
  if (typeof d.candidates === "number") parts.push(`${d.candidates} مرشّح`);
  if (typeof d.properties === "number") parts.push(`${d.properties} عقار`);
  if (typeof d.intent === "string") parts.push(`نية: ${d.intent}`);
  return parts.join(" • ");
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `${min}د`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}س`;
  return `${Math.floor(hr / 24)}ي`;
}
