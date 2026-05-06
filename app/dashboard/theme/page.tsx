import { redirect } from "next/navigation";

// ── Legacy: تم استبدالها بقسم "التصميم" داخل /dashboard/settings ──
// كانت تكتب لحقول قديمة (accent_color, font_family) لا يقرأها النظام.
// المصدر الموحَّد للثيم الآن: site_settings.color_*  + font_size_*
// تاريخ الدمج: 6 مايو 2026
export default function LegacyThemeRedirect() {
  redirect("/dashboard/settings?tab=design");
}
