"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { DEPARTMENT_META } from "@/lib/org-constants";
import {
  Network,
  Users,
  Sparkles,
  BookOpen,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Loader2,
  Crown,
  Bot,
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

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 22,
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
            <Network size={20} style={{ color: "var(--purple-ai)" }} /> فريقك من المساعدين الأذكياء
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-ghost)" }}>
            مساعدون متخصّصون يخدمونك في التسويق، المتابعة، التحليل، التحصيل وغيرها. اضغط على أي
            مساعد لتعديل توجيهاته أو قاعدة معرفته.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 9,
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            color: "var(--purple-ai)",
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

      {/* CEO badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(198,145,76,0.18), rgba(232,184,109,0.08))",
            border: "1px solid rgba(198,145,76,0.4)",
            borderRadius: 14,
            padding: "16px 28px",
            textAlign: "center",
            minWidth: 220,
          }}
        >
          <Crown size={20} style={{ color: "var(--gold-1)", marginBottom: 6 }} />
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>
            الرئيس التنفيذي
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
            {brokerName}
          </div>
        </div>
      </div>

      {/* Connecting line */}
      <div
        style={{
          width: 2,
          height: 30,
          background: "linear-gradient(to bottom, var(--gold-2), transparent)",
          margin: "0 auto",
        }}
      />

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
          gap: 10,
          marginBottom: 22,
        }}
      >
        <SummaryStat label="مدراء" value={managers.length} icon={Crown} color="var(--gold-1)" />
        <SummaryStat label="موظفون" value={totalEmployees} icon={Users} color="var(--success-2)" />
        <SummaryStat
          label="توجيهات نشطة"
          value={totalDirectives}
          icon={Sparkles}
          color="var(--purple-ai)"
        />
        <SummaryStat
          label="اقتراحات تنتظر مراجعتك"
          value={totalPending}
          icon={Bot}
          color={totalPending > 0 ? "var(--gold-1)" : "var(--text-ghost)"}
        />
        <SummaryStat label="عناصر معرفة" value={totalKB} icon={BookOpen} color="var(--info)" />
      </div>

      {/* Managers grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2
            size={26}
            style={{ color: "var(--purple-ai)", animation: "spin 1s linear infinite" }}
          />
        </div>
      ) : managers.length === 0 ? (
        <div
          style={{
            background: "var(--bg-deep)",
            border: "1px solid var(--overlay-mid)",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            color: "var(--text-disabled)",
          }}
        >
          <Network size={32} style={{ color: "var(--border-1)", marginBottom: 10 }} />
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
            لا يوجد مدراء — هل تم تشغيل migration 031؟
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 14,
          }}
        >
          {managers.map((m) => {
            const dept = DEPARTMENT_META[m.department] || {
              label: m.department,
              color: "var(--text-muted)",
              bg: "rgba(161,161,170,0.10)",
              icon: Bot,
            };
            const Icon = dept.icon;
            return (
              <Link
                key={m.manager_id}
                href={`/dashboard/organization/manager/${m.manager_id}`}
                style={{
                  background: "var(--bg-deep)",
                  border: `1px solid ${dept.color}33`,
                  borderRadius: 14,
                  padding: 16,
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${dept.color}66`;
                  e.currentTarget.style.background = "var(--bg-surface-1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${dept.color}33`;
                  e.currentTarget.style.background = "var(--bg-deep)";
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: dept.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} style={{ color: dept.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text-on-dark)",
                        lineHeight: 1.3,
                      }}
                    >
                      {m.manager_name}
                    </div>
                    <div style={{ fontSize: 11, color: dept.color, marginTop: 2 }}>
                      {dept.label}
                    </div>
                  </div>
                  <ChevronLeft size={14} style={{ color: "var(--text-disabled)", flexShrink: 0 }} />
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Mini label="موظفون" value={m.employee_count} color="var(--success-2)" />
                  <Mini label="توجيهات" value={m.active_directives} color="var(--purple-ai)" />
                  <Mini
                    label="اقتراحات"
                    value={m.pending_suggestions}
                    color={m.pending_suggestions > 0 ? "var(--gold-1)" : "var(--text-disabled)"}
                    highlight={m.pending_suggestions > 0}
                  />
                  <Mini label="معرفة" value={m.kb_items} color="var(--info)" />
                </div>

                {/* Status badge */}
                {!m.manager_enabled && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--danger)",
                      background: "rgba(239,68,68,0.06)",
                      padding: "4px 8px",
                      borderRadius: 5,
                      textAlign: "center",
                    }}
                  >
                    ⚠ معطّل
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Tip card */}
      <div
        style={{
          marginTop: 22,
          padding: 14,
          background: "rgba(96,165,250,0.05)",
          border: "1px solid rgba(96,165,250,0.15)",
          borderRadius: 11,
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.8,
        }}
      >
        💡 <strong style={{ color: "var(--info)" }}>كيف يعمل النظام؟</strong>
        <br />• تكتب أنت توجيهات + قاعدة معرفة لكل <strong>مدير</strong> (نبرة الكتابة، السياسات،
        حدود التفويض)
        <br />• AI يقترح <strong>تلقائياً</strong> توجيهات لكل موظف تحت المدير، أنت تعتمد أو ترفض
        <br />• الموظفون ينفّذون مهامهم اليومية مع التوجيهات الموروثة + المخصّصة
        <br />• القرارات الحساسة تُرفع كـ <strong>Escalations</strong> تنتظر موافقتك CEO
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Network;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-deep)",
        border: "1px solid var(--overlay-soft)",
        borderRadius: 11,
        padding: "12px 14px",
      }}
    >
      <Icon size={14} style={{ color, marginBottom: 6 }} />
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Mini({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: "8px 10px",
        background: highlight ? `${color}15` : "var(--bg-surface-2)",
        border: highlight ? `1px solid ${color}33` : "1px solid transparent",
        borderRadius: 7,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: 3 }}>{label}</div>
    </div>
  );
}
