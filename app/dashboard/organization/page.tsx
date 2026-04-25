"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { DEPARTMENT_META } from "@/lib/org-constants";
import {
  Network, Users, Sparkles, BookOpen, ChevronLeft, RefreshCw,
  AlertCircle, Loader2, Crown, Bot,
} from "lucide-react";

type ManagerOverview = {
  manager_id: string;
  manager_code: string;
  manager_name: string;
  department: string;
  manager_enabled: boolean;
  employee_count: number;
  active_directives: number;
  pending_suggestions: number;
  kb_items: number;
};

export default function OrganizationPage() {
  const [managers, setManagers] = useState<ManagerOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokerName, setBrokerName] = useState("CEO");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const [{ data: structure, error: e1 }, { data: identity }] = await Promise.all([
        supabase.rpc("org_structure_for_tenant"),
        supabase.from("broker_identity").select("broker_name").maybeSingle(),
      ]);
      if (e1) throw new Error(e1.message);
      setManagers((structure || []) as ManagerOverview[]);
      if (identity?.broker_name) setBrokerName(identity.broker_name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }

  const totalEmployees = managers.reduce((s, m) => s + m.employee_count, 0);
  const totalDirectives = managers.reduce((s, m) => s + m.active_directives, 0);
  const totalPending = managers.reduce((s, m) => s + m.pending_suggestions, 0);
  const totalKB = managers.reduce((s, m) => s + m.kb_items, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Network size={20} style={{ color: "#A78BFA" }} /> الهيكل التنظيمي
          </h1>
          <p style={{ fontSize: 13, color: "#71717A" }}>
            أنت CEO. كل قسم له مدير AI + موظفين تحته. اضغط على أي مدير لإدارة توجيهاته وقاعدة معرفته.
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#A78BFA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <AlertCircle size={14} style={{ color: "#F87171", display: "inline", marginInlineEnd: 8 }} />
          <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
        </div>
      )}

      {/* CEO badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(198,145,76,0.18), rgba(232,184,109,0.08))",
          border: "1px solid rgba(198,145,76,0.4)",
          borderRadius: 14, padding: "16px 28px", textAlign: "center", minWidth: 220,
        }}>
          <Crown size={20} style={{ color: "#E8B86D", marginBottom: 6 }} />
          <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 3 }}>الرئيس التنفيذي</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#F4F4F5" }}>{brokerName}</div>
        </div>
      </div>

      {/* Connecting line */}
      <div style={{
        width: 2, height: 30, background: "linear-gradient(to bottom, #C6914C, transparent)",
        margin: "0 auto",
      }} />

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 22 }}>
        <SummaryStat label="مدراء" value={managers.length} icon={Crown} color="#E8B86D" />
        <SummaryStat label="موظفون" value={totalEmployees} icon={Users} color="#34D399" />
        <SummaryStat label="توجيهات نشطة" value={totalDirectives} icon={Sparkles} color="#A78BFA" />
        <SummaryStat label="اقتراحات تنتظر مراجعتك" value={totalPending} icon={Bot} color={totalPending > 0 ? "#E8B86D" : "#71717A"} />
        <SummaryStat label="عناصر معرفة" value={totalKB} icon={BookOpen} color="#60A5FA" />
      </div>

      {/* Managers grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 size={26} style={{ color: "#A78BFA", animation: "spin 1s linear infinite" }} />
        </div>
      ) : managers.length === 0 ? (
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 40, textAlign: "center", color: "#52525B" }}>
          <Network size={32} style={{ color: "#3F3F46", marginBottom: 10 }} />
          <div style={{ fontSize: 14, color: "#A1A1AA" }}>لا يوجد مدراء — هل تم تشغيل migration 031؟</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
          {managers.map(m => {
            const dept = DEPARTMENT_META[m.department] || { label: m.department, color: "#A1A1AA", bg: "rgba(161,161,170,0.10)", icon: Bot };
            const Icon = dept.icon;
            return (
              <Link key={m.manager_id} href={`/dashboard/organization/manager/${m.manager_id}`}
                style={{
                  background: "#0F0F12", border: `1px solid ${dept.color}33`,
                  borderRadius: 14, padding: 16, textDecoration: "none",
                  display: "flex", flexDirection: "column", gap: 12,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${dept.color}66`; e.currentTarget.style.background = "#141418"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${dept.color}33`; e.currentTarget.style.background = "#0F0F12"; }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: dept.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={18} style={{ color: dept.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7", lineHeight: 1.3 }}>{m.manager_name}</div>
                    <div style={{ fontSize: 11, color: dept.color, marginTop: 2 }}>{dept.label}</div>
                  </div>
                  <ChevronLeft size={14} style={{ color: "#52525B", flexShrink: 0 }} />
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Mini label="موظفون"   value={m.employee_count}      color="#34D399" />
                  <Mini label="توجيهات"  value={m.active_directives}    color="#A78BFA" />
                  <Mini label="اقتراحات" value={m.pending_suggestions}  color={m.pending_suggestions > 0 ? "#E8B86D" : "#52525B"} highlight={m.pending_suggestions > 0} />
                  <Mini label="معرفة"    value={m.kb_items}             color="#60A5FA" />
                </div>

                {/* Status badge */}
                {!m.manager_enabled && (
                  <div style={{ fontSize: 10, color: "#F87171", background: "rgba(239,68,68,0.06)", padding: "4px 8px", borderRadius: 5, textAlign: "center" }}>
                    ⚠ معطّل
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Tip card */}
      <div style={{ marginTop: 22, padding: 14, background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 11, fontSize: 12, color: "#A1A1AA", lineHeight: 1.8 }}>
        💡 <strong style={{ color: "#60A5FA" }}>كيف يعمل النظام؟</strong>
        <br />• تكتب أنت توجيهات + قاعدة معرفة لكل <strong>مدير</strong> (نبرة الكتابة، السياسات، حدود التفويض)
        <br />• AI يقترح <strong>تلقائياً</strong> توجيهات لكل موظف تحت المدير، أنت تعتمد أو ترفض
        <br />• الموظفون ينفّذون مهامهم اليومية مع التوجيهات الموروثة + المخصّصة
        <br />• القرارات الحساسة تُرفع كـ <strong>Escalations</strong> تنتظر موافقتك CEO
      </div>
    </div>
  );
}

function SummaryStat({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Network; color: string }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: "12px 14px" }}>
      <Icon size={14} style={{ color, marginBottom: 6 }} />
      <div style={{ fontSize: 20, fontWeight: 800, color: "#F4F4F5", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#52525B", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Mini({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div style={{
      padding: "8px 10px", background: highlight ? `${color}15` : "#18181B",
      border: highlight ? `1px solid ${color}33` : "1px solid transparent",
      borderRadius: 7, textAlign: "center",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#71717A", marginTop: 3 }}>{label}</div>
    </div>
  );
}
