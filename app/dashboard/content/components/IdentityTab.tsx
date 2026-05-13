"use client";

import Link from "next/link";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// IdentityTab — banner only (تم نقل التحرير لـ /dashboard/settings)
//
// المصدر الموحَّد لهوية الوسيط الآن: /dashboard/settings → الملف الشخصي
// هذا التبويب كان يكرّر نفس الحقول. أبقيناه كـ pointer لتفادي إرباك المستخدم.
// ══════════════════════════════════════════════════════════════
export default function IdentityTab() {
  return (
    <div dir="rtl" className="mx-auto max-w-2xl px-4 py-10">
      <div
        className="space-y-4 rounded-2xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(232,184,109,0.10), rgba(200,149,76,0.04))",
          border: "1px solid var(--gold-bg)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
          }}
        >
          <Sparkles size={28} color="#0A0A0C" />
        </div>

        <h2 className="text-xl font-bold" style={{ color: "var(--text-strong)" }}>
          هوية الوسيط انتقلت إلى الإعدادات
        </h2>

        <p
          className="text-sm leading-7"
          style={{ color: "var(--text-soft)", maxWidth: 480, margin: "0 auto" }}
        >
          لتجنّب التكرار، اسمك وتخصصك ووصفك وأسلوب كتابتك أصبحت تُحرَّر من مكان واحد فقط. الذكاء
          الاصطناعي للمحتوى يقرأ منها مباشرة — أي تعديل يظهر فوراً في كل المنصة.
        </p>

        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold no-underline"
          style={{
            background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
            color: "#0A0A0C",
          }}
        >
          <Settings size={14} /> فتح الإعدادات
          <ArrowLeft size={14} />
        </Link>

        <p className="pt-2 text-xs" style={{ color: "var(--text-faint)" }}>
          المصدر الواحد للحقيقة (Single Source of Truth) — نظام أنظف وأقل إرباكاً.
        </p>
      </div>
    </div>
  );
}
