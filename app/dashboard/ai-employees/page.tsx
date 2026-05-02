import { redirect } from "next/navigation";

// Legacy page (deprecated) → AI Hub
export default function LegacyAIEmployeesRedirect() {
  redirect("/dashboard/ai/assistants");
}
