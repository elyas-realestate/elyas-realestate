import type { Metadata, Viewport } from "next";
import { Noto_Kufi_Arabic, Tajawal, Cairo } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import { I18nProvider } from "@/lib/i18n";

const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elyas-realestate.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "وسيط برو — المنصة العقارية الذكية",
    template: "%s | وسيط برو",
  },
  description: "منصة إدارة عقارية متكاملة للوسطاء السعوديين — CRM، عقود، أتمتة، ذكاء صناعي، واتساب، فواتير ZATCA — كل ما تحتاجه لإدارة عملك العقاري في مكان واحد.",
  keywords: [
    "وسيط عقاري", "عقارات السعودية", "منصة وسيط عقاري", "CRM عقاري",
    "إدارة عقارات", "وسيط برو", "العقارات الرياض", "ذكاء صناعي عقاري",
    "real estate Saudi", "broker platform", "real estate CRM",
  ],
  authors: [{ name: "إلياس الدخيل" }],
  creator: "إلياس الدخيل",
  publisher: "وسيط برو",

  applicationName: "وسيط برو",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "وسيط برو",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },

  // ── Open Graph (Facebook + WhatsApp + LinkedIn) ──
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: SITE_URL,
    siteName: "وسيط برو",
    title: "وسيط برو — المنصة العقارية الذكية",
    description: "منصة إدارة عقارية متكاملة للوسطاء السعوديين — CRM، عقود، أتمتة، ذكاء صناعي، واتساب.",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "وسيط برو",
      },
    ],
  },

  // ── Twitter / X Cards ──
  twitter: {
    card: "summary_large_image",
    title: "وسيط برو — المنصة العقارية الذكية",
    description: "منصة إدارة عقارية متكاملة للوسطاء السعوديين",
    images: ["/icons/icon-512.png"],
  },

  // ── Robots / Indexing ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification (ضع رمز Search Console هنا لاحقاً) ──
  // verification: { google: "...", },
};

export const viewport: Viewport = {
  themeColor: "var(--gold-2)",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-theme="cream"
      className={`${notoKufi.variable} ${tajawal.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* تطبيق الثيم + ألوان البراند قبل أول render لتجنّب FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wasit_theme');var theme=(t==='dark'||t==='cream')?t:'cream';document.documentElement.setAttribute('data-theme',theme);var a=localStorage.getItem('wasit_brand_accent');var ad=localStorage.getItem('wasit_brand_accent_dark');if(a){document.documentElement.style.setProperty('--gold-1',a);}if(ad){document.documentElement.style.setProperty('--gold-2',ad);}else if(a){document.documentElement.style.setProperty('--gold-2',a);}}catch(e){document.documentElement.setAttribute('data-theme','cream');}})();`,
          }}
        />
        {/* حماية دفاعية: إخفاء عنصر "Stop Claude" يُحقَن من extensions (محدد فقط) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function h(){document.querySelectorAll('button,[role="tooltip"]').forEach(function(el){var t=(el.textContent||'').trim();if(t==='Stop Claude'||t==='Stop Claude ⊙'||t.startsWith('Stop Claude')){el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true');}});}if(document.body){h();new MutationObserver(h).observe(document.body,{childList:true,subtree:true});}else{document.addEventListener('DOMContentLoaded',function(){h();new MutationObserver(h).observe(document.body,{childList:true,subtree:true});});}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AnalyticsTracker />
        <I18nProvider>{children}</I18nProvider>
        {/* PWA: register service worker on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
