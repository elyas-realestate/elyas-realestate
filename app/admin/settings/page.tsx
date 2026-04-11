"use client";
import { Settings, Key, Globe, Shield } from "lucide-react";

const ENV_VARS = [
  { name: "NEXT_PUBLIC_SUPABASE_URL",      label: "Supabase URL",         status: "set",   icon: Globe   },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase Anon Key",    status: "set",   icon: Key     },
  { name: "SUPABASE_SERVICE_ROLE_KEY",     label: "Supabase Service Role", status: "missing", icon: Shield },
  { name: "NEXT_PUBLIC_ADMIN_EMAIL",       label: "Admin Email",           status: process.env.NEXT_PUBLIC_ADMIN_EMAIL ? "set" : "missing", icon: Shield },
  { name: "OPENAI_API_KEY",               label: "OpenAI API Key",        status: "unknown", icon: Key  },
  { name: "ANTHROPIC_API_KEY",            label: "Anthropic API Key",     status: "unknown", icon: Key  },
  { name: "GOOGLE_API_KEY",               label: "Google API Key",        status: "unknown", icon: Key  },
];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  set:     { bg: "rgba(74,222,128,0.05)",  border: "rgba(74,222,128,0.2)",  text: "#4ADE80", label: "مضبوط"  },
  missing: { bg: "rgba(239,68,68,0.05)",   border: "rgba(239,68,68,0.2)",   text: "#F87171", label: "مفقود"  },
  unknown: { bg: "rgba(161,161,170,0.05)", border: "rgba(161,161,170,0.1)", text: "#71717A", label: "غير محدد" },
};

export default function AdminSettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>إعدادات الإدارة</h1>
        <p style={{ fontSize: 13, color: "#52525B" }}>متغيرات البيئة والإعدادات التقنية</p>
      </div>

      {/* ENV Vars */}
      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA", marginBottom: 16 }}>متغيرات البيئة</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ENV_VARS.map(v => {
            const s = STATUS_COLORS[v.status];
            const Icon = v.icon;
            return (
              <div
                key={v.name}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 9, background: s.bg, border: `1px solid ${s.border}`, gap: 12 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <Icon size={14} style={{ color: s.text, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#D4D4D8", fontFamily: "monospace" }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: "#52525B" }}>{v.label}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: s.text, flexShrink: 0 }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: "#3F3F46", marginTop: 14, lineHeight: 1.6 }}>
          * حالة مفاتيح AI تظهر كـ "غير محدد" لأنها server-only ولا يمكن قراءتها من المتصفح.
          تحقق من Vercel Dashboard → Environment Variables.
        </p>
      </div>

      {/* Admin Access */}
      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA", marginBottom: 12 }}>حماية لوحة الإدارة</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <InfoRow
            label="طريقة الحماية"
            value={process.env.NEXT_PUBLIC_ADMIN_EMAIL ? "بريد إلكتروني محدد" : "أي مستخدم مسجّل"}
          />
          {process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
            <InfoRow label="البريد المسموح" value={process.env.NEXT_PUBLIC_ADMIN_EMAIL} mono />
          )}
          <InfoRow label="رابط الإدارة" value="/admin" mono />
        </div>

        {!process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 9, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p style={{ fontSize: 12, color: "#F87171", lineHeight: 1.6 }}>
              تحذير: لوحة الإدارة مفتوحة لأي مستخدم مسجّل. أضف{" "}
              <code style={{ background: "rgba(239,68,68,0.08)", padding: "1px 5px", borderRadius: 3 }}>NEXT_PUBLIC_ADMIN_EMAIL</code>{" "}
              في متغيرات البيئة لتقييد الوصول.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: 12, color: "#52525B" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#D4D4D8", fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
    </div>
  );
}
