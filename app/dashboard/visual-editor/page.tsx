import { redirect } from "next/navigation";

// ── Legacy: مكرّر تماماً مع /dashboard/settings → tab="design" ──
// تاريخ الدمج: 6 مايو 2026
export default function LegacyVisualEditorRedirect() {
  redirect("/dashboard/settings?tab=design");
}
