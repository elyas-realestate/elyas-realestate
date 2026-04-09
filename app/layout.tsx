import type { Metadata } from "next";
import { Noto_Kufi_Arabic, Tajawal } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";

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

export const metadata: Metadata = {
  title: "إلياس الدخيل — وسيط عقاري",
  description: "منصة إدارة عقارية متكاملة",
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
      className={`${notoKufi.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
