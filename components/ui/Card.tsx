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
      className={`rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)]
        ${padding ? "p-5" : ""} ${className}`}
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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-[#C6914C]">{icon}</span>
        )}
        <div>
          <h3 className="font-cairo font-bold text-sm">{title}</h3>
          {subtitle && (
            <p className="text-[10px] text-[#5A5A62] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
