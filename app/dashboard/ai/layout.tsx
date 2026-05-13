"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Power,
  Users,
  FlaskConical,
  Inbox,
  ShieldCheck,
  Plug,
  ChevronRight,
} from "lucide-react";

type StatusResp = {
  ok: boolean;
  tenant?: {
    system_master_active: boolean;
    daily_call_count: number;
    daily_call_limit: number;
  };
  managers?: Array<{ tenant_enabled: boolean }>;
  employees?: Array<{ tenant_enabled: boolean }>;
  outputs_count?: number;
};

type ApprovalsResp = {
  pending?: any[];
};

const REFRESH_EVENT = "ai-hub-refresh";

const TABS = [
  { id: "control", href: "/dashboard/ai/control", label: "التحكم", icon: Power },
  {
    id: "assistants",
    href: "/dashboard/ai/assistants",
    label: "المساعدون",
    icon: Users,
    showCount: true,
    countKey: "assistants",
  },
  { id: "test", href: "/dashboard/ai/test", label: "الاختبار", icon: FlaskConical },
  {
    id: "outputs",
    href: "/dashboard/ai/outputs",
    label: "المخرجات",
    icon: Inbox,
    showCount: true,
    countKey: "outputs",
  },
  {
    id: "approvals",
    href: "/dashboard/ai/approvals",
    label: "الموافقات",
    icon: ShieldCheck,
    showCount: true,
    countKey: "approvals",
  },
  { id: "providers", href: "/dashboard/ai/providers", label: "المزوّدون", icon: Plug },
];

export default function AILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [counts, setCounts] = useState({ assistants: 0, outputs: 0, approvals: 0 });
  const [loading, setLoading] = useState(true);

  // دالة جلب البيانات — قابلة لإعادة الاستدعاء
  async function fetchAll() {
    const [statusRes, apr] = await Promise.all([
      fetch("/api/admin/operations/status")
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/org/approvals")
        .then((r) => r.json())
        .catch(() => ({ pending: [] })),
    ]);
    setStatus(statusRes);
    setCounts({
      assistants: (statusRes?.employees?.length || 0) + (statusRes?.managers?.length || 0),
      outputs: statusRes?.outputs_count || 0,
      approvals: (apr as ApprovalsResp)?.pending?.length || 0,
    });
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    // استمع لأحداث التحديث من control page
    const handler = () => fetchAll();
    window.addEventListener(REFRESH_EVENT, handler);
    return () => window.removeEventListener(REFRESH_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const t = status?.tenant;
  const isOn = !!t?.system_master_active;
  const usagePct = t
    ? Math.min(100, Math.round((t.daily_call_count / Math.max(1, t.daily_call_limit)) * 100))
    : 0;
  const enabledAssistants =
    (status?.employees?.filter((e) => e.tenant_enabled).length || 0) +
    (status?.managers?.filter((m) => m.tenant_enabled).length || 0);

  return (
    <div dir="rtl" className="space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs no-underline"
        style={{ color: "var(--text-faint)" }}
      >
        <ChevronRight size={12} /> العودة للداشبورد
      </Link>

      <div>
        <h1
          className="flex items-center gap-2 text-2xl font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          <Sparkles size={22} style={{ color: "var(--gold-2)" }} /> الذكاء الصناعي
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
          مكان واحد لكل ما يخصّ مساعديك الأذكياء — تحكّم، تجربة، مراجعة، موافقات.
        </p>
      </div>

      {/* HERO STATS — Daily usage بارز كحلٍّ للسيناريو B */}
      <div
        className="grid grid-cols-2 gap-4 rounded-xl p-5 lg:grid-cols-4"
        style={{
          background: "linear-gradient(135deg, var(--gold-bg), var(--bg-surface-1))",
          border: "1px solid var(--gold-bg-hover)",
        }}
      >
        <HeroStat
          label="حالة النظام"
          value={loading ? null : isOn ? "🟢 يعمل" : "🔴 متوقف"}
          color={loading ? "var(--text-faint)" : isOn ? "var(--success)" : "var(--danger)"}
        />
        <HeroStat
          label="استدعاءات اليوم"
          value={loading ? null : t ? `${t.daily_call_count}/${t.daily_call_limit}` : "—"}
          color={
            usagePct > 80 ? "var(--danger)" : usagePct > 50 ? "var(--warning)" : "var(--success)"
          }
          progressPct={loading ? 0 : usagePct}
        />
        <HeroStat
          label="المساعدون النشطون"
          value={loading ? null : `${enabledAssistants}/${counts.assistants}`}
          color="var(--gold-2)"
        />
        <HeroStat
          label="الموافقات المعلَّقة"
          value={loading ? null : String(counts.approvals)}
          color={counts.approvals > 0 ? "var(--warning)" : "var(--text-faint)"}
        />
      </div>

      {/* TABS */}
      <div
        className="flex gap-1 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--gold-bg)" }}
      >
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          let count: number | null = null;
          if (tab.countKey === "assistants") count = enabledAssistants;
          else if (tab.countKey === "outputs") count = counts.outputs;
          else if (tab.countKey === "approvals") count = counts.approvals;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap no-underline transition"
              style={{
                color: isActive ? "var(--gold-2)" : "var(--text-soft)",
                borderBottom: `2px solid ${isActive ? "var(--gold-2)" : "transparent"}`,
                fontWeight: isActive ? 700 : 500,
              }}
            >
              <Icon size={14} />
              {tab.label}
              {tab.showCount && count !== null && count > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    background: isActive ? "var(--gold-2)" : "var(--bg-surface-2)",
                    color: isActive ? "var(--bg-page)" : "var(--text-soft)",
                    fontSize: 10,
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  color,
  progressPct,
}: {
  label: string;
  value: string | null;
  color: string;
  progressPct?: number;
}) {
  return (
    <div>
      <div className="mb-1 text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
      {value === null ? (
        // Skeleton أثناء التحميل
        <div
          style={{
            width: 80,
            height: 24,
            borderRadius: 4,
            background: "var(--bg-surface-2)",
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
      ) : (
        <div className="text-xl font-bold" style={{ color }}>
          {value}
        </div>
      )}
      {progressPct !== undefined && value !== null && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full"
          style={{ background: "var(--bg-surface-2)" }}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${progressPct}%`, background: color }}
          />
        </div>
      )}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
