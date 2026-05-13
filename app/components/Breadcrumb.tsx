"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="mb-5 flex items-center gap-1 text-sm" aria-label="breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronLeft size={13} style={{ color: "var(--text-faint)" }} />}
            {!isLast && crumb.href ? (
              <Link
                href={crumb.href}
                className="transition hover:opacity-90"
                style={{ color: "var(--text-soft)", textDecoration: "none" }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                style={{
                  color: isLast ? "var(--gold-2)" : "var(--text-soft)",
                  fontWeight: isLast ? 600 : 400,
                }}
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
