"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "gold" | "ghost" | "danger" | "muted";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  gold: "bg-gradient-to-br from-[#C6914C] to-[#A6743A] text-[#0A0A0C] font-bold hover:brightness-110",
  ghost: "bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] text-[#9A9AA0] hover:text-white",
  danger:
    "bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#F87171] hover:bg-[rgba(248,113,113,0.15)]",
  muted:
    "bg-[rgba(198,145,76,0.06)] border border-[rgba(198,145,76,0.12)] text-[#C6914C] hover:bg-[rgba(198,145,76,0.12)]",
};

export function Button({
  variant = "gold",
  icon,
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:opacity-50 ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
