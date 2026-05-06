import { redirect } from "next/navigation";

// ── Legacy: تم استبدالها بـ /dashboard/settings (الإعدادات الموحَّدة) ──
// تاريخ الدمج: 6 مايو 2026
export default function LegacySiteSettingsRedirect() {
  redirect("/dashboard/settings");
}
