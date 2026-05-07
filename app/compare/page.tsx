import { Suspense } from "react";
import ComparePageClient from "./ComparePageClient";

// ══════════════════════════════════════════════════════════════════
// Server wrapper — يلفّ ComparePageClient في <Suspense>
// مطلوب من Next.js لأن useSearchParams يحتاج boundary للـ prerender
// ══════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

export const metadata = {
  title: "مقارنة العقارات — وسيط برو",
  description: "قارن عقارات جنباً إلى جنب: السعر، المساحة، الموقع، والمميزات.",
};

function ComparePageFallback() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--gold-2)" }}>
        <div
          style={{
            width: 22,
            height: 22,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span>جاري تحميل المقارنة...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageFallback />}>
      <ComparePageClient />
    </Suspense>
  );
}
