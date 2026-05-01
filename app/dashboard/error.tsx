"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // تسجيل الخطأ بدون كشف التفاصيل للمستخدم
    console.error("[Dashboard Error]", error.digest || "unknown");
  }, [error]);

  return (
    <div
      dir="rtl"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "40px 20px",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          marginBottom: 24,
        }}
      >
        ⚠️
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "var(--text-strong)",
          marginBottom: 10,
          fontFamily: "'Noto Kufi Arabic', serif",
        }}
      >
        حدث خطأ غير متوقع
      </h2>

      <p
        style={{
          fontSize: 14,
          color: "var(--text-soft)",
          lineHeight: 1.7,
          maxWidth: 400,
          marginBottom: 28,
        }}
      >
        نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني
        إذا استمرت المشكلة.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "12px 28px",
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: "var(--bg-page)",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            fontFamily: "'Tajawal', sans-serif",
            transition: "all 0.2s",
          }}
        >
          إعادة المحاولة
        </button>

        <button
          onClick={() => (window.location.href = "/dashboard")}
          style={{
            padding: "12px 28px",
            borderRadius: 10,
            background: "var(--gold-bg-soft)",
            border: "1px solid var(--gold-bg-hover)",
            color: "var(--gold-2)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "'Tajawal', sans-serif",
            transition: "all 0.2s",
          }}
        >
          الصفحة الرئيسية
        </button>
      </div>

      {/* لا نعرض تفاصيل الخطأ للمستخدم — فقط digest آمن */}
      {error.digest && (
        <p
          style={{
            fontSize: 11,
            color: "var(--border-1)",
            marginTop: 24,
          }}
        >
          رمز الخطأ: {error.digest}
        </p>
      )}
    </div>
  );
}
