"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Users, FileText, TrendingUp, CheckSquare, Megaphone, Settings, LogOut, Globe, ExternalLink, Building2, LayoutDashboard, Palette, Menu, X } from "lucide-react";
import { Toaster } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const menuItems = [
  { label: "لوحة التحكم",    href: "/dashboard",               icon: LayoutDashboard, group: "main" },
  { label: "العقارات",       href: "/dashboard/properties",    icon: Building2,       group: "main" },
  { label: "العملاء",        href: "/dashboard/clients",       icon: Users,           group: "main" },
  { label: "الصفقات",        href: "/dashboard/deals",         icon: TrendingUp,      group: "main" },
  { label: "الطلبات",        href: "/dashboard/requests",      icon: FileText,        group: "main" },
  { label: "المهام",         href: "/dashboard/tasks",         icon: CheckSquare,     group: "main" },
  { label: "المحتوى",        href: "/dashboard/content",       icon: Megaphone,       group: "main" },
  { label: "الإعدادات",      href: "/dashboard/settings",      icon: Settings,        group: "settings" },
  { label: "إعدادات الموقع", href: "/dashboard/site-settings", icon: Globe,           group: "settings" },
  { label: "المحرر البصري",  href: "/dashboard/visual-editor", icon: Palette,         group: "settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); } else { setAuthorized(true); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!authorized) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#0A0A0C', color:'#C6914C', fontFamily:"'Tajawal', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');`}</style>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-current rounded-full border-t-transparent animate-spin"></div>
        <span>جاري التحقق...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" dir="rtl" style={{ background:'#0A0A0C', color:'#F5F5F5', fontFamily:"'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .dash-sidebar::-webkit-scrollbar { width: 4px; }
        .dash-sidebar::-webkit-scrollbar-thumb { background: rgba(198,145,76,0.2); border-radius: 4px; }
        .dash-sidebar {
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .dash-sidebar.open { transform: translateX(0); }
        .dash-main { margin-right: 0; padding: 20px 16px; }
        @media (min-width: 768px) {
          .dash-sidebar { transform: translateX(0) !important; }
          .dash-main { margin-right: 240px; padding: 32px; }
        }
      `}</style>

      {/* ═══════ HEADER ═══════ */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between" style={{ height:64, padding:'0 16px', background:'rgba(16,16,20,0.95)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid rgba(198,145,76,0.1)' }}>
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex items-center justify-center rounded-lg transition"
            style={{ width:40, height:40, background:'rgba(198,145,76,0.05)', border:'1px solid rgba(198,145,76,0.12)', color:'#9A9AA0' }}
            onClick={() => setSidebarOpen(v => !v)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center justify-center font-kufi font-black" style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, #C6914C, #A6743A)', color:'#0A0A0C', fontSize:16, flexShrink:0 }}>إ</div>
          <div className="flex flex-col" style={{ lineHeight:1.2 }}>
            <span className="font-kufi font-bold" style={{ fontSize:15, color:'#F5F5F5' }}>إلياس الدخيل</span>
            <span style={{ fontSize:10, color:'#C6914C', fontWeight:500 }}>لوحة التحكم</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="hidden sm:flex items-center gap-1.5 no-underline transition" style={{ color:'#5A5A62', fontSize:13 }}>
            <ExternalLink size={14} />
            <span>الموقع</span>
          </Link>
          <div className="hidden sm:block" style={{ width:1, height:20, background:'rgba(198,145,76,0.12)' }}></div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 transition" style={{ color:'#5A5A62', fontSize:13, background:'none', border:'none', cursor:'pointer' }}>
            <LogOut size={14} />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      <div className="flex" style={{ paddingTop:64 }}>

        {/* ═══════ OVERLAY — mobile only ═══════ */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30"
            style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(2px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══════ SIDEBAR ═══════ */}
        <aside
          className={"dash-sidebar fixed top-16 right-0 bottom-0 overflow-y-auto z-30" + (sidebarOpen ? " open" : "")}
          style={{ width:240, background:'#101014', borderLeft:'1px solid rgba(198,145,76,0.08)', padding:'16px 12px' }}
        >
          {/* Close button — mobile only */}
          <div className="md:hidden flex justify-end mb-2">
            <button onClick={() => setSidebarOpen(false)} style={{ color:'#5A5A62', background:'none', border:'none', cursor:'pointer', padding:4 }}>
              <X size={18} />
            </button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item, idx) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const isFirstSettings = item.group === "settings" && (idx === 0 || menuItems[idx - 1].group !== "settings");
              return (
                <div key={item.href}>
                  {isFirstSettings && (
                    <div style={{ margin:'12px 0 8px', padding:'0 14px' }}>
                      <div style={{ height:1, background:'rgba(198,145,76,0.12)' }} />
                      <span style={{ fontSize:10, color:'#5A5A62', display:'block', marginTop:8, letterSpacing:1 }}>الإعدادات</span>
                    </div>
                  )}
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 no-underline transition"
                    style={{
                      padding:'10px 14px',
                      borderRadius:10,
                      fontSize:14,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#C6914C' : '#9A9AA0',
                      background: isActive ? 'rgba(198,145,76,0.08)' : 'transparent',
                      borderRight: isActive ? '3px solid #C6914C' : '3px solid transparent',
                    }}
                  >
                    <item.icon size={18} style={{ opacity: isActive ? 1 : 0.5 }} />
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>

          <div style={{ marginTop:24, padding:'16px 14px', borderTop:'1px solid rgba(198,145,76,0.08)' }}>
            <div style={{ fontSize:11, color:'#5A5A62', lineHeight:1.6 }}>
              وسيط عقاري مرخّص<br />
              <span style={{ color:'#C6914C' }}>رخصة فال</span>
            </div>
          </div>
        </aside>

        {/* ═══════ MAIN CONTENT ═══════ */}
        <main className="dash-main flex-1" style={{ minHeight:'calc(100vh - 64px)' }}>
          {children}
        </main>
      </div>

      <Toaster
        position="top-center"
        dir="rtl"
        toastOptions={{
          style: {
            background: '#16161A',
            border: '1px solid rgba(193,141,74,0.2)',
            color: '#F5F5F5',
            fontFamily: "'Tajawal', sans-serif",
            fontSize: 14,
            borderRadius: 12,
          },
        }}
      />
    </div>
  );
}
