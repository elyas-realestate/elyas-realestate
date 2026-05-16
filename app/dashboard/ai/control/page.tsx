"use client";

import { useEffect, useState } from "react";
import {
  Power,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Bot,
  Crown,
  Clock,
  Settings2,
  Pause,
  Play,
  Calendar,
  Activity,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// حدث مشترك بين control page والـ layout لتحديث الـ hero
const REFRESH_EVENT = "ai-hub-refresh";

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
  tenant_enabled: boolean;
};

type ActivityRow = {
  id: string;
  actor_kind: string;
  action: string;
  details: any;
  created_at: string;
};

type Schedule = { time: string; cron: string; task: string; endpoint: string };

type StatusResp = {
  ok: boolean;
  tenant: Tenant;
  managers: Manager[];
  employees: Employee[];
  activity: ActivityRow[];
  schedule: Schedule[];
  error?: string;
};

export default function ControlTab() {
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleMaster(active: boolean) {
    setBusy("master");
    try {
      const reason = !active ? prompt("سبب الإيقاف (اختياري):") || undefined : undefined;
      const res = await fetch("/api/admin/operations/master-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, reason }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        toast.error(j.error || "فشل تعديل النظام");
      } else {
        toast.success(active ? "✅ تم تشغيل النظام" : "🛑 تم إيقاف النظام");
        window.dispatchEvent(new Event(REFRESH_EVENT));
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || "خطأ غير متوقع");
    } finally {
      setBusy(null);
    }
  }

  async function toggleTarget(kind: "manager" | "employee", code: string, current: boolean) {
    setBusy(`${kind}:${code}`);
    try {
      const res = await fetch("/api/admin/operations/employee-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, code, enabled: !current }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        toast.error(j.error || "فشل تعديل المساعد");
      } else {
        const verb = !current ? "✅ تم تشغيل" : "🛑 تم إيقاف";
        toast.success(`${verb} ${j.target?.name || code}`);
        window.dispatchEvent(new Event(REFRESH_EVENT));
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || "خطأ غير متوقع");
    } finally {
      setBusy(null);
    }
  }

  async function saveLimit() {
    setBusy("limit");
    try {
      const res = await fetch("/api/admin/operations/limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_call_limit: limitDraft }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        toast.error(j.error || "فشل تحديث الحد");
      } else {
        toast.success(`✅ الحد اليومي الآن ${limitDraft}`);
        setEditingLimit(false);
        window.dispatchEvent(new Event(REFRESH_EVENT));
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || "خطأ غير متوقع");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
      </div>
    );
  }

  if (!data?.ok || !data.tenant) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)" }}
      >
        <p style={{ color: "var(--danger)" }}>{data?.error || "فشل تحميل الحالة"}</p>
      </div>
    );
  }

  const t = data.tenant;
  const isOn = t.system_master_active;
  const usagePct = Math.min(
    100,
    Math.round((t.daily_call_count / Math.max(1, t.daily_call_limit)) * 100)
  );

  return (
    <div className="space-y-5">
      {/* MASTER SWITCH */}
      <div
        className="rounded-xl p-5"
        style={{
          background: isOn ? "var(--success-bg)" : "var(--bg-surface-1)",
          border: `2px solid ${isOn ? "var(--success)" : "var(--danger)"}`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: isOn ? "var(--success)" : "var(--danger)",
              }}
            >
              <Power size={24} style={{ color: "#fff" }} />
            </div>
            <div>
              <div className="text-base font-bold" style={{ color: "var(--text-strong)" }}>
                {isOn ? "النظام يعمل" : "النظام متوقف"}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                {isOn
                  ? "المساعدون النشطون يستطيعون الرد والعمل"
                  : t.master_paused_reason || "كل الكرونات والـ webhooks متوقفة"}
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleMaster(!isOn)}
            disabled={busy === "master"}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold"
            style={{
              background: isOn
                ? "var(--danger)"
                : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: isOn ? "#fff" : "var(--bg-page)",
              border: "none",
              cursor: busy === "master" ? "wait" : "pointer",
            }}
          >
            {busy === "master" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isOn ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
            {isOn ? "إيقاف النظام" : "تشغيل النظام"}
          </button>
        </div>

        {/* Usage meter inline */}
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--gold-bg)" }}>
          <div
            className="mb-2 flex items-center justify-between text-xs"
            style={{ color: "var(--text-soft)" }}
          >
            <span>
              الحد اليومي:{" "}
              <strong style={{ color: "var(--text-strong)" }}>{t.daily_call_count}</strong> /{" "}
              {t.daily_call_limit}
            </span>
            {!editingLimit ? (
              <button
                onClick={() => {
                  setLimitDraft(t.daily_call_limit);
                  setEditingLimit(true);
                }}
                className="inline-flex items-center gap-1"
                style={{
                  color: "var(--gold-2)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Settings2 size={11} /> تعديل
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={limitDraft}
                  onChange={(e) => setLimitDraft(Number(e.target.value))}
                  className="w-20 rounded px-2 py-1 text-xs"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--gold-bg)",
                    color: "var(--text-strong)",
                  }}
                />
                <button
                  onClick={saveLimit}
                  disabled={busy === "limit"}
                  className="rounded px-2 py-1 text-xs"
                  style={{ background: "var(--gold-2)", color: "var(--bg-page)", border: "none" }}
                >
                  حفظ
                </button>
                <button
                  onClick={() => setEditingLimit(false)}
                  className="px-2 py-1 text-xs"
                  style={{ background: "transparent", color: "var(--text-faint)", border: "none" }}
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: "var(--bg-surface-2)" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${usagePct}%`,
                background:
                  usagePct > 80
                    ? "var(--danger)"
                    : usagePct > 50
                      ? "var(--warning)"
                      : "var(--success)",
              }}
            />
          </div>
        </div>
      </div>

      {/* MANAGERS */}
      <Section title={`المدراء (${data.managers.length})`} icon={<Crown size={16} />}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {data.managers.map((m) => (
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

      {/* EMPLOYEES */}
      <Section title={`المساعدون (${data.employees.length})`} icon={<Bot size={16} />}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {data.employees.map((e) => (
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

      {/* SCHEDULE + ACTIVITY */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="جدول العمل" icon={<Calendar size={16} />}>
          <div
            className="overflow-hidden rounded-lg"
            style={{ border: "1px solid var(--gold-bg)" }}
          >
            {data.schedule.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 text-xs"
                style={{
                  background: i % 2 === 0 ? "var(--bg-surface-1)" : "var(--bg-surface-2)",
                  borderTop: i > 0 ? "1px solid var(--gold-bg)" : "none",
                }}
              >
                <div className="flex items-center gap-2">
                  <Clock size={11} style={{ color: "var(--gold-2)" }} />
                  <span style={{ color: "var(--text-soft)" }}>{s.time}</span>
                </div>
                <div style={{ color: "var(--text-strong)" }}>{s.task}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="النشاط الأخير" icon={<Activity size={16} />}>
          {data.activity.length === 0 ? (
            <div className="py-6 text-center text-xs" style={{ color: "var(--text-faint)" }}>
              — لا يوجد نشاط بعد —
            </div>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {data.activity.slice(0, 15).map((a) => (
                <ActivityItem key={a.id} row={a} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
    >
      <h3
        className="mb-3 flex items-center gap-2 text-sm font-bold"
        style={{ color: "var(--gold-2)" }}
      >
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  kind,
  code,
  name,
  subtitle,
  enabled,
  busy,
  masterOff,
  onToggle,
}: {
  kind: string;
  code: string;
  name: string;
  subtitle: string;
  enabled: boolean;
  busy: boolean;
  masterOff: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg p-3"
      style={{
        background: enabled ? "var(--gold-bg)" : "var(--bg-surface-2)",
        border: `1px solid ${enabled ? "var(--gold-2)" : "var(--gold-bg-soft)"}`,
        opacity: masterOff ? 0.55 : 1,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: enabled ? "var(--success)" : "var(--text-faint)",
            }}
          />
          <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
            {name}
          </span>
        </div>
        <div className="truncate text-xs" style={{ color: "var(--text-faint)" }}>
          {subtitle}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href={`/dashboard/ai/test?employee=${code}`}
          title="جرّب الآن"
          className="flex items-center gap-1 rounded px-2 py-1.5 text-xs no-underline"
          style={{
            background: "var(--bg-surface-1)",
            color: "var(--gold-2)",
            border: "1px solid var(--gold-bg-hover)",
          }}
        >
          <FlaskConical size={11} /> جرّب
        </Link>
        <button
          onClick={onToggle}
          disabled={busy}
          className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold"
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
    </div>
  );
}

function ActivityItem({ row }: { row: ActivityRow }) {
  const time = new Date(row.created_at);
  const timeStr = time.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  const isError =
    row.action.includes("error") || row.action.includes("failed") || row.action.includes("skipped");
  return (
    <div
      className="flex items-start gap-2 rounded p-2 text-xs"
      style={{
        background: "var(--bg-surface-2)",
        border: `1px solid var(--gold-bg-soft)`,
      }}
    >
      {isError ? (
        <AlertCircle size={12} style={{ color: "var(--warning)" }} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={12} style={{ color: "var(--success)" }} className="mt-0.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-bold" style={{ color: "var(--text-strong)" }}>
          {row.action}
        </div>
        <div style={{ color: "var(--text-faint)" }}>{timeStr}</div>
      </div>
    </div>
  );
}
