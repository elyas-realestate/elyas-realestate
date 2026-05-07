"use client";

import { useEffect } from "react";
import Link from "next/link";

// ══════════════════════════════════════════════════════════════
// Root-level error boundary — يلتقط أي خطأ في الصفحات العامة
// ══════════════════════════════════════════════════════════════

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // تسجيل آمن (لا نكشف stack للمستخدم)
    console.error("[Root Error]", error.digest || error.message || "unknown");
  }, [error]);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: "var(--bg-page)",
        color: "var(--text-strong)",
        fontFamily: "'Tajawal', sans-serif",
        padding: "40px 24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&family=Noto+Kufi+Arabic:wght@700;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-up-delay { animation: fadeUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div
        className="font-kufi fade-up"
        style={{
          fontSize: "clamp(72px, 16vw, 140px)",
          fontWeight: 900,
          lineHeight: 1,
          background: "linear-gradient(135deg, #C6914C 0%, #8B6028 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          userSelect: "none",
        }}
      >
        500
      </div>

      <div className="fade-up-delay text-center" style={{ marginTop: 24, maxWidth: 420 }}>
        <h1
          className="font-kufi"
          style={{ fontSize: 22, fontWeight: 700, color: "var(--text-strong)", marginBottom: 12 }}
        >
          حدث خطأ غير متوقّع
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-soft)", lineHeight: 1.8, marginBottom: 24 }}>
          نعتذر عن الإزعاج. يمكنك إعادة المحاولة الآن، أو العودة للصفحة الرئيسية.
        </p>
        {error?.digest && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-faint)",
              opacity: 0.6,
              marginBottom: 24,
              direction: "ltr",
              fontFamily: "monospace",
            }}
          >
            ref: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center" style={{ flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 28px",
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--gold-2, #C6914C), var(--gold-3, #A6743A))",
              color: "var(--bg-page, #fff)",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 28px",
              borderRadius: 10,
              background: "var(--gold-bg-soft, rgba(198,145,76,0.1))",
              border: "1px solid var(--gold-bg-hover, rgba(198,145,76,0.25))",
              color: "var(--gold-2, #C6914C)",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </div>

      <div
        className="fade-up-delay font-kufi"
        style={{ marginTop: 64, fontSize: 12, color: "var(--border-1, #555)", fontWeight: 700, letterSpacing: 1 }}
      >
        وسيط برو
      </div>
    </div>
  );
}
