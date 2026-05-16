import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { reverseVAT, calculateVAT } from "@/lib/vat";
import { createLogger } from "@/lib/logger";

const log = createLogger({ route: "/api/moyasar-webhook" });

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
    log.warn("MOYASAR_WEBHOOK_SECRET غير مضبوط — التحقق متجاوَز");
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
      log.warn("تحقق التوقيع فشل");
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
    await admin
      .from("payment_events")
      .insert({
        payment_id: payment.id,
        event_type: eventType,
        status: payment.status,
        amount: payment.amount,
        raw_payload: event,
      })
      .select()
      .maybeSingle();

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

          await admin
            .from("tenant_payments")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", tp.id);

          await admin
            .from("site_settings")
            .update({
              plan: tp.plan,
              plan_expires_at: expiresAt.toISOString(),
            })
            .eq("tenant_id", tp.tenant_id);

          log.info("✅ تفعيل plan", { plan: tp.plan, tenant_id: tp.tenant_id });

          // ── إنشاء فاتورة ZATCA-compliant ──
          await createSubscriptionInvoice(admin, {
            tenantId: tp.tenant_id,
            paymentId: payment.id,
            plan: tp.plan,
            billing: tp.billing,
            amountHalalas: payment.amount,
            metadata: payment.metadata || {},
          });
        }
        break;
      }

      case "payment_failed":
      case "payment_voided": {
        await admin
          .from("tenant_payments")
          .update({ status: "failed" })
          .eq("payment_id", payment.id);
        break;
      }

      case "payment_refunded": {
        await admin
          .from("tenant_payments")
          .update({ status: "refunded" })
          .eq("payment_id", payment.id);
        // اختياري: downgrade للـ free
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    log.error("Webhook handler error", e);
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 });
  }
}

// ══════════════════════════════════════════════════════════════
// إنشاء فاتورة اشتراك ZATCA-compliant بعد نجاح الدفع
// ══════════════════════════════════════════════════════════════
interface InvoiceArgs {
  tenantId: string;
  paymentId: string;
  plan: string;
  billing: string;
  amountHalalas: number;
  metadata: Record<string, string>;
}

async function createSubscriptionInvoice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  args: InvoiceArgs
) {
  try {
    // ── استخراج breakdown ──
    // المبلغ من Moyasar gross (شامل VAT). reverse للحصول على net و VAT.
    const grossSAR = args.amountHalalas / 100;
    const breakdown = args.metadata?.net_sar
      ? calculateVAT(parseFloat(args.metadata.net_sar))
      : reverseVAT(grossSAR);

    // ── العداد التسلسلي عبر RPC (atomic) ──
    const { data: nextCounterData } = await admin.rpc("next_subscription_invoice_counter", {
      p_tenant_id: args.tenantId,
    });
    const nextCounter = (nextCounterData as number) || 1;
    const invoiceNumber = `WP-${args.tenantId.slice(0, 8).toUpperCase()}-${String(nextCounter).padStart(6, "0")}`;

    // ── الوصف ──
    const planLabels: Record<string, string> = {
      basic: "اشتراك الأساسي",
      pro: "اشتراك الاحترافي",
    };
    const billingLabel = args.billing === "yearly" ? "سنوي" : "شهري";

    // ── إنشاء الفاتورة في الجدول الصحيح ──
    const { error: invErr } = await admin.from("subscription_invoices").insert({
      tenant_id: args.tenantId,
      invoice_number: invoiceNumber,
      invoice_counter: nextCounter,
      invoice_type: "simplified",
      payment_id: args.paymentId,
      payment_method: "card",
      subtotal: breakdown.net,
      vat_amount: breakdown.vat,
      vat_rate: 0.15,
      total: breakdown.gross,
      currency: "SAR",
      plan: args.plan,
      billing: args.billing,
      description: `${planLabels[args.plan] || args.plan} (${billingLabel})`,
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    if (invErr) {
      log.warn("إنشاء الفاتورة فشل", { error: invErr.message });
    } else {
      log.info("✅ فاتورة تم إنشاؤها", { invoiceNumber });
    }
  } catch (e) {
    log.error("Invoice creation error", e);
  }
}
