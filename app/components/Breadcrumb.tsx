"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 mb-5 text-sm" aria-label="breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronLeft size={13} style={{ color: "#5A5A62" }} />}
            {!isLast && crumb.href ? (
              <Link
                href={crumb.href}
                className="transition hover:opacity-90"
                style={{ color: "#9A9AA0", textDecoration: "none" }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: isLast ? "#C18D4A" : "#9A9AA0", fontWeight: isLast ? 600 : 400 }}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
