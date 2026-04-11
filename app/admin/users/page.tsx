"use client";
import { Users, AlertCircle } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>المستخدمون</h1>
        <p style={{ fontSize: 13, color: "#52525B" }}>إدارة وسطاء المنصة</p>
      </div>

      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={26} style={{ color: "#7C3AED", opacity: 0.6 }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#A1A1AA", marginBottom: 8 }}>قائمة المستخدمين</h2>
          <p style={{ fontSize: 13, color: "#52525B", lineHeight: 1.7, maxWidth: 420 }}>
            ستظهر هنا قائمة بجميع الوسطاء المسجّلين في المنصة، مع إمكانية تعديل الخطط وإيقاف الحسابات.
          </p>
        </div>

        <div style={{ marginTop: 8, padding: "14px 20px", borderRadius: 10, background: "rgba(234,179,8,0.04)", border: "1px solid rgba(234,179,8,0.12)", maxWidth: 480, width: "100%" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertCircle size={15} style={{ color: "#CA8A04", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#A16207", lineHeight: 1.7 }}>
              هذه الصفحة تنتظر: إضافة جدول <code style={{ background: "rgba(234,179,8,0.08)", padding: "1px 5px", borderRadius: 3 }}>tenants</code> في Supabase،
              وإضافة <code style={{ background: "rgba(234,179,8,0.08)", padding: "1px 5px", borderRadius: 3 }}>SUPABASE_SERVICE_ROLE_KEY</code> في متغيرات البيئة.
              سيتم تفعيلها في مرحلة نظام المستخدمين المتعددين.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
