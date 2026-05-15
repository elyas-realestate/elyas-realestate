// ══════════════════════════════════════════════════════════════
// NotificationsTab — تبويب الإشعارات
// ══════════════════════════════════════════════════════════════
// أبسط tab — لا state، فقط روابط لإعدادات الإشعارات المفصّلة.
// ══════════════════════════════════════════════════════════════

import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";

export function NotificationsTab() {
  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--gold-bg-hover)" }}
          >
            <Bell size={20} className="text-[var(--gold-2)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-strong)" }}>
              الإشعارات والتنبيهات
            </h3>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              استلام تنبيهات فورية على جوالك أو متصفحك
            </p>
          </div>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--text-soft)", lineHeight: 1.8 }}>
          تحكّم في إشعارات لوحة التحكم: عملاء جدد، صفقات قيد التفاوض، عقود تنتظر التوقيع، ومتابعات
          AI. يمكنك تفعيلها على هاتفك (PWA) أو على متصفحك مباشرة.
        </p>
        <Link
          href="/dashboard/settings/notifications"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold no-underline transition"
          style={{
            background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: "var(--bg-page)",
          }}
        >
          <Bell size={15} /> إعدادات الإشعارات الكاملة <ArrowRight size={14} />
        </Link>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: "var(--gold-bg-soft)", border: "1px solid var(--gold-bg)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-soft)", lineHeight: 1.7 }}>
          💡 <strong>نصيحة:</strong> ثبّت تطبيق وسيط برو على جوالك (iOS / Android) لاستلام
          الإشعارات في خلفية الجهاز، حتى عند إغلاق المتصفح. التثبيت يستغرق ٣٠ ثانية ولا يحتاج App
          Store.
        </p>
      </div>
    </div>
  );
}
