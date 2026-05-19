"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Shield,
  Search,
  User,
  Plus,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Upload,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ACTION_CFG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{
      size?: number;
      style?: React.CSSProperties;
      className?: string;
    }>;
  }
> = {
  create: { label: "إنشاء", color: "var(--success)", icon: Plus },
  update: { label: "تعديل", color: "var(--info)", icon: Edit3 },
  delete: { label: "حذف", color: "var(--danger)", icon: Trash2 },
  login: { label: "دخول", color: "var(--gold-2)", icon: LogIn },
  logout: { label: "خروج", color: "var(--text-soft)", icon: LogOut },
  export: { label: "تصدير", color: "var(--purple-ai)", icon: Download },
  import: { label: "استيراد", color: "var(--warning)", icon: Upload },
};

const ENTITY_LABELS: Record<string, string> = {
  property: "عقار",
  client: "عميل",
  deal: "صفقة",
  task: "مهمة",
  project: "مشروع",
  quotation: "عرض سعر",
  invoice: "فاتورة",
  content: "محتوى",
  settings: "إعدادات",
};

export default function AuditPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("الكل");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error?.message?.includes("does not exist")) {
      setMissingTable(true);
      setLoading(false);
      return;
    }
    setLogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "الكل" && log.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !log.entity_name?.toLowerCase().includes(q) &&
          !log.user_email?.toLowerCase().includes(q) &&
          !log.action?.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, actionFilter, search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // KPIs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = logs.filter((l) => new Date(l.created_at) >= today).length;
  // eslint-disable-next-line react-hooks/purity
  const weekStart = new Date(Date.now() - 7 * 86400000);
  const weekCount = logs.filter((l) => new Date(l.created_at) >= weekStart).length;

  if (loading)
    return (
      <div dir="rtl" className="space-y-4">
        <div className="skeleton mb-6 h-8 w-48 rounded" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );

  if (missingTable)
    return (
      <div dir="rtl" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "var(--gold-bg-soft)",
            border: "1px solid var(--gold-bg-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Shield size={28} style={{ color: "var(--gold-2)" }} />
        </div>
        <h2
          style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)", marginBottom: 12 }}
        >
          يلزم تفعيل سجل التدقيق
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.8 }}>
          شغّل{" "}
          <code
            style={{
              background: "var(--bg-surface-2)",
              padding: "2px 8px",
              borderRadius: 6,
              color: "var(--gold-2)",
            }}
          >
            supabase/010_audit_log.sql
          </code>{" "}
          في Supabase → SQL Editor
        </p>
      </div>
    );

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="mb-1 text-2xl font-bold">سجل التدقيق والأمان</h2>
        <p style={{ color: "var(--text-faint)", fontSize: 13 }}>
          تتبع جميع العمليات التي تمت على المنصة
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "إجمالي السجلات", val: logs.length, color: "var(--gold-2)" },
          { label: "اليوم", val: todayCount, color: "var(--success)" },
          { label: "آخر 7 أيام", val: weekCount, color: "var(--info)" },
          {
            label: "عمليات الحذف",
            val: logs.filter((l) => l.action === "delete").length,
            color: "var(--danger)",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg-soft)" }}
          >
            <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 6 }}>{k.label}</p>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: k.color }}>
              {k.val}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md min-w-[200px] flex-1">
          <Search
            size={16}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-faint)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-strong)",
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["الكل", "create", "update", "delete"].map((a) => (
            <button
              key={a}
              onClick={() => {
                setActionFilter(a);
                setPage(0);
              }}
              className="rounded-xl px-3 py-2 text-xs font-semibold transition"
              style={{
                background: actionFilter === a ? "var(--gold-bg-hover)" : "var(--bg-surface-1)",
                color: actionFilter === a ? "var(--gold-2)" : "var(--text-faint)",
                border:
                  "1px solid " +
                  (actionFilter === a ? "var(--gold-bg-strong)" : "var(--gold-bg-soft)"),
                cursor: "pointer",
              }}
            >
              {a === "الكل" ? "الكل" : ACTION_CFG[a]?.label || a}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      {paged.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg-soft)" }}
        >
          <Shield
            size={36}
            style={{ color: "var(--gold-bg-hover)", margin: "0 auto 12px", display: "block" }}
          />
          <p style={{ color: "var(--text-faint)", fontSize: 14 }}>لا توجد سجلات</p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg-soft)" }}
        >
          {paged.map((log, i) => {
            const cfg = ACTION_CFG[log.action] || {
              label: log.action,
              color: "var(--text-soft)",
              icon: Eye,
            };
            const ActionIcon = cfg.icon;
            const date = new Date(log.created_at);
            return (
              <div
                key={log.id}
                className="flex items-center gap-4 px-5 py-4 transition"
                style={{
                  borderBottom: i < paged.length - 1 ? "1px solid rgba(198,145,76,0.05)" : "none",
                }}
              >
                {/* Action icon */}
                <div
                  className="flex flex-shrink-0 items-center justify-center rounded-xl"
                  style={{
                    width: 36,
                    height: 36,
                    background: cfg.color + "12",
                    border: "1px solid " + cfg.color + "20",
                  }}
                >
                  <ActionIcon size={15} style={{ color: cfg.color }} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-bold"
                      style={{ background: cfg.color + "15", color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    {log.entity_type && (
                      <span style={{ fontSize: 12, color: "var(--text-soft)" }}>
                        {ENTITY_LABELS[log.entity_type] || log.entity_type}
                      </span>
                    )}
                    {log.entity_name && (
                      <span
                        style={{ fontSize: 13, color: "var(--text-on-dark)", fontWeight: 600 }}
                        className="truncate"
                      >
                        {log.entity_name}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>
                    <User
                      size={10}
                      style={{ display: "inline", marginLeft: 3, verticalAlign: "middle" }}
                    />
                    {log.user_email || "—"}
                  </p>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-left">
                  <p style={{ fontSize: 12, color: "var(--text-soft)" }}>
                    <Clock
                      size={10}
                      style={{ display: "inline", marginLeft: 3, verticalAlign: "middle" }}
                    />
                    {date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-faint)" }}>
                    {date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-3 py-4"
              style={{ borderTop: "1px solid var(--gold-bg-soft)" }}
            >
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg p-2 transition disabled:opacity-30"
                style={{
                  background: "var(--gold-bg-soft)",
                  cursor: page === 0 ? "default" : "pointer",
                  border: "none",
                  color: "var(--gold-2)",
                }}
              >
                <ChevronRight size={16} />
              </button>
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg p-2 transition disabled:opacity-30"
                style={{
                  background: "var(--gold-bg-soft)",
                  cursor: page >= totalPages - 1 ? "default" : "pointer",
                  border: "none",
                  color: "var(--gold-2)",
                }}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
