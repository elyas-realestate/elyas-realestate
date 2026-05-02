"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Power, ChevronRight, Loader2, AlertCircle, CheckCircle2,
  Bot, Crown, Activity, Clock, DollarSign, ShieldCheck,
  Calendar, Settings2, Pause, Play, Zap
} from "lucide-react";

type Tenant = {
  id: string;
  slug: string;
  system_master_active: boolean;
  daily_call_limit: number;
  daily_call_count: number;
  master_paused_reason: string | null;
  master_paused_at: string | null;
};

type Manager = {
  id: string;
  code: string;
  name: string;
  department: string;
  default_ai_provider: string;
  default_ai_model: string;
  is_active: boolean;
  tenant_enabled: boolean;
};

type Employee = {
  id: string;
  code: string;
  name: string;
  manager_id: string | null;
  manager_name: string | null;
  default_ai_provider: string;
  default_ai_model: string;
  is_active: boolean;
  tenant_enabled: boolean;
};

type ActivityRow = {
  id: string;
  actor_kind: string;
  actor_id: string | null;
  action: string;
  target_kind: string | null;
  details: any;
  created_at: string;
};

type Schedule = {
  time: string;
  cron: string;
  task: string;
  endpoint: string;
};

type StatusResp = {
  ok: boolean;
  tenant: Tenant;
  managers: Manager[];
  employees: Employee[];
  activity: ActivityRow[];
  reviews: any[];
  schedule: Schedule[];
  error?: string;
};

export default function OperationsPage() {
  const [data, setData] = useState<StatusResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitDraft, setLimitDraft] = useState(50);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/operations/status");
      const j = await res.json();
      setData(j);
      if (j?.tenant?.daily_call_limit) setLimitDraft(j.tenant.daily_call_limit);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleMaster(active: boolean) {
    setBusy("master");
    try {
      const reason = !active ? prompt("سبب الإيقاف (اختياري):") || undefined : undefined;
      await fetch("/api/admin/operations/master-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, reason }),
      });
      await load();
    } finally { setBusy(null); }
  }

  async function toggleTarget(kind: "manager" | "employee", code: string, current: boolean) {
    setBusy(`${kind}:${code}`);
    try {
      await fetch("/api/admin/operations/employee-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, code, enabled: !current }),
      });
      await load();
    } finally { setBusy(null); }
  }

  async function saveLimit() {
    setBusy("limit");
    try {
      await fetch("/api/admin/operations/limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_call_limit: limitDraft }),
      });
      setEditingLimit(false);
      await load();
    } finally { setBusy(null); }
  }

  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
      </div>
    );
  }

  if (!data?.ok || !data.tenant) {
    return (
      <div dir="rtl" className="rounded-xl p-6" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)" }}>
        <p style={{ color: "var(--danger)" }}>{data?.error || "فشل تحميل الحالة"}</p>
      </div>
    );
  }

  const t = data.tenant;
  const isOn = t.system_master_active;
  const usagePct = Math.min(100, Math.round((t.daily_call_count / Math.max(1, t.daily_call_limit)) * 100));
  const enabledEmployees = data.employees.filter(e => e.tenant_enabled).length;
  const enabledManagers = data.managers.filter(m => m.tenant_enabled).length;

  return (
    <div dir="rtl" className="space-y-6 max-w-6xl">
      <Link href="/dashboard/ceo" className="inline-flex items-center gap-1 text-xs no-underline" style={{ color: "var(--text-faint)" }}>
        <ChevronRight size={12} /> العودة للوحة CEO
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-strong)" }}>
          <ShieldCheck size={22} style={{ color: "var(--gold-2)" }} /> مركز التحكم التشغيلي
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          أنت المالك الكامل لتشغيل/إيقاف منظومة الموظفين الأذكياء. كل شي افتراضياً مطفّى لين تشغّله بنفسك.
        </p>
      </div>

      {/* ════════════ MASTER SWITCH ════════════ */}
      <div className="rounded-xl p-6" style={{
        background: isOn ? "var(--success-bg)" : "var(--bg-surface-1)",
        border: `2px solid ${isOn ? "var(--success)" : "var(--danger)"}`,
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{
              background: isOn ? "var(--success)" : "var(--danger)",
            }}>
              <Power size={28} style={{ color: "#fff" }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: "var(--text-strong)" }}>
                {isOn ? "🟢 النظام يعمل" : "🔴 النظام متوقف"}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                {isOn
                  ? "المدراء والموظفون النشطون يستطيعون الرد والعمل تلقائياً"
                  : t.master_paused_reason || "كل الكرونات والـ webhooks متوقفة — لن يستهلك أي رصيد"}
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleMaster(!isOn)}
            disabled={busy === "master"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm"
            style={{
              background: isOn ? "var(--danger)" : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: isOn ? "#fff" : "var(--bg-page)",
              border: "none",
              cursor: busy === "master" ? "wait" : "pointer",
            }}
          >
            {busy === "master" ? <Loader2 size={14} className="animate-spin" />
              : isOn ? <Pause size={14} /> : <Play size={14} />}
            {isOn ? "إيقاف النظام" : "تشغيل النظام"}
          </button>
        </div>

        {/* Usage meter */}
        <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--gold-bg)" }}>
          <div className="flex items-center justify-between text-xs mb-2" style={{ color: "var(--text-soft)" }}>
            <span>استدعاءات AI اليوم: <strong style={{ color: "var(--text-strong)" }}>{t.daily_call_count}</strong> / {t.daily_call_limit}</span>
            {!editingLimit ? (
              <button
                onClick={() => { setLimitDraft(t.daily_call_limit); setEditingLimit(true); }}
                className="inline-flex items-center gap-1 underline"
                style={{ color: "var(--gold-2)", background: "transparent", border: "none", cursor: "pointer" }}
              >
                <Settings2 size={11} /> تعديل الحد
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={limitDraft}
                  onChange={e => setLimitDraft(Number(e.target.value))}
                  className="w-20 rounded px-2 py-1 text-xs"
                  style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)", color: "var(--text-strong)" }}
                />
                <button onClick={saveLimit} disabled={busy === "limit"} className="text-xs px-2 py-1 rounded"
                  style={{ background: "var(--gold-2)", color: "var(--bg-page)", border: "none" }}>
                  حفظ
                </button>
                <button onClick={() => setEditingLimit(false)} className="text-xs px-2 py-1"
                  style={{ background: "transparent", color: "var(--text-faint)", border: "none" }}>
                  إلغاء
                </button>
              </div>
            )}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-surface-2)" }}>
            <div className="h-full transition-all" style={{
              width: `${usagePct}%`,
              background: usagePct > 80 ? "var(--danger)" : usagePct > 50 ? "var(--warning)" : "var(--success)",
            }} />
          </div>
          <div className="text-xs mt-2 flex items-center gap-2" style={{ color: "var(--text-faint)" }}>
            <Zap size={11} />
            لو وصلت {t.daily_call_limit} استدعاء، النظام يطفّي نفسه تلقائياً ويحميك من أي استهلاك إضافي.
          </div>
        </div>
      </div>

      {/* ════════════ STATS ════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Crown size={18} />} label="المدراء النشطون" value={`${enabledManagers}/${data.managers.length}`} />
        <StatCard icon={<Bot size={18} />}   label="الموظفون النشطون" value={`${enabledEmployees}/${data.employees.length}`} />
        <StatCard icon={<Activity size={18} />} label="نشاط اليوم" value={String(data.activity.filter(a => isToday(a.created_at)).length)} />
        <StatCard icon={<DollarSign size={18} />} label="استدعاءات الشهر" value={String(t.daily_call_count /* TODO: real monthly */)} />
      </div>

      {/* ════════════ MANAGERS ════════════ */}
      <Section title={`المدراء (${data.managers.length})`} icon={<Crown size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.managers.map(m => (
            <ToggleRow
              key={m.id}
              kind="manager"
              code={m.code}
              name={m.name}
              subtitle={`${m.department} • ${m.default_ai_provider}/${m.default_ai_model}`}
              enabled={m.tenant_enabled}
              busy={busy === `manager:${m.code}`}
              masterOff={!isOn}
              onToggle={() => toggleTarget("manager", m.code, m.tenant_enabled)}
            />
          ))}
        </div>
      </Section>

      {/* ════════════ EMPLOYEES ════════════ */}
      <Section title={`الموظفون (${data.employees.length})`} icon={<Bot size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.employees.map(e => (
            <ToggleRow
              key={e.id}
              kind="employee"
              code={e.code}
              name={e.name}
              subtitle={`${e.manager_name || "بدون مدير"} • ${e.default_ai_provider}/${e.default_ai_model}`}
              enabled={e.tenant_enabled}
              busy={busy === `employee:${e.code}`}
              masterOff={!isOn}
              onToggle={() => toggleTarget("employee", e.code, e.tenant_enabled)}
            />
          ))}
        </div>
      </Section>

      {/* ════════════ SCHEDULE ════════════ */}
      <Section title="جدول العمل" icon={<Calendar size={18} />}>
        <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>
          هذه الأوقات تُطبَّق فقط عندما يكون النظام مفعّلاً ✓ والموظف/المدير المعني مفعّلاً ✓.
        </p>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--gold-bg)" }}>
          {data.schedule.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs" style={{
              background: i % 2 === 0 ? "var(--bg-surface-1)" : "var(--bg-surface-2)",
              borderTop: i > 0 ? "1px solid var(--gold-bg)" : "none",
            }}>
              <div className="flex items-center gap-3">
                <Clock size={12} style={{ color: "var(--gold-2)" }} />
                <span style={{ color: "var(--text-soft)" }}>{s.time}</span>
              </div>
              <div style={{ color: "var(--text-strong)" }}>{s.task}</div>
              <code className="text-xs" style={{ color: "var(--text-faint)" }}>{s.cron}</code>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════════ ACTIVITY FEED ════════════ */}
      <Section title="سجل النشاط (آخر ٥٠)" icon={<Activity size={18} />}>
        {data.activity.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--text-faint)" }}>
            — لا يوجد نشاط بعد —
          </div>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {data.activity.map(a => (
              <ActivityItem key={a.id} row={a} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: "var(--gold-2)" }}>{icon}</div>
      <div className="text-xs" style={{ color: "var(--text-faint)" }}>{label}</div>
      <div className="text-xl font-bold mt-1" style={{ color: "var(--text-strong)" }}>{value}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--gold-2)" }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  kind, code, name, subtitle, enabled, busy, masterOff, onToggle,
}: {
  kind: string; code: string; name: string; subtitle: string;
  enabled: boolean; busy: boolean; masterOff: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg p-3" style={{
      background: enabled ? "var(--gold-bg)" : "var(--bg-surface-2)",
      border: `1px solid ${enabled ? "var(--gold-2)" : "var(--gold-bg-soft)"}`,
      opacity: masterOff ? 0.55 : 1,
    }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {enabled
            ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
            : <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-faint)" }} />}
          <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{name}</span>
        </div>
        <div className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{subtitle}</div>
      </div>
      <button
        onClick={onToggle}
        disabled={busy}
        className="px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
        style={{
          background: enabled ? "var(--danger-bg)" : "var(--gold-bg-hover)",
          color: enabled ? "var(--danger)" : "var(--gold-2)",
          border: `1px solid ${enabled ? "var(--danger)" : "var(--gold-2)"}`,
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {busy ? <Loader2 size={11} className="animate-spin" /> : enabled ? "إيقاف" : "تشغيل"}
      </button>
    </div>
  );
}

function ActivityItem({ row }: { row: ActivityRow }) {
  const time = new Date(row.created_at);
  const timeStr = time.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });

  const isError = row.action.includes("error") || row.action.includes("failed") || row.action.includes("skipped");
  const isSkip = row.action.includes("skipped") || row.details?.gated;

  return (
    <div className="flex items-start gap-3 rounded p-2 text-xs" style={{
      background: "var(--bg-surface-2)",
      border: `1px solid var(--gold-bg-soft)`,
    }}>
      <div className="shrink-0">
        {isError ? <AlertCircle size={13} style={{ color: isSkip ? "var(--warning)" : "var(--danger)" }} />
                : <CheckCircle2 size={13} style={{ color: "var(--success)" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold" style={{ color: "var(--text-strong)" }}>{row.action}</span>
          <span style={{ color: "var(--text-faint)" }}>• {row.actor_kind}</span>
        </div>
        {row.details && (
          <div className="mt-0.5 truncate" style={{ color: "var(--text-faint)" }}>
            {summarizeDetails(row.details)}
          </div>
        )}
      </div>
      <div className="shrink-0 text-end" style={{ color: "var(--text-faint)" }}>
        <div>{timeStr}</div>
        <div className="text-xs opacity-70">{dateStr}</div>
      </div>
    </div>
  );
}

function summarizeDetails(d: any): string {
  if (!d || typeof d !== "object") return "";
  if (d.reason) return `السبب: ${d.reason}`;
  if (d.code) return `${d.name || d.code}`;
  if (d.inserted) return `أنتج ${d.inserted} عنصر`;
  return Object.keys(d).slice(0, 3).map(k => `${k}: ${String(d[k]).slice(0, 40)}`).join(" • ");
}

function isToday(iso: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10) === today;
}
