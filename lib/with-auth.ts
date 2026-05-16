// ══════════════════════════════════════════════════════════════
// lib/with-auth.ts — Helpers موحّدة للـ Auth + Supabase clients
// ══════════════════════════════════════════════════════════════
// قبل: كل API route يكرّر نفس الـ ٢٠ سطر من إعداد Supabase + auth
// بعد: استدعاء واحد بسطر واحد يرجع كل ما تحتاج
// ══════════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Supabase client مربوط بـ Database schema — للاستخدام داخل هذا الملف وفي الـ APIs */
export type DbClient = SupabaseClient<Database>;

/**
 * يرجع Supabase admin client (service_role) — يتجاوز RLS.
 * استخدمه فقط في server routes للعمليات الموثوقة.
 */
export function getSupabaseAdmin(): DbClient {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * يرجع Supabase auth client (anon key) مع Bearer token المُستخرج من الـ request.
 * يحترم RLS — مفيد لقراءة بيانات حسب صلاحيات المستخدم.
 */
export function getSupabaseAuth(req: NextRequest): DbClient | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

export interface AuthContext {
  /** Supabase admin client (يتجاوز RLS) — مربوط بـ Database schema */
  admin: DbClient;
  /** المستخدم الحالي — null لو لم يكن مسجّل دخول */
  user: { id: string; email?: string } | null;
  /** tenant_id الخاص بالمستخدم — null لو لم يكن صاحب tenant */
  tenant_id: string | null;
}

/**
 * يحاول استخراج المستخدم + tenant_id من الـ request.
 * يرجع admin client دائماً. لو لم يكن في Bearer token، user و tenant_id يرجعان null.
 *
 * مثال:
 * ```ts
 * const { admin, user, tenant_id } = await getAuthContext(req);
 * if (!user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
 * ```
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext> {
  const admin = getSupabaseAdmin();
  const supabaseAuth = getSupabaseAuth(req);

  if (!supabaseAuth) {
    return { admin, user: null, tenant_id: null };
  }

  try {
    const { data: userData } = await supabaseAuth.auth.getUser();
    if (!userData.user) {
      return { admin, user: null, tenant_id: null };
    }

    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    return {
      admin,
      user: { id: userData.user.id, email: userData.user.email },
      tenant_id: tenant?.id || null,
    };
  } catch {
    return { admin, user: null, tenant_id: null };
  }
}

/**
 * إصدار صارم من getAuthContext — يرمي خطأ لو لم يوجد مستخدم.
 * استخدمه عندما الـ API يتطلّب تسجيل دخول إلزامي.
 */
export async function requireAuth(
  req: NextRequest
): Promise<AuthContext & { user: NonNullable<AuthContext["user"]> }> {
  const ctx = await getAuthContext(req);
  if (!ctx.user) {
    throw new AuthError("غير مصرّح — يحتاج تسجيل دخول", 401);
  }
  return ctx as AuthContext & { user: NonNullable<AuthContext["user"]> };
}

/**
 * خطأ مخصّص للـ auth — يمكن إمساكه في الـ route handler وإرجاع NextResponse مناسب.
 */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
