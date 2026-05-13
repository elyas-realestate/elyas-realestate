"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, FileText, Settings as SettingsIcon } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// /dashboard/whatsapp Hub Layout
// تبويبات لوحدة WhatsApp (محادثات / قوالب / إعدادات)
// ══════════════════════════════════════════════════════════════

const TABS = [
  { href: "/dashboard/whatsapp/inbox", label: "المحادثات", icon: Inbox },
  { href: "/dashboard/whatsapp", label: "قوالب + استيراد", icon: FileText, exact: true },
  { href: "/dashboard/whatsapp/settings", label: "الإعدادات", icon: SettingsIcon },
];

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div dir="rtl" className="space-y-3">
      {/* تبويبات فقط — العنوان والوصف من صفحة كل tab */}
      <div
        className="flex flex-wrap gap-1 rounded-xl p-1"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        {TABS.map((t) => {
          const active = isActive(t.href, t.exact);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm no-underline transition"
              style={{
                background: active ? "var(--gold-bg)" : "transparent",
                color: active ? "var(--gold-2)" : "var(--text-soft)",
                fontWeight: active ? 700 : 500,
                border: `1px solid ${active ? "var(--gold-2)" : "transparent"}`,
              }}
            >
              <t.icon size={14} />
              {t.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
