"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { Users, Crown, Zap, Gift, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";


const PLAN_META: Record<string, { label: string; color: string; Icon: typeof Gift }> = {
  free:  { label: "مجاني",   color: "#71717A", Icon: Gift  },
  basic: { label: "أساسي",   color: "#C6914C", Icon: Zap   },
  pro:   { label: "احترافي", color: "#E8B86D", Icon: Crown },
};

type Tenant = {
  id: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminUsersPage() {
  const [tenants, setTenants]   = useState<Tenant[]>([]);
  const [loading, setLoading]   = useState(true);
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => { loadTenants(); }, []);

  async function loadTenants() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenants")
      .select("id, slug, plan, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("تأكد من تشغيل SQL migration أولاً");
    } else {
      setTenants(data || []);
    }
    setLoading(false);
  }

  async function toggleActive(tenant: Tenant) {
    setChanging(tenant.id);
    const { error } = await supabase
      .from("tenants")
      .update({ is_active: !tenant.is_active })
      .eq("id", tenant.id);

    if (error) {
      toast.error("فشل التحديث");
    } else {
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, is_active: !t.is_active } : t));
      toast.success(tenant.is_active ? "تم إيقاف الحساب" : "تم تفعيل الحساب");
    }
    setChanging(null);
  }

  async function changePlan(tenantId: string, plan: string) {
    setChanging(tenantId);
    const { error } = await supabase
      .from("tenants")
      .update({ plan })
      .eq("id", tenantId);

    if (error) {
      toast.error("فشل تغيير الخطة");
    } else {
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, plan } : t));
      toast.success(`تم تغيير الخطة إلى ${PLAN_META[plan]?.label || plan}`);
    }
    setChanging(null);
  }

  return (
    <div>
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>المستخدمون</h1>
          <p style={{ fontSize: 13, color: "#52525B" }}>
            {loading ? "..." : `${tenants.length} وسيط مسجّل`}
          </p>
        </div>
        <button
          onClick={loadTenants}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", color: "#A78BFA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          تحديث
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#52525B", fontSize: 13 }}>
            <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
            جاري التحميل...
          </div>
        ) : tenants.length === 0 ? (
          <div style={{ padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Users size={32} style={{ color: "#27272A" }} />
            <p style={{ fontSize: 13, color: "#52525B" }}>
              لا يوجد مستخدمون — تأكد من تشغيل SQL migration في Supabase
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["الوسيط (Slug)", "الخطة", "الحالة", "تاريخ التسجيل", "إجراءات"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, color: "#52525B", fontWeight: 600, letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t, i) => {
                const meta = PLAN_META[t.plan] || PLAN_META.free;
                const Icon = meta.Icon;
                const isChanging = changing === t.id;
                return (
                  <tr
                    key={t.id}
                    style={{ borderBottom: i < tenants.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", opacity: isChanging ? 0.6 : 1, transition: "opacity 0.2s" }}
                  >
                    {/* Slug */}
                    <td style={{ padding: "14px 16px" }}>
                      <code style={{ fontSize: 13, color: "#A78BFA", background: "rgba(124,58,237,0.08)", padding: "3px 8px", borderRadius: 5 }}>
                        /broker/{t.slug}
                      </code>
                    </td>

                    {/* Plan */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {Object.keys(PLAN_META).map(planId => {
                          const pm = PLAN_META[planId];
                          const PIcon = pm.Icon;
                          const isActive = t.plan === planId;
                          return (
                            <button
                              key={planId}
                              onClick={() => !isActive && changePlan(t.id, planId)}
                              disabled={isChanging}
                              style={{
                                display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7,
                                background: isActive ? `${pm.color}14` : "transparent",
                                border: `1px solid ${isActive ? pm.color + "40" : "rgba(255,255,255,0.06)"}`,
                                color: isActive ? pm.color : "#52525B",
                                fontSize: 11, cursor: isActive ? "default" : "pointer",
                                fontFamily: "'Tajawal', sans-serif",
                              }}
                            >
                              <PIcon size={11} />
                              {pm.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      {t.is_active ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#4ADE80" }}>
                          <CheckCircle size={13} /> نشط
                        </span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#F87171" }}>
                          <XCircle size={13} /> موقوف
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#52525B" }}>
                      {new Date(t.created_at).toLocaleDateString("ar-SA")}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => toggleActive(t)}
                        disabled={isChanging}
                        style={{
                          padding: "5px 12px", borderRadius: 7, fontSize: 11, cursor: "pointer",
                          fontFamily: "'Tajawal', sans-serif",
                          background: t.is_active ? "rgba(239,68,68,0.06)" : "rgba(74,222,128,0.06)",
                          border: `1px solid ${t.is_active ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.15)"}`,
                          color: t.is_active ? "#F87171" : "#4ADE80",
                        }}
                      >
                        {t.is_active ? "إيقاف" : "تفعيل"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
