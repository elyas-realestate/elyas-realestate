"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function track(event_type: string, page: string, element?: string) {
  try {
    await supabase.from("site_analytics").insert([{ event_type, page, element }]);
  } catch {
    // silently fail if table doesn't exist
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const tracked = useRef<Set<string>>(new Set());

  // Track page views on route change
  useEffect(() => {
    if (tracked.current.has(pathname)) return;
    tracked.current.add(pathname);
    track("pageview", pathname);
  }, [pathname]);

  // Track clicks on key elements
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const closest = target.closest("[data-track]") as HTMLElement | null;
      if (closest) {
        const element = closest.getAttribute("data-track") || "unknown";
        track("click", pathname, element);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  return null;
}
