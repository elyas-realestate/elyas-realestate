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

export const metadata: Metadata = {
  title: "وسيط برو — المنصة العقارية الذكية",
  description: "منصة إدارة عقارية متكاملة للوسطاء السعوديين",
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
      className={`${notoKufi.variable} ${tajawal.variable} ${cairo.variable} h-full antialiased`}
    >
      <head>
        {/* تطبيق الثيم + ألوان البراند قبل أول render لتجنّب FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wasit_theme');if(t==='cream'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}var a=localStorage.getItem('wasit_brand_accent');var ad=localStorage.getItem('wasit_brand_accent_dark');if(a){document.documentElement.style.setProperty('--gold-1',a);}if(ad){document.documentElement.style.setProperty('--gold-2',ad);}else if(a){document.documentElement.style.setProperty('--gold-2',a);}}catch(e){}})();`,
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
