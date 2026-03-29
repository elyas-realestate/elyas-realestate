"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Home, Users, FileText, TrendingUp, CheckSquare, Megaphone, Settings, LogOut, Building2, Globe } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const menuItems = [
  { label: "العقارات", href: "/dashboard/properties", icon: Home },
  { label: "العملاء", href: "/dashboard/clients", icon: Users },
  { label: "الصفقات", href: "/dashboard/deals", icon: TrendingUp },
  { label: "الطلبات", href: "/dashboard/requests", icon: FileText },
  { label: "المهام", href: "/dashboard/tasks", icon: CheckSquare },
  { label: "المحتوى", href: "/dashboard/content", icon: Megaphone },
  { label: "الإعدادات", href: "/dashboard/settings", icon: Settings },
  { label: "إعدادات الموقع", href: "/dashboard/site-settings", icon: Globe },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!authorized) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">جاري التحقق...</div>;
  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-blue-400" />
          <h1 className="text-lg font-bold">إلياس الدخيل</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/properties" target="_blank" className="text-gray-400 hover:text-white text-sm">الموقع الإلكتروني</Link>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
            <LogOut size={16} />
            خروج
          </button>
        </div>
      </header>

      <div className="flex pt-16">
        <aside className="w-60 bg-gray-900 min-h-screen border-l border-gray-800 p-4 fixed top-16 right-0 bottom-0 overflow-y-auto">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={"flex items-center gap-3 px-4 py-3 rounded-lg transition " + (isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white")}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 mr-60 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}