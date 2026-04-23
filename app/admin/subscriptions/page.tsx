"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw, AlertCircle, TrendingUp, DollarSign, Crown, Zap, Gift,
} from "lucide-react";

type Subscription = {
  tenant_id: string;
  slug: string;
  broker_name: string | null;
  plan: string;
  is_active: boolean;
  monthly_value: number;
  started_at: string;
};

type SummaryData = {
  total: number;
  paying: number;
  mrr: number;
  arr: number;
};

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  free:  { label: "مجاني",   color: "#71717A", bg: "rgba(113,113,122,0.08)" },
  basic: { label: "أساسي",   color: "#C6914C", bg: "rgba(198,145,76,0.10)"  },
  pro:   { label: "احترافي", color: "#E8B86D", bg: "rgba(232,184,109,0.10)" },
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setSubs(json.subscriptions || []);
      setSummary(json.summary || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    }
    setLoading(false);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>الاشتراكات والإيرادات</h1>
          <p style={{ fontSize: 13, color: "#52525B" }}>إيرادات شهرية وسنوية، خطط نشطة، ومدفوعة</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#A78BFA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={14} style={{ color: "#F87171" }} />
          <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "MRR — دخل شهري",  value: summary ? `${summary.mrr.toLocaleString("en-US")} ر.س` : "—", icon: DollarSign, color: "#34D399", bg: "rgba(52,211,153,0.08)" },
          { label: "ARR — دخل سنوي",  value: summary ? `${summary.arr.toLocaleString("en-US")} ر.س` : "—", icon: TrendingUp, color: "#E8B86D", bg: "rgba(232,184,109,0.08)" },
          { label: "اشتراكات مدفوعة", value: summary ? summary.paying : "—", icon: Crown,     color: "#A78BFA", bg: "rgba(124,58,237,0.08)" },
          { label: "إجمالي الخطط",    value: summary ? summary.total  : "—", icon: Zap,       color: "#60A5FA", bg: "rgba(96,165,250,0.08)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 16px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", lineHeight: 1.1 }}>
              {loading ? <span style={{ display: "inline-block", width: 60, height: 22, background: "#1C1C1E", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} /> : value}
            </div>
            <div style={{ fontSize: 12, color: "#52525B", marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Subscriptions list */}
      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA" }}>كل الاشتراكات</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#141418", color: "#71717A", textAlign: "right" }}>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الوسيط</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الخطة</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12, textAlign: "center" }}>القيمة الشهرية</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الحالة</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>بدأ في</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td colSpan={5} style={{ padding: 14 }}>
                      <div style={{ height: 24, background: "#1C1C1E", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                    </td>
                  </tr>
                ))
              ) : subs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#52525B" }}>لا توجد اشتراكات</td></tr>
              ) : (
                subs.map(s => {
                  const meta = PLAN_META[s.plan] || PLAN_META.free;
                  return (
                    <tr key={s.tenant_id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "11px 14px" }}>
                        <Link href={`/admin/tenants/${s.tenant_id}`} style={{ color: "#E4E4E7", fontWeight: 600 }}>
                          {s.broker_name || s.slug}
                        </Link>
                        <div style={{ fontSize: 11, color: "#52525B", direction: "ltr", textAlign: "right" }}>/{s.slug}</div>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, background: meta.bg, padding: "3px 9px", borderRadius: 6 }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", textAlign: "center", color: "#E4E4E7", fontWeight: 600 }}>
                        {Number(s.monthly_value || 0).toLocaleString("en-US")} ر.س
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 11, color: s.is_active ? "#4ADE80" : "#F87171" }}>
                          {s.is_active ? "نشط" : "معلّق"}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", color: "#A1A1AA", fontSize: 12 }}>
                        {new Date(s.started_at).toLocaleDateString("ar-SA")}
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
