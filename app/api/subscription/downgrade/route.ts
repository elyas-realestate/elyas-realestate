import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  try {
    // ── التحقق من هوية المستخدم ──
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const { plan } = body;

    // السماح فقط بالتحويل للخطة المجانية عبر هذا المسار
    if (plan !== "free" || !(plan in PLAN_LIMITS)) {
      return NextResponse.json({ error: "خطة غير صحيحة" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // التحقق أن site_settings تعود لهذا المستخدم
    const { data: settings } = await supabase
      .from("site_settings")
      .select("id")
      .eq("tenant_id", user.id)
      .single();

    if (!settings) {
      return NextResponse.json({ error: "لم يتم العثور على الإعدادات" }, { status: 404 });
    }

    await supabase
      .from("site_settings")
      .update({ plan, plan_expires_at: null })
      .eq("id", settings.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
