import { NextResponse } from "next/server";
import { extractCoordsFromUrl, isShortMapsUrl, warnIfOutsideSaudi } from "@/lib/google-maps-coords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/maps/resolve
 * Body: { url: string }
 * يحاول استخراج إحداثيات من رابط Google Maps. للروابط القصيرة
 * يتبع التوجيه (redirect) ثم يستخرج من الـ URL النهائي.
 */
export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url مطلوب" }, { status: 400 });
    }

    // محاولة محلية أولاً
    let coords = extractCoordsFromUrl(url);

    // لو فشل وكان short URL، نتبع الـ redirect
    if (!coords && isShortMapsUrl(url)) {
      try {
        const res = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; Wasit-Pro)" },
        });
        const finalUrl = res.url;
        coords = extractCoordsFromUrl(finalUrl);
      } catch {
        return NextResponse.json(
          { error: "تعذّر متابعة الرابط القصير، انسخ الرابط الكامل من Google Maps" },
          { status: 422 }
        );
      }
    }

    if (!coords) {
      return NextResponse.json(
        { error: "لم نستطع استخراج إحداثيات من هذا الرابط. تأكد من نسخه من تطبيق Google Maps." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      lat: coords.lat,
      lng: coords.lng,
      warning: warnIfOutsideSaudi(coords),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ غير متوقّع" }, { status: 500 });
  }
}
