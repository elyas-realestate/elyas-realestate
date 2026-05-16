"use client";

import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Target,
  Layers,
  Swords,
  ShieldAlert,
  TrendingUp,
  Calendar,
  Rocket,
  Flame,
} from "lucide-react";
import {
  PROJECT_META,
  PHASES,
  COMPETITORS,
  LAUNCH_READINESS,
  STRENGTHS,
  WEAKNESSES,
  OPPORTUNITIES,
  THREATS,
  ACTIVE_RISKS,
  TOP_PRIORITIES,
  phaseCompletionPct,
  overallCompletionPct,
  readinessPct,
  blockingGaps,
  daysSinceStart,
  daysToBeta,
  currentPositionSummary,
  type Phase,
  type ReadinessItem,
  type Risk,
} from "@/lib/project-status";

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  done: { bg: "var(--success-bg)", fg: "var(--success)", label: "مكتمل" },
  in_progress: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "قيد العمل" },
  pending: { bg: "var(--bg-surface-2)", fg: "var(--text-faint)", label: "في الانتظار" },
  blocked: { bg: "var(--danger-bg)", fg: "var(--danger)", label: "متوقّف" },
};

export default function ProjectTrackerPage() {
  const overall = overallCompletionPct();
  const readyBlocking = readinessPct(true);
  const readyAll = readinessPct(false);
  const gaps = blockingGaps();
  const daysIn = daysSinceStart();
  const daysBeta = daysToBeta();
  const summary = currentPositionSummary();

  return (
    <div dir="rtl" className="max-w-6xl space-y-6">
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
          <Briefcase size={22} style={{ color: "var(--gold-2)" }} /> تتبّع المشروع —{" "}
          {PROJECT_META.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
          {PROJECT_META.tagline} • مالك: {PROJECT_META.ownerName}
        </p>
      </div>

      {/* أين أنا الآن؟ */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "linear-gradient(135deg, var(--gold-bg), var(--bg-surface-1))",
          border: "1px solid var(--gold-2)",
        }}
      >
        <div className="mb-2 text-xs" style={{ color: "var(--gold-2)" }}>
          أين أنا الآن؟
        </div>
        <div
          className="text-base leading-relaxed font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          {summary}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<Layers size={18} />}
          label="إنجاز تقني"
          value={`${overall}%`}
          sub={`${PHASES.flatMap((p) => p.milestones).filter((m) => m.status === "done").length} من ${PHASES.flatMap((p) => p.milestones).length} milestone`}
          accent="var(--success)"
        />
        <Stat
          icon={<Rocket size={18} />}
          label="جاهزية الإطلاق"
          value={`${readyBlocking}%`}
          sub={`${gaps.length} عنصر بلوكر متبقّي`}
          accent={
            readyBlocking >= 80
              ? "var(--success)"
              : readyBlocking >= 50
                ? "var(--warning)"
                : "var(--danger)"
          }
        />
        <Stat
          icon={<Calendar size={18} />}
          label="أيام منذ البداية"
          value={String(daysIn)}
          sub={PROJECT_META.startedAt}
          accent="var(--info, #5b9bf6)"
        />
        <Stat
          icon={<Target size={18} />}
          label="إلى موعد Beta"
          value={daysBeta > 0 ? `${daysBeta} يوم` : `متأخر ${Math.abs(daysBeta)} يوم`}
          sub={PROJECT_META.targetBetaLaunch}
          accent={
            daysBeta > 14 ? "var(--success)" : daysBeta > 0 ? "var(--warning)" : "var(--danger)"
          }
        />
      </div>

      {/* المراحل */}
      <Section title="المراحل" icon={<Layers size={18} />}>
        <div className="space-y-2">
          {PHASES.map((p) => (
            <PhaseRow key={p.id} phase={p} />
          ))}
        </div>
      </Section>

      {/* الأولويات الإستراتيجية */}
      <Section title="الأولويات الإستراتيجية الحالية" icon={<Flame size={18} />}>
        <div className="space-y-2">
          {TOP_PRIORITIES.map((p) => (
            <div
              key={p.id}
              className="rounded-lg p-3"
              style={{
                background: p.rank <= 3 ? "var(--danger-bg)" : "var(--bg-surface-2)",
                border: `1px solid ${p.rank <= 3 ? "var(--danger)" : "var(--gold-bg)"}`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: p.rank <= 3 ? "var(--danger)" : "var(--gold-2)",
                    color: "#fff",
                  }}
                >
                  {p.rank}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                    {p.title}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--text-soft)" }}>
                    {p.why}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span
                      className="rounded px-2 py-0.5"
                      style={{ background: "var(--bg-surface-1)", color: "var(--text-faint)" }}
                    >
                      ⏱ {p.effort}
                    </span>
                    <span
                      className="rounded px-2 py-0.5"
                      style={{ background: "var(--bg-surface-1)", color: "var(--text-faint)" }}
                    >
                      🎯 {p.impact}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* البلوكرات المتبقّية */}
      {gaps.length > 0 && (
        <Section
          title={`البلوكرات قبل الإطلاق (${gaps.length})`}
          icon={<ShieldAlert size={18} />}
          accent="var(--danger)"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {gaps.map((g) => (
              <div
                key={g.id}
                className="flex items-start gap-2 rounded-lg p-3"
                style={{
                  background: "var(--danger-bg)",
                  border: "1px solid var(--danger)",
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: "var(--danger)" }}
                  className="mt-0.5 shrink-0"
                />
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                    {g.label}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                    {g.category} {g.note ? `• ${g.note}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* جاهزية الإطلاق */}
      <Section
        title={`قائمة جاهزية الإطلاق (${readyAll}% الكلي / ${readyBlocking}% الحرج)`}
        icon={<Rocket size={18} />}
      >
        <ReadinessGrid items={LAUNCH_READINESS} />
      </Section>

      {/* المخاطر */}
      <Section title="المخاطر النشطة" icon={<AlertTriangle size={18} />} accent="var(--warning)">
        <div className="space-y-2">
          {ACTIVE_RISKS.map((r) => (
            <RiskRow key={r.id} risk={r} />
          ))}
        </div>
      </Section>

      {/* SWOT */}
      <Section title="تحليل SWOT" icon={<TrendingUp size={18} />}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SwotPanel title="نقاط القوة" items={STRENGTHS} color="var(--success)" emoji="💪" />
          <SwotPanel title="نقاط الضعف" items={WEAKNESSES} color="var(--danger)" emoji="⚠️" />
          <SwotPanel title="الفرص" items={OPPORTUNITIES} color="var(--info, #5b9bf6)" emoji="🚀" />
          <SwotPanel title="التهديدات" items={THREATS} color="var(--warning)" emoji="🛡️" />
        </div>
      </Section>

      {/* المنافسون */}
      <Section title="التحليل التنافسي" icon={<Swords size={18} />}>
        <div className="space-y-3">
          {COMPETITORS.map((c) => (
            <div
              key={c.name}
              className="rounded-lg p-4"
              style={{
                background: "var(--bg-surface-2)",
                border: "1px solid var(--gold-bg)",
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-bold" style={{ color: "var(--text-strong)" }}>
                  {c.name}
                </h4>
                <span
                  className="rounded px-2 py-0.5 text-xs"
                  style={{ background: "var(--bg-surface-1)", color: "var(--text-soft)" }}
                >
                  {c.positioning}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                <div>
                  <div className="mb-1 font-bold" style={{ color: "var(--success)" }}>
                    قوّتهم
                  </div>
                  <ul className="space-y-1" style={{ color: "var(--text-soft)" }}>
                    {c.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-1 font-bold" style={{ color: "var(--danger)" }}>
                    ضعفهم
                  </div>
                  <ul className="space-y-1" style={{ color: "var(--text-soft)" }}>
                    {c.weaknesses.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-1 font-bold" style={{ color: "var(--gold-2)" }}>
                    ميزتنا
                  </div>
                  <p style={{ color: "var(--text-soft)" }}>{c.ourEdge}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div
        className="rounded-lg p-4 text-xs"
        style={{
          background: "var(--bg-surface-2)",
          border: "1px dashed var(--gold-bg)",
          color: "var(--text-faint)",
        }}
      >
        💡 لتحديث هذا الداشبورد: عدّل <code>lib/project-status.ts</code> ثم اعمل push. البيانات
        typed وتُعكَس فوراً.
      </div>
    </div>
  );
}

// ════════════ Components ════════════

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
    >
      <div className="mb-1 flex items-center gap-2 text-xs" style={{ color: accent }}>
        {icon} {label}
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
        {value}
      </div>
      <div className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
        {sub}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
    >
      <h3
        className="mb-3 flex items-center gap-2 text-sm font-bold"
        style={{ color: accent || "var(--gold-2)" }}
      >
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function PhaseRow({ phase }: { phase: Phase }) {
  const pct = phaseCompletionPct(phase);
  const c = STATUS_COLORS[phase.status];

  return (
    <details
      className="rounded-lg"
      style={{
        background: "var(--bg-surface-2)",
        border: `1px solid ${phase.status === "done" ? "var(--success)" : phase.status === "in_progress" ? "var(--warning)" : "var(--gold-bg-soft)"}`,
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {phase.status === "done" ? (
              <CheckCircle2 size={14} style={{ color: "var(--success)" }} />
            ) : phase.status === "in_progress" ? (
              <Clock size={14} style={{ color: "var(--warning)" }} />
            ) : (
              <Circle size={14} style={{ color: "var(--text-faint)" }} />
            )}
            <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
              {phase.name}
            </span>
            <span className="rounded px-2 py-0.5 text-xs" style={{ background: c.bg, color: c.fg }}>
              {c.label}
            </span>
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
            {phase.description}
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full"
            style={{ background: "var(--bg-surface-1)" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${pct}%`,
                background:
                  phase.status === "done"
                    ? "var(--success)"
                    : phase.status === "in_progress"
                      ? "var(--warning)"
                      : "var(--gold-bg-hover)",
              }}
            />
          </div>
        </div>
        <div className="text-xs font-bold" style={{ color: c.fg }}>
          {pct}%
        </div>
      </summary>
      <div className="space-y-1 px-3 pb-3">
        {phase.milestones.map((m) => (
          <div
            key={m.code}
            className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
            style={{
              background: "var(--bg-surface-1)",
              color: "var(--text-soft)",
            }}
          >
            {m.status === "done" ? (
              <CheckCircle2 size={11} style={{ color: "var(--success)" }} />
            ) : m.status === "in_progress" ? (
              <Clock size={11} style={{ color: "var(--warning)" }} />
            ) : (
              <Circle size={11} style={{ color: "var(--text-faint)" }} />
            )}
            <span style={{ fontFamily: "monospace", color: "var(--text-faint)", fontSize: 10 }}>
              {m.code}
            </span>
            <span>{m.name}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

function ReadinessGrid({ items }: { items: ReadinessItem[] }) {
  const byCategory = items.reduce<Record<string, ReadinessItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(byCategory).map(([cat, list]) => (
        <div key={cat}>
          <div className="mb-1.5 text-xs font-bold" style={{ color: "var(--text-soft)" }}>
            {cat}
          </div>
          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {list.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
                style={{
                  background: it.done
                    ? "var(--success-bg)"
                    : it.blocking
                      ? "var(--danger-bg)"
                      : "var(--bg-surface-2)",
                  border: `1px solid ${it.done ? "var(--success)" : it.blocking ? "var(--danger)" : "var(--gold-bg-soft)"}`,
                }}
              >
                {it.done ? (
                  <CheckCircle2 size={12} style={{ color: "var(--success)" }} />
                ) : (
                  <Circle
                    size={12}
                    style={{ color: it.blocking ? "var(--danger)" : "var(--text-faint)" }}
                  />
                )}
                <span style={{ color: "var(--text-strong)" }}>{it.label}</span>
                {it.blocking && !it.done && (
                  <span
                    className="ms-auto rounded px-1.5 py-0.5 text-xs"
                    style={{ background: "var(--danger)", color: "#fff", fontSize: 9 }}
                  >
                    BLOCKER
                  </span>
                )}
                {it.note && (
                  <span className="ms-auto text-xs" style={{ color: "var(--text-faint)" }}>
                    {it.note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RiskRow({ risk }: { risk: Risk }) {
  const sevColor =
    risk.severity === "high"
      ? "var(--danger)"
      : risk.severity === "medium"
        ? "var(--warning)"
        : "var(--info, #5b9bf6)";
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "var(--bg-surface-2)",
        borderRight: `3px solid ${sevColor}`,
        border: "1px solid var(--gold-bg-soft)",
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="rounded px-2 py-0.5 text-xs font-bold"
          style={{ background: sevColor, color: "#fff", textTransform: "uppercase" }}
        >
          {risk.severity === "high" ? "عالي" : risk.severity === "medium" ? "متوسط" : "منخفض"}
        </span>
        <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
          {risk.title}
        </span>
      </div>
      <div className="mt-1 text-xs" style={{ color: "var(--text-soft)" }}>
        <strong>الأثر:</strong> {risk.impact}
      </div>
      <div className="mt-1 text-xs" style={{ color: "var(--success)" }}>
        <strong>التخفيف:</strong> {risk.mitigation}
      </div>
    </div>
  );
}

function SwotPanel({
  title,
  items,
  color,
  emoji,
}: {
  title: string;
  items: { text: string; weight: number }[];
  color: string;
  emoji: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "var(--bg-surface-2)", border: `1px solid ${color}30` }}
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color }}>
        <span>{emoji}</span> {title}
      </div>
      <ul className="space-y-1.5 text-xs">
        {items
          .sort((a, b) => b.weight - a.weight)
          .map((item, i) => (
            <li key={i} className="flex items-start gap-2" style={{ color: "var(--text-soft)" }}>
              <span
                style={{ color, opacity: item.weight === 3 ? 1 : item.weight === 2 ? 0.7 : 0.5 }}
              >
                {item.weight === 3 ? "●●●" : item.weight === 2 ? "●●" : "●"}
              </span>
              <span>{item.text}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
