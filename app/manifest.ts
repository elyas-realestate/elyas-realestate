import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "وسيط برو — المنصة العقارية الذكية",
    short_name: "وسيط برو",
    description: "منصة إدارة عقارية ذكية للوسطاء السعوديين — عقارات، عملاء، عقود، تقارير",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#C6914C",
    orientation: "portrait-primary",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icons/icon-96.png",            sizes: "96x96",   type: "image/png", purpose: "any" },
      { src: "/icons/icon-144.png",           sizes: "144x144", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png",           sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png",           sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png",  sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["business", "productivity", "finance"],
    shortcuts: [
      {
        name: "العقارات",
        short_name: "عقارات",
        description: "إدارة العقارات",
        url: "/dashboard/properties",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "العملاء",
        short_name: "عملاء",
        description: "إدارة العملاء",
        url: "/dashboard/clients",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "العقود",
        short_name: "عقود",
        description: "العقود الإلكترونية",
        url: "/dashboard/contracts",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "الصفقات",
        short_name: "صفقات",
        description: "تتبع الصفقات",
        url: "/dashboard/deals",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
