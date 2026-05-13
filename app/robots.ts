import type { MetadataRoute } from "next";

// ══════════════════════════════════════════════════════════════
// robots.txt — يحدد ما يُسمح للـ crawlers بزيارته
// يحجب الـ dashboards/admin/api من الفهرسة
// ══════════════════════════════════════════════════════════════

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elyas-realestate.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/properties/",
          "/search",
          "/mortgage",
          "/login",
          "/register",
          "/privacy",
          "/terms",
          "/data-processing",
          "/license",
          "/c/", // بطاقات الوسطاء العامة
        ],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/sign/", // روابط توقيع العقود (خاصة)
          "/onboarding",
        ],
      },
      // قواعد خاصة لـ AI crawlers (نسمح بالقراءة لتحسين الظهور)
      {
        userAgent: ["GPTBot", "ChatGPT-User", "Claude-Web", "PerplexityBot"],
        allow: ["/", "/properties/", "/search", "/c/"],
        disallow: ["/dashboard/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
