# استراتيجية وسيط برو — ٩٠ يوم

> آخر تحديث: مايو ٢٠٢٦ — مبني على ٣ تقارير تنافسية (تداولكم، نزل، تعاريف) + جولتَي فحص كلود لمنصتي

## الخصوم الأربعة

| المنصة       | السعر             | الدرجة            | USP                                          |
| ------------ | ----------------- | ----------------- | -------------------------------------------- |
| نزل          | 990 ر.س/سنة       | 7.7               | تكاملات حكومية + نزل Pay + تطبيق أصلي        |
| تعاريف       | 999 ر.س/سنة       | 7.5               | AI Matching + Page Builder + PMS كامل        |
| تداولكم      | 2,173 ر.س/سنة     | 5.5               | خريطة تفاعلية كواجهة عامة                    |
| **وسيط برو** | **2,988 ر.س/سنة** | **6.2 → هدف 8.5** | **١٤ مساعد AI + عقود سعودية + واتساب inbox** |

## ميادين تفوّقي (لا أتنازل عنها)

1. ١٤ مساعد AI متخصّص — لا أحد يقترب
2. واتساب Inbox + بوت + استيراد محادثات تاريخية
3. ٤ قوالب عقود سعودية (حصر، إيجار سكني/تجاري، بيع)
4. حاسبة تمويل + جدول استهلاك

## ميادين الضعف (مرتّبة بالخطورة)

1. 🔴 السعر ٣× أعلى — حلّه: باقة سنوية بخصم + VAT صريح
2. 🔴 لا "طلبات عقار" منفصل + AI Matching
3. 🟠 لا Property Management كامل
4. 🟠 لا Bulk CSV Import
5. 🟠 لا خريطة تفاعلية للصفحة العامة
6. 🟠 لا Visual Page Builder
7. 🟡 لا Moyasar داخلي
8. 🟡 تكاملات Ejar/ZATCA/Nafath/فال مخططة فقط

---

## مسار B (٣٠ يوماً) — الموافق عليه

### المرحلة ٠ — هذا الأسبوع

- [ ] Z1: Push كل التعديلات الحالية (الجولات السابقة)
- [ ] Z2: باقة سنوية بخصم ١٧٪ + ذكر VAT صراحة
- [ ] Z3: تجربة مجانية ١٤ يوم بدون بطاقة
- [ ] Z4: استبدال الإيموجي بـ SVG + توحيد PRO/AI

### المرحلة ١ — أسبوع ٢-٣ (Critical Parity)

- [ ] P1: كيان «طلبات العقار» منفصل + زر «تحويل لصفقة»
- [ ] P2: AI Property Matching مدمج بـ "اقتراح ٣ وحدات + رسالة WhatsApp جاهزة"
- [ ] P3: Bulk CSV Import للعقارات والعملاء
- [ ] P4: استخراج إحداثيات من رابط Google Maps

### المرحلة ٢ — أسبوع ٤ (Differentiation)

- [ ] D2: Property Management — جدول دفعات + تذكير واتساب آلي + لوحة مستحقات/متأخرات
- [ ] D3: Moyasar — رابط دفع للعميل من الصفقة + VAT تلقائي

### مؤجَّل (مرحلة ٢ لاحقة)

- D1: خريطة تفاعلية Mapbox للصفحة العامة
- G1: Ejar MVP
- G2: حقول فال
- G3: ZATCA Phase 2
- L1-L5: صقل + Multi-Pipeline + علامة مائية + Section Editor

---

## بنود الجولة الثانية المتبقية (متوازية مع B)

### 🔴 حرجة

1. تسريب MOYASAR_SECRET_KEY في /dashboard/subscription
2. صفحات 404: /dashboard/audit-log + /dashboard/security/2fa + /dashboard/billing
   3-4. إيموجي السوشال + إيموجي الخدمات الافتراضية في DB
3. ✅ بيانات الديمو في /dashboard (مُصلَح، يحتاج push)
4. قوالب العقود تعرض `{{first_party_name}}` خام
5. ✅ Cmd+K (مُصلَح، يحتاج push)

### 🟠 عالية

8. أرقام مختلطة في /mortgage (مُصلَح جزئياً)
9. غياب VAT في الاشتراكات → مع Z2
10. ✅ شعار navbar — revalidate=10
11. ✅ رفع صورة Hero (مُصلَح)
12. ✅ CEO/مدراء (مُصلَح)
13. تنظيم تبويبات الإعدادات
14. ✅ تخطيط /dashboard/deals (مُصلَح)

### 🟡 متوسطة

15. كود CSS الخام في /dashboard/theme
16. ✅ "اللون الذهبي" → "اللون المميّز"
17. مصطلحات: AI/PRO/Moyasar في عربية
18. ✅ جوال إلزامي
19. ✅ زر نشر العقار
20. ✅ /search "0 properties"
21. ✅ رمز ◆
22. شريط تقدم الاشتراك أحمر مع غير محدود

---

## الرسالة التسويقية المعتمدة

> **«وسيط واحد + ١٤ مساعد ذكي + Ejar من اليوم الأول.**
> **ميزانية مكتب كامل، بـ ٢٤٩ ر.س/شهر — أرخص من قهوتين يومياً.»**

## مبدأ الترتيب

- لا منافسة في ميادين الخصوم — تَفوَّق فيما يميّزك
- إغلاق فجوات أساسية فقط (٣ فجوات قاتلة) لا أكثر
- استثمار فائض الجهد في AI الأعمق + التكاملات الحكومية

---

## سجل الجلسات (لمنع تكرار العمل)

### آخر commit دُفع لـ Vercel: `def5eb1` (QUICK_THEMES_CREAM)

### كل ما تحت ينتظر `git push` فقط:

**جولة ١ (T-series):** ٣٤ بند — Theme system كامل + sidebar restructure
**جولة ٢ (U-series):** ١٠ بنود — dashboard real data + CEO wording + UX polish
**جولة ٣ (V-series):** ٦ بنود — security leak + contracts {{}} + VAT + AI/PRO عربنة
**جولة ٤ (P-series + Z2):** ٤ بنود — Property Requests + AI Matching + Maps + سنوي
**جولة ٥ (W-series):** ٨ بنود — sidebar Add fix + EN move + RTL toast + redirects
**جولة ٦ (V4):** Service icons SVG picker (Lucide)

### Migrations مطبّقة على DB:

- `site_settings_extras` (social/page columns)
- `property_requests_extras` (payment/government_support/converted_to_deal_id)
- `broker_identity_extras` (photo_url/commercial_register/freelance_doc)

### الباقي من خطة B:

- P3: Bulk CSV Import
- D2: Property Management
- D3: Moyasar payment links

---

## 🚨 درس مهم من الجولة ٤

**الـ user_preferences الذي يُرسَل لكلود كـ system prompt كان مخزَّناً في
`broker_identity.bio_long`** — يُعرَض حرفياً للعملاء على /elyas! هذا
يحدث لأن النص كان نص نظام يبدأ بـ "أنت إلياس الدخيل، طموح..."
ولُصق بطريقة ما في bio_long.

**الإصلاح:** تم استبدال bio_long في DB بنص bio احترافي بشري حقيقي.
**الوقاية المستقبلية:** في صفحة الإعدادات، يجب إضافة validation:

- لو نص bio_long يبدأ بـ "أنت" + اسم المستخدم → تحذير
- لو فيه أكثر من ٣٠٠ كلمة بنبرة "نظام" → تحذير

### حالة الـ push:

آخر commit وصل لـ Vercel: `def5eb1` (الثيم الكريمي)
كل الـ commits بعدها (٤+ جلسات) ما زالت محلية:

- BrandColorProvider, SocialIcon, ServiceIcon
- Sidebar restructure (collapsible groups + Cmd+K + Settings popover)
- Hero image hex fix + drag-drop upload
- MOYASAR_SECRET_KEY removal
- Property Requests + AI Matching + Convert button
- Maps coordinates extraction
- VAT + annual subscription
- AI/PRO عربنة
- Real dashboard data
- Lucide service icons
- Toast top-right
- /finance + /properties/new redirects
