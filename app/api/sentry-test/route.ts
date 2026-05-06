import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ══════════════════════════════════════════════════════════════
// /api/sentry-test — endpoint اختبار يرفع خطأ متعمَّد لاختبار Sentry
//
// طريقتان للوصول:
// 1) ?secret=<CRON_SECRET> — للسكربتات الآلية
// 2) مسجَّل دخول كمالك tenant — لأن المالك يقدر يختبر من المتصفح بدون secret
// ══════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  // ── طريقة 1: secret من query (للسكربتات) ──
  if (secret && secret === process.env.CRON_SECRET) {
    throw new Error(
      "Sentry test error from /api/sentry-test (secret auth) — لو شفت هذا في Sentry dashboard، التكامل يعمل!"
    );
  }

  // ── طريقة 2: مالك tenant مسجَّل دخول ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // تأكد إنه مالك tenant (مو فقط مستخدم عشوائي)
  const { data: t } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).maybeSingle();

  if (!t?.id) {
    return NextResponse.json(
      { error: "هذا الـ endpoint للمالكين فقط" },
      { status: 403 }
    );
  }

  // ── الخطأ المتعمَّد لاختبار Sentry ──
  throw new Error(
    `Sentry test error from /api/sentry-test (owner auth) — user_id=${user.id.slice(0, 8)} — لو شفت هذا في Sentry dashboard، التكامل يعمل!`
  );
}
