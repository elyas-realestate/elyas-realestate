"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search, Filter, RefreshCw, AlertCircle, ChevronLeft,
  Building2, Users, Briefcase, CheckCircle2, XCircle,
} from "lucide-react";

type Tenant = {
  id: string;
  slug: string;
  owner_id: string;
  owner_email: string | null;
  broker_name: string | null;
  plan: string;
  is_active: boolean;
  created_at: string;
  property_count: number;
  client_count: number;
  deal_count: number;
  last_activity: string | null;
};

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  free:  { label: "مجاني",   color: "#71717A", bg: "rgba(113,113,122,0.08)" },
  basic: { label: "أساسي",   color: "#C6914C", bg: "rgba(198,145,76,0.10)"  },
  pro:   { label: "احترافي", color: "#E8B86D", bg: "rgba(232,184,109,0.10)" },
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [query, setQuery]     = useState("");
  const [planFilter, setPlanFilter]   = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/tenants");
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setTenants(json.tenants || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter(t => {
      if (planFilter !== "all" && t.plan !== planFilter) return false;
      if (statusFilter === "active"    && !t.is_active) return false;
      if (statusFilter === "suspended" &&  t.is_active) return false;
      if (!q) return true;
      return (
        t.slug.toLowerCase().includes(q) ||
        (t.broker_name || "").toLowerCase().includes(q) ||
        (t.owner_email || "").toLowerCase().includes(q)
      );
    });
  }, [tenants, query, planFilter, statusFilter]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>المستأجرون (Tenants)</h1>
          <p style={{ fontSize: 13, color: "#52525B" }}>{loading ? "…" : `${filtered.length} من ${tenants.length}`} وسيط</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#A78BFA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#52525B" }} />
          <input
            placeholder="بحث بالاسم، الـ slug، أو البريد…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 36px 10px 14px", background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none" }}
          />
        </div>

        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          style={{ padding: "10px 12px", background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none", cursor: "pointer" }}>
          <option value="all">كل الخطط</option>
          <option value="free">مجاني</option>
          <option value="basic">أساسي</option>
          <option value="pro">احترافي</option>
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "10px 12px", background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none", cursor: "pointer" }}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">معلّق</option>
        </select>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={14} style={{ color: "#F87171" }} />
          <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#141418", color: "#71717A", textAlign: "right" }}>
                <th style={{ padding: "12px 14px", fontWeight: 600, fontSize: 12 }}>الوسيط</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, fontSize: 12 }}>الخطة</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, fontSize: 12, textAlign: "center" }}>عقارات</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, fontSize: 12, textAlign: "center" }}>عملاء</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, fontSize: 12, textAlign: "center" }}>صفقات</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, fontSize: 12 }}>التسجيل</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, fontSize: 12 }}>الحالة</th>
                <th style={{ padding: "12px 14px", fontWeight: 600, fontSize: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td colSpan={8} style={{ padding: 14 }}>
                      <div style={{ height: 28, background: "#1C1C1E", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#52525B" }}>لا توجد نتائج مطابقة</td></tr>
              ) : (
                filtered.map(t => {
                  const meta = PLAN_META[t.plan] || PLAN_META.free;
                  return (
                    <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#E4E4E7" }}>{t.broker_name || t.slug}</div>
                        <div style={{ fontSize: 11, color: "#52525B", direction: "ltr", textAlign: "right" }}>/{t.slug}</div>
                        {t.owner_email && <div style={{ fontSize: 10, color: "#3F3F46", marginTop: 2 }}>{t.owner_email}</div>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, background: meta.bg, padding: "3px 9px", borderRadius: 6 }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: "#D4D4D8" }}>{t.property_count}</td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: "#D4D4D8" }}>{t.client_count}</td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: "#D4D4D8" }}>{t.deal_count}</td>
                      <td style={{ padding: "12px 14px", color: "#A1A1AA", fontSize: 12, whiteSpace: "nowrap" }}>
                        {new Date(t.created_at).toLocaleDateString("ar-SA")}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {t.is_active ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4ADE80" }}>
                            <CheckCircle2 size={12} /> نشط
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#F87171" }}>
                            <XCircle size={12} /> معلّق
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "left" }}>
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#A78BFA", padding: "5px 10px", borderRadius: 7, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}
                        >
                          <ChevronLeft size={12} /> تفاصيل
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
