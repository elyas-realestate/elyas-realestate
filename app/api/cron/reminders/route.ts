import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// /api/cron/reminders — يُشغّل يومياً (Vercel Cron أو خارجي)
// الحماية: Authorization: Bearer $CRON_SECRET
// المهام:
//   1. الفواتير المتأخرة أكثر من 0 أيام → تذكير
//   2. الفواتير التي تستحق خلال 3 أيام → تنبيه قبل الاستحقاق
//   3. عقود الإيجار التي تنتهي خلال 60/30/7 أيام → تنبيه تجديد
//   4. عقارات بحاجة متابعة (last_check > 7 أيام) → تنبيه
// ══════════════════════════════════════════════════════════════

function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / 86400000);
}

async function processInvoiceReminders(admin: ReturnType<typeof createClient>) {
  const now = new Date();
  // الفواتير غير المدفوعة (المتأخرة أو قاربت الاستحقاق خلال 3 أيام)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 3);

  const { data: invoices, error } = await admin
    .from("invoices")
    .select("id, tenant_id, client_id, client_name, amount, vat_amount, invoice_number, due_date, status")
    .eq("status", "غير مدفوعة")
    .not("due_date", "is", null)
    .lte("due_date", cutoff.toISOString().slice(0, 10));

  if (error || !invoices) return { processed: 0, error: error?.message };

  let notificationsCreated = 0;
  for (const inv of invoices) {
    const dueDate = new Date(inv.due_date as string);
    const daysOverdue = daysBetween(now, dueDate); // >0 = متأخرة
    const daysLeft    = -daysOverdue;              // >0 = باقي لها

    let title = "";
    let kind  = "";
    if (daysOverdue >= 14) {
      title = `فاتورة متأخرة 14 يوم — ${inv.client_name || "عميل"}`;
      kind  = "invoice_overdue_14";
    } else if (daysOverdue >= 7) {
      title = `فاتورة متأخرة 7 أيام — ${inv.client_name || "عميل"}`;
      kind  = "invoice_overdue_7";
    } else if (daysOverdue >= 1) {
      title = `فاتورة متأخرة — ${inv.client_name || "عميل"}`;
      kind  = "invoice_overdue";
    } else if (daysLeft <= 3 && daysLeft >= 0) {
      title = `فاتورة تستحق خلال ${daysLeft} أيام — ${inv.client_name || "عميل"}`;
      kind  = "invoice_due_soon";
    } else {
      continue;
    }

    // تأكد ما أنشأنا نفس التذكير اليوم
    const today = now.toISOString().slice(0, 10);
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("tenant_id", inv.tenant_id)
      .eq("kind", kind)
      .eq("reference_id", inv.id)
      .gte("created_at", `${today}T00:00:00`)
      .maybeSingle();
    if (existing) continue;

    await admin.from("notifications").insert({
      tenant_id:    inv.tenant_id,
      kind,
      title,
      body:         `المبلغ: ${Number(inv.amount) + Number(inv.vat_amount || 0)} ر.س — رقم ${inv.invoice_number || inv.id.slice(0,8)}`,
      reference_id: inv.id,
      reference_type: "invoice",
    });
    notificationsCreated++;
  }
  return { processed: invoices.length, notifications: notificationsCreated };
}

async function processContractReminders(admin: ReturnType<typeof createClient>) {
  // عقود الإيجار في property_requests بتاريخ end_date قريب
  // نعتمد على جدول contracts لو موجود — وإلا نتخطّى
  const now = new Date();
  const checkWindows = [60, 30, 7]; // أيام قبل الانتهاء

  const { data: contracts, error } = await admin
    .from("contracts")
    .select("id, tenant_id, tenant_name, property_id, end_date, status")
    .in("status", ["active", "نشط"])
    .not("end_date", "is", null);

  // جدول contracts قد لا يكون موجود — نتعامل بهدوء
  if (error) return { processed: 0, skipped: "contracts table not found" };
  if (!contracts) return { processed: 0 };

  let notificationsCreated = 0;
  for (const c of contracts) {
    const endDate = new Date(c.end_date as string);
    const daysLeft = daysBetween(endDate, now);

    if (!checkWindows.includes(daysLeft)) continue;

    const kind = `contract_expiry_${daysLeft}`;
    const today = now.toISOString().slice(0, 10);
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("tenant_id", c.tenant_id)
      .eq("kind", kind)
      .eq("reference_id", c.id)
      .gte("created_at", `${today}T00:00:00`)
      .maybeSingle();
    if (existing) continue;

    await admin.from("notifications").insert({
      tenant_id:      c.tenant_id,
      kind,
      title:          `عقد ينتهي خلال ${daysLeft} يوم — ${c.tenant_name || "مستأجر"}`,
      body:           `تاريخ الانتهاء: ${c.end_date} — ${daysLeft <= 7 ? "⚠️ عاجل" : "جدّد الآن"}`,
      reference_id:   c.id,
      reference_type: "contract",
    });
    notificationsCreated++;
  }
  return { processed: contracts.length, notifications: notificationsCreated };
}

async function processStaleProperties(admin: ReturnType<typeof createClient>) {
  // عقارات ما تم التحقق من توفرها خلال آخر 7 أيام
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString();

  const { data: props, error } = await admin
    .from("properties")
    .select("id, tenant_id, title, last_availability_check")
    .eq("status", "متاح");

  if (error || !props) return { processed: 0 };

  const stale = props.filter(
    (p) => !p.last_availability_check || new Date(p.last_availability_check) < cutoff,
  );

  // نلخّص في تنبيه واحد لكل tenant — مو تنبيه لكل عقار
  const byTenant: Record<string, number> = {};
  for (const p of stale) {
    byTenant[p.tenant_id] = (byTenant[p.tenant_id] || 0) + 1;
  }

  let notificationsCreated = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const [tenantId, count] of Object.entries(byTenant)) {
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("kind", "stale_properties")
      .gte("created_at", `${today}T00:00:00`)
      .maybeSingle();
    if (existing) continue;

    await admin.from("notifications").insert({
      tenant_id:      tenantId,
      kind:           "stale_properties",
      title:          `${count} عقار يحتاج متابعة توفّر`,
      body:           "آخر تحقّق من التوفّر كان أكثر من 7 أيام — تواصل مع المُلّاك.",
      reference_type: "property",
    });
    notificationsCreated++;
  }
  return { processed: stale.length, notifications: notificationsCreated };
}

export async function GET(req: NextRequest) {
  // ── حماية: Bearer token من Vercel Cron أو مصدر خارجي ──
  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const results = {
    started_at: new Date().toISOString(),
    invoices:   await processInvoiceReminders(admin),
    contracts:  await processContractReminders(admin),
    properties: await processStaleProperties(admin),
  };

  return NextResponse.json(results);
}

// POST للتشغيل اليدوي من الإعدادات (نفس الحماية)
export const POST = GET;
