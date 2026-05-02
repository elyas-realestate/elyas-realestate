import { redirect } from "next/navigation";

// ✓ نعيد التوجيه للصفحة الكاملة الموجودة (محتواها 457 سطر، لا داعي لتكراره).
// لاحقاً، يمكن نقل المحتوى هنا مباشرة لتجنّب القفزة البصرية.
export default function ApprovalsTab() {
  redirect("/dashboard/ceo/approvals");
}
