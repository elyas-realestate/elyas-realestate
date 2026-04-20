import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = ["شراء", "إيجار", "استثمار", "بيع", "أخرى"] as const;
const ALLOWED_CATEGORIES = ["سكني", "تجاري", "أرض", ""] as const;

function sanitize(val: unknown, maxLen = 200): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name         = sanitize(body.name, 100);
    const phone        = sanitize(body.phone, 20).replace(/[^\d+]/g, "");
    const request_type = sanitize(body.request_type, 30);
    const main_category = sanitize(body.main_category, 30);
    const budget_min   = Number(body.budget_min) || null;
    const budget_max   = Number(body.budget_max) || null;
    const notes        = sanitize(body.notes, 500);
    const tenant_id    = sanitize(body.tenant_id, 40);

    if (!name || name.length < 2)      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    if (!phone || phone.length < 9)    return NextResponse.json({ error: "رقم الجوال غير صحيح" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(request_type as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json({ error: "نوع الطلب غير صحيح" }, { status: 400 });
    }
    if (!tenant_id) return NextResponse.json({ error: "معرّف المكتب مفقود" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // ── التحقق أن tenant_id حقيقي وموجود في قاعدة البيانات ──
    // يمنع حقن بيانات مزيفة تحت أي tenant_id يرسله المهاجم
    const { data: tenantExists } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", tenant_id)
      .single();
    if (!tenantExists) return NextResponse.json({ error: "مكتب غير موجود" }, { status: 400 });

    // أنشئ أو ابحث عن العميل بالجوال
    let clientId: string | null = null;
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("phone", phone)
      .single();

    if (existing) {
      clientId = existing.id;
    } else {
      const { data: newClient } = await supabase
        .from("clients")
        .insert({ tenant_id, full_name: name, phone, source: "الموقع الإلكتروني", status: "جديد" })
        .select("id")
        .single();
      clientId = newClient?.id ?? null;
    }

    // أضف الطلب
    const { error } = await supabase.from("property_requests").insert({
      tenant_id,
      client_file_id: clientId,
      request_type,
      main_category: main_category || null,
      budget_min,
      budget_max,
      required_features: notes || null,
      urgency_level: "عادي",
      status: "جديد",
      city: "الرياض",
    });

    if (error) {
      console.error("broker-request insert error:", error.message);
      return NextResponse.json({ error: "حدث خطأ، حاول مرة أخرى" }, { status: 500 });
    }

    // ── إشعار البريد الإلكتروني للوسيط (fire & forget) ──
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    fetch(`${siteUrl}/api/notify-broker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: tenant_id,
        type: "request",
        data: {
          "الاسم":       name,
          "الجوال":      phone,
          "نوع الطلب":   request_type,
          "التصنيف":     main_category || "—",
          "الميزانية":   budget_min || budget_max ? `${budget_min?.toLocaleString() || "—"} - ${budget_max?.toLocaleString() || "—"} ر.س` : "—",
          "ملاحظات":     notes || "",
        },
      }),
    }).catch(() => {}); // لا نوقف الرد على فشل الإيميل

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });
  }
}
