import { redirect } from "next/navigation";

// إعادة توجيه القديم /broker/[slug] إلى /[slug]
export default async function BrokerRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
