"use client";

import { useState } from "react";
import Breadcrumb from "../../components/Breadcrumb";
import { FileText, Download, TrendingUp, Calendar, Printer } from "lucide-react";

const MONTHS_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
];

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "التقارير" }]} />

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-[#C6914C]" />
          التقارير الشهرية
        </h1>
        <p className="text-sm text-[#8A8A92] mt-1">
          تقرير شامل لأداء أعمالك خلال الشهر — جاهز للطباعة أو الإرسال كملف PDF.
        </p>
      </div>

      {/* ── البطاقة الرئيسية ── */}
      <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C6914C] to-[#8A5F2E] flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white">تقرير الأداء الشهري</h2>
            <p className="text-xs text-[#8A8A92] mt-0.5">يتضمّن: العقارات • الصفقات • الإيرادات • الفواتير • العقارات الراكدة</p>
          </div>
        </div>

        {/* ── اختصارات ── */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={setThisMonth}
            className="px-3 py-1.5 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] hover:bg-[#26262C] rounded-lg text-xs text-white transition"
          >
            هذا الشهر
          </button>
          <button
            onClick={setLastMonth}
            className="px-3 py-1.5 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] hover:bg-[#26262C] rounded-lg text-xs text-white transition"
          >
            الشهر الماضي
          </button>
        </div>

        {/* ── اختيار الشهر/السنة ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#8A8A92] mb-1.5">الشهر</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="w-full bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2.5 text-white focus:border-[#C6914C] outline-none"
            >
              {MONTHS_AR.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8A8A92] mb-1.5">السنة</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2.5 text-white focus:border-[#C6914C] outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── زر التوليد ── */}
        <button
          onClick={openReport}
          className="w-full py-4 bg-gradient-to-r from-[#C6914C] to-[#8A5F2E] hover:from-[#d49f5c] hover:to-[#996a38] text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 transition"
        >
          <Printer className="h-5 w-5" />
          توليد التقرير — {MONTHS_AR[month - 1]} {year}
        </button>

        <p className="text-xs text-[#5A5A62] text-center">
          سيُفتح في نافذة جديدة. لحفظه كـ PDF، اضغط "حفظ كـ PDF" من نافذة الطباعة.
        </p>
      </div>

      {/* ── محتوى التقرير ── */}
      <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#C6914C]" />
          ماذا يحتوي التقرير؟
        </h3>
        <ul className="space-y-2 text-sm text-[#9A9AA0]">
          <li className="flex gap-2"><span className="text-[#C6914C]">•</span>صفحة غلاف احترافية باسم مكتبك وشعاره</li>
          <li className="flex gap-2"><span className="text-[#C6914C]">•</span>إحصائيات: عقارات جديدة، عملاء جدد، صفقات (جديدة ومُغلقة)</li>
          <li className="flex gap-2"><span className="text-[#C6914C]">•</span>الإيرادات: فواتير مدفوعة/معلّقة/متأخّرة + عمولات الصفقات المُغلقة</li>
          <li className="flex gap-2"><span className="text-[#C6914C]">•</span>مخطط توزيع النشاط الأسبوعي</li>
          <li className="flex gap-2"><span className="text-[#C6914C]">•</span>قائمة آخر 5 عقارات منشورة</li>
          <li className="flex gap-2"><span className="text-[#C6914C]">•</span>تنبيهات: عقارات راكدة + فواتير متأخّرة</li>
        </ul>
      </div>
    </div>
  );
}
