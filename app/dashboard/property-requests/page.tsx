"use client";
import { supabase } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Inbox, Search, ArrowUpRight, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";
import { formatSAR } from "@/lib/format";

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  جديد:        { color: "var(--info)",    bg: "var(--info-bg)",    label: "جديد" },
  "قيد العمل": { color: "var(--gold-2)",  bg: "var(--gold-bg)",    label: "قيد العمل" },
  محول:        { color: "var(--success)", bg: "var(--success-bg)", label: "محوّل لصفقة" },
  مغلق:        { color: "var(--text-faint)", bg: "var(--bg-surface-3)", label: "مغلق" },
  ضائع:        { color: "var(--danger)",  bg: "var(--danger-bg)",  label: "ضائع" },
};

export default function PropertyRequestsPage() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("property_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setReqs(data || []);
    setLoading(false);
  }

  const filtered = reqs.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [r.contact_name, r.contact_phone, r.city, r.district, r.message]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q));
    }
    return true;
  });

  const counts = {
    all: reqs.length,
    جديد: reqs.filter(r => r.status === "جديد").length,
    "قيد العمل": reqs.filter(r => r.status === "قيد العمل").length,
    محول: reqs.filter(r => r.status === "محول").length,
  };

  return (
    <div dir="rtl" className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-strong)" }}>
            <Inbox size={20} style={{ color: "var(--gold-2)" }} /> طلبات العقار
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            ما يبحث عنه عملاؤك — حوّل أي طلب لصفقة بنقرة واحدة، واستعرض اقتراحات المساعد الذكي للعقارات المطابقة.
          </p>
        </div>
        <Link
          href="/dashboard/property-requests/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm no-underline transition"
          style={{
            background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: "var(--bg-page)",
          }}
        >
          <Plus size={16} /> طلب جديد
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap" style={{ borderBottom: "1px solid var(--gold-bg)", paddingBottom: 8 }}>
        {[
          { key: "all", label: "الكل", count: counts.all },
          { key: "جديد", label: "جديدة", count: counts.جديد },
          { key: "قيد العمل", label: "قيد العمل", count: counts["قيد العمل"] },
          { key: "محول", label: "محوّلة", count: counts.محول },
        ].map(tab => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
              style={{
                background: active ? "var(--gold-bg-hover)" : "transparent",
                color: active ? "var(--gold-2)" : "var(--text-soft)",
                border: active ? "1px solid var(--gold-bg-strong)" : "1px solid transparent",
              }}
            >
              {tab.label}
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: active ? "var(--bg-page)" : "var(--bg-surface-2)", color: active ? "var(--gold-2)" : "var(--text-faint)" }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث باسم العميل، الجوال، المدينة، الحي..."
          className="w-full rounded-lg pr-10 pl-4 py-3 text-sm focus:outline-none transition"
          style={{
            background: "var(--bg-surface-1)",
            border: "1px solid var(--gold-bg)",
            color: "var(--text-strong)",
          }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ background: "var(--bg-surface-1)", border: "1px dashed var(--gold-bg)" }}>
          <Inbox size={40} style={{ color: "var(--text-faint)", margin: "0 auto 12px" }} />
          <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-strong)" }}>
            {search || statusFilter !== "all" ? "لا توجد طلبات تطابق البحث" : "لا توجد طلبات بعد"}
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-faint)" }}>
            ابدأ بإضافة أول طلب من عميل وسيقترح لك المساعد عقارات مطابقة من مخزونك.
          </p>
          <Link
            href="/dashboard/property-requests/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold no-underline"
            style={{ background: "var(--gold-bg-hover)", color: "var(--gold-2)", border: "1px solid var(--gold-bg-strong)" }}
          >
            <Plus size={14} /> أضف طلباً جديداً
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(r => {
            const meta = STATUS_META[r.status] || STATUS_META["جديد"];
            const Icon = r.status === "محول" ? CheckCircle2 : r.status === "ضائع" ? AlertCircle : Clock;
            return (
              <Link
                key={r.id}
                href={`/dashboard/property-requests/${r.id}`}
                className="rounded-xl p-4 no-underline transition flex flex-col gap-2"
                style={{
                  background: "var(--bg-surface-1)",
                  border: "1px solid var(--gold-bg)",
                  color: "var(--text-strong)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: "var(--text-strong)" }}>
                      {r.contact_name || "عميل بدون اسم"}
                    </div>
                    {r.contact_phone && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }} dir="ltr">{r.contact_phone}</div>
                    )}
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded flex items-center gap-1"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <Icon size={11} /> {meta.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: "var(--text-soft)" }}>
                  {r.request_type && <span><b>نوع:</b> {r.request_type}</span>}
                  {r.main_category && <span><b>فئة:</b> {r.main_category}</span>}
                  {r.city && <span><b>📍</b> {r.city}{r.district ? ` - ${r.district}` : ""}</span>}
                </div>

                {(r.budget_min || r.budget_max) && (
                  <div className="text-xs" style={{ color: "var(--gold-2)" }}>
                    💰 {r.budget_min ? formatSAR(r.budget_min, { short: true }) : "؟"} → {r.budget_max ? formatSAR(r.budget_max, { short: true }) : "؟"}
                  </div>
                )}

                {r.message && (
                  <div className="text-xs line-clamp-2" style={{ color: "var(--text-soft)" }}>
                    💬 {r.message}
                  </div>
                )}

                <div className="flex items-center justify-between mt-1 pt-2" style={{ borderTop: "1px solid var(--gold-bg-soft)" }}>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--gold-2)" }}>
                    عرض التفاصيل <ArrowUpRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
