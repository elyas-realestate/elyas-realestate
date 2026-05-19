# برومت Claude in Browser — فحص نشر ٦ مايو ٢٠٢٦

> انسخ هذا الكامل والصقه في Claude in Browser بعد تأكّد النشر.
> الهدف: التحقّق أن Migrations 047/048/049 + الكود الجديد يعمل فعلاً في الإنتاج.

---

## 🤖 البرومت (انسخ من هنا)

```
أنت Claude المخصّص لفحص الجودة في منصة Wasit Pro (وسيط برو).
المنصة هي SaaS عقاري سعودي: https://elyas-realestate.vercel.app

مهمتك: التحقق من نشر تحديثات يوم ٦ مايو ٢٠٢٦ بدقّة، وتسجيل النتائج بترتيب.
تصرّف كـ QA tester حقيقي: لا تخمين، لا اختصار. إذا لم تتأكد من شيء، اكتبه صراحة.

═══════════════════════════════════════════════════════════════════
🎯 الهدف العام
═══════════════════════════════════════════════════════════════════
أتحقق من نجاح هذه التحديثات الكبيرة:
1) Migrations 047 + 048 + 049 (10 جداول جديدة)
2) APIs جديدة: /api/vcard/[slug], /api/qr, /api/lead-capture
3) APIs ذكاء اصطناعي: /api/ai/voice-to-property, /api/ai/smart-matching, /api/ai/neighborhood-intel
4) UI: زر "احفظ في جهات اتصالك" في /c/[slug] و /[slug]
5) رمز SAR الرسمي عاد يظهر (لا نص "ر.س")
6) صفحة /[slug] فيها زر تسجيل دخول
7) /[slug] الـ tagline تحت الاسم تقول "زيارة موقعي" أو شبيه

═══════════════════════════════════════════════════════════════════
📋 خطة الاختبار — نفّذها بالترتيب
═══════════════════════════════════════════════════════════════════

✅ STEP 1 — افتح https://elyas-realestate.vercel.app
- تأكّد تحميل الصفحة الرئيسية بدون أخطاء.
- خذ screenshot.
- تحقّق: العنوان والـ hero section تظهر طبيعياً.

✅ STEP 2 — افتح https://elyas-realestate.vercel.app/elyas
- خذ screenshot.
- ابحث عن:
  □ زر "📇 احفظ بياناتي" في الـ navbar (على اليسار قرب الواتساب).
  □ زر "تسجيل دخول" في الـ navbar.
  □ في قسم "تواصل معي" يوجد زر بارز "اضغط لحفظ في جهات اتصالك" مع تدرّج لوني وأيقونة contacts.
  □ تحت اسم الاسم في الهيرو لا يظهر "/elyas" بل عبارة طبيعية.
  □ رمز الريال (SAR) يظهر كأيقونة وليس نصاً "ر.س".

✅ STEP 3 — اختبر تنزيل الـ vCard
- اضغط على زر "اضغط لحفظ في جهات اتصالك".
- يجب أن ينزّل ملف بصيغة .vcf اسمه "Elyas...".
- إذا أمكن، افتح الملف بمحرر نصي وتأكد أنه يبدأ بـ "BEGIN:VCARD" وينتهي بـ "END:VCARD".
- يجب أن يحتوي على: FN, ORG, TITLE, TEL, EMAIL, URL على الأقل.
- خذ screenshot للملف بعد فتحه.

✅ STEP 4 — افتح https://elyas-realestate.vercel.app/c/elyas
- خذ screenshot كامل للصفحة.
- ابحث عن:
  □ زر "اضغط لحفظ في جهات اتصالك" — هيرو بارز مع تدرّج لوني.
  □ الزر يحتوي على نص فرعي: "iPhone · Android · Huawei — بضغطة واحدة".
  □ الأيقونات الاجتماعية تظهر بألوانها الرسمية (X أسود، Instagram تدرج وردي/برتقالي، إلخ).

✅ STEP 5 — اختبر API الـ QR مباشرة
- افتح في tab جديد:
  https://elyas-realestate.vercel.app/api/qr?text=TEST&size=400
- يجب أن تظهر صورة QR PNG.
- جرّب SVG:
  https://elyas-realestate.vercel.app/api/qr?text=TEST&format=svg
- يجب أن يظهر QR بصيغة SVG.
- خذ screenshot.

✅ STEP 6 — اختبر API الـ vCard مباشرة
- افتح:
  https://elyas-realestate.vercel.app/api/vcard/elyas
- يجب أن ينزّل ملف .vcf أو يعرض المحتوى نصياً.
- ابحث عن "BEGIN:VCARD" في المحتوى.

✅ STEP 7 — اختبر API لمعلومات الحي (Neighborhood Intel)
- افتح:
  https://elyas-realestate.vercel.app/api/ai/neighborhood-intel?city=الرياض&district=العليا
- توقّع JSON response فيه:
  { ok: true, data: { description_ar, highlights, schools_count, ... }, cached: true|false }
- إذا رجع cached=false المرة الأولى ثم cached=true المرة الثانية → ممتاز (الكاش يشتغل).
- خذ screenshot للـ JSON.

✅ STEP 8 — اختبر صفحة العقارات
- افتح: https://elyas-realestate.vercel.app/properties (أو /elyas/properties إن وُجدت)
- ابحث عن:
  □ رمز SAR رسمي (أيقونة مع لون متناسق مع النص — ليس "ر.س").
  □ بطاقات العقارات تظهر طبيعياً.

✅ STEP 9 — اختبر /pricing
- افتح: https://elyas-realestate.vercel.app/pricing
- تأكّد:
  □ الأسعار تظهر مع رمز SAR رسمي.
  □ الـ VAT 15% مذكور.
  □ ZATCA mention موجود.

✅ STEP 10 — اختبر sitemap وrobots
- افتح: https://elyas-realestate.vercel.app/sitemap.xml
  □ يجب أن يكون XML صحيح، فيه على الأقل 5 URLs.
- افتح: https://elyas-realestate.vercel.app/robots.txt
  □ يجب أن يكون فيه User-agent rules + إشارة للـ AI crawlers.

✅ STEP 11 — اختبر صفحة Beta Waitlist
- افتح: https://elyas-realestate.vercel.app/
- ابحث عن نموذج "قائمة الانتظار" أو "Waitlist".
- إذا وُجد، جرّب إدخال بريد وهمي test@example.com.
  □ يجب أن يظهر success message أو رسالة مشابهة.

✅ STEP 12 — Console errors check
- في كل صفحة فتحتها، افتح DevTools (F12) → Console.
- إذا ظهرت أخطاء حمراء، انسخها كاملة.

═══════════════════════════════════════════════════════════════════
📤 شكل التقرير المطلوب
═══════════════════════════════════════════════════════════════════

اكتب التقرير النهائي بهذا الشكل:

# تقرير فحص نشر ٦ مايو ٢٠٢٦

## ✅ ما يعمل
- [اكتب كل ما تأكدت من عمله]

## ⚠️ تحذيرات/ملاحظات
- [أي شي يعمل لكن فيه ملاحظة]

## ❌ أخطاء واضحة
- [أخطاء واضحة + screenshot/رابط]

## Console errors
- [اكتب الأخطاء من Console]

## Screenshots
- [أرفق الـ screenshots المهمة]

## التوصية النهائية
- جاهز للإطلاق ✅ / يحتاج إصلاحات قبل Beta ⚠️ / حالة طوارئ ❌

═══════════════════════════════════════════════════════════════════
🔥 قواعد مهمة
═══════════════════════════════════════════════════════════════════
- لا تخمّن. إذا ما تأكدت من شي، اكتب "غير مؤكد" بصراحة.
- اختبر فعلياً في المتصفح، ليس بالكلام.
- لا ترسل نتيجة "كل شي تمام" بدون screenshots.
- إذا API رد بـ 500 أو 404 → اعتبره خطأ حرج.
- إذا لقيت "ر.س" نصاً (وليس أيقونة) → خطأ حرج، أبلغ فوراً.

ابدأ الآن.
```

---

## 📋 ملاحظات للمالك

- الفحص اليدوي للجداول يحتاج Supabase Dashboard مباشرة (مش CIB).
  بعد رجوع التقرير، شغّل في Supabase SQL editor:

```sql
-- تحقّق الجداول الجديدة
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'lead_captures',
    'property_visit_bookings',
    'property_views_log',
    'testimonials',
    'property_comparisons',
    'property_voice_intakes',
    'virtual_staging_jobs',
    'client_property_alerts',
    'property_alert_matches',
    'whatsapp_catalog_sync_log',
    'neighborhood_intel'
  )
ORDER BY table_name;
```

- يجب أن ترجع 11 صف. إذا أقل، فيه migration ما اتطبق.

- تحقّق أن RLS مفعّل:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'lead_captures', 'testimonials', 'neighborhood_intel'
  );
```

- يجب أن يكون `rowsecurity = true` للكل.

---

**بعد ما يرجع التقرير من CIB، أرسله لي وسأحلّله نقطة-نقطة.**
