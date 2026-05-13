"use client";

import { Loader2 } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// Loading States — مكوّنات موحَّدة لكل حالات التحميل
// ══════════════════════════════════════════════════════════════════

interface SpinnerProps {
  size?: number;
  color?: string;
  label?: string;
  fullPage?: boolean;
}

export function Spinner({ size = 20, color = "var(--gold-2)", label, fullPage }: SpinnerProps) {
  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        color,
        fontFamily: "'Tajawal', sans-serif",
        fontSize: 14,
      }}
    >
      <Loader2 size={size} className="animate-spin" />
      {label && <span>{label}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton loader — لقوائم
export function SkeletonRow({ height = 56, count = 3 }: { height?: number; count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            background:
              "linear-gradient(90deg, var(--bg-surface-2) 0%, var(--bg-surface-1) 50%, var(--bg-surface-2) 100%)",
            backgroundSize: "200% 100%",
            borderRadius: 12,
            border: "1px solid var(--gold-bg-soft)",
            animation: "skeletonPulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// Card skeleton
export function SkeletonCard({ height = 180 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background:
          "linear-gradient(90deg, var(--bg-surface-2) 0%, var(--bg-surface-1) 50%, var(--bg-surface-2) 100%)",
        backgroundSize: "200% 100%",
        borderRadius: 14,
        border: "1px solid var(--gold-bg-soft)",
        animation: "skeletonPulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

// Empty state موحّد
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      dir="rtl"
      style={{
        textAlign: "center",
        padding: "40px 20px",
        background: "var(--bg-surface-1)",
        border: "1px solid var(--gold-bg)",
        borderRadius: 14,
      }}
    >
      {icon && <div style={{ marginBottom: 12, color: "var(--gold-2)" }}>{icon}</div>}
      <p
        className="font-kufi"
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-strong)",
          marginBottom: 4,
          fontFamily: "'Noto Kufi Arabic', serif",
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: "var(--text-faint)",
            lineHeight: 1.7,
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// Error state موحَّد
export function ErrorState({
  message = "حدث خطأ غير متوقّع",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      dir="rtl"
      style={{
        textAlign: "center",
        padding: "32px 20px",
        background: "rgba(239,68,68,0.05)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 14,
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <p style={{ fontSize: 14, color: "var(--text-strong)", marginBottom: 12 }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "8px 18px",
            borderRadius: 9,
            background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: "var(--bg-page)",
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
