"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import {
  CheckSquare, Inbox, MessageCircle, TrendingUp, ArrowLeft,
  Loader2, Clock, AlertTriangle, ChevronRight, Plus
} from "lucide-react";

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
  const [tasks, setTasks] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [tasksRes, dealsRes, fuRes, reqRes] = await Promise.all([
        supabase.from("tasks").select("id, title, status, priority, due_date, related_to")
          .neq("status", "مكتمل").order("due_date", { ascending: true, nullsFirst: false }).limit(8),
        supabase.from("deals").select("id, title, stage, amount, client_name")
          .neq("stage", "مغلقة - فوز").neq("stage", "مغلقة - خسارة")
          .order("updated_at", { ascending: false }).limit(8),
        supabase.from("followup_queue").select("id, message, client_id, status, created_at")
          .eq("status", "pending").order("created_at", { ascending: false }).limit(8),
        supabase.from("property_requests").select("id, full_name, request_type, city, district, created_at")
          .eq("status", "جديد").order("created_at", { ascending: false }).limit(8),
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
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} /></div>;
  }

  const totalActions = stats.tasks_pending + stats.deals_active + stats.cold_clients + stats.new_requests;

  return (
    <div dir="rtl" className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-strong)" }}>
            <CheckSquare size={22} style={{ color: "var(--gold-2)" }} /> يومي
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            {totalActions === 0
              ? "ما في شي ينتظر الآن. وقت ممتاز لإضافة عقار أو عميل جديد."
              : `لديك ${totalActions} عنصر يحتاج إجراء اليوم.`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<CheckSquare size={18} />} label="مهام معلَّقة" value={stats.tasks_pending} color="var(--gold-2)" />
        <Stat icon={<TrendingUp size={18} />} label="صفقات نشطة" value={stats.deals_active} color="var(--success)" />
        <Stat icon={<MessageCircle size={18} />} label="عملاء باردون" value={stats.cold_clients} color="var(--info, #3B82F6)" />
        <Stat icon={<Inbox size={18} />} label="طلبات جديدة" value={stats.new_requests} color="var(--warning)" />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks */}
        <Section
          title="مهامي"
          icon={<CheckSquare size={16} />}
          count={stats.tasks_pending}
          href="/dashboard/tasks"
          empty="لا توجد مهام معلَّقة"
        >
          {tasks.map(t => (
            <RowItem key={t.id}
              title={t.title}
              subtitle={t.due_date ? new Date(t.due_date).toLocaleDateString("ar-SA") : "بدون تاريخ"}
              accent={t.priority === "عالية" ? "var(--danger)" : t.priority === "متوسطة" ? "var(--warning)" : "var(--text-faint)"}
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
          {deals.map(d => (
            <RowItem key={d.id}
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
          {followups.map(f => (
            <RowItem key={f.id}
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
          href="/dashboard/property-requests"
          empty="لا طلبات جديدة"
        >
          {requests.map(r => (
            <RowItem key={r.id}
              title={r.full_name}
              subtitle={`${r.request_type || "—"} — ${r.district || r.city || ""}`}
              accent="var(--warning)"
              href={`/dashboard/property-requests#${r.id}`}
              icon={<Inbox size={12} />}
            />
          ))}
        </Section>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl p-4 flex flex-wrap gap-2" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
        <span className="text-sm font-bold" style={{ color: "var(--text-soft)" }}>اختصارات سريعة:</span>
        <Link href="/dashboard/tasks" className="text-xs px-3 py-1.5 rounded-full no-underline" style={btnStyle()}>
          <Plus size={11} className="inline ms-1" /> مهمة
        </Link>
        <Link href="/dashboard/clients/add" className="text-xs px-3 py-1.5 rounded-full no-underline" style={btnStyle()}>
          <Plus size={11} className="inline ms-1" /> عميل
        </Link>
        <Link href="/dashboard/properties/add" className="text-xs px-3 py-1.5 rounded-full no-underline" style={btnStyle()}>
          <Plus size={11} className="inline ms-1" /> عقار
        </Link>
        <Link href="/dashboard/deals" className="text-xs px-3 py-1.5 rounded-full no-underline" style={btnStyle()}>
          <Plus size={11} className="inline ms-1" /> صفقة
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

function Stat({ icon, label, value, color }: any) {
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
      <div className="flex items-center gap-2 text-xs mb-1" style={{ color }}>
        {icon} {label}
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>{value}</div>
    </div>
  );
}

function Section({ title, icon, count, href, empty, children }: any) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.length > 0 && items[0];
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--gold-2)" }}>
          {icon} {title}
          {count > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
              background: "var(--gold-2)", color: "var(--bg-page)", fontSize: 10,
            }}>{count}</span>
          )}
        </h3>
        <Link href={href} className="text-xs flex items-center gap-1 no-underline" style={{ color: "var(--text-faint)" }}>
          الكل <ArrowLeft size={11} />
        </Link>
      </div>
      {hasItems ? (
        <div className="space-y-1.5">{children}</div>
      ) : (
        <div className="text-center py-6 text-xs" style={{ color: "var(--text-faint)" }}>{empty}</div>
      )}
    </div>
  );
}

function RowItem({ title, subtitle, accent, href, icon }: any) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg p-2.5 no-underline transition" style={{
      background: "var(--bg-surface-2)",
      border: `1px solid var(--gold-bg-soft)`,
      borderRight: `3px solid ${accent}`,
    }}>
      <span style={{ color: accent }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{title}</div>
        <div className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{subtitle}</div>
      </div>
      <ChevronRight size={12} style={{ color: "var(--text-faint)" }} />
    </Link>
  );
}
