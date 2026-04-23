"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, ShieldCheck, ExternalLink, Building2, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";


const navItems = [
  { label: "نظرة عامة",    href: "/admin",               icon: LayoutDashboard },
  { label: "المستأجرون",   href: "/admin/tenants",       icon: Building2       },
  { label: "الاشتراكات",   href: "/admin/subscriptions", icon: CreditCard      },
  { label: "سجل التدقيق",  href: "/admin/audit",         icon: Shield          },
  { label: "المستخدمون",   href: "/admin/users",         icon: Users           },
  { label: "الخطط",        href: "/admin/plans",         icon: CreditCard      },
  { label: "الإعدادات",    href: "/admin/settings",      icon: Settings        },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [ready, setReady]     = useState(false);
  const [email, setEmail]     = useState("");

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    // فحص super_admin عبر RPC (الـ proxy يفحص أيضاً، لكن نكرّر على جانب الكلاينت)
    const { data: isSa, error } = await supabase.rpc("is_super_admin");
    if (error || !isSa) {
      router.replace("/dashboard");
      return;
    }

    setEmail(session.user.email || "");
    setReady(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: "#0A0A0C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #7C3AED", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#09090B", color: "#F4F4F5", fontFamily: "'Tajawal', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
      `}</style>

      {/* ══ Sidebar ══ */}
      <aside style={{ width: 220, background: "#0F0F12", borderLeft: "1px solid rgba(124,58,237,0.12)", display: "flex", flexDirection: "column", position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 40 }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #5B21B6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F4F4F5" }}>وسيط برو</div>
              <div style={{ fontSize: 10, color: "#7C3AED", fontWeight: 600 }}>لوحة الإدارة</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9,
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#A78BFA" : "#71717A",
                  background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
                  borderRight: isActive ? "3px solid #7C3AED" : "3px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                <item.icon size={16} style={{ opacity: isActive ? 1 : 0.5 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(124,58,237,0.1)" }}>
          <div style={{ fontSize: 11, color: "#3F3F46", marginBottom: 10, wordBreak: "break-all" }}>{email}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/dashboard"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 10px", borderRadius: 8, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", fontSize: 12, color: "#7C3AED" }}
            >
              <ExternalLink size={12} />
              <span>الداشبورد</span>
            </Link>
            <button
              onClick={handleLogout}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 10px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", fontSize: 12, color: "#F87171", cursor: "pointer" }}
            >
              <LogOut size={12} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ══ Main ══ */}
      <main style={{ flex: 1, marginRight: 220, padding: "32px", minHeight: "100vh" }}>
        {children}
      </main>

      <Toaster
        position="top-center"
        dir="rtl"
        toastOptions={{
          style: {
            background: "#18181B", border: "1px solid rgba(124,58,237,0.2)",
            color: "#F4F4F5", fontFamily: "'Tajawal', sans-serif", fontSize: 14, borderRadius: 12,
          },
        }}
      />
    </div>
  );
}
