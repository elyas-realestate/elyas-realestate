"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// ══════════════════════════════════════════════════════════════
// Global Error Boundary — يلتقط الأخطاء التي تكسر الـ root layout
// يُرسلها لـ Sentry ثم يعرض fallback UI
// ══════════════════════════════════════════════════════════════
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{
        fontFamily: "'Tajawal', sans-serif",
        background: "#FAF7F0",
        color: "#1A1A1A",
        margin: 0,
        padding: 24,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 22, marginBottom: 12, fontWeight: 700 }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ color: "#6A6A72", marginBottom: 24, lineHeight: 1.7 }}>
            تم تسجيل الخطأ تلقائياً وسيُعالَج. حاول إعادة المحاولة أو ارجع للصفحة الرئيسية.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#9A9AA0", marginBottom: 24 }}>
              رمز الخطأ: <code style={{ background: "#F0EBE0", padding: "2px 6px", borderRadius: 4 }}>{error.digest}</code>
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #E8B86D, #C8954C)",
                color: "#0A0A0C",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
              }}>
              إعادة المحاولة
            </button>
            <a
              href="/dashboard"
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "transparent",
                color: "#6A6A72",
                border: "1px solid #E0D8C8",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}>
              العودة للرئيسية
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
