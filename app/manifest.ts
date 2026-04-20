import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "وسيط برو — المنصة العقارية الذكية",
    short_name: "وسيط برو",
    description: "منصة إدارة عقارية ذكية للوسطاء السعوديين",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0A0A0C",
    theme_color: "#C6914C",
    orientation: "portrait-primary",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/sar.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/sar.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["business", "productivity"],
    shortcuts: [
      {
        name: "العقارات",
        short_name: "عقارات",
        description: "إدارة العقارات",
        url: "/dashboard/properties",
        icons: [{ src: "/sar.png", sizes: "192x192" }],
      },
      {
        name: "العملاء",
        short_name: "عملاء",
        description: "إدارة العملاء",
        url: "/dashboard/clients",
        icons: [{ src: "/sar.png", sizes: "192x192" }],
      },
      {
        name: "الصفقات",
        short_name: "صفقات",
        description: "تتبع الصفقات",
        url: "/dashboard/deals",
        icons: [{ src: "/sar.png", sizes: "192x192" }],
      },
    ],
  };
}
