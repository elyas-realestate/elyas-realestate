import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Moyasar webhook handler — يستقبل تنبيهات تغيّر حالة الدفع
// Docs: https://docs.moyasar.com/integrations/webhooks
//
// أنواع الأحداث:
// - payment_paid: نجح الدفع
// - payment_failed: فشل
// - payment_authorized: مصرَّح به (يحتاج capture)
// - payment_captured: تم الخصم
// - payment_refunded: تم استرداد
// - payment_voided: أُلغي
//
// Moyasar يرسل HMAC-SHA256 في header `X-Moyasar-Signature`
// نتحقق من التوقيع باستخدام WEBHOOK_SECRET

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.MOYASAR_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[moyasar-webhook] MOYASAR_WEBHOOK_SECRET غير مضبوط — التحقق متجاوَز");
    return true; // في dev نسمح، في production يجب ضبطه
  }
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-moyasar-signature");

    if (!verifySignature(rawBody, signature)) {
      console.warn("[moyasar-webhook] تحقق التوقيع فشل");
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
    }

    const eventType = event.type;
    const payment = event.data;

    if (!payment?.id) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // سجّل الحدث في jdaول التدقيق
    await admin.from("payment_events").insert({
      payment_id: payment.id,
      event_type: eventType,
      status: payment.status,
      amount: payment.amount,
      raw_payload: event,
    }).select().maybeSingle();

    // عالج كل حدث
    switch (eventType) {
      case "payment_paid":
      case "payment_captured": {
        // ابحث عن tenant_payment بـ payment_id
        const { data: tp } = await admin
          .from("tenant_payments")
          .select("id, tenant_id, plan, billing")
          .eq("payment_id", payment.id)
          .maybeSingle();

        if (tp) {
          // فعّل الاشتراك
          const expiresAt = new Date();
          if (tp.billing === "yearly") {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }

          await admin.from("tenant_payments").update({
            status: "paid",
            paid_at: new Date().toISOString(),
          }).eq("id", tp.id);

          await admin.from("site_settings").update({
            plan: tp.plan,
            plan_expires_at: expiresAt.toISOString(),
          }).eq("tenant_id", tp.tenant_id);

          console.log(`[moyasar-webhook] ✅ تفعيل ${tp.plan} للـ tenant ${tp.tenant_id}`);
        }
        break;
      }

      case "payment_failed":
      case "payment_voided": {
        await admin.from("tenant_payments")
          .update({ status: "failed" })
          .eq("payment_id", payment.id);
        break;
      }

      case "payment_refunded": {
        await admin.from("tenant_payments")
          .update({ status: "refunded" })
          .eq("payment_id", payment.id);
        // اختياري: downgrade للـ free
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[moyasar-webhook] خطأ:", e);
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 });
  }
}
