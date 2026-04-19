import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { calculateMatch, findBestMatches } from "@/lib/matching";

export async function POST(req: NextRequest) {
  try {
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

    // ── جلب tenant_id للمستخدم الحالي ──
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();
    if (!tenantData) return NextResponse.json({ error: "لم يتم العثور على الحساب" }, { status: 403 });

    const body = await req.json();
    const { request_id, filters } = body;

    // 1. جلب عقارات الـ tenant الحالي فقط
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, city, district, price, offer_type, main_category, rooms")
      .eq("is_published", true)
      .eq("tenant_id", tenantData.id);

    if (error || !properties) {
      return NextResponse.json({ error: "فشل في جلب العقارات" }, { status: 500 });
    }

    // 2. تطبيق خوارزمية المطابقة التلقائية
    const requestData = filters || {};
    const matches = findBestMatches(requestData, properties, request_id || "req_0", 10);

    // 3. (توسيع) يمكن جلب تفاصيل أكثر عن أعلى 10 عقارات مطابقة وعرضها
    if (matches.length > 0) {
      const ids = matches.map(m => m.property_id);
      const { data: matchedProperties } = await supabase
        .from("properties")
        .select("id, title, price, images, district, city")
        .in("id", ids);

      // دمج النقاط مع بيانات العقار
      const finalResult = matches.map(m => ({
        ...m,
        property: matchedProperties?.find(p => p.id === m.property_id) || null
      }));

      return NextResponse.json({ matches: finalResult });
    }

    return NextResponse.json({ matches: [] });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
