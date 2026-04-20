import { createClient } from "@supabase/supabase-js";
import { MetadataRoute } from "next";


export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waseet-pro.com";

  // نستخدم service role لقراءة البيانات العامة بدون RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── الصفحات الثابتة ──
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                   lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/register`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/login`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/search`,       lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${baseUrl}/mortgage`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // ── صفحات الوسطاء — /{slug} ──
  const { data: tenants } = await supabase
    .from("tenants")
    .select("slug, updated_at")
    .eq("is_active", true)
    .not("slug", "is", null);

  const brokerPages: MetadataRoute.Sitemap = (tenants || []).map(t => ({
    url: `${baseUrl}/${t.slug}`,
    lastModified: new Date(t.updated_at || new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ── العقارات المنشورة — /properties/{id} ──
  const { data: properties } = await supabase
    .from("properties")
    .select("id, updated_at, title")
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(1000);

  const propertyPages: MetadataRoute.Sitemap = (properties || []).map(p => ({
    url: `${baseUrl}/properties/${p.id}`,
    lastModified: new Date(p.updated_at || new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...brokerPages, ...propertyPages];
}
