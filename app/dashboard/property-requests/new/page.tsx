import { redirect } from "next/navigation";

// ── Legacy: تم دمج مع /requests ──
export default function LegacyNewPropertyRequestRedirect() {
  redirect("/dashboard/requests?action=new");
}
