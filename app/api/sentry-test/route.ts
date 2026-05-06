import { NextResponse } from "next/server";

// ══════════════════════════════════════════════════════════════
// /api/sentry-test — endpoint اختبار يرفع خطأ متعمَّد لاختبار Sentry
// محمي بـ secret query parameter للتأكد إن المستخدم العادي لا يسببه عرضياً
// ══════════════════════════════════════════════════════════════

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  // التحقق من secret
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── خطأ متعمَّد لاختبار Sentry ──
  throw new Error(
    "Sentry test error from /api/sentry-test — لو شفت هذا في Sentry dashboard، التكامل يعمل!"
  );
}
