import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// /api/ai/smart-matching — Smart Property Matching
// يفحص active alerts ويبحث عن عقارات مطابقة جديدة
// يُرسل تنبيه (واتساب/in-app) عند العثور على match
// يمكن استدعاؤه من cron أو manually
// ══════════════════════════════════════════════════════════════

interface AlertCriteria {
  id: string;
  tenant_id: string;
  client_id: string;
  city?: string;
  district?: string;
  main_category?: string;
  sub_category?: string;
  offer_type?: string;
  min_price?: number;
  max_price?: number;
  min_rooms?: number;
  min_area?: number;
}

interface PropertyRow {
  id: string;
  tenant_id: string;
  title: string;
  city?: string;
  district?: string;
  main_category?: string;
  sub_category?: string;
  offer_type?: string;
  price?: number;
  rooms?: number;
  area?: number;
}

function calculateMatchScore(alert: AlertCriteria, prop: PropertyRow): number {
  let matched = 0;
  let total = 0;

  // City (weight: 3)
  if (alert.city) {
    total += 3;
    if (prop.city === alert.city) matched += 3;
  }
  // District (weight: 2)
  if (alert.district) {
    total += 2;
    if (prop.district?.includes(alert.district)) matched += 2;
  }
  // Category (weight: 2)
  if (alert.main_category) {
    total += 2;
    if (prop.main_category === alert.main_category) matched += 2;
  }
  // Sub category (weight: 1)
  if (alert.sub_category) {
    total += 1;
    if (prop.sub_category === alert.sub_category) matched += 1;
  }
  // Offer type (weight: 2)
  if (alert.offer_type) {
    total += 2;
    if (prop.offer_type === alert.offer_type) matched += 2;
  }
  // Price range (weight: 2)
  if (alert.min_price || alert.max_price) {
    total += 2;
    const price = prop.price || 0;
    const minOk = !alert.min_price || price >= alert.min_price;
    const maxOk = !alert.max_price || price <= alert.max_price;
    if (minOk && maxOk) matched += 2;
  }
  // Rooms (weight: 1)
  if (alert.min_rooms) {
    total += 1;
    if ((prop.rooms || 0) >= alert.min_rooms) matched += 1;
  }
  // Area (weight: 1)
  if (alert.min_area) {
    total += 1;
    if ((prop.area || 0) >= alert.min_area) matched += 1;
  }

  if (total === 0) return 0;
  return Math.round((matched / total) * 100) / 100;
}

export async function POST(req: NextRequest) {
  // ── Auth أو CRON_SECRET ──
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const url = new URL(req.url);
  const cronSecret = url.searchParams.get("secret");
  const isCronCall = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!user && !isCronCall) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── جلب active alerts (لـ tenant واحد إذا user، لكلهم إذا cron) ──
  let alertsQuery = admin.from("client_property_alerts").select("*").eq("is_active", true);

  if (!isCronCall && user) {
    const { data: t } = await authClient
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!t?.id) return NextResponse.json({ error: "لا يوجد tenant" }, { status: 404 });
    alertsQuery = alertsQuery.eq("tenant_id", t.id);
  }

  const { data: alerts } = await alertsQuery;
  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ ok: true, alerts_checked: 0, new_matches: 0 });
  }

  let newMatchesCount = 0;
  const matchedDetails: Array<{ alert_id: string; property_id: string; score: number }> = [];

  for (const alert of alerts as AlertCriteria[]) {
    // ── جلب العقارات المنشورة لنفس tenant ──
    let propsQuery = admin
      .from("properties")
      .select(
        "id, tenant_id, title, city, district, main_category, sub_category, offer_type, price, rooms, area"
      )
      .eq("tenant_id", alert.tenant_id)
      .eq("is_published", true);

    if (alert.city) propsQuery = propsQuery.ilike("city", `%${alert.city}%`);
    if (alert.offer_type) propsQuery = propsQuery.eq("offer_type", alert.offer_type);

    const { data: props } = await propsQuery;
    if (!props) continue;

    for (const prop of props as PropertyRow[]) {
      const score = calculateMatchScore(alert, prop);
      if (score < 0.6) continue; // لا تنبيه إلا إذا التطابق ٦٠٪+

      // ── منع التكرار ──
      const { data: existing } = await admin
        .from("property_alert_matches")
        .select("id")
        .eq("alert_id", alert.id)
        .eq("property_id", prop.id)
        .maybeSingle();

      if (existing) continue;

      // ── إنشاء match ──
      await admin.from("property_alert_matches").insert({
        alert_id: alert.id,
        property_id: prop.id,
        match_score: score,
      });

      newMatchesCount++;
      matchedDetails.push({ alert_id: alert.id, property_id: prop.id, score });
    }

    // تحديث آخر فحص
    await admin
      .from("client_property_alerts")
      .update({ last_matched_at: new Date().toISOString() })
      .eq("id", alert.id);
  }

  return NextResponse.json({
    ok: true,
    alerts_checked: alerts.length,
    new_matches: newMatchesCount,
    matches: matchedDetails.slice(0, 20),
  });
}
