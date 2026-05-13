"use client";

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[rgba(198,145,76,0.09)] bg-[#16161A] ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[#C6914C]">{icon}</span>}
        <div>
          <h3 className="font-cairo text-sm font-bold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[10px] text-[#5A5A62]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
