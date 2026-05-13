"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-[#3A3A42]">{icon}</div>
      <p className="mb-1 text-sm text-[#9A9AA0]">{title}</p>
      {subtitle && <p className="mb-4 text-xs text-[#5A5A62]">{subtitle}</p>}
      {action}
    </div>
  );
}
