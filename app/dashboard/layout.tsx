"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import {
  Users,
  FileText,
  TrendingUp,
  CheckSquare,
  Megaphone,
  Settings,
  LogOut,
  ExternalLink,
  Building2,
  LayoutDashboard,
  Menu,
  X,
  BarChart3,
  CreditCard,
  Plus,
  Bell,
  Banknote,
  Shield,
  ShieldCheck,
  Brain,
  MessageCircle,
  KeyRound,
  AlertTriangle,
  Wrench,
  Package,
  Upload,
  Share2,
  FileSignature,
  Crown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Building,
  Search,
  Inbox,
  Sparkles,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import AIAssistant from "@/components/AIAssistant";
import LangToggle from "@/components/LangToggle";
import BrandColorProvider from "@/app/components/BrandColorProvider";
import { useMyRole, ROLE_LABELS, PERMS } from "@/lib/use-my-role";
import type { LucideIcon } from "lucide-react";
import type { PropertyRequest, Client, Deal } from "@/types/database";

type NavItemData = { label: string; href: string; icon: LucideIcon };
type NavGroup = {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItemData[];
  officeOnly?: boolean;
};

// ═══════════════════════════════════════════════════════════════
// PRIMARY — هيكل ٧ عناصر بناءً على تقرير CIB (Miller's Law)
// ٥ يومية + المالية + الإعدادات. كل واحد يقود لـ hub بداخله sub-pages.
// ═══════════════════════════════════════════════════════════════
const primaryItems: NavItemData[] = [
  { label: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
  { label: "يومي", href: "/dashboard/today", icon: CheckSquare },
  { label: "العملاء", href: "/dashboard/clients", icon: Users },
  { label: "العقارات", href: "/dashboard/properties", icon: Building2 },
  { label: "الذكاء الصناعي", href: "/dashboard/ai", icon: Sparkles },
  { label: "المالية", href: "/dashboard/financial", icon: Banknote },
];

// ═══════════════════════════════════════════════════════════════
// SECONDARY — مجموعات قابلة للطي: العمل اليومي + أدوات + إدارة الأملاك
// "إدارة الأملاك" تظهر فقط لو office_mode_enabled = true
// ═══════════════════════════════════════════════════════════════
const secondaryGroups: NavGroup[] = [
  {
    id: "work",
    title: "العمل اليومي",
    icon: Briefcase,
    items: [
      { label: "الصفقات", href: "/dashboard/deals", icon: TrendingUp },
      { label: "المهام", href: "/dashboard/tasks", icon: CheckSquare },
      { label: "طلبات العقار", href: "/dashboard/requests", icon: Inbox },
    ],
  },
  {
    id: "tools",
    title: "أدوات",
    icon: BarChart3,
    items: [
      { label: "بطاقتي التعريفية", href: "/dashboard/profile-card", icon: Sparkles },
      { label: "محادثات WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
      { label: "المحتوى التسويقي", href: "/dashboard/marketing", icon: Megaphone },
      { label: "محتوى الذكاء الصناعي", href: "/dashboard/content", icon: Brain },
      { label: "توزيع العقارات", href: "/dashboard/distribute", icon: Share2 },
      { label: "العقود", href: "/dashboard/contracts", icon: FileSignature },
      { label: "المستندات", href: "/dashboard/documents", icon: FileText },
      { label: "التقارير والتحليل", href: "/dashboard/insights", icon: FileText },
      { label: "استيراد CSV", href: "/dashboard/import", icon: Upload },
    ],
  },
  // ── يظهر فقط في "وضع المكتب" (office_mode_enabled = true) ──
  {
    id: "office",
    title: "إدارة الأملاك (وضع المكتب)",
    icon: Building,
    officeOnly: true,
    items: [
      { label: "المشاريع", href: "/dashboard/projects", icon: Building2 },
      { label: "بوابة المستأجر", href: "/dashboard/tenant-portal", icon: KeyRound },
      { label: "أوامر العمل", href: "/dashboard/work-orders", icon: Wrench },
      { label: "الأصول", href: "/dashboard/assets", icon: Package },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// SETTINGS MENU — يفتح كـ Popover من زر Settings في الـ footer
// ═══════════════════════════════════════════════════════════════
// تم تبسيط: حذف 3 عناصر AI (نقلت لـ /dashboard/ai)
// ─── Settings menu ───
// ٧ عناصر فقط (بدلاً من ١٠): حذفنا التكرارات (المظهر داخل /settings، CEO Identity داخل /ceo، الإشعارات لها صفحة منفصلة بسيطة)
const settingsMenu: NavItemData[] = [
  { label: "الإعدادات العامة", href: "/dashboard/settings", icon: Settings },
  { label: "لوحة الرئيس التنفيذي", href: "/dashboard/ceo", icon: Crown },
  { label: "مركز المساعدة", href: "/dashboard/help", icon: HelpCircle },
  { label: "الفريق", href: "/dashboard/team", icon: Users },
  { label: "الاشتراك", href: "/dashboard/subscription", icon: CreditCard },
  { label: "سجل التدقيق", href: "/dashboard/audit", icon: Shield },
  { label: "الأمان (2FA)", href: "/dashboard/security", icon: ShieldCheck },
];

// كل العناصر مدمجة (للبحث السريع Command Palette)
const allItemsForSearch = (() => {
  const all: NavItemData[] = [...primaryItems];
  secondaryGroups.forEach((g) => all.push(...g.items));
  all.push(...settingsMenu);
  return all;
})();

function NavItem({
  item,
  isActive,
  badge,
}: {
  item: NavItemData;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-3 no-underline transition-all"
      style={{
        padding: "9px 12px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? "var(--gold-2)" : "#6A6A72",
        background: isActive ? "var(--gold-bg-soft)" : "transparent",
        borderRight: isActive ? "3px solid var(--gold-2)" : "3px solid transparent",
        marginBottom: 1,
      }}
    >
      <item.icon
        size={17}
        style={{
          color: isActive ? "var(--gold-2)" : "#6A6A72",
          flexShrink: 0,
          transition: "color 0.2s",
        }}
      />
      <span style={{ flex: 1, lineHeight: 1 }}>{item.label}</span>
      {badge && badge > 0 ? (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--bg-page)",
            background: "var(--gold-2)",
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
  const [brokerSlug, setBrokerSlug] = useState("");
  const [officeMode, setOfficeMode] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [renewalDaysLeft, setRenewalDaysLeft] = useState<number | null>(null);
  const [renewalPlan, setRenewalPlan] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { role } = useMyRole();

  useEffect(() => {
    checkAuth();
  }, []);
  useEffect(() => {
    setSidebarOpen(false);
    setSettingsOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // استرجاع حالة طيّ المجموعات من localStorage + فتح المجموعة التي تحوي المسار النشط
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wasit_sidebar_groups");
      const initial: Record<string, boolean> = saved ? JSON.parse(saved) : {};
      // افتح المجموعة التي تحوي الصفحة النشطة تلقائياً
      secondaryGroups.forEach((g) => {
        if (g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))) {
          initial[g.id] = true;
        }
      });
      setExpandedGroups(initial);
    } catch {
      /* تجاهل */
    }
  }, [pathname]);

  function toggleGroup(id: string) {
    setExpandedGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("wasit_sidebar_groups", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  // اغلاق Popover الإعدادات عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  // Command Palette — Cmd/Ctrl + K (نسخة مبسّطة بدون stopPropagation)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = (e.key || "").toLowerCase();
      // Cmd/Ctrl + K → فتح/إغلاق
      if ((e.metaKey || e.ctrlKey) && (k === "k" || e.code === "KeyK")) {
        e.preventDefault();
        setSearchOpen((v) => !v);
        setSearchQuery("");
        return;
      }
      // Escape → إغلاق كل popups
      if (k === "escape") {
        setSearchOpen(false);
        setSettingsOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // cleanup realtime on unmount
  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  async function checkAuth() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      window.location.href = "/login";
      return;
    }
    setAuthorized(true);

    const [
      { count },
      { data: identity },
      { data: ownedTenant },
      { data: siteSettings },
      { data: membership },
      { data: superAdminCheck },
    ] = await Promise.all([
      supabase
        .from("property_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "جديد"),
      supabase.from("broker_identity").select("broker_name").limit(1).maybeSingle(),
      supabase
        .from("tenants")
        .select("slug, office_mode_enabled")
        .eq("owner_id", user.id)
        .maybeSingle(),
      supabase.from("site_settings").select("plan, plan_expires_at").limit(1).maybeSingle(),
      supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase.rpc("is_super_admin"),
    ]);
    setIsSuperAdmin(!!superAdminCheck);
    setNewRequests(count || 0);
    if (identity?.broker_name) setBrokerName(identity.broker_name);
    // resolve slug: owner first, else fetch by membership tenant_id
    if (ownedTenant?.slug) {
      setBrokerSlug(ownedTenant.slug);
      setOfficeMode(!!ownedTenant.office_mode_enabled);
    } else if (membership?.tenant_id) {
      const { data: memberTenant } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", membership.tenant_id)
        .maybeSingle();
      if (memberTenant?.slug) setBrokerSlug(memberTenant.slug);
    }

    // ── تحقق من انتهاء الاشتراك ──
    if (siteSettings?.plan_expires_at && siteSettings.plan !== "free") {
      const expiresAt = new Date(siteSettings.plan_expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays > 0) {
        setRenewalDaysLeft(diffDays);
        setRenewalPlan(siteSettings.plan || "");
      } else if (diffDays <= 0) {
        setRenewalDaysLeft(0);
        setRenewalPlan(siteSettings.plan || "");
      }
    }

    // ── Realtime subscriptions ──
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "property_requests" },
        (payload) => {
          const r = payload.new as PropertyRequest;
          setNewRequests((n) => n + 1);
          setNotifCount((n) => n + 1);
          toast("🏠 طلب عقار جديد", {
            description: `${r.request_type || "طلب"} · ${r.main_category || ""} · ميزانية ${r.budget_min ? Number(r.budget_min).toLocaleString() + " ر.س" : "غير محددة"}`,
            action: {
              label: "عرض",
              onClick: () => {
                window.location.href = "/dashboard/requests";
              },
            },
            duration: 7000,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clients" },
        (payload) => {
          // ملاحظة: realtime payload قد يحتوي حقولاً إضافية لم تظهر بعد في schema الحالي
          const c = payload.new as Client & { source?: string | null };
          setNotifCount((n) => n + 1);
          toast("👤 عميل جديد", {
            description: `${c.full_name || "عميل"} · ${c.phone || ""} · من ${c.source || "غير محدد"}`,
            action: {
              label: "عرض",
              onClick: () => {
                window.location.href = "/dashboard/clients";
              },
            },
            duration: 6000,
          });
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "deals" }, (payload) => {
        const d = payload.new as Deal;
        setNotifCount((n) => n + 1);
        toast("🤝 صفقة جديدة", {
          description: `${d.title || "صفقة"} · ${d.deal_type || ""}`,
          action: {
            label: "عرض",
            onClick: () => {
              window.location.href = "/dashboard/deals";
            },
          },
          duration: 6000,
        });
      })
      .subscribe();

    channelRef.current = channel;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Current page label
  const currentPage = allItemsForSearch.find(
    (m) => pathname === m.href || (m.href !== "/dashboard" && pathname.startsWith(m.href))
  );

  if (!authorized)
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg-page)" }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: "var(--gold-bg-strong)", borderTopColor: "var(--gold-2)" }}
        />
      </div>
    );

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      style={{ background: "var(--bg-page)", color: "var(--text-strong)" }}
    >
      <BrandColorProvider />
      <style>{`
        .dash-sidebar {
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .dash-sidebar.open { transform: translateX(0); }
        .dash-main { margin-right: 0; padding: 20px 16px; }
        .dash-nav-item:hover { color: var(--gold-2) !important; background: rgba(198,145,76,0.05) !important; }
        @media (min-width: 768px) {
          .dash-sidebar { transform: translateX(0) !important; }
          .dash-main { margin-right: 240px; padding: 28px 32px; }
        }
        nav::-webkit-scrollbar { width: 3px; }
        nav::-webkit-scrollbar-thumb { background: var(--gold-bg-hover); border-radius: 4px; }
      `}</style>

      {/* ═══════ HEADER ═══════ */}
      <header
        className="fixed top-0 right-0 left-0 z-40 flex items-center justify-between"
        style={{
          height: 60,
          padding: "0 20px",
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--gold-bg-soft)",
        }}
      >
        {/* Right: hamburger + page title */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center justify-center rounded-lg transition md:hidden"
            style={{
              width: 36,
              height: 36,
              background: "var(--gold-bg-soft)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)",
            }}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Page title — desktop */}
          {currentPage && (
            <div className="hidden items-center gap-2 md:flex">
              <currentPage.icon size={16} style={{ color: "var(--gold-2)" }} />
              <span
                className="font-cairo font-semibold"
                style={{ fontSize: 15, color: "var(--text-on-dark)" }}
              >
                {currentPage.label}
              </span>
            </div>
          )}
        </div>

        {/* Left: actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/requests"
            className="relative flex items-center justify-center rounded-lg no-underline transition"
            style={{
              width: 36,
              height: 36,
              background: newRequests > 0 ? "var(--gold-bg-soft)" : "rgba(198,145,76,0.04)",
              border: `1px solid ${newRequests > 0 ? "var(--gold-bg-hover)" : "var(--gold-bg-soft)"}`,
              color: newRequests > 0 ? "var(--gold-2)" : "var(--text-faint)",
            }}
          >
            <Bell size={16} />
            {(newRequests > 0 || notifCount > 0) && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: -4,
                  left: -4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "var(--danger)",
                  border: "1.5px solid var(--bg-page)",
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#fff",
                  padding: "0 3px",
                }}
              >
                {notifCount > 0
                  ? notifCount > 9
                    ? "9+"
                    : notifCount
                  : newRequests > 9
                    ? "9+"
                    : newRequests}
              </span>
            )}
          </Link>
          {/* LangToggle مخفي على الموبايل — متاح في popover الإعدادات */}
          <div className="hidden lg:block">
            <LangToggle />
          </div>
          <Link
            href="/search"
            target="_blank"
            className="hidden items-center gap-1.5 no-underline transition sm:flex"
            style={{
              color: "var(--text-faint)",
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgba(198,145,76,0.04)",
              border: "1px solid var(--gold-bg-soft)",
            }}
          >
            <ExternalLink size={13} />
            <span>صفحة البحث</span>
          </Link>
          <Link
            href="/mortgage"
            target="_blank"
            className="hidden items-center gap-1.5 no-underline transition sm:flex"
            style={{
              color: "var(--text-faint)",
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgba(198,145,76,0.04)",
              border: "1px solid var(--gold-bg-soft)",
            }}
          >
            <ExternalLink size={13} />
            <span>التمويل</span>
          </Link>
          {brokerSlug && (
            <Link
              href={`/${brokerSlug}`}
              target="_blank"
              title={`زيارة موقعك العام (/${brokerSlug})`}
              className="hidden items-center gap-1.5 no-underline transition sm:flex"
              style={{
                color: "var(--gold-2)",
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 8,
                background: "var(--gold-bg-soft)",
                border: "1px solid var(--gold-bg-hover)",
                fontWeight: 600,
              }}
            >
              <ExternalLink size={13} />
              <span>زيارة موقعي</span>
            </Link>
          )}
          {/* تتبّع المشروع — عرض مؤقّت بارز للمالك */}
          <Link
            href="/dashboard/project-tracker"
            className="hidden items-center gap-1.5 no-underline transition sm:flex"
            style={{
              color: "var(--bg-page)",
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              border: "none",
              fontWeight: 700,
            }}
          >
            <BarChart3 size={13} />
            <span>تتبّع المشروع</span>
          </Link>
        </div>
      </header>

      {/* ═══════ RENEWAL BANNER ═══════ */}
      {renewalDaysLeft !== null && (
        <div
          style={{
            position: "fixed",
            top: 60,
            left: 0,
            right: 0,
            zIndex: 39,
            background:
              renewalDaysLeft === 0
                ? "linear-gradient(90deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))"
                : "linear-gradient(90deg, rgba(234,179,8,0.95), rgba(161,98,7,0.95))",
            backdropFilter: "blur(12px)",
            padding: "9px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
            color: renewalDaysLeft === 0 ? "#fff" : "var(--bg-page)",
          }}
        >
          <AlertTriangle size={15} />
          <span>
            {renewalDaysLeft === 0
              ? `انتهى اشتراكك (${renewalPlan}) — جدّد الآن للحفاظ على وصولك الكامل`
              : `اشتراكك (${renewalPlan}) ينتهي خلال ${renewalDaysLeft} ${renewalDaysLeft === 1 ? "يوم" : "أيام"} — جدّد قبل الانتهاء`}
          </span>
          <Link
            href="/dashboard/subscription"
            style={{
              padding: "4px 14px",
              borderRadius: 7,
              background:
                renewalDaysLeft === 0 ? "rgba(255,255,255,0.2)" : "var(--shadow-overlay-3)",
              border: `1px solid ${renewalDaysLeft === 0 ? "rgba(255,255,255,0.3)" : "var(--shadow-overlay-2)"}`,
              color: renewalDaysLeft === 0 ? "#fff" : "var(--bg-page)",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            تجديد الاشتراك
          </Link>
        </div>
      )}

      <div className="flex" style={{ paddingTop: renewalDaysLeft !== null ? 98 : 60 }}>
        {/* Overlay — mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: "var(--modal-overlay)", backdropFilter: "blur(3px)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══════ SIDEBAR ═══════ */}
        <aside
          className={"dash-sidebar fixed right-0 bottom-0 z-30" + (sidebarOpen ? " open" : "")}
          style={{
            top: renewalDaysLeft !== null ? 98 : 60,
            width: 240,
            background: "var(--sidebar-bg)",
            borderLeft: "1px solid rgba(198,145,76,0.07)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* ── Sidebar inline (no wrapper component — prevents scroll reset on navigation) ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              height: "100%",
              minHeight: 0,
            }}
          >
            {/* Logo */}
            <div style={{ padding: "20px 16px 16px" }}>
              <div className="flex items-center gap-3">
                <div
                  className="font-cairo flex items-center justify-center font-black"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: "linear-gradient(135deg,var(--gold-2),var(--gold-4))",
                    color: "var(--bg-page)",
                    fontSize: 17,
                    flexShrink: 0,
                    boxShadow: "0 4px 12px var(--gold-bg-strong)",
                  }}
                >
                  و
                </div>
                <div>
                  <div
                    className="font-cairo font-bold"
                    style={{ fontSize: 14, color: "var(--text-strong)", lineHeight: 1.2 }}
                  >
                    وسيط برو
                  </div>
                  <div style={{ fontSize: 10, color: "var(--gold-2)", fontWeight: 500 }}>
                    لوحة التحكم
                  </div>
                </div>
              </div>
            </div>

            {/* New Property CTA — يفتح نموذج الإضافة مباشرة */}
            <div style={{ padding: "0 12px 14px" }}>
              <Link
                href="/dashboard/properties/add"
                className="flex items-center justify-center gap-2 no-underline transition-all"
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg,rgba(198,145,76,0.18),var(--gold-bg-soft))",
                  border: "1px solid rgba(198,145,76,0.25)",
                  color: "var(--gold-2)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Plus size={15} />
                إضافة عقار
              </Link>
            </div>

            {/* Quick Search button */}
            <div style={{ padding: "0 12px 10px" }}>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-full items-center gap-2 transition-all"
                style={{
                  padding: "7px 10px",
                  borderRadius: 9,
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--gold-bg-soft)",
                  color: "var(--text-faint)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--gold-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--gold-bg-soft)";
                }}
              >
                <Search size={13} />
                <span style={{ flex: 1, textAlign: "start" }}>بحث سريع...</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: "var(--bg-surface-3)",
                    color: "var(--text-faint)",
                  }}
                >
                  ⌘K
                </span>
              </button>
            </div>

            {/* Main Nav */}
            <nav style={{ flex: 1, padding: "0 8px", overflowY: "auto", minHeight: 0 }}>
              {/* PRIMARY — العناصر اليومية */}
              <div style={{ marginBottom: 14 }}>
                {primaryItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
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

              {/* SECONDARY — مجموعات قابلة للطي. officeOnly تختفي ما لم يفعّل الوسيط "وضع المكتب" */}
              {secondaryGroups
                .filter((g) => !g.officeOnly || officeMode)
                .map((group) => {
                  const isExpanded = expandedGroups[group.id];
                  const hasActive = group.items.some(
                    (it) => pathname === it.href || pathname.startsWith(it.href + "/")
                  );
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.id} style={{ marginBottom: 4 }}>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="flex w-full items-center transition-all"
                        style={{
                          padding: "8px 12px",
                          borderRadius: 9,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          gap: 10,
                          color: hasActive ? "var(--gold-2)" : "var(--text-soft)",
                          fontSize: 12.5,
                          fontWeight: hasActive ? 600 : 500,
                          textAlign: "start",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--gold-bg-soft)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <GroupIcon
                          size={15}
                          style={{
                            color: hasActive ? "var(--gold-2)" : "var(--text-ghost)",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ flex: 1, lineHeight: 1 }}>{group.title}</span>
                        {isExpanded ? (
                          <ChevronUp size={13} style={{ color: "var(--text-faint)" }} />
                        ) : (
                          <ChevronDown size={13} style={{ color: "var(--text-faint)" }} />
                        )}
                      </button>
                      {isExpanded && (
                        <div
                          style={{
                            paddingInlineStart: 12,
                            marginTop: 2,
                            marginBottom: 6,
                            borderInlineStart: "1px solid var(--gold-bg-soft)",
                            marginInlineStart: 18,
                          }}
                        >
                          {group.items.map((item) => {
                            const isActive =
                              pathname === item.href || pathname.startsWith(item.href + "/");
                            return <NavItem key={item.href} item={item} isActive={isActive} />;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </nav>

            {/* Super Admin Panel Link — يظهر فقط لمالك المنصة */}
            {isSuperAdmin && (
              <div style={{ padding: "8px 12px 0" }}>
                <Link
                  href="/admin"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(124,58,237,0.06))",
                    border: "1px solid rgba(124,58,237,0.30)",
                    color: "#C4B5FD",
                    fontSize: 12.5,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(124,58,237,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(124,58,237,0.06))";
                  }}
                >
                  <Shield size={14} />
                  <span style={{ flex: 1 }}>لوحة إدارة المنصّة</span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "rgba(124,58,237,0.25)",
                      color: "var(--purple-ai)",
                    }}
                  >
                    مالك
                  </span>
                </Link>
              </div>
            )}

            {/* Settings button + Popover */}
            <div ref={settingsRef} style={{ padding: "6px 12px 8px", position: "relative" }}>
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                className="flex w-full items-center gap-2 transition-all"
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: settingsOpen ? "var(--gold-bg-soft)" : "transparent",
                  border: settingsOpen ? "1px solid var(--gold-bg-hover)" : "1px solid transparent",
                  color: settingsOpen ? "var(--gold-2)" : "var(--text-soft)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "start",
                }}
                onMouseEnter={(e) => {
                  if (!settingsOpen) e.currentTarget.style.background = "var(--gold-bg-soft)";
                }}
                onMouseLeave={(e) => {
                  if (!settingsOpen) e.currentTarget.style.background = "transparent";
                }}
              >
                <Settings size={15} />
                <span style={{ flex: 1 }}>الإعدادات والإدارة</span>
                <ChevronUp
                  size={12}
                  style={{
                    transform: settingsOpen ? "rotate(0deg)" : "rotate(180deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {settingsOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% - 6px)",
                    insetInlineEnd: 12,
                    insetInlineStart: 12,
                    background: "var(--bg-surface-1)",
                    border: "1px solid var(--gold-bg-hover)",
                    borderRadius: 12,
                    padding: 6,
                    boxShadow: "var(--shadow-lg)",
                    maxHeight: "60vh",
                    overflowY: "auto",
                    zIndex: 50,
                  }}
                >
                  {settingsMenu
                    .filter((item) => {
                      if (item.href === "/dashboard/subscription" && !PERMS.canManageBilling(role))
                        return false;
                      if (item.href === "/dashboard/team" && !PERMS.canManageTeam(role))
                        return false;
                      if (item.href === "/dashboard/audit" && !PERMS.canViewAuditLog(role))
                        return false;
                      if (item.href === "/dashboard/settings" && !PERMS.canManageSettings(role))
                        return false;
                      return true;
                    })
                    .map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSettingsOpen(false)}
                          className="flex items-center gap-2.5 no-underline transition-all"
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            color: isActive ? "var(--gold-2)" : "var(--text-soft)",
                            background: isActive ? "var(--gold-bg-soft)" : "transparent",
                            fontSize: 12.5,
                            fontWeight: isActive ? 600 : 500,
                            margin: "1px 0",
                          }}
                        >
                          <ItemIcon
                            size={14}
                            style={{ color: isActive ? "var(--gold-2)" : "var(--text-ghost)" }}
                          />
                          <span style={{ flex: 1 }}>{item.label}</span>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Bottom Profile */}
            <div style={{ padding: "6px 12px 16px", borderTop: "1px solid var(--gold-bg-soft)" }}>
              <div
                className="flex items-center gap-3"
                style={{
                  padding: "10px 10px",
                  borderRadius: 12,
                  background: "rgba(198,145,76,0.04)",
                }}
              >
                <div
                  className="font-cairo flex flex-shrink-0 items-center justify-center font-black"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "linear-gradient(135deg,var(--gold-2),var(--gold-4))",
                    color: "var(--bg-page)",
                    fontSize: 14,
                  }}
                >
                  {brokerName.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="truncate"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--text-on-dark)",
                      lineHeight: 1.3,
                    }}
                  >
                    {brokerName}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-faint)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>وسيط عقاري</span>
                    {role !== "none" && (
                      <span
                        style={{
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 700,
                          background:
                            role === "owner"
                              ? "rgba(250,204,21,0.15)"
                              : role === "admin"
                                ? "rgba(56,189,248,0.15)"
                                : role === "viewer"
                                  ? "rgba(148,163,184,0.15)"
                                  : "rgba(74,222,128,0.15)",
                          color:
                            role === "owner"
                              ? "var(--warning)"
                              : role === "admin"
                                ? "var(--info-2)"
                                : role === "viewer"
                                  ? "var(--text-muted)"
                                  : "var(--success)",
                        }}
                      >
                        {ROLE_LABELS[role]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="تسجيل خروج"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-faint)",
                    padding: 4,
                    borderRadius: 6,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══════ MAIN ═══════ */}
        <main
          className="dash-main flex-1"
          style={{
            minHeight: "calc(100vh - 60px)",
            minWidth: 0,
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>

      <AIAssistant />

      {/* ═══════ COMMAND PALETTE (Cmd/Ctrl + K) ═══════ */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "var(--modal-overlay)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "15vh",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--gold-bg-hover)",
              borderRadius: 14,
              width: "min(560px, 92vw)",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderBottom: "1px solid var(--gold-bg-soft)",
              }}
            >
              <Search size={16} style={{ color: "var(--text-faint)" }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في القائمة..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-strong)",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "var(--bg-surface-3)",
                  color: "var(--text-faint)",
                }}
              >
                ESC
              </span>
            </div>
            <div style={{ overflowY: "auto", padding: 6 }}>
              {(() => {
                const q = searchQuery.trim();
                const items = q
                  ? allItemsForSearch.filter((it) =>
                      it.label.toLowerCase().includes(q.toLowerCase())
                    )
                  : allItemsForSearch;
                if (items.length === 0)
                  return (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        fontSize: 13,
                        color: "var(--text-faint)",
                      }}
                    >
                      لا توجد نتائج
                    </div>
                  );
                return items.slice(0, 12).map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 no-underline transition-all"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        color: "var(--text-strong)",
                        fontSize: 13,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--gold-bg-soft)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <ItemIcon size={15} style={{ color: "var(--gold-2)" }} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: 10, color: "var(--text-faint)", direction: "ltr" }}>
                        {item.href}
                      </span>
                    </Link>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      <Toaster
        position="top-right"
        dir="ltr"
        offset={{ top: 80, right: 20 }}
        richColors
        toastOptions={{
          style: {
            fontFamily: "var(--font-tajawal), 'Tajawal', sans-serif",
            fontSize: 14,
            borderRadius: 12,
            textAlign: "right",
            direction: "rtl",
          },
        }}
      />
    </div>
  );
}
