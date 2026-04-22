import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/feed/properties?tenant=SLUG
// يُرجع XML feed للعقارات المنشورة — صيغة مبسّطة متوافقة مع معظم البوّابات.
// لا يتطلّب مصادقة (عام عمداً) — يستخدم service role لكنّه يفلتر is_published=true فقط.

function xmlEsc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenant");
  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant slug required" }, { status: 400 });
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // اعثر على المستأجر
  const { data: tenant } = await svc
    .from("tenants").select("id, slug, is_active").eq("slug", tenantSlug).maybeSingle();
  if (!tenant || !tenant.is_active) {
    return NextResponse.json({ error: "tenant not found" }, { status: 404 });
  }

  // العقارات المنشورة
  const { data: props } = await svc
    .from("properties")
    .select("id, code, title, description, price, city, district, main_category, sub_category, offer_type, land_area, rooms, main_image, images, created_at, updated_at")
    .eq("tenant_id", tenant.id)
    .eq("is_published", true)
    .order("updated_at", { ascending: false })
    .limit(500);

  const origin = new URL(req.url).origin;
  const feedUrl = `${origin}/api/feed/properties?tenant=${tenantSlug}`;
  const siteUrl = `${origin}/broker/${tenantSlug}`;
  const now = new Date().toUTCString();

  const items = (props || []).map((p: any) => {
    const link = `${origin}/property/${p.code || p.id}`;
    const pubDate = new Date(p.updated_at || p.created_at).toUTCString();
    const imgUrl = p.main_image || (p.images?.[0]);
    return `
    <item>
      <title>${xmlEsc(p.title)}</title>
      <link>${xmlEsc(link)}</link>
      <guid isPermaLink="true">${xmlEsc(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${p.description || p.title}]]></description>
      ${p.city     ? `<city>${xmlEsc(p.city)}</city>` : ""}
      ${p.district ? `<district>${xmlEsc(p.district)}</district>` : ""}
      ${p.price    ? `<price currency="SAR">${Number(p.price)}</price>` : ""}
      ${p.land_area? `<area unit="sqm">${Number(p.land_area)}</area>` : ""}
      ${p.rooms    ? `<bedrooms>${Number(p.rooms)}</bedrooms>` : ""}
      ${p.main_category ? `<category>${xmlEsc(p.main_category)}</category>` : ""}
      ${p.sub_category  ? `<subcategory>${xmlEsc(p.sub_category)}</subcategory>` : ""}
      ${p.offer_type    ? `<listing_type>${xmlEsc(p.offer_type)}</listing_type>` : ""}
      ${imgUrl          ? `<enclosure url="${xmlEsc(imgUrl)}" type="image/jpeg"/>` : ""}
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>عقارات ${xmlEsc(tenantSlug)}</title>
    <link>${xmlEsc(siteUrl)}</link>
    <description>خلاصة العقارات المنشورة</description>
    <language>ar</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${xmlEsc(feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800", // 30 دقيقة
    },
  });
}
