import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waseet-pro.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/broker/", "/properties/", "/register", "/login"],
        disallow: ["/dashboard/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
