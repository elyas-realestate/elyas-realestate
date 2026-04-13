"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import {
  Shield, Search, Filter, User, Plus, Edit3, Trash2,
  LogIn, LogOut, Download, Upload, Eye, Clock,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const ACTION_CFG: Record<string, { label: string; color: string; icon: any }> = {
  create:  { label: "إنشاء",  color: "#4ADE80", icon: Plus     },
  update:  { label: "تعديل",  color: "#60A5FA", icon: Edit3    },
  delete:  { label: "حذف",    color: "#F87171", icon: Trash2   },
  login:   { label: "دخول",   color: "#C6914C", icon: LogIn    },
  logout:  { label: "خروج",   color: "#9A9AA0", icon: LogOut   },
  export:  { label: "تصدير",  color: "#A78BFA", icon: Download },
  import:  { label: "استيراد", color: "#FACC15", icon: Upload   },
};

const ENTITY_LABELS: Record<string, string> = {
  property: "عقار", client: "عميل", deal: "صفقة", task: "مهمة",
  project: "مشروع", quotation: "عرض سعر", invoice: "فاتورة",
  content: "محتوى", settings: "إعدادات",
};

export default function AuditPage() {
  const [logs, setLogs]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [search, setSearch]     = useState("");
  const [actionFilter, setActionFilter] = useState("الكل");
  const [page, setPage]         = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error?.message?.includes("does not exist")) { setMissingTable(true); setLoading(false); return; }
    setLogs(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== "الكل" && log.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!log.entity_name?.toLowerCase().includes(q) &&
            !log.user_email?.toLowerCase().includes(q) &&
            !log.action?.includes(q)) return false;
      }
      return true;
    });
  }, [logs, actionFilter, search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // KPIs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = logs.filter(l => new Date(l.created_at) >= today).length;
  const weekStart = new Date(Date.now() - 7 * 86400000);
  const weekCount = logs.filter(l => new Date(l.created_at) >= weekStart).length;

  if (loading) return (
    <div dir="rtl" className="space-y-4">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  if (missingTable) return (
    <div dir="rtl" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Shield size={28} style={{ color: "#C6914C" }} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 12 }}>يلزم تفعيل سجل التدقيق</h2>
      <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8 }}>
        شغّل <code style={{ background: "#1C1C22", padding: "2px 8px", borderRadius: 6, color: "#C6914C" }}>supabase/010_audit_log.sql</code> في Supabase → SQL Editor
      </p>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">سجل التدقيق والأمان</h2>
        <p style={{ color: "#5A5A62", fontSize: 13 }}>تتبع جميع العمليات التي تمت على المنصة</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي السجلات", val: logs.length, color: "#C6914C" },
          { label: "اليوم", val: todayCount, color: "#4ADE80" },
          { label: "آخر 7 أيام", val: weekCount, color: "#60A5FA" },
          { label: "عمليات الحذف", val: logs.filter(l => l.action === "delete").length, color: "#F87171" },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 6 }}>{k.label}</p>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#5A5A62" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..."
            className="w-full rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none"
            style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.12)", color: "#F5F5F5" }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["الكل", "create", "update", "delete"].map(a => (
            <button key={a} onClick={() => { setActionFilter(a); setPage(0); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition"
              style={{
                background: actionFilter === a ? "rgba(198,145,76,0.15)" : "#16161A",
                color: actionFilter === a ? "#C6914C" : "#5A5A62",
                border: "1px solid " + (actionFilter === a ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.08)"),
                cursor: "pointer",
              }}>
              {a === "الكل" ? "الكل" : ACTION_CFG[a]?.label || a}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      {paged.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <Shield size={36} style={{ color: "rgba(198,145,76,0.2)", margin: "0 auto 12px", display: "block" }} />
          <p style={{ color: "#5A5A62", fontSize: 14 }}>لا توجد سجلات</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          {paged.map((log, i) => {
            const cfg = ACTION_CFG[log.action] || { label: log.action, color: "#9A9AA0", icon: Eye };
            const ActionIcon = cfg.icon;
            const date = new Date(log.created_at);
            return (
              <div key={log.id}
                className="flex items-center gap-4 px-5 py-4 transition"
                style={{ borderBottom: i < paged.length - 1 ? "1px solid rgba(198,145,76,0.05)" : "none" }}>
                {/* Action icon */}
                <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: 36, height: 36, background: cfg.color + "12", border: "1px solid " + cfg.color + "20" }}>
                  <ActionIcon size={15} style={{ color: cfg.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: cfg.color + "15", color: cfg.color }}>
                      {cfg.label}
                    </span>
                    {log.entity_type && (
                      <span style={{ fontSize: 12, color: "#9A9AA0" }}>{ENTITY_LABELS[log.entity_type] || log.entity_type}</span>
                    )}
                    {log.entity_name && (
                      <span style={{ fontSize: 13, color: "#E5E5E5", fontWeight: 600 }} className="truncate">{log.entity_name}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "#5A5A62", marginTop: 3 }}>
                    <User size={10} style={{ display: "inline", marginLeft: 3, verticalAlign: "middle" }} />
                    {log.user_email || "—"}
                  </p>
                </div>

                {/* Time */}
                <div className="text-left flex-shrink-0">
                  <p style={{ fontSize: 12, color: "#9A9AA0" }}>
                    <Clock size={10} style={{ display: "inline", marginLeft: 3, verticalAlign: "middle" }} />
                    {date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                  </p>
                  <p style={{ fontSize: 11, color: "#5A5A62" }}>{date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4" style={{ borderTop: "1px solid rgba(198,145,76,0.06)" }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-lg transition disabled:opacity-30"
                style={{ background: "rgba(198,145,76,0.06)", cursor: page === 0 ? "default" : "pointer", border: "none", color: "#C6914C" }}>
                <ChevronRight size={16} />
              </button>
              <span style={{ fontSize: 12, color: "#5A5A62" }}>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-lg transition disabled:opacity-30"
                style={{ background: "rgba(198,145,76,0.06)", cursor: page >= totalPages - 1 ? "default" : "pointer", border: "none", color: "#C6914C" }}>
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
