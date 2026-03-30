"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Home, Users, FileText, TrendingUp, CheckSquare, Megaphone, Settings } from "lucide-react";

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
];

export default function Dashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState({ properties: 0, clients: 0, deals: 0, tasks: 0 });

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
    } else {
      setChecking(false);
      loadStats();
    }
  }

  async function loadStats() {
    const [p, c, d, t] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }).neq("current_stage", "مكتملة"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "مكتملة"),
    ]);
    setStats({ properties: p.count || 0, clients: c.count || 0, deals: d.count || 0, tasks: t.count || 0 });
  }

  if (checking) return <div className="flex items-center justify-center h-64">...</div>;

  const statCards = [
    { label: "العقارات", value: stats.properties, color: "bg-[#C9A84C]" },
    { label: "العملاء", value: stats.clients, color: "bg-green-600" },
    { label: "الصفقات الجارية", value: stats.deals, color: "bg-yellow-600" },
    { label: "المهام المعلقة", value: stats.tasks, color: "bg-red-600" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">نظرة عامة</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-[#16161A] rounded-xl p-6 border border-[rgba(201,168,76,0.12)]">
            <div className={"w-3 h-3 rounded-full " + stat.color + " mb-4"}></div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-[#9A9AA0] text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
      <h3 className="text-lg font-semibold mb-4">وصول سريع</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.slice(0, 6).map((item) => (
          <Link key={item.href} href={item.href} className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 flex items-center gap-4 hover:bg-[#1C1C22] transition">
            <item.icon size={24} className="text-[#C9A84C]" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}