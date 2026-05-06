import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// sitemap.xml — Next.js App Router auto-generation
// يُولَّد ديناميكياً: صفحات ثابتة + روابط الوسطاء + العقارات المنشورة
// ══════════════════════════════════════════════════════════════

const SITE = "https://elyas-realestate.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── الصفحات الثابتة ──
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE,                       lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE}/search`,           lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE}/properties`,       lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE}/mortgage`,         lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/login`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE}/register`,         lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE}/privacy`,          lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE}/terms`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE}/data-processing`,  lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${SITE}/license`,          lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return staticPages;
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const dynamicPages: MetadataRoute.Sitemap = [];

  try {
    const { data: tenants } = await admin
      .from("tenants")
      .select("slug, updated_at")
      .not("slug", "is", null)
      .limit(1000);

    if (tenants) {
      for (const t of tenants) {
        if (!t.slug) continue;
        dynamicPages.push({
          url: `${SITE}/${encodeURIComponent(t.slug)}`,
          lastModified: t.updated_at ? new Date(t.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
        dynamicPages.push({
          url: `${SITE}/c/${encodeURIComponent(t.slug)}`,
          lastModified: t.updated_at ? new Date(t.updated_at) : now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    const { data: properties } = await admin
      .from("properties")
      .select("id, updated_at")
      .eq("is_published", true)
      .limit(5000);

    if (properties) {
      for (const p of properties) {
        dynamicPages.push({
          url: `${SITE}/properties/${p.id}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: "daily",
          priority: 0.7,
        });
      }
    }
  } catch (e) {
    console.error("[sitemap] فشل جلب البيانات الديناميكية:", e);
  }

  return [...staticPages, ...dynamicPages];
}
