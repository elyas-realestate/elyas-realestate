"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sparkles, Power, Users, FlaskConical, Inbox, ShieldCheck, Plug, ChevronRight
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
};

type ApprovalsResp = {
  pending?: any[];
};

type QueueResp = {
  total?: number;
};

const TABS = [
  { id: "control",    href: "/dashboard/ai/control",    label: "التحكم",    icon: Power },
  { id: "assistants", href: "/dashboard/ai/assistants", label: "المساعدون", icon: Users, showCount: true, countKey: "assistants" },
  { id: "test",       href: "/dashboard/ai/test",       label: "الاختبار",  icon: FlaskConical },
  { id: "outputs",    href: "/dashboard/ai/outputs",    label: "المخرجات",  icon: Inbox, showCount: true, countKey: "outputs" },
  { id: "approvals",  href: "/dashboard/ai/approvals",  label: "الموافقات", icon: ShieldCheck, showCount: true, countKey: "approvals" },
  { id: "providers",  href: "/dashboard/ai/providers",  label: "المزوّدون", icon: Plug },
];

export default function AILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [counts, setCounts] = useState({ assistants: 0, outputs: 0, approvals: 0 });

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/admin/operations/status").then(r => r.json()).catch(() => null),
      fetch("/api/org/approvals").then(r => r.json()).catch(() => ({ pending: [] })),
      fetch("/api/marketing/queue?status=pending&count=true").then(r => r.json()).catch(() => ({ total: 0 })),
    ]).then(([statusRes, apr, queue]: [StatusResp, ApprovalsResp, QueueResp]) => {
      if (!alive) return;
      setStatus(statusRes);
      setCounts({
        assistants: (statusRes?.employees?.length || 0) + (statusRes?.managers?.length || 0),
        outputs: queue?.total || 0,
        approvals: apr?.pending?.length || 0,
      });
    });
    return () => { alive = false; };
  }, [pathname]);

  const t = status?.tenant;
  const isOn = !!t?.system_master_active;
  const usagePct = t ? Math.min(100, Math.round((t.daily_call_count / Math.max(1, t.daily_call_limit)) * 100)) : 0;
  const enabledAssistants = (status?.employees?.filter(e => e.tenant_enabled).length || 0)
                           + (status?.managers?.filter(m => m.tenant_enabled).length || 0);

  return (
    <div dir="rtl" className="space-y-5">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs no-underline" style={{ color: "var(--text-faint)" }}>
        <ChevronRight size={12} /> العودة للداشبورد
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-strong)" }}>
          <Sparkles size={22} style={{ color: "var(--gold-2)" }} /> الذكاء الصناعي
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          مكان واحد لكل ما يخصّ مساعديك الأذكياء — تحكّم، تجربة، مراجعة، موافقات.
        </p>
      </div>

      {/* HERO STATS — Daily usage بارز كحلٍّ للسيناريو B */}
      <div className="rounded-xl p-5 grid grid-cols-2 lg:grid-cols-4 gap-4" style={{
        background: "linear-gradient(135deg, var(--gold-bg), var(--bg-surface-1))",
        border: "1px solid var(--gold-bg-hover)",
      }}>
        <HeroStat
          label="حالة النظام"
          value={isOn ? "🟢 يعمل" : "🔴 متوقف"}
          color={isOn ? "var(--success)" : "var(--danger)"}
        />
        <HeroStat
          label="استدعاءات اليوم"
          value={t ? `${t.daily_call_count}/${t.daily_call_limit}` : "—"}
          color={usagePct > 80 ? "var(--danger)" : usagePct > 50 ? "var(--warning)" : "var(--success)"}
          progressPct={usagePct}
        />
        <HeroStat
          label="المساعدون النشطون"
          value={`${enabledAssistants}/${counts.assistants}`}
          color="var(--gold-2)"
        />
        <HeroStat
          label="الموافقات المعلَّقة"
          value={String(counts.approvals)}
          color={counts.approvals > 0 ? "var(--warning)" : "var(--text-faint)"}
        />
      </div>

      {/* TABS */}
      <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--gold-bg)" }}>
        {TABS.map(tab => {
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
              className="flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition no-underline"
              style={{
                color: isActive ? "var(--gold-2)" : "var(--text-soft)",
                borderBottom: `2px solid ${isActive ? "var(--gold-2)" : "transparent"}`,
                fontWeight: isActive ? 700 : 500,
              }}
            >
              <Icon size={14} />
              {tab.label}
              {tab.showCount && count !== null && count > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                  background: isActive ? "var(--gold-2)" : "var(--bg-surface-2)",
                  color: isActive ? "var(--bg-page)" : "var(--text-soft)",
                  fontSize: 10,
                }}>{count}</span>
              )}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}

function HeroStat({ label, value, color, progressPct }: { label: string; value: string; color: string; progressPct?: number }) {
  return (
    <div>
      <div className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      {progressPct !== undefined && (
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-surface-2)" }}>
          <div className="h-full transition-all" style={{ width: `${progressPct}%`, background: color }} />
        </div>
      )}
    </div>
  );
}
