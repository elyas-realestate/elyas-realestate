"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Building2, Users as UsersIcon, FileText, UserCircle2, Mail, Calendar,
  ShieldAlert, Power, CreditCard,
} from "lucide-react";

type TenantDetail = {
  tenant: {
    id: string;
    slug: string;
    plan: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    owner_id: string;
  };
  owner_email: string | null;
  site_settings: Record<string, unknown> | null;
  broker_identity: { broker_name?: string; [k: string]: unknown } | null;
  stats: {
    properties: number;
    clients: number;
    deals: number;
    invoices: number;
    paid_total: number;
  };
  members: Array<{
    user_id: string;
    role: string;
    email: string | null;
    status: string;
    joined_at: string | null;
  }>;
  recent_invoices: Array<{
    id: string;
    invoice_number?: string;
    total?: number;
    status?: string;
    created_at: string;
  }>;
};

const PLAN_META: Record<string, { label: string; color: string; bg: string; price: number }> = {
  free:  { label: "مجاني",   color: "var(--text-ghost)", bg: "rgba(113,113,122,0.08)", price: 0   },
  basic: { label: "أساسي",   color: "var(--gold-2)", bg: "var(--gold-bg)",  price: 199 },
  pro:   { label: "احترافي", color: "var(--gold-1)", bg: "rgba(232,184,109,0.10)", price: 499 },
};

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [mutating, setMutating] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/tenants/${id}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setDetail(json.detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    }
    setLoading(false);
  }

  async function toggleSuspend() {
    if (!detail) return;
    const nextActive = !detail.tenant.is_active;
    const confirmMsg = nextActive
      ? "تفعيل هذا الوسيط؟"
      : "تعليق هذا الوسيط؟ لن يستطيع الدخول حتى التفعيل.";
    if (!confirm(confirmMsg)) return;

    setMutating(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: id, updates: { is_active: nextActive } }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(nextActive ? "تم التفعيل" : "تم التعليق");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التنفيذ");
    }
    setMutating(false);
  }

  async function changePlan(newPlan: string) {
    if (!detail) return;
    if (newPlan === detail.tenant.plan) return;
    if (!confirm(`تغيير الخطة إلى "${PLAN_META[newPlan]?.label || newPlan}"؟`)) return;

    setMutating(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: id, updates: { plan: newPlan } }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("تم تحديث الخطة");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التنفيذ");
    }
    setMutating(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--purple-2)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", gap: 10, alignItems: "center" }}>
        <AlertCircle size={16} style={{ color: "var(--danger)" }} />
        <span style={{ fontSize: 14, color: "var(--danger)" }}>{error || "لم يُعثر على المستأجر"}</span>
      </div>
    );
  }

  const plan = PLAN_META[detail.tenant.plan] || PLAN_META.free;

  return (
    <div>
      {/* Back */}
      <Link href="/admin/tenants"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-ghost)", marginBottom: 16 }}>
        <ArrowRight size={12} /> المستأجرون
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
            {detail.broker_identity?.broker_name || (detail.site_settings?.site_name as string) || detail.tenant.slug}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-disabled)", fontSize: 12, flexWrap: "wrap" }}>
            <span style={{ direction: "ltr" }}>/{detail.tenant.slug}</span>
            {detail.owner_email && <><span>•</span><span>{detail.owner_email}</span></>}
            <span>•</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: plan.color, background: plan.bg, padding: "2px 8px", borderRadius: 5 }}>{plan.label}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "var(--purple-ai)", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
            <RefreshCw size={13} /> تحديث
          </button>
          <button onClick={toggleSuspend} disabled={mutating}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
              background: detail.tenant.is_active ? "rgba(239,68,68,0.08)" : "rgba(74,222,128,0.08)",
              border: `1px solid ${detail.tenant.is_active ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.2)"}`,
              color: detail.tenant.is_active ? "var(--danger)" : "var(--success)",
              fontSize: 13, cursor: mutating ? "not-allowed" : "pointer", opacity: mutating ? 0.5 : 1,
              fontFamily: "'Tajawal', sans-serif",
            }}>
            <Power size={13} /> {detail.tenant.is_active ? "تعليق الحساب" : "تفعيل الحساب"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "عقارات", value: detail.stats.properties, icon: Building2,  color: "var(--purple-ai)" },
          { label: "عملاء",  value: detail.stats.clients,    icon: UsersIcon,  color: "var(--success)" },
          { label: "صفقات",  value: detail.stats.deals,      icon: FileText,   color: "var(--gold-1)" },
          { label: "فواتير", value: detail.stats.invoices,   icon: CreditCard, color: "var(--info)" },
          { label: "مدفوعات", value: `${Number(detail.stats.paid_total || 0).toLocaleString("en-US")} ر.س`, icon: CreditCard, color: "var(--success-2)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: "var(--bg-deep)", border: "1px solid var(--overlay-soft)", borderRadius: 12, padding: "14px 14px" }}>
            <Icon size={14} style={{ color, marginBottom: 8 }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--text-disabled)", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Plan change */}
      <div style={{ background: "var(--bg-deep)", border: "1px solid var(--overlay-soft)", borderRadius: 14, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <CreditCard size={14} /> الخطة الحالية
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(PLAN_META).map(([id, meta]) => {
            const active = id === detail.tenant.plan;
            return (
              <button
                key={id}
                onClick={() => changePlan(id)}
                disabled={mutating || active}
                style={{
                  padding: "10px 16px", borderRadius: 9, fontSize: 13,
                  background: active ? meta.bg : "transparent",
                  border: `1px solid ${active ? meta.color + "55" : "var(--overlay-mid)"}`,
                  color: active ? meta.color : "var(--text-ghost)",
                  cursor: mutating || active ? "default" : "pointer",
                  fontFamily: "'Tajawal', sans-serif", fontWeight: active ? 700 : 500,
                  opacity: mutating ? 0.6 : 1,
                }}
              >
                {meta.label} — {meta.price === 0 ? "مجاني" : `${meta.price} ر.س/شهر`}
                {active && <span style={{ marginInlineStart: 6 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two columns: Members + Recent Invoices */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Members */}
        <div style={{ background: "var(--bg-deep)", border: "1px solid var(--overlay-soft)", borderRadius: 14, padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <UsersIcon size={14} /> أعضاء الفريق ({detail.members.length})
          </h2>
          {detail.members.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-disabled)" }}>لا أعضاء بعد</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {detail.members.map(m => (
                <div key={m.user_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "var(--bg-surface-2)" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{m.email || m.user_id.slice(0, 8)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-disabled)", marginTop: 2 }}>{m.role} • {m.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent invoices */}
        <div style={{ background: "var(--bg-deep)", border: "1px solid var(--overlay-soft)", borderRadius: 14, padding: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} /> آخر الفواتير
          </h2>
          {detail.recent_invoices.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-disabled)" }}>لا توجد فواتير</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {detail.recent_invoices.slice(0, 6).map(inv => (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "var(--bg-surface-2)" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", direction: "ltr", textAlign: "right" }}>{inv.invoice_number || inv.id.slice(0, 8)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-disabled)", marginTop: 2 }}>{new Date(inv.created_at).toLocaleDateString("ar-SA")}</div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, color: "var(--text-on-dark)" }}>{Number(inv.total || 0).toLocaleString("en-US")} ر.س</div>
                    <div style={{ fontSize: 10, color: "var(--text-disabled)", marginTop: 2 }}>{inv.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ background: "var(--bg-deep)", border: "1px solid var(--overlay-soft)", borderRadius: 14, padding: 18 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>المعلومات الأساسية</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, fontSize: 13 }}>
          <div><span style={{ color: "var(--text-disabled)" }}>الـ slug:</span> <span style={{ color: "var(--text-on-dark)", direction: "ltr" }}>/{detail.tenant.slug}</span></div>
          <div><span style={{ color: "var(--text-disabled)" }}>المالك:</span> <span style={{ color: "var(--text-on-dark)" }}>{detail.owner_email || "—"}</span></div>
          <div><span style={{ color: "var(--text-disabled)" }}>التسجيل:</span> <span style={{ color: "var(--text-on-dark)" }}>{new Date(detail.tenant.created_at).toLocaleDateString("ar-SA")}</span></div>
          <div><span style={{ color: "var(--text-disabled)" }}>آخر تحديث:</span> <span style={{ color: "var(--text-on-dark)" }}>{new Date(detail.tenant.updated_at).toLocaleDateString("ar-SA")}</span></div>
          <div><span style={{ color: "var(--text-disabled)" }}>الحالة:</span>
            <span style={{ color: detail.tenant.is_active ? "var(--success)" : "var(--danger)", marginInlineStart: 6 }}>
              {detail.tenant.is_active ? "نشط" : "معلّق"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
