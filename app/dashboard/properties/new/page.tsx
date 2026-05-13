// ──────────────────────────────────────────────────────────────
// Alias Route — /properties/new → /properties/add
// ──────────────────────────────────────────────────────────────
// السبب: المعيار الصناعي يستخدم /new، لكن صفحتنا الأساسية في /add.
// نُبقي هذا الـ redirect لـ:
//   - منع 404 لمن يكتب /new يدوياً من العادة
//   - دعم روابط خارجية قديمة (إن وُجدت)
// لا تحذف هذا الملف — هو ميزة لا dead code.
// راجع: /dashboard/finance → /dashboard/financial (نفس النمط).
// ──────────────────────────────────────────────────────────────
import { redirect } from "next/navigation";

export default function PropertyNewRedirect() {
  redirect("/dashboard/properties/add");
}
