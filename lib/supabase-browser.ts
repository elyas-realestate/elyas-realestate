import { createBrowserClient } from "@supabase/ssr";

/**
 * إنشاء Supabase client واحد لجميع صفحات لوحة التحكم
 * يُستخدم فقط في Client Components ("use client")
 *
 * @example
 * import { supabase } from "@/lib/supabase-browser";
 * const { data } = await supabase.from("properties").select("*");
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
