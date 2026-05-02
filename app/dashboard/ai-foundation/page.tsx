import { redirect } from "next/navigation";

// Legacy → AI Hub Settings (إعدادات افتراضية)
export default function LegacyAIFoundationRedirect() {
  redirect("/dashboard/ai/control");
}
