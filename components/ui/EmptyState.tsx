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
      <div className="text-[#3A3A42] mb-3">{icon}</div>
      <p className="text-sm text-[#9A9AA0] mb-1">{title}</p>
      {subtitle && <p className="text-xs text-[#5A5A62] mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}
