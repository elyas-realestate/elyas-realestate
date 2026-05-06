import { redirect } from "next/navigation";

// ── Legacy: تم دمج مع /requests ── نمرر الـ id كـ hash anchor
export default async function LegacyPropertyRequestDetailRedirect(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  redirect(`/dashboard/requests#${encodeURIComponent(id)}`);
}
