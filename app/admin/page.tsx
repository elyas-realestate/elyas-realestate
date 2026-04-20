"use client";
import { useState, useEffect } from "react";
import {
  Users, TrendingUp, Gift, Zap, Crown,
  RefreshCw, ArrowUpRight, AlertCircle,
} from "lucide-react";

type Tenant = {
  id: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  broker_name: string;
};

type ApiData = {
  tenants: Tenant[];
  total: number;
  planCounts: Record<string, number>;
};

const PLAN_META: Record<string, { label: string; color: string; bg: string; Icon: typeof Gift }> = {
  free:  { label: "مجاني",   color: "#71717A", bg: "rgba(113,113,122,0.08)", Icon: Gift  },
  basic: { label: "أساسي",   color: "#C6914C", bg: "rgba(198,145,76,0.08)",  Icon: Zap   },
  pro:   { label: "احترافي", color: "#E8B86D", bg: "rgba(232,184,109,0.08)", Icon: Crown },
};

export default function AdminPage() {
  const [data, setData]       = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tenants");
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    }
    setLoading(false);
  }

  const recentTenants = (data?.tenants || []).slice(0, 5);
  const totalActive   = (data?.tenants || []).filter(t => t.is_active).length;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>نظرة عامة</h1>
          <p style={{ fontSize: 13, color: "#52525B" }}>إحصائيات المنصة ومراقبة الوسطاء</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#A78BFA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={14} style={{ color: "#F87171", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "إجمالي الوسطاء",   value: data?.total ?? 0,                     icon: Users,       color: "#A78BFA", bg: "rgba(124,58,237,0.08)" },
          { label: "حسابات نشطة",      value: loading ? 0 : totalActive,            icon: TrendingUp,  color: "#4ADE80", bg: "rgba(74,222,128,0.08)"  },
          { label: "خطة مجانية",       value: data?.planCounts.free  ?? 0,           icon: Gift,        color: "#71717A", bg: "rgba(113,113,122,0.08)" },
          { label: "خطة أساسي + احترافي", value: (data?.planCounts.basic ?? 0) + (data?.planCounts.pro ?? 0), icon: Crown, color: "#E8B86D", bg: "rgba(232,184,109,0.08)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#F4F4F5", lineHeight: 1 }}>
              {loading ? <span style={{ display: "inline-block", width: 40, height: 26, background: "#1C1C1E", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} /> : value}
            </div>
            <div style={{ fontSize: 12, color: "#52525B", marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Plan Distribution ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* توزيع الخطط */}
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA", marginBottom: 16 }}>توزيع الخطط</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(PLAN_META).map(([id, meta]) => {
              const count = data?.planCounts[id] ?? 0;
              const total = data?.total || 1;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <meta.Icon size={13} style={{ color: meta.color }} />
                      <span style={{ fontSize: 13, color: "#D4D4D8" }}>{meta.label}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#52525B" }}>{loading ? "—" : `${count} (${pct}%)`}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "#1C1C1E", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: loading ? "0%" : `${pct}%`, background: meta.color, borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* آخر المسجّلين */}
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA" }}>آخر المسجّلين</h2>
            <a href="/admin/users" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7C3AED", textDecoration: "none" }}>
              عرض الكل <ArrowUpRight size={12} />
            </a>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 42, borderRadius: 8, background: "#1C1C1E", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : recentTenants.length === 0 ? (
            <p style={{ fontSize: 13, color: "#52525B", textAlign: "center", padding: "16px 0" }}>لا يوجد مستخدمون بعد</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTenants.map(t => {
                const meta = PLAN_META[t.plan] || PLAN_META.free;
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "#18181B" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#D4D4D8", fontWeight: 500 }}>{t.broker_name || t.slug}</div>
                      <div style={{ fontSize: 10, color: "#52525B", direction: "ltr" }}>/{t.slug}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 10, color: meta.color, background: meta.bg, padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>{meta.label}</span>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.is_active ? "#4ADE80" : "#F87171", flexShrink: 0 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
