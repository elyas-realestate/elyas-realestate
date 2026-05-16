import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * إنشاء Supabase client واحد لجميع صفحات لوحة التحكم
 * يُستخدم فقط في Client Components ("use client")
 *
 * مرتبط بـ `Database` type المولّد من schema الفعلي للمشروع،
 * فيوفّر autocomplete + type safety على أسماء الجداول والأعمدة.
 *
 * @example
 * import { supabase } from "@/lib/supabase-browser";
 * const { data } = await supabase.from("properties").select("*");
 */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
