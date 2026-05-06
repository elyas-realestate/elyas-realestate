import { redirect } from "next/navigation";

// ── Legacy: تم دمج /property-requests مع /requests (نفس جدول property_requests) ──
// تاريخ الدمج: 6 مايو 2026
export default function LegacyPropertyRequestsRedirect() {
  redirect("/dashboard/requests");
}
