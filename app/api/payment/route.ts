import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createPayment, getPayment, PLAN_PRICES } from "@/lib/moyasar";

export async function POST(req: NextRequest) {
  try {
    // ── التحقق من هوية المستخدم ──
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح — يرجى تسجيل الدخول" }, { status: 401 });

    const body = await req.json();
    const { plan, billing, card_name, card_number, card_cvc, card_month, card_year } = body;

    if (!plan || !PLAN_PRICES[plan]) return NextResponse.json({ error: "خطة غير صحيحة" }, { status: 400 });
    if (!billing || (billing !== "monthly" && billing !== "yearly")) return NextResponse.json({ error: "دورة فوترة غير صحيحة" }, { status: 400 });
    if (!card_name || !card_number || !card_cvc || !card_month || !card_year) {
      return NextResponse.json({ error: "بيانات البطاقة ناقصة" }, { status: 400 });
    }

    const priceInfo = PLAN_PRICES[plan];
    const amountSAR = billing === "monthly" ? priceInfo.monthly : priceInfo.yearly;
    const amountHalalas = amountSAR * 100;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waseet-pro.com";

    const payment = await createPayment({
      amount: amountHalalas,
      currency: "SAR",
      description: `اشتراك ${priceInfo.label} — ${billing === "monthly" ? "شهري" : "سنوي"}`,
      callback_url: `${baseUrl}/dashboard/subscription?payment_status=success&plan=${plan}`,
      source: {
        type: "creditcard",
        name: String(card_name).slice(0, 100),
        number: String(card_number).replace(/\s/g, "").slice(0, 20),
        cvc: String(card_cvc).slice(0, 4),
        month: String(card_month).slice(0, 2),
        year: String(card_year).slice(0, 4),
      },
      metadata: { plan, billing },
    });

    // ── تحقق مستقل من المبلغ والحالة قبل الترقية ──
    if (payment.status === "paid" || payment.status === "authorized") {
      // إعادة استعلام Moyasar للتأكد (server-to-server verification)
      const verified = await getPayment(payment.id);
      const expectedHalalas = amountHalalas;

      if (
        (verified.status !== "paid" && verified.status !== "authorized") ||
        verified.amount < expectedHalalas
      ) {
        return NextResponse.json({ error: "لم يتم التحقق من الدفع" }, { status: 402 });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (billing === "monthly" ? 1 : 12));

      // ربط الإعدادات بالمستخدم الحالي (وليس أول صف)
      const { data: settings } = await supabase
        .from("site_settings")
        .select("id")
        .eq("tenant_id", user.id)
        .single();

      if (settings) {
        await supabase.from("site_settings").update({
          plan,
          plan_expires_at: expiresAt.toISOString(),
          payment_id: payment.id,
        }).eq("id", settings.id);
      }
    }

    return NextResponse.json({ payment_id: payment.id, status: payment.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ في الدفع";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // ── التحقق من هوية المستخدم ──
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  try {
    const payment = await getPayment(id);
    return NextResponse.json({ status: payment.status, amount: payment.amount });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
