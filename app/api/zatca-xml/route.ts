import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { buildUblXml, hashInvoice, isValidSaudiVat } from "@/lib/zatca";

// ── GET /api/zatca-xml?id=<invoice_id> ──
// يصدّر فاتورة كـ UBL 2.1 XML متوافق مع ZATCA Phase 2
export async function GET(req: NextRequest) {
  // ── Auth ──
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // ── Fetch invoice (tenant scoped) ──
  const { data: inv, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();
  if (error || !inv) return NextResponse.json({ error: "not found" }, { status: 404 });

  // ── Fetch seller identity ──
  const { data: identity } = await supabase
    .from("broker_identity")
    .select("broker_name, vat_number, commercial_register, commercial_street, commercial_district, commercial_city, commercial_postal, commercial_building")
    .eq("tenant_id", user.id)
    .maybeSingle();

  if (!identity?.vat_number || !isValidSaudiVat(identity.vat_number)) {
    return NextResponse.json({
      error: "الرقم الضريبي غير موجود أو غير صالح — أضفه في الإعدادات → الشهادات",
    }, { status: 400 });
  }

  // ── previous hash (آخر فاتورة لنفس الـ tenant) ──
  const { data: prev } = await supabase
    .from("invoices")
    .select("invoice_hash")
    .eq("tenant_id", user.id)
    .lt("invoice_counter", inv.invoice_counter || Number.MAX_SAFE_INTEGER)
    .order("invoice_counter", { ascending: false })
    .limit(1)
    .maybeSingle();

  const issueDateTime = new Date(inv.created_at || Date.now());
  const issueDate = issueDateTime.toISOString().slice(0, 10);
  const issueTime = issueDateTime.toISOString().slice(11, 19);

  const xml = buildUblXml({
    invoiceUuid:    inv.xml_uuid || inv.id,
    invoiceNumber:  inv.invoice_number || `INV-${inv.invoice_counter || 0}`,
    invoiceCounter: Number(inv.invoice_counter || 1),
    issueDate,
    issueTime,
    invoiceType:    (inv.invoice_type === "simplified" ? "simplified" : "standard"),
    previousHash:   prev?.invoice_hash || null,
    seller: {
      name:           identity.broker_name || "وسيط عقاري",
      vatNumber:      identity.vat_number,
      crNumber:       identity.commercial_register || "",
      street:         identity.commercial_street    || "",
      buildingNumber: identity.commercial_building  || "",
      district:       identity.commercial_district  || "",
      city:           identity.commercial_city      || "الرياض",
      postalCode:     identity.commercial_postal    || "",
    },
    buyer: {
      name:  inv.client_name || "عميل نقدي",
    },
    lines: [
      {
        id:          1,
        description: inv.title || "خدمة وساطة عقارية",
        quantity:    1,
        unitPrice:   Number(inv.amount || 0),
        vatRate:     15,
      },
    ],
    currency: inv.currency || "SAR",
  });

  // ── احسب الـ hash وخزّنه في الفاتورة (لسلسلة ZATCA) ──
  const hash = await hashInvoice(xml);
  await supabase
    .from("invoices")
    .update({
      invoice_hash:  hash,
      previous_hash: prev?.invoice_hash || null,
    })
    .eq("id", inv.id)
    .eq("tenant_id", user.id);

  const filename = `invoice-${inv.invoice_number || inv.invoice_counter || inv.id.slice(0,8)}.xml`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type":        "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Invoice-Hash":      hash,
    },
  });
}
