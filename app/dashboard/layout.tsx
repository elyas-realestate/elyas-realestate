"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import {
  Users, FileText, TrendingUp, CheckSquare, Megaphone, Settings,
  LogOut, Globe, ExternalLink, Building2, LayoutDashboard, Palette,
  Menu, X, BarChart3, Scale, CreditCard, Plus, Bell, Banknote, Target, Shield, Brain, MessageCircle,
} from "lucide-react";
import { Toaster } from "sonner";
import AIAssistant from "@/components/AIAssistant";

type NavItemData = { label: string; href: string; icon: any };
type NavGroup = { title: string; items: NavItemData[] };

const menuGroups: NavGroup[] = [
  {
    title: "الرئيسية",
    items: [
      { label: "لوحة التحكم",    href: "/dashboard",           icon: LayoutDashboard },
      { label: "المهام",         href: "/dashboard/tasks",     icon: CheckSquare     },
    ]
  },
  {
    title: "المبيعات والعملاء (CRM)",
    items: [
      { label: "العملاء",        href: "/dashboard/clients",   icon: Users           },
      { label: "الصفقات",        href: "/dashboard/deals",     icon: TrendingUp      },
      { label: "الواتساب",       href: "/dashboard/whatsapp",  icon: MessageCircle   },
    ]
  },
  {
    title: "إدارة الأملاك",
    items: [
      { label: "العقارات",       href: "/dashboard/properties",icon: Building2       },
      { label: "المشاريع",       href: "/dashboard/projects",  icon: Building2       },
      { label: "الطلبات",        href: "/dashboard/requests",  icon: FileText        },
    ]
  },
  {
    title: "المالية",
    items: [
      { label: "عروض الأسعار",   href: "/dashboard/quotations",icon: FileText        },
      { label: "الفواتير",       href: "/dashboard/invoices",  icon: CreditCard      },
      { label: "العمولات",       href: "/dashboard/commissions",icon: Banknote       },
      { label: "التحليل المالي", href: "/dashboard/financial", icon: BarChart3       },
    ]
  },
  {
    title: "التسويق والمحتوى",
    items: [
      { label: "المحتوى",        href: "/dashboard/content",   icon: Megaphone       },
      { label: "التسويق",        href: "/dashboard/marketing", icon: Target          },
    ]
  },
  {
    title: "أدوات أخرى",
    items: [
      { label: "اشتراكات التطبيقات", href: "/dashboard/external-subscriptions", icon: CreditCard },
      { label: "الوثائق",        href: "/dashboard/documents", icon: Scale           },
    ]
  }
];

const settingsMenu: NavItemData[] = [
  { label: "الاشتراك",        href: "/dashboard/subscription",     icon: CreditCard },
  { label: "تأسيس AI",      href: "/dashboard/ai-foundation",   icon: Brain      },
  { label: "سجل التدقيق",    href: "/dashboard/audit",            icon: Shield     },
  { label: "الإعدادات",      href: "/dashboard/settings",      icon: Settings   },
  { label: "إعدادات الموقع", href: "/dashboard/site-settings", icon: Globe      },
  { label: "المحرر البصري",  href: "/dashboard/visual-editor", icon: Palette    },
];

function NavItem({
  item, isActive, badge,
}: {
  item: NavItemData;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 no-underline transition-all group"
      style={{
        padding: "9px 12px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? "#C6914C" : "#6A6A72",
        background: isActive ? "rgba(198,145,76,0.09)" : "transparent",
        borderRight: isActive ? "3px solid #C6914C" : "3px solid transparent",
        marginBottom: 1,
      }}
    >
      <item.icon
        size={17}
        style={{
          color: isActive ? "#C6914C" : "#6A6A72",
          flexShrink: 0,
          transition: "color 0.2s",
        }}
      />
      <span style={{ flex: 1, lineHeight: 1 }}>{item.label}</span>
      {badge && badge > 0 ? (
        <span
          style={{
            fontSize: 10, fontWeight: 700,
            color: "#0A0A0C",
            background: "#C6914C",
            borderRadius: 999,
            padding: "1px 6px",
            minWidth: 18,
            textAlign: "center",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [newRequests, setNewRequests] = useState(0);
  const [brokerName, setBrokerName] = useState("إلياس الدخيل");

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) { window.location.href = "/login"; return; }
    setAuthorized(true);

    const [{ count }, { data: identity }] = await Promise.all([
      supabase.from("property_requests").select("id", { count: "exact", head: true }).eq("status", "جديد"),
      supabase.from("broker_identity").select("broker_name").limit(1).single(),
    ]);
    setNewRequests(count || 0);
    if (identity?.broker_name) setBrokerName(identity.broker_name);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Current page label
  const allNavItems = [...menuGroups.flatMap(g => g.items), ...settingsMenu];
  const currentPage = allNavItems.find(
    (m) => pathname === m.href || (m.href !== "/dashboard" && pathname.startsWith(m.href))
  );

  if (!authorized) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0C" }}>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "rgba(198,145,76,0.3)", borderTopColor: "#C6914C" }}
      />
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center font-cairo font-black"
            style={{
              width: 38, height: 38, borderRadius: 11,
              background: "linear-gradient(135deg, #C6914C, #8A5F2E)",
              color: "#0A0A0C", fontSize: 17, flexShrink: 0,
              boxShadow: "0 4px 12px rgba(198,145,76,0.3)",
            }}
          >
            و
          </div>
          <div>
            <div className="font-cairo font-bold" style={{ fontSize: 14, color: "#F5F5F5", lineHeight: 1.2 }}>
              وسيط برو
            </div>
            <div style={{ fontSize: 10, color: "#C6914C", fontWeight: 500 }}>لوحة التحكم</div>
          </div>
        </div>
      </div>

      {/* New Property CTA */}
      <div style={{ padding: "0 12px 14px" }}>
        <Link
          href="/dashboard/properties"
          className="flex items-center justify-center gap-2 no-underline transition-all"
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(198,145,76,0.18), rgba(198,145,76,0.08))",
            border: "1px solid rgba(198,145,76,0.25)",
            color: "#C6914C",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Plus size={15} />
          إضافة عقار
        </Link>
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: "0 8px", overflowY: "auto" }}>
        {menuGroups.map((group, i) => (
          <div key={group.title} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4, padding: "0 6px 6px", fontSize: 10, fontWeight: 700, color: "#5A5A62", letterSpacing: "1.2px", borderTop: i > 0 ? "1px solid rgba(198,145,76,0.08)" : "none", paddingTop: i > 0 ? 12 : 0 }}>
              {group.title}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  badge={item.href === "/dashboard/requests" ? newRequests : undefined}
                />
              );
            })}
          </div>
        ))}

        <div style={{ margin: "14px 0 12px" }}>
          <div style={{ marginBottom: 4, padding: "0 6px 6px", fontSize: 10, fontWeight: 700, color: "#5A5A62", letterSpacing: "1.2px", borderTop: "1px solid rgba(198,145,76,0.08)", paddingTop: 12 }}>
            الإعدادات
          </div>
          {settingsMenu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return <NavItem key={item.href} item={item} isActive={isActive} />;
          })}
        </div>
      </nav>

      {/* Bottom Profile */}
      <div style={{ padding: "12px 12px 16px", borderTop: "1px solid rgba(198,145,76,0.08)" }}>
        <div className="flex items-center gap-3" style={{ padding: "10px 10px", borderRadius: 12, background: "rgba(198,145,76,0.04)" }}>
          <div
            className="flex items-center justify-center font-cairo font-black flex-shrink-0"
            style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #C6914C, #8A5F2E)", color: "#0A0A0C", fontSize: 14 }}
          >
            {brokerName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate" style={{ fontSize: 12.5, fontWeight: 600, color: "#E5E5E5", lineHeight: 1.3 }}>{brokerName}</div>
            <div style={{ fontSize: 10, color: "#5A5A62" }}>وسيط عقاري</div>
          </div>
          <button
            onClick={handleLogout}
            title="تسجيل خروج"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#5A5A62", padding: 4, borderRadius: 6, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "#5A5A62")}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#0A0A0C", color: "#F5F5F5" }}>
      <style>{`
        .dash-sidebar {
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .dash-sidebar.open { transform: translateX(0); }
        .dash-main { margin-right: 0; padding: 20px 16px; }
        .dash-nav-item:hover { color: #C6914C !important; background: rgba(198,145,76,0.05) !important; }
        @media (min-width: 768px) {
          .dash-sidebar { transform: translateX(0) !important; }
          .dash-main { margin-right: 240px; padding: 28px 32px; }
        }
        nav::-webkit-scrollbar { width: 3px; }
        nav::-webkit-scrollbar-thumb { background: rgba(198,145,76,0.15); border-radius: 4px; }
      `}</style>

      {/* ═══════ HEADER ═══════ */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between"
        style={{
          height: 60,
          padding: "0 20px",
          background: "rgba(10,10,12,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(198,145,76,0.08)",
        }}
      >
        {/* Right: hamburger + page title */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden flex items-center justify-center rounded-lg transition"
            style={{
              width: 36, height: 36,
              background: "rgba(198,145,76,0.06)",
              border: "1px solid rgba(198,145,76,0.12)",
              color: "#9A9AA0",
            }}
            onClick={() => setSidebarOpen(v => !v)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Page title — desktop */}
          {currentPage && (
            <div className="hidden md:flex items-center gap-2">
              <currentPage.icon size={16} style={{ color: "#C6914C" }} />
              <span className="font-cairo font-semibold" style={{ fontSize: 15, color: "#E5E5E5" }}>
                {currentPage.label}
              </span>
            </div>
          )}
        </div>

        {/* Left: actions */}
        <div className="flex items-center gap-2">
          {newRequests > 0 && (
            <Link
              href="/dashboard/requests"
              className="relative no-underline flex items-center justify-center rounded-lg transition"
              style={{ width: 36, height: 36, background: "rgba(198,145,76,0.06)", border: "1px solid rgba(198,145,76,0.12)", color: "#C6914C" }}
            >
              <Bell size={16} />
              <span
                className="absolute"
                style={{ top: 6, left: 6, width: 7, height: 7, borderRadius: "50%", background: "#F87171", border: "1.5px solid #0A0A0C" }}
              />
            </Link>
          )}
          <Link
            href="/search"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 no-underline transition"
            style={{ color: "#5A5A62", fontSize: 12, padding: "6px 10px", borderRadius: 8, background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.08)" }}
          >
            <ExternalLink size={13} />
            <span>صفحة البحث</span>
          </Link>
          <Link
            href="/mortgage"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 no-underline transition"
            style={{ color: "#5A5A62", fontSize: 12, padding: "6px 10px", borderRadius: 8, background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.08)" }}
          >
            <ExternalLink size={13} />
            <span>التمويل</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 no-underline transition"
            style={{ color: "#5A5A62", fontSize: 12, padding: "6px 10px", borderRadius: 8, background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.08)" }}
          >
            <ExternalLink size={13} />
            <span>الموقع</span>
          </Link>
        </div>
      </header>

      <div className="flex" style={{ paddingTop: 60 }}>

        {/* Overlay — mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(3px)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══════ SIDEBAR ═══════ */}
        <aside
          className={"dash-sidebar fixed top-[60px] right-0 bottom-0 z-30" + (sidebarOpen ? " open" : "")}
          style={{
            width: 240,
            background: "#0D0D10",
            borderLeft: "1px solid rgba(198,145,76,0.07)",
          }}
        >
          <SidebarContent />
        </aside>

        {/* ═══════ MAIN ═══════ */}
        <main className="dash-main flex-1" style={{ minHeight: "calc(100vh - 60px)" }}>
          {children}
        </main>
      </div>

      <AIAssistant />

      <Toaster
        position="top-center"
        dir="rtl"
        toastOptions={{
          style: {
            background: "#16161A",
            border: "1px solid rgba(198,145,76,0.2)",
            color: "#F5F5F5",
            fontFamily: "var(--font-tajawal), 'Tajawal', sans-serif",
            fontSize: 14,
            borderRadius: 12,
          },
        }}
      />
    </div>
  );
}
