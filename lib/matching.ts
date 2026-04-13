/**
 * خوارزمية المطابقة الذكية — تربط طلبات العملاء بالعقارات المتاحة
 * نقاط التطابق من 0 إلى 100 بناءً على: المدينة، الحي، السعر، النوع، الغرف
 */

export interface MatchScore {
  property_id: string;
  request_id: string;
  score: number;         // 0-100
  breakdown: {
    city: number;        // 0-30
    district: number;    // 0-20
    price: number;       // 0-25
    category: number;    // 0-15
    rooms: number;       // 0-10
  };
}

export function calculateMatch(
  request: {
    city?: string;
    district?: string;
    min_price?: number;
    max_price?: number;
    offer_type?: string;
    main_category?: string;
    rooms?: number;
  },
  property: {
    id: string;
    city?: string;
    district?: string;
    price?: number;
    offer_type?: string;
    main_category?: string;
    rooms?: number;
  },
  requestId: string
): MatchScore {
  const breakdown = { city: 0, district: 0, price: 0, category: 0, rooms: 0 };

  // المدينة — 30 نقطة
  if (request.city && property.city) {
    if (property.city === request.city) breakdown.city = 30;
    else if (property.city.includes(request.city) || request.city.includes(property.city)) breakdown.city = 15;
  } else if (!request.city) {
    breakdown.city = 15; // لا تفضيل = نصف النقاط
  }

  // الحي — 20 نقطة
  if (request.district && property.district) {
    if (property.district === request.district) breakdown.district = 20;
    else if (property.district.includes(request.district) || request.district.includes(property.district)) breakdown.district = 10;
  } else if (!request.district) {
    breakdown.district = 10;
  }

  // السعر — 25 نقطة
  if (property.price) {
    const min = request.min_price || 0;
    const max = request.max_price || Infinity;
    if (property.price >= min && property.price <= max) {
      breakdown.price = 25;
    } else {
      // حساب القرب النسبي
      const mid = (min + (max === Infinity ? min * 2 : max)) / 2;
      if (mid > 0) {
        const diff = Math.abs(property.price - mid) / mid;
        if (diff < 0.1) breakdown.price = 20;
        else if (diff < 0.25) breakdown.price = 15;
        else if (diff < 0.5) breakdown.price = 8;
      }
    }
  } else if (!request.min_price && !request.max_price) {
    breakdown.price = 12;
  }

  // التصنيف + نوع العرض — 15 نقطة
  if (request.main_category && property.main_category) {
    if (property.main_category === request.main_category) breakdown.category += 8;
  } else {
    breakdown.category += 4;
  }
  if (request.offer_type && property.offer_type) {
    if (property.offer_type === request.offer_type) breakdown.category += 7;
  } else {
    breakdown.category += 3;
  }

  // الغرف — 10 نقاط
  if (request.rooms && property.rooms) {
    if (property.rooms === request.rooms) breakdown.rooms = 10;
    else if (Math.abs(property.rooms - request.rooms) === 1) breakdown.rooms = 6;
    else if (Math.abs(property.rooms - request.rooms) === 2) breakdown.rooms = 3;
  } else if (!request.rooms) {
    breakdown.rooms = 5;
  }

  const score = breakdown.city + breakdown.district + breakdown.price + breakdown.category + breakdown.rooms;

  return {
    property_id: property.id,
    request_id: requestId,
    score,
    breakdown,
  };
}

/**
 * ترتيب العقارات حسب أفضل تطابق مع طلب العميل
 */
export function findBestMatches(
  request: Parameters<typeof calculateMatch>[0],
  properties: Parameters<typeof calculateMatch>[1][],
  requestId: string,
  limit = 5
): MatchScore[] {
  return properties
    .map(p => calculateMatch(request, p, requestId))
    .filter(m => m.score >= 30) // حد أدنى 30%
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
