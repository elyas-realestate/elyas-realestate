"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, AlertCircle, Shield, Activity } from "lucide-react";

type AuditEvent = {
  id: string;
  tenant_id: string | null;
  tenant_slug: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_name: string | null;
  ip_address: string | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  create:       { color: "var(--success)", bg: "rgba(74,222,128,0.08)" },
  update:       { color: "var(--info)", bg: "rgba(96,165,250,0.08)" },
  delete:       { color: "var(--danger)", bg: "rgba(239,68,68,0.08)"  },
  login:        { color: "var(--purple-ai)", bg: "rgba(124,58,237,0.08)" },
  export:       { color: "var(--gold-1)", bg: "rgba(232,184,109,0.08)" },
  suspend:      { color: "var(--danger)", bg: "rgba(239,68,68,0.08)"  },
  activate:     { color: "var(--success)", bg: "rgba(74,222,128,0.08)" },
  plan_change:  { color: "var(--gold-1)", bg: "rgba(232,184,109,0.08)" },
};

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [limit, setLimit]     = useState(100);

  useEffect(() => { load(); }, [limit]);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/audit?limit=${limit}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setEvents(json.events || []);
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={20} style={{ color: "var(--purple-ai)" }} /> سجل التدقيق الإداري
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-disabled)" }}>آخر {events.length} نشاط عبر كل المستأجرين</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}
            style={{ padding: "8px 12px", background: "var(--bg-deep)", border: "1px solid var(--overlay-mid)", borderRadius: 9, color: "var(--text-on-dark)", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none", cursor: "pointer" }}>
            <option value={50}>آخر 50</option>
            <option value={100}>آخر 100</option>
            <option value={250}>آخر 250</option>
            <option value={500}>آخر 500</option>
          </select>
          <button onClick={load} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "var(--purple-ai)", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            تحديث
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={14} style={{ color: "var(--danger)" }} />
          <span style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>
        </div>
      )}

      <div style={{ background: "var(--bg-deep)", border: "1px solid var(--overlay-soft)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
            <thead>
              <tr style={{ background: "#141418", color: "var(--text-ghost)", textAlign: "right" }}>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الوقت</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الإجراء</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>المستخدم</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>المستأجر</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>الهدف</th>
                <th style={{ padding: "11px 14px", fontWeight: 600, fontSize: 12 }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td colSpan={6} style={{ padding: 14 }}>
                      <div style={{ height: 20, background: "#1C1C1E", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
                      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                    </td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--text-disabled)" }}>لا أحداث مسجّلة</td></tr>
              ) : (
                events.map(e => {
                  const ac = ACTION_COLORS[e.action] || { color: "var(--text-muted)", bg: "rgba(161,161,170,0.08)" };
                  return (
                    <tr key={e.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                        {new Date(e.created_at).toLocaleString("ar-SA")}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: ac.color, background: ac.bg, padding: "3px 9px", borderRadius: 6, direction: "ltr", display: "inline-block" }}>
                          {e.action}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)", fontSize: 12 }}>
                        {e.user_email || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12 }}>
                        {e.tenant_slug ? (
                          <Link href={`/admin/tenants/${e.tenant_id}`} style={{ color: "var(--purple-ai)", direction: "ltr", display: "inline-block" }}>
                            /{e.tenant_slug}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--text-disabled)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12 }}>
                        {e.entity_type && <span style={{ color: "var(--text-ghost)" }}>{e.entity_type}</span>}
                        {e.entity_name && <span style={{ color: "var(--text-secondary)", marginInlineStart: 6 }}>{e.entity_name}</span>}
                        {!e.entity_type && !e.entity_name && "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-ghost)", fontSize: 11, direction: "ltr" }}>
                        {e.ip_address || "—"}
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
