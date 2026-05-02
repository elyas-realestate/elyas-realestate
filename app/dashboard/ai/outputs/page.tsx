"use client";

import Link from "next/link";
import { Megaphone, MessageCircle, BarChart3, ChevronLeft, Inbox } from "lucide-react";

export default function OutputsTab() {
  return (
    <div className="space-y-4">
      <div className="text-sm" style={{ color: "var(--text-faint)" }}>
        كل ما أنتجه المساعدون ينتظر مراجعتك في مكان واحد.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <OutputCard
          href="/dashboard/marketing/queue"
          icon={<Megaphone size={20} />}
          title="منشورات تسويقية"
          desc="منشورات للعقارات الجديدة، تنتظر اعتمادك قبل النشر"
          color="var(--gold-2)"
        />
        <OutputCard
          href="/dashboard/clients/followups"
          icon={<MessageCircle size={20} />}
          title="رسائل متابعة"
          desc="رسائل واتساب لعملاء باردين، تنتظر إرسالك"
          color="var(--info, #5b9bf6)"
        />
        <OutputCard
          href="/dashboard/insights"
          icon={<BarChart3 size={20} />}
          title="تقارير المحلل"
          desc="تقارير أسبوعية عن أداء العقارات والصفقات"
          color="var(--success)"
        />
      </div>

      <div className="rounded-xl p-4 text-xs" style={{
        background: "var(--bg-surface-2)",
        border: "1px dashed var(--gold-bg)",
        color: "var(--text-faint)",
      }}>
        💡 المحتوى لا يُنشر تلقائياً — كل شي يمر عليك أولاً.
      </div>
    </div>
  );
}

function OutputCard({ href, icon, title, desc, color }: { href: string; icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <Link href={href} className="rounded-xl p-4 no-underline block transition" style={{
      background: "var(--bg-surface-1)",
      border: "1px solid var(--gold-bg)",
    }}>
      <div className="flex items-center justify-between mb-2">
        <div style={{ color }}>{icon}</div>
        <ChevronLeft size={14} style={{ color: "var(--text-faint)" }} />
      </div>
      <div className="font-bold text-sm mb-1" style={{ color: "var(--text-strong)" }}>{title}</div>
      <div className="text-xs" style={{ color: "var(--text-faint)" }}>{desc}</div>
    </Link>
  );
}
