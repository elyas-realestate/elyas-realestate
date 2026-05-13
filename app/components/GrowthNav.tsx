"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, Brain, Share2, TrendingUp } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// GrowthNav — شريط تنقل موحَّد لصفحات النمو الـ ٣:
//   - /dashboard/marketing  (الحملات + المقارنة)
//   - /dashboard/content    (المحتوى الذكي + الترندات)
//   - /dashboard/distribute (نشر العقارات على المنصات)
//
// يُدرج في رأس كل صفحة من الثلاث ليعطي المستخدم وعياً بأنها مجموعة واحدة.
// ══════════════════════════════════════════════════════════════

const TABS = [
  { href: "/dashboard/content", label: "المحتوى الذكي", icon: Brain, desc: "صناعة + خطة + ترندات" },
  {
    href: "/dashboard/marketing",
    label: "الحملات",
    icon: Megaphone,
    desc: "تسويق + مقارنة العقارات",
  },
  {
    href: "/dashboard/distribute",
    label: "التوزيع",
    icon: Share2,
    desc: "نشر على المنصات الخارجية",
  },
];

export default function GrowthNav() {
  const pathname = usePathname() || "";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div dir="rtl" className="mb-4">
      {/* رأس صغير */}
      <div className="mb-2 flex items-center gap-2">
        <TrendingUp size={14} style={{ color: "var(--gold-2)" }} />
        <span className="text-xs font-bold" style={{ color: "var(--text-soft)" }}>
          مركز النمو
        </span>
      </div>

      {/* تبويبات */}
      <div
        className="grid grid-cols-1 gap-2 rounded-xl p-1.5 md:grid-cols-3"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        {TABS.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 no-underline transition"
              style={{
                background: active ? "var(--gold-bg)" : "transparent",
                border: `1px solid ${active ? "var(--gold-2)" : "transparent"}`,
              }}
            >
              <t.icon
                size={14}
                style={{ color: active ? "var(--gold-2)" : "var(--text-soft)", flexShrink: 0 }}
              />
              <div className="min-w-0 flex-1">
                <div
                  className="text-xs"
                  style={{
                    color: active ? "var(--gold-2)" : "var(--text-strong)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {t.label}
                </div>
                <div className="truncate text-xs" style={{ color: "var(--text-faint)" }}>
                  {t.desc}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
