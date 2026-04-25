import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendPushToUser } from "@/lib/push";

// ══════════════════════════════════════════════════════════════
// /api/push/notify — إرسال إشعار Push لنفس المستخدم الحالي
// (للاختبار من زر في الـ Settings — يضمن أن VAPID يعمل قبل ربط triggers)
// ══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
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
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: { title?: string; body?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const result = await sendPushToUser(user.id, {
    title: body.title || "وسيط برو",
    body: body.body || "إشعار اختباري — Push يعمل! ✅",
    url: body.url || "/dashboard",
  });

  return NextResponse.json(result);
}
