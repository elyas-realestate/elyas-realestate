import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waseet-pro.com";

  // الصفحات الثابتة
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily",  priority: 1.0 },
    { url: `${baseUrl}/login`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // صفحات الوسطاء العامة
  const { data: tenants } = await supabase
    .from("tenants")
    .select("slug, updated_at")
    .eq("is_active", true);

  const brokerPages: MetadataRoute.Sitemap = (tenants || []).map(t => ({
    url: `${baseUrl}/broker/${t.slug}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // العقارات المنشورة
  const { data: properties } = await supabase
    .from("properties")
    .select("id, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(500);

  const propertyPages: MetadataRoute.Sitemap = (properties || []).map(p => ({
    url: `${baseUrl}/properties/${p.id}`,
    lastModified: new Date(p.updated_at || new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...brokerPages, ...propertyPages];
}
