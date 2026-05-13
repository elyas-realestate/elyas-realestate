/**
 * استخراج إحداثيات (lat/lng) من نص أو رابط Google Maps
 *
 * تدعم الأنماط:
 *  - رابط كامل: https://www.google.com/maps/@24.7136,46.6753,15z
 *  - place: https://www.google.com/maps/place/.../@24.7136,46.6753,15z
 *  - q-param: https://www.google.com/maps?q=24.7136,46.6753
 *  - !3d/!4d داخل URL طويل
 *  - أرقام مباشرة: "24.7136, 46.6753"
 *
 * الروابط القصيرة (maps.app.goo.gl / goo.gl/maps) تحتاج resolve عبر API
 * لأنها redirects — استعمل /api/maps/resolve.
 */

export type Coords = { lat: number; lng: number };

const SAUDI_BOUNDS = {
  latMin: 16,
  latMax: 33,
  lngMin: 34,
  lngMax: 56,
};

function isInSaudiBounds(lat: number, lng: number): boolean {
  return (
    lat >= SAUDI_BOUNDS.latMin &&
    lat <= SAUDI_BOUNDS.latMax &&
    lng >= SAUDI_BOUNDS.lngMin &&
    lng <= SAUDI_BOUNDS.lngMax
  );
}

/** صحّة عامة للإحداثيات (نطاق العالم) */
function isValidLatLng(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * استخراج محلي (بدون شبكة). يكفي لأكثر روابط Google Maps الكاملة.
 * إذا فشل، يرجع null — يمكن للمستدعي حينها استدعاء resolveShortUrl.
 */
export function extractCoordsFromUrl(input: string): Coords | null {
  if (!input || typeof input !== "string") return null;
  const url = input.trim();

  // 1) نمط @lat,lng — الأكثر شيوعاً
  const atMatch = url.match(/[@/](-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 2) نمط q=lat,lng (بارامتر استعلام)
  const qMatch = url.match(/[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 3) نمط !3dlat!4dlng (داخل URLs الطويلة)
  const bangMatch = url.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (bangMatch) {
    const lat = parseFloat(bangMatch[1]);
    const lng = parseFloat(bangMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 4) أرقام مباشرة (نسخ من Google Maps)
  const directMatch = url.match(/^\s*(-?\d{1,3}\.\d+)\s*[,،]\s*(-?\d{1,3}\.\d+)\s*$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  return null;
}

/**
 * يكتشف ما إذا كان الرابط من نوع short URL يحتاج resolve عبر شبكة.
 */
export function isShortMapsUrl(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const url = input.trim().toLowerCase();
  return (
    url.includes("maps.app.goo.gl") ||
    url.includes("goo.gl/maps") ||
    /^https?:\/\/maps\.google\.[a-z]+\/?\?[^@]+$/.test(url)
  );
}

/**
 * تحذير لو الإحداثيات خارج نطاق المملكة (لا يمنع، فقط تنبيه UX).
 */
export function warnIfOutsideSaudi(coords: Coords): string | null {
  if (!isInSaudiBounds(coords.lat, coords.lng)) {
    return "تنبيه: هذه الإحداثيات خارج المملكة العربية السعودية — تأكد من صحة الرابط.";
  }
  return null;
}
