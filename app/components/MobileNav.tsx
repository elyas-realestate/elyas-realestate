"use client";
import { useState } from "react";
import Link from "next/link";

interface NavLink { href: string; label: string; type: string; }

export default function MobileNav({ links, loginText }: { links: NavLink[]; loginText: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="nav-mobile-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="القائمة"
        style={{ minWidth: 40, minHeight: 40 }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>

      <div className={"nav-drawer" + (open ? " open" : "")}>
        {links.map((link, i) =>
          link.type === "anchor" ? (
            <a key={i} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
          ) : (
            <Link key={i} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
          )
        )}
        <Link href="/login" onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)', fontSize: 13 }}>{loginText}</Link>
      </div>
    </>
  );
}
