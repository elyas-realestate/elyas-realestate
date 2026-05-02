import { redirect } from "next/navigation";

// تم نقل المركز لـ AI Hub
export default function OperationsRedirect() {
  redirect("/dashboard/ai/control");
}
