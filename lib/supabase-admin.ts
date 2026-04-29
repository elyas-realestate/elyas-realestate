// ══════════════════════════════════════════════════════════════
// lib/supabase-admin.ts — Admin (service_role) Supabase client
//
// بدلاً من تكرار createClient في كل route، نوحّده هنا
// مع فحص env vars وإعطاء خطأ واضح بدل رسالة SDK داخلية
// ══════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class MissingServerEnvError extends Error {
  constructor(missing: string[]) {
    super(`متغيرات بيئة الخادم ناقصة: ${missing.join(", ")}. تواصل مع الإدارة لإكمال الإعدادات.`);
    this.name = "MissingServerEnvError";
  }
}

/**
 * يُرجع service_role client أو يرمي MissingServerEnvError برسالة عربية واضحة
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new MissingServerEnvError(missing);
  }

  return createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * فحص سريع: هل الـ env vars الأساسية موجودة؟
 * استخدمه في بداية route قبل أي عمل ثقيل
 */
export function checkServerEnv(): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length === 0) return { ok: true };
  return { ok: false, missing };
}
