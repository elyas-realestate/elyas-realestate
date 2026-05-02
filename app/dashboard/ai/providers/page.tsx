import { redirect } from "next/navigation";

// ✓ نعيد التوجيه لصفحة admin الموجودة (تتطلب super_admin).
// لاحقاً، نقلها هنا مع gate صلاحية مدمج.
export default function ProvidersTab() {
  redirect("/admin/ai-providers");
}
