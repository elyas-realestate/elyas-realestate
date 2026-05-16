"use client";

import { useState } from "react";
import Breadcrumb from "../../components/Breadcrumb";
import { FileText, TrendingUp, Calendar, Printer } from "lucide-react";

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  function openReport() {
    window.open(`/api/report/monthly?year=${year}&month=${month}`, "_blank");
  }

  // اختصارات زمنية
  function setThisMonth() {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }
  function setLastMonth() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  // 5 سنوات للخلف + السنة الحالية
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "التقارير" }]} />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <FileText className="h-6 w-6 text-[var(--gold-2)]" />
          التقارير الشهرية
        </h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          تقرير شامل لأداء أعمالك خلال الشهر — جاهز للطباعة أو الإرسال كملف PDF.
        </p>
      </div>

      {/* ── البطاقة الرئيسية ── */}
      <div className="space-y-5 rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold-4)]">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white">تقرير الأداء الشهري</h2>
            <p className="mt-0.5 text-xs text-[var(--text-soft)]">
              يتضمّن: العقارات • الصفقات • الإيرادات • الفواتير • العقارات الراكدة
            </p>
          </div>
        </div>

        {/* ── اختصارات ── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={setThisMonth}
            className="rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs text-white transition hover:bg-[#26262C]"
          >
            هذا الشهر
          </button>
          <button
            onClick={setLastMonth}
            className="rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs text-white transition hover:bg-[#26262C]"
          >
            الشهر الماضي
          </button>
        </div>

        {/* ── اختيار الشهر/السنة ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-soft)]">الشهر</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 py-2.5 text-white outline-none focus:border-[var(--gold-2)]"
            >
              {MONTHS_AR.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-soft)]">السنة</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 py-2.5 text-white outline-none focus:border-[var(--gold-2)]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── زر التوليد ── */}
        <button
          onClick={openReport}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-4)] py-4 text-lg font-bold text-white transition hover:from-[#d49f5c] hover:to-[#996a38]"
        >
          <Printer className="h-5 w-5" />
          توليد التقرير — {MONTHS_AR[month - 1]} {year}
        </button>

        <p className="text-center text-xs text-[var(--text-faint)]">
          سيُفتح في نافذة جديدة. لحفظه كـ PDF، اضغط "حفظ كـ PDF" من نافذة الطباعة.
        </p>
      </div>

      {/* ── محتوى التقرير ── */}
      <div className="rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-6">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-white">
          <Calendar className="h-4 w-4 text-[var(--gold-2)]" />
          ماذا يحتوي التقرير؟
        </h3>
        <ul className="space-y-2 text-sm text-[var(--text-soft)]">
          <li className="flex gap-2">
            <span className="text-[var(--gold-2)]">•</span>صفحة غلاف احترافية باسم مكتبك وشعاره
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--gold-2)]">•</span>إحصائيات: عقارات جديدة، عملاء جدد، صفقات
            (جديدة ومُغلقة)
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--gold-2)]">•</span>الإيرادات: فواتير مدفوعة/معلّقة/متأخّرة +
            عمولات الصفقات المُغلقة
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--gold-2)]">•</span>مخطط توزيع النشاط الأسبوعي
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--gold-2)]">•</span>قائمة آخر 5 عقارات منشورة
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--gold-2)]">•</span>تنبيهات: عقارات راكدة + فواتير متأخّرة
          </li>
        </ul>
      </div>
    </div>
  );
}
