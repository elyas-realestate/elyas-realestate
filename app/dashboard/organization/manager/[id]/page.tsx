"use client";
import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  DEPARTMENT_META,
  PROVIDER_LABELS,
  KB_CATEGORIES,
  TRIGGER_LABELS,
} from "@/lib/org-constants";
import { logger } from "@/lib/logger";
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Activity,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Bot,
  Cpu,
  Clock,
  Wand2,
} from "lucide-react";

type Manager = {
  id: string;
  code: string;
  name: string;
  department: string;
  description: string;
  default_ai_provider: string;
  default_ai_model: string;
};

type Employee = {
  id: string;
  code: string;
  name: string;
  description: string;
  default_ai_provider: string;
  default_ai_model: string;
  trigger_type?: string;
};

type Directive = {
  id: string;
  title: string;
  content: string;
  status: string;
  source: string;
  display_order: number;
  created_at: string;
};

type KBItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  created_at: string;
};

type Activity = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

type ManagerReview = {
  id: string;
  summary: string;
  highlights: { title: string; detail: string }[];
  concerns: { title: string; severity: "info" | "warning" | "critical"; detail: string }[];
  suggestions_count: number;
  metrics: Record<string, unknown>;
  period_end: string;
  created_at: string;
};

type Tab = "directives" | "knowledge" | "team" | "activity";

export default function ManagerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [manager, setManager] = useState<Manager | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [kb, setKB] = useState<KBItem[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [latestReview, setLatestReview] = useState<ManagerReview | null>(null);
  const [tab, setTab] = useState<Tab>("directives");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Modals
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);
  const [editingDirective, setEditingDirective] = useState<Directive | null>(null);
  const [showKBModal, setShowKBModal] = useState(false);
  const [editingKB, setEditingKB] = useState<KBItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: t } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      let tid = t?.id;
      if (!tid) {
        const { data: m } = await supabase
          .from("tenant_members")
          .select("tenant_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        tid = m?.tenant_id;
      }
      if (!tid) throw new Error("لم يُعثر على المستأجر");
      setTenantId(tid);

      const [mgrRes, empRes, dirRes, kbRes, actRes, revRes] = await Promise.all([
        supabase.from("ai_managers").select("*").eq("id", id).single(),
        supabase.from("ai_employees").select("*").eq("manager_id", id).order("display_order"),
        supabase
          .from("directives")
          .select("*")
          .eq("tenant_id", tid)
          .eq("target_kind", "manager")
          .eq("target_id", id)
          .order("display_order"),
        supabase
          .from("knowledge_base")
          .select("*")
          .eq("tenant_id", tid)
          .eq("target_kind", "manager")
          .eq("target_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("org_activity_log")
          .select("*")
          .eq("tenant_id", tid)
          .eq("actor_kind", "manager")
          .eq("actor_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("manager_reviews")
          .select("*")
          .eq("tenant_id", tid)
          .eq("manager_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (mgrRes.error) throw new Error(mgrRes.error.message);
      if (dirRes.error)
        logger.warn("[manager-page] directives fetch failed", { error: dirRes.error.message });
      if (kbRes.error)
        logger.warn("[manager-page] kb fetch failed", { error: kbRes.error.message });
      setManager(mgrRes.data as Manager);
      setEmployees((empRes.data || []) as Employee[]);
      setDirectives((dirRes.data || []) as Directive[]);
      setKB((kbRes.data || []) as KBItem[]);
      setActivity((actRes.data || []) as Activity[]);
      setLatestReview((revRes.data as ManagerReview | null) || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !manager) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Loader2
          size={28}
          style={{ color: "var(--purple-ai)", animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !manager) {
    return (
      <div
        style={{
          padding: 16,
          background: "rgba(239,68,68,0.07)",
          borderRadius: 10,
          color: "var(--danger)",
        }}
      >
        <AlertCircle size={14} style={{ display: "inline", marginInlineEnd: 8 }} />
        {error || "المدير غير موجود"}
      </div>
    );
  }

  const dept = DEPARTMENT_META[manager.department];
  const Icon = dept?.icon || Bot;

  return (
    <div>
      <Link
        href="/dashboard/organization"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          color: "var(--text-ghost)",
          marginBottom: 12,
        }}
      >
        <ArrowRight size={12} /> الهيكل التنظيمي
      </Link>

      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${dept?.color}15, transparent)`,
          border: `1px solid ${dept?.color}33`,
          borderRadius: 14,
          padding: 18,
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            background: dept?.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} style={{ color: dept?.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
            {manager.name}
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {manager.description}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-ghost)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Cpu size={11} />{" "}
            {PROVIDER_LABELS[manager.default_ai_provider] || manager.default_ai_provider}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-disabled)", direction: "ltr" }}>
            {manager.default_ai_model}
          </div>
        </div>
      </div>

      {/* Generate Suggestions for Team — banner */}
      {directives.length > 0 && employees.length > 0 && (
        <SuggestionsBanner
          managerId={id}
          managerName={manager.name}
          employeeCount={employees.length}
        />
      )}

      {/* Latest Manager Review (K-8) */}
      {latestReview && <LatestReviewCard review={latestReview} />}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 18,
          borderBottom: "1px solid var(--overlay-mid)",
          flexWrap: "wrap",
        }}
      >
        <TabButton
          active={tab === "directives"}
          onClick={() => setTab("directives")}
          icon={Sparkles}
          label="التوجيهات"
          badge={directives.length}
        />
        <TabButton
          active={tab === "knowledge"}
          onClick={() => setTab("knowledge")}
          icon={BookOpen}
          label="قاعدة المعرفة"
          badge={kb.length}
        />
        <TabButton
          active={tab === "team"}
          onClick={() => setTab("team")}
          icon={Users}
          label="الفريق"
          badge={employees.length}
        />
        <TabButton
          active={tab === "activity"}
          onClick={() => setTab("activity")}
          icon={Activity}
          label="النشاط"
        />
      </div>

      {/* Directives Tab */}
      {tab === "directives" && tenantId && (
        <DirectivesTab
          directives={directives}
          tenantId={tenantId}
          targetKind="manager"
          targetId={id}
          onAdd={() => {
            setEditingDirective(null);
            setShowDirectiveModal(true);
          }}
          onEdit={(d) => {
            setEditingDirective(d);
            setShowDirectiveModal(true);
          }}
          onChange={load}
        />
      )}

      {/* Knowledge Tab */}
      {tab === "knowledge" && tenantId && (
        <KnowledgeTab
          kb={kb}
          tenantId={tenantId}
          targetKind="manager"
          targetId={id}
          onAdd={() => {
            setEditingKB(null);
            setShowKBModal(true);
          }}
          onEdit={(k) => {
            setEditingKB(k);
            setShowKBModal(true);
          }}
          onChange={load}
        />
      )}

      {/* Team Tab */}
      {tab === "team" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {employees.map((emp) => (
            <Link
              key={emp.id}
              href={`/dashboard/organization/employee/${emp.id}`}
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--overlay-soft)",
                borderRadius: 11,
                padding: 14,
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(167,139,250,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={14} style={{ color: "var(--purple-ai)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-on-dark)" }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-disabled)", direction: "ltr" }}>
                    {emp.code}
                  </div>
                </div>
                <ChevronLeft size={12} style={{ color: "var(--text-disabled)" }} />
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                {emp.description.slice(0, 100)}...
              </p>
              <div style={{ display: "flex", gap: 6, fontSize: 10, color: "var(--text-ghost)" }}>
                <span
                  style={{ background: "var(--bg-surface-2)", padding: "2px 8px", borderRadius: 4 }}
                >
                  {PROVIDER_LABELS[emp.default_ai_provider]}
                </span>
                {emp.trigger_type && (
                  <span
                    style={{
                      background: "var(--bg-surface-2)",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    <Clock size={9} style={{ display: "inline", marginInlineEnd: 3 }} />
                    {TRIGGER_LABELS[emp.trigger_type] || emp.trigger_type}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activity.length === 0 ? (
            <div
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--overlay-soft)",
                borderRadius: 10,
                padding: 32,
                textAlign: "center",
                color: "var(--text-disabled)",
                fontSize: 13,
              }}
            >
              لا يوجد نشاط بعد — يبدأ الموظفون بتسجيل الإجراءات لما يشغّلون مهامهم
            </div>
          ) : (
            activity.map((a) => (
              <div
                key={a.id}
                style={{
                  background: "var(--bg-deep)",
                  border: "1px solid var(--overlay-soft)",
                  borderRadius: 9,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Activity size={12} style={{ color: "var(--purple-ai)", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>
                  {a.action}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-disabled)" }}>
                  {new Date(a.created_at).toLocaleString("ar-SA", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Directive Modal */}
      {showDirectiveModal && tenantId && (
        <DirectiveModal
          directive={editingDirective}
          tenantId={tenantId}
          targetKind="manager"
          targetId={id}
          onClose={() => setShowDirectiveModal(false)}
          onSave={async () => {
            await load();
            setShowDirectiveModal(false);
          }}
        />
      )}

      {/* KB Modal */}
      {showKBModal && tenantId && (
        <KBModal
          kbItem={editingKB}
          tenantId={tenantId}
          targetKind="manager"
          targetId={id}
          onClose={() => setShowKBModal(false)}
          onSave={async () => {
            await load();
            setShowKBModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Suggestions Banner — يوفّر زر توليد اقتراحات لكل الفريق
// ─────────────────────────────────────────────────────────────
type ResultRow = { employee_id: string; employee_name: string; inserted: number; error?: string };

function SuggestionsBanner({
  managerId,
  managerName,
  employeeCount,
}: {
  managerId: string;
  managerName: string;
  employeeCount: number;
}) {
  const [busy, setBusy] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [lastRun, setLastRun] = useState<{
    total: number;
    results: ResultRow[];
    error?: string;
  } | null>(null);

  async function generate() {
    if (
      !confirm(
        `توليد اقتراحات لـ ${employeeCount} موظفين تحت ${managerName}؟ يستغرق ~${employeeCount * 12} ثانية. ${replaceExisting ? "(سيستبدل المعلَّقة السابقة)" : "(سيُضاف للموجود)"}`
      )
    )
      return;
    setBusy(true);
    setLastRun(null);
    try {
      const res = await fetch("/api/org/suggest-directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager_id: managerId, replace_existing: replaceExisting }),
      });
      const text = await res.text();
      let json: {
        error?: string;
        total_suggestions?: number;
        employees_processed?: number;
        results?: ResultRow[];
      } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        const msg =
          json.error ||
          (res.status === 503
            ? "إعدادات الخادم ناقصة — تحقق من Vercel env vars"
            : `الخادم رجع ${res.status}`);
        throw new Error(msg);
      }
      const total = json.total_suggestions ?? 0;
      const rows = json.results ?? [];
      setLastRun({ total, results: rows });
      if (total > 0) {
        toast.success(`تم توليد ${total} اقتراح. راجعها في صفحات الموظفين.`);
      } else {
        toast.error("لم يتم توليد أي اقتراحات. شاهد التفاصيل أدناه.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ";
      toast.error(msg);
      setLastRun({ total: 0, results: [], error: msg });
    }
    setBusy(false);
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(232,184,109,0.08), rgba(198,145,76,0.04))",
        border: "1px solid rgba(232,184,109,0.25)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Wand2 size={20} style={{ color: "var(--gold-1)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-1)" }}>
            توليد اقتراحات للفريق ({employeeCount} موظفين)
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
            AI يحوّل توجيهات هذا المدير إلى ٣-٥ توجيهات تشغيلية لكل موظف، تظهر في صفحاتهم بحالة
            &quot;بانتظار مراجعتك&quot;.
          </div>
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            style={{ accentColor: "var(--gold-1)" }}
          />
          استبدال الاقتراحات السابقة
        </label>
        <button
          onClick={generate}
          disabled={busy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
            color: "var(--bg-page)",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "'Tajawal', sans-serif",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Wand2 size={13} />
          )}
          {busy ? "جاري التوليد..." : "ولّد الاقتراحات"}
        </button>
      </div>

      {/* Inline result panel */}
      {lastRun && !busy && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid rgba(232,184,109,0.20)",
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          {lastRun.error ? (
            <div style={{ color: "var(--danger)" }}>
              <strong>فشل التوليد:</strong> {lastRun.error}
            </div>
          ) : (
            <>
              <div
                style={{
                  marginBottom: 6,
                  color: lastRun.total > 0 ? "#86EFAC" : "var(--warning-2)",
                  fontWeight: 700,
                }}
              >
                نتيجة آخر تشغيل: {lastRun.total} اقتراح إجمالاً
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {lastRun.results.map((r) => (
                  <div
                    key={r.employee_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      borderRadius: 5,
                      background: r.error ? "rgba(248,113,113,0.05)" : "rgba(74,222,128,0.05)",
                      border: `1px solid ${r.error ? "rgba(248,113,113,0.20)" : "rgba(74,222,128,0.15)"}`,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: r.error ? "var(--danger)" : "#86EFAC" }}>
                      {r.employee_name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: r.error ? "var(--danger)" : "var(--text-muted)",
                      }}
                    >
                      {r.error ? `❌ ${r.error.slice(0, 80)}` : `✓ ${r.inserted} اقتراح`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab Button
// ─────────────────────────────────────────────────────────────
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sparkles;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        background: active ? "rgba(167,139,250,0.08)" : "transparent",
        border: "none",
        borderBottom: `2px solid ${active ? "var(--purple-ai)" : "transparent"}`,
        color: active ? "var(--purple-ai)" : "var(--text-muted)",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        fontFamily: "'Tajawal', sans-serif",
        marginBottom: -1,
      }}
    >
      <Icon size={13} /> {label}
      {typeof badge === "number" && (
        <span
          style={{
            fontSize: 10,
            background: active ? "var(--purple-ai)" : "#27272A",
            color: active ? "var(--bg-page)" : "var(--text-muted)",
            padding: "1px 6px",
            borderRadius: 8,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Directives Tab Content
// ─────────────────────────────────────────────────────────────
function DirectivesTab({
  directives,
  onAdd,
  onEdit,
  onChange,
}: {
  directives: Directive[];
  tenantId: string;
  targetKind: string;
  targetId: string;
  onAdd: () => void;
  onEdit: (d: Directive) => void;
  onChange: () => void;
}) {
  async function remove(id: string) {
    if (!confirm("حذف هذا التوجيه؟")) return;
    const { error } = await supabase.from("directives").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("حُذف");
      onChange();
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <p style={{ fontSize: 12, color: "var(--text-ghost)" }}>
          توجيهات هذا المدير الاستراتيجية. تُورَث تلقائياً للموظفين كاقتراحات.
        </p>
        <button
          onClick={onAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--purple-ai), var(--purple-2))",
            color: "var(--bg-page)",
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          <Plus size={13} /> توجيه جديد
        </button>
      </div>
      {directives.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="لا توجيهات بعد"
          hint="أضف توجيه استراتيجي يُوجِّه عمل المدير وفريقه"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {directives.map((d) => (
            <div
              key={d.id}
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--overlay-soft)",
                borderRadius: 11,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-on-dark)" }}>
                  {d.title}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(d)} style={iconBtn("var(--purple-ai)")}>
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => remove(d.id)} style={iconBtn("var(--danger)")}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {d.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Knowledge Tab
// ─────────────────────────────────────────────────────────────
function KnowledgeTab({
  kb,
  onAdd,
  onEdit,
  onChange,
}: {
  kb: KBItem[];
  tenantId: string;
  targetKind: string;
  targetId: string;
  onAdd: () => void;
  onEdit: (k: KBItem) => void;
  onChange: () => void;
}) {
  async function remove(id: string) {
    if (!confirm("حذف هذا العنصر من قاعدة المعرفة؟")) return;
    const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("حُذف");
      onChange();
    }
  }
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <p style={{ fontSize: 12, color: "var(--text-ghost)" }}>
          معلومات يستخدمها المدير وموظفوه عند الحاجة (FAQs, سياسات، بيانات سوق...).
        </p>
        <button
          onClick={onAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--info), var(--info-3))",
            color: "#fff",
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          <Plus size={13} /> عنصر معرفة
        </button>
      </div>
      {kb.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="قاعدة المعرفة فارغة"
          hint="أضف معلومات تساعد AI في فهم سياقك العقاري الخاص"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 10,
          }}
        >
          {kb.map((k) => (
            <div
              key={k.id}
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--overlay-soft)",
                borderRadius: 11,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--info)",
                    background: "rgba(96,165,250,0.1)",
                    padding: "2px 7px",
                    borderRadius: 4,
                  }}
                >
                  {KB_CATEGORIES[k.category] || k.category}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(k)} style={iconBtn("var(--purple-ai)")}>
                    <Edit3 size={11} />
                  </button>
                  <button onClick={() => remove(k.id)} style={iconBtn("var(--danger)")}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-on-dark)",
                  marginBottom: 6,
                }}
              >
                {k.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  maxHeight: 80,
                  overflow: "hidden",
                }}
              >
                {k.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modals + helpers
// ─────────────────────────────────────────────────────────────
function DirectiveModal({
  directive,
  tenantId,
  targetKind,
  targetId,
  onClose,
  onSave,
}: {
  directive: Directive | null;
  tenantId: string;
  targetKind: string;
  targetId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(directive?.title || "");
  const [content, setContent] = useState(directive?.content || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim()) {
      toast.error("العنوان والمحتوى مطلوبان");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (directive) {
        const { error } = await supabase
          .from("directives")
          .update({ title, content })
          .eq("id", directive.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("directives").insert({
          tenant_id: tenantId,
          target_kind: targetKind,
          target_id: targetId,
          title,
          content,
          source: "custom",
          status: "active",
          created_by: userData.user?.id,
        });
        if (error) throw new Error(error.message);
      }
      toast.success("حُفظ");
      onSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ");
    }
    setBusy(false);
  }

  return (
    <Modal title={directive ? "تعديل توجيه" : "توجيه جديد"} onClose={onClose}>
      <Field label="العنوان">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
          placeholder="مثلاً: نبرة الردود"
        />
      </Field>
      <Field label="المحتوى" hint="اكتب التوجيه بصياغة واضحة قابلة للتنفيذ">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          style={inputStyle}
          placeholder="مثلاً: استخدم العربية الفصحى دائماً، تجنّب الـ emojis، اختصر الردود لأقل من 80 كلمة..."
        />
      </Field>
      <ModalActions onClose={onClose} onSave={save} busy={busy} />
    </Modal>
  );
}

function KBModal({
  kbItem,
  tenantId,
  targetKind,
  targetId,
  onClose,
  onSave,
}: {
  kbItem: KBItem | null;
  tenantId: string;
  targetKind: string;
  targetId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(kbItem?.title || "");
  const [content, setContent] = useState(kbItem?.content || "");
  const [category, setCategory] = useState(kbItem?.category || "general");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim()) {
      toast.error("العنوان والمحتوى مطلوبان");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (kbItem) {
        const { error } = await supabase
          .from("knowledge_base")
          .update({ title, content, category })
          .eq("id", kbItem.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("knowledge_base").insert({
          tenant_id: tenantId,
          target_kind: targetKind,
          target_id: targetId,
          title,
          content,
          category,
          is_active: true,
          created_by: userData.user?.id,
        });
        if (error) throw new Error(error.message);
      }
      toast.success("حُفظ");
      onSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ");
    }
    setBusy(false);
  }

  return (
    <Modal title={kbItem ? "تعديل عنصر معرفة" : "عنصر معرفة جديد"} onClose={onClose}>
      <Field label="العنوان">
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="الفئة">
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          {Object.entries(KB_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="المحتوى">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          style={inputStyle}
        />
      </Field>
      <ModalActions onClose={onClose} onSave={save} busy={busy} />
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--modal-overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--bg-deep)",
          border: "1px solid var(--overlay-mid)",
          borderRadius: 14,
          padding: 22,
          maxWidth: 600,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-on-dark)" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-ghost)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onClose,
  onSave,
  busy,
}: {
  onClose: () => void;
  onSave: () => void;
  busy: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
      <button
        onClick={onClose}
        style={{
          padding: "10px 18px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.04)",
          color: "var(--text-muted)",
          border: "1px solid var(--overlay-mid)",
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        إلغاء
      </button>
      <button
        onClick={onSave}
        disabled={busy}
        style={{
          padding: "10px 22px",
          borderRadius: 8,
          background: "linear-gradient(135deg, var(--purple-ai), var(--purple-2))",
          color: "var(--bg-page)",
          border: "none",
          fontSize: 13,
          fontWeight: 700,
          cursor: busy ? "not-allowed" : "pointer",
          fontFamily: "'Tajawal', sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? (
          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Save size={13} />
        )}
        حفظ
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 10, color: "var(--text-disabled)", marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Sparkles;
  title: string;
  hint: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-deep)",
        border: "1px solid var(--overlay-soft)",
        borderRadius: 12,
        padding: 40,
        textAlign: "center",
      }}
    >
      <Icon size={32} style={{ color: "var(--border-1)", marginBottom: 10 }} />
      <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--text-ghost)" }}>{hint}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--bg-surface-2)",
  border: "1px solid var(--overlay-mid)",
  borderRadius: 8,
  color: "var(--text-on-dark)",
  fontSize: 13,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
};

function iconBtn(color: string): React.CSSProperties {
  return {
    background: `${color}10`,
    border: `1px solid ${color}30`,
    color,
    padding: 6,
    borderRadius: 6,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

// ─────────────────────────────────────────────────────────────
// K-8: بطاقة آخر مراجعة من المدير
// ─────────────────────────────────────────────────────────────
function LatestReviewCard({ review }: { review: ManagerReview }) {
  const [expanded, setExpanded] = useState(false);
  // eslint-disable-next-line react-hooks/purity
  const ageHours = Math.floor((Date.now() - new Date(review.created_at).getTime()) / 3600_000);
  const hasCritical = (review.concerns || []).some((c) => c.severity === "critical");
  const ageLabel = ageHours < 24 ? `قبل ${ageHours} ساعة` : `قبل ${Math.floor(ageHours / 24)} يوم`;

  return (
    <div
      style={{
        background: hasCritical ? "rgba(248,113,113,0.05)" : "rgba(96,165,250,0.05)",
        border: `1px solid ${hasCritical ? "rgba(248,113,113,0.25)" : "rgba(96,165,250,0.20)"}`,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Sparkles size={14} style={{ color: hasCritical ? "var(--danger)" : "var(--info)" }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: hasCritical ? "var(--danger)" : "var(--info)",
          }}
        >
          آخر مراجعة من المدير
        </span>
        <span style={{ fontSize: 10, color: "var(--text-ghost)" }}>· {ageLabel}</span>
        {review.suggestions_count > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(232,184,109,0.10)",
              color: "var(--gold-1)",
              fontWeight: 600,
            }}
          >
            {review.suggestions_count} اقتراح جديد
          </span>
        )}
        {hasCritical && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(248,113,113,0.15)",
              color: "var(--danger)",
              fontWeight: 700,
            }}
          >
            تنبيه حرج
          </span>
        )}
      </div>

      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "8px 0", lineHeight: 1.7 }}>
        {review.summary}
      </p>

      {expanded && (
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {review.highlights && review.highlights.length > 0 && (
            <div>
              <div
                style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", marginBottom: 4 }}
              >
                إنجازات
              </div>
              {review.highlights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    background: "rgba(74,222,128,0.06)",
                    border: "1px solid rgba(74,222,128,0.15)",
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#86EFAC" }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {h.detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          {review.concerns && review.concerns.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--warning-2)",
                  marginBottom: 4,
                }}
              >
                مخاوف
              </div>
              {review.concerns.map((c, i) => {
                const sevColor =
                  c.severity === "critical"
                    ? "var(--danger)"
                    : c.severity === "warning"
                      ? "var(--warning-2)"
                      : "var(--info)";
                return (
                  <div
                    key={i}
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      background: `${sevColor}10`,
                      border: `1px solid ${sevColor}30`,
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sevColor }}>
                        {c.title}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background: `${sevColor}20`,
                          color: sevColor,
                          fontWeight: 700,
                        }}
                      >
                        {c.severity === "critical"
                          ? "حرج"
                          : c.severity === "warning"
                            ? "تحذير"
                            : "معلومة"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {c.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {review.suggestions_count > 0 && (
            <div
              style={{
                padding: 8,
                borderRadius: 6,
                background: "rgba(232,184,109,0.06)",
                border: "1px solid rgba(232,184,109,0.18)",
                fontSize: 11,
                color: "var(--gold-1)",
              }}
            >
              ولّد المدير {review.suggestions_count} اقتراح توجيه جديد لفريقك. تجدها في صفحات
              الموظفين تحت قسم &quot;الاقتراحات&quot;.
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          marginTop: 8,
          padding: "4px 10px",
          borderRadius: 5,
          background: "transparent",
          border: "1px solid var(--overlay-mid)",
          color: "var(--text-muted)",
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
      </button>
    </div>
  );
}
