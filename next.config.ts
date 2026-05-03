import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP عام للمنصّة كلها (يطبّق على /dashboard, /admin, إلخ)
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' blob: data: https://*.supabase.co;
  connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${!isDev ? "upgrade-insecure-requests;" : ""}
`.replace(/\n/g, "").replace(/\s{2,}/g, " ").trim();

// CSP أوسع لصفحة Claude Design landing فقط (تحتاج blob: scripts + Google Fonts)
const landingCspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
  style-src 'self' 'unsafe-inline' blob: https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' blob: data: https:;
  connect-src 'self' blob: data:;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${!isDev ? "upgrade-insecure-requests;" : ""}
`.replace(/\n/g, "").replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // (PP-FIX4) أزلنا rewrite إلى /landing.html — كان static dark.
        // الآن `/` يستخدم app/page.tsx الذي يستهلك CSS variables → كريمي تلقائياً.
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    const sharedSecurityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      // CSP موسّع للصفحة الرئيسية (Claude Design bundle يحتاج blob:)
      {
        source: "/",
        headers: [
          { key: "Content-Security-Policy", value: landingCspHeader },
          ...sharedSecurityHeaders,
        ],
      },
      // CSP موسّع لـ landing.html المباشرة
      {
        source: "/landing.html",
        headers: [
          { key: "Content-Security-Policy", value: landingCspHeader },
          ...sharedSecurityHeaders,
        ],
      },
      // CSP صارم لكل المسارات الأخرى — قواعد محددة بدلاً من catch-all
      // (catch-all كانت تطابق /landing.html و / فيتسبب في CSP مزدوج وانسحاب الموسّع)
      { source: "/dashboard/:path*", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/admin/:path*", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/api/:path*", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/auth/:path*", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/sign/:path*", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/broker/:path*", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/login", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/signup", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/privacy", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/terms", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/data-processing", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/license", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/search", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
      { source: "/mortgage", headers: [{ key: "Content-Security-Policy", value: cspHeader }, ...sharedSecurityHeaders] },
    ];
  },
};

export default nextConfig;
