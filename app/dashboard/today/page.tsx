"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import {
  CheckSquare,
  Inbox,
  MessageCircle,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Plus,
} from "lucide-react";
import HelpHint from "@/app/components/HelpHint";

// "صفحة يومي" — موحَّدة من ٤ مصادر:
// ١. المهام (tasks)
// ٢. صفقات قيد التفاوض (deals)
// ٣. متابعات العملاء الباردين (followups)
// ٤. طلبات العقار الجديدة (property_requests)
//
// الفلسفة: ماذا أفعل اليوم؟ — كل شي يحتاج إجراء في مكان واحد.

export default function TodayPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tasks_pending: 0,
    deals_active: 0,
    cold_clients: 0,
    new_requests: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deals, setDeals] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [followups, setFollowups] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [tasksRes, dealsRes, fuRes, reqRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, status, priority, due_date, related_to")
          .neq("status", "مكتمل")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(8),
        supabase
          .from("deals")
          .select("id, title, stage, amount, client_name")
          .neq("stage", "مغلقة - فوز")
          .neq("stage", "مغلقة - خسارة")
          .order("updated_at", { ascending: false })
          .limit(8),
        supabase
          .from("followup_queue")
          .select("id, message, client_id, status, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("property_requests")
          .select("id, full_name, request_type, city, district, created_at")
          .eq("status", "جديد")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      setTasks(tasksRes.data || []);
      setDeals(dealsRes.data || []);
      setFollowups(fuRes.data || []);
      setRequests(reqRes.data || []);

      setStats({
        tasks_pending: tasksRes.data?.length || 0,
        deals_active: dealsRes.data?.length || 0,
        cold_clients: fuRes.data?.length || 0,
        new_requests: reqRes.data?.length || 0,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
      </div>
    );
  }

  const totalActions =
    stats.tasks_pending + stats.deals_active + stats.cold_clients + stats.new_requests;

  return (
    <div dir="rtl" className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="flex items-center gap-2 text-2xl font-bold"
            style={{ color: "var(--text-strong)" }}
          >
            <CheckSquare size={22} style={{ color: "var(--gold-2)" }} /> يومي
            <HelpHint
              title="صفحة يومي"
              body="هنا تجد كل ما يحتاج إجراء منك اليوم: مهامك، صفقات قيد التفاوض، عملاء يحتاجون متابعة، ورسائل WhatsApp غير مقروءة. أربعة مصادر في صفحة واحدة."
              helpUrl="/dashboard/help#today"
              size="sm"
            />
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
            {totalActions === 0
              ? "ما في شي ينتظر الآن. وقت ممتاز لإضافة عقار أو عميل جديد."
              : `لديك ${totalActions} عنصر يحتاج إجراء اليوم.`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<CheckSquare size={18} />}
          label="مهام معلَّقة"
          value={stats.tasks_pending}
          color="var(--gold-2)"
        />
        <Stat
          icon={<TrendingUp size={18} />}
          label="صفقات نشطة"
          value={stats.deals_active}
          color="var(--success)"
        />
        <Stat
          icon={<MessageCircle size={18} />}
          label="عملاء باردون"
          value={stats.cold_clients}
          color="var(--info, #3B82F6)"
        />
        <Stat
          icon={<Inbox size={18} />}
          label="طلبات جديدة"
          value={stats.new_requests}
          color="var(--warning)"
        />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tasks */}
        <Section
          title="مهامي"
          icon={<CheckSquare size={16} />}
          count={stats.tasks_pending}
          href="/dashboard/tasks"
          empty="لا توجد مهام معلَّقة"
        >
          {tasks.map((t) => (
            <RowItem
              key={t.id}
              title={t.title}
              subtitle={
                t.due_date ? new Date(t.due_date).toLocaleDateString("ar-SA") : "بدون تاريخ"
              }
              accent={
                t.priority === "عالية"
                  ? "var(--danger)"
                  : t.priority === "متوسطة"
                    ? "var(--warning)"
                    : "var(--text-faint)"
              }
              href={`/dashboard/tasks#${t.id}`}
              icon={t.priority === "عالية" ? <AlertTriangle size={12} /> : <Clock size={12} />}
            />
          ))}
        </Section>

        {/* Deals */}
        <Section
          title="صفقات قيد التفاوض"
          icon={<TrendingUp size={16} />}
          count={stats.deals_active}
          href="/dashboard/deals"
          empty="لا توجد صفقات نشطة"
        >
          {deals.map((d) => (
            <RowItem
              key={d.id}
              title={d.title || d.client_name || "صفقة"}
              subtitle={`${d.stage}${d.amount ? ` — ${Number(d.amount).toLocaleString("en-US")} ر.س` : ""}`}
              accent="var(--success)"
              href={`/dashboard/deals#${d.id}`}
              icon={<TrendingUp size={12} />}
            />
          ))}
        </Section>

        {/* Followups */}
        <Section
          title="عملاء يحتاجون متابعة"
          icon={<MessageCircle size={16} />}
          count={stats.cold_clients}
          href="/dashboard/clients/followups"
          empty="لا يوجد عملاء بانتظار رسائل"
        >
          {followups.map((f) => (
            <RowItem
              key={f.id}
              title={f.message?.slice(0, 60) || "متابعة"}
              subtitle={new Date(f.created_at).toLocaleDateString("ar-SA")}
              accent="var(--info, #3B82F6)"
              href="/dashboard/clients/followups"
              icon={<MessageCircle size={12} />}
            />
          ))}
        </Section>

        {/* Requests */}
        <Section
          title="طلبات عقار جديدة"
          icon={<Inbox size={16} />}
          count={stats.new_requests}
          href="/dashboard/requests"
          empty="لا طلبات جديدة"
        >
          {requests.map((r) => (
            <RowItem
              key={r.id}
              title={r.full_name}
              subtitle={`${r.request_type || "—"} — ${r.district || r.city || ""}`}
              accent="var(--warning)"
              href={`/dashboard/requests#${r.id}`}
              icon={<Inbox size={12} />}
            />
          ))}
        </Section>
      </div>

      {/* Quick actions */}
      <div
        className="flex flex-wrap gap-2 rounded-xl p-4"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <span className="text-sm font-bold" style={{ color: "var(--text-soft)" }}>
          اختصارات سريعة:
        </span>
        <Link
          href="/dashboard/tasks"
          className="rounded-full px-3 py-1.5 text-xs no-underline"
          style={btnStyle()}
        >
          <Plus size={11} className="ms-1 inline" /> مهمة
        </Link>
        <Link
          href="/dashboard/clients"
          className="rounded-full px-3 py-1.5 text-xs no-underline"
          style={btnStyle()}
        >
          <Plus size={11} className="ms-1 inline" /> عميل
        </Link>
        <Link
          href="/dashboard/properties/add"
          className="rounded-full px-3 py-1.5 text-xs no-underline"
          style={btnStyle()}
        >
          <Plus size={11} className="ms-1 inline" /> عقار
        </Link>
        <Link
          href="/dashboard/deals"
          className="rounded-full px-3 py-1.5 text-xs no-underline"
          style={btnStyle()}
        >
          <Plus size={11} className="ms-1 inline" /> صفقة
        </Link>
      </div>
    </div>
  );
}

function btnStyle(): React.CSSProperties {
  return {
    background: "var(--bg-surface-2)",
    border: "1px solid var(--gold-bg)",
    color: "var(--text-soft)",
  };
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
    >
      <div className="mb-1 flex items-center gap-2 text-xs" style={{ color }}>
        {icon} {label}
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  href,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  href: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.length > 0 && items[0];
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: "var(--gold-2)" }}
        >
          {icon} {title}
          {count > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{
                background: "var(--gold-2)",
                color: "var(--bg-page)",
                fontSize: 10,
              }}
            >
              {count}
            </span>
          )}
        </h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs no-underline"
          style={{ color: "var(--text-faint)" }}
        >
          الكل <ArrowLeft size={11} />
        </Link>
      </div>
      {hasItems ? (
        <div className="space-y-1.5">{children}</div>
      ) : (
        <div className="py-6 text-center text-xs" style={{ color: "var(--text-faint)" }}>
          {empty}
        </div>
      )}
    </div>
  );
}

function RowItem({
  title,
  subtitle,
  accent,
  href,
  icon,
}: {
  title: string;
  subtitle: string;
  accent: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg p-2.5 no-underline transition"
      style={{
        background: "var(--bg-surface-2)",
        border: `1px solid var(--gold-bg-soft)`,
        borderRight: `3px solid ${accent}`,
      }}
    >
      <span style={{ color: accent }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold" style={{ color: "var(--text-strong)" }}>
          {title}
        </div>
        <div className="truncate text-xs" style={{ color: "var(--text-faint)" }}>
          {subtitle}
        </div>
      </div>
      <ChevronRight size={12} style={{ color: "var(--text-faint)" }} />
    </Link>
  );
}
