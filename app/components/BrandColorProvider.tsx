"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";

/**
 * يقرأ ألوان الوسيط (color_accent / color_accent_dark) من site_settings
 * ويطبّقها كـ CSS variable overrides على <html>:
 *   --gold-1 → color_accent
 *   --gold-2 → color_accent_dark (أو color_accent)
 *
 * هذا يجعل الثيم السريع المختار يطبّق على لوحة التحكم بأكملها
 * (الأزرار، الأيقونات، الـ accents) دون المساس بالخلفيات والنصوص
 * التي يتحكم بها الثيم العام (داكن/كريمي).
 *
 * يستجيب أيضاً لحدث "wasit:brand-update" المحلي لإعادة القراءة فوراً
 * بعد الحفظ من صفحة الإعدادات.
 */
export default function BrandColorProvider() {
  useEffect(() => {
    let mounted = true;

    function isCleanColor(v: unknown): v is string {
      return typeof v === "string" && v.trim().length > 0 && !v.trim().startsWith("var(");
    }

    function applyOverrides(accent?: string, accentDark?: string) {
      const root = document.documentElement;
      if (isCleanColor(accent)) {
        root.style.setProperty("--gold-1", accent!);
      } else {
        root.style.removeProperty("--gold-1");
      }
      if (isCleanColor(accentDark)) {
        root.style.setProperty("--gold-2", accentDark!);
      } else if (isCleanColor(accent)) {
        // fallback: استعمل accent نفسه لـ gold-2
        root.style.setProperty("--gold-2", accent!);
      } else {
        root.style.removeProperty("--gold-2");
      }
    }

    async function load() {
      try {
        // 1. حاول قراءة الـ tenant الخاص بالمستخدم الحالي (الأدق مع RLS)
        const {
          data: { user },
        } = await supabase.auth.getUser();
        let row: { color_accent?: string | null; color_accent_dark?: string | null } | null = null;

        if (user) {
          const { data: ownTenant } = await supabase
            .from("tenants")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();
          if (ownTenant?.id) {
            const { data } = await supabase
              .from("site_settings")
              .select("color_accent, color_accent_dark")
              .eq("tenant_id", ownTenant.id)
              .maybeSingle();
            row = data;
          }
        }

        // 2. fallback: أي صف متاح (يفيد في حالات RLS مفتوحة لـ public read)
        if (!row) {
          const { data } = await supabase
            .from("site_settings")
            .select("color_accent, color_accent_dark")
            .limit(1)
            .maybeSingle();
          row = data;
        }

        if (!mounted || !row) return;
        applyOverrides(row.color_accent || undefined, row.color_accent_dark || undefined);

        // كاش محلي للـ first-paint بعد reload
        try {
          if (row.color_accent) localStorage.setItem("wasit_brand_accent", row.color_accent);
          if (row.color_accent_dark)
            localStorage.setItem("wasit_brand_accent_dark", row.color_accent_dark);
        } catch {
          /* تجاهل */
        }
      } catch {
        // تجاهُل — الوضع الافتراضي يبقى
      }
    }

    // first-paint: استعمل الكيم المحفوظ محلياً قبل اكتمال الطلب
    try {
      const cached1 = localStorage.getItem("wasit_brand_accent");
      const cached2 = localStorage.getItem("wasit_brand_accent_dark");
      if (cached1) applyOverrides(cached1, cached2 || undefined);
    } catch {
      /* تجاهل */
    }

    load();

    function onUpdate(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      applyOverrides(detail.accent, detail.accentDark);
    }
    window.addEventListener("wasit:brand-update", onUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("wasit:brand-update", onUpdate);
    };
  }, []);

  return null;
}
