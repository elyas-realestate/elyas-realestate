# 📱 دليل ربط WhatsApp Business API — Meta Cloud API

هذا الدليل يشرح كيفية ربط رقم WhatsApp Business عبر Meta Cloud API لتفعيل **الإرسال الفعلي** و**الرد التلقائي بالذكاء الاصطناعي** في منصّة وسيط برو.

> **ملاحظة:** الميزة تعمل بدون هذا الإعداد عبر `wa.me` (يفتح المحادثة في جوّالك يدوياً). الإعداد الكامل يحوّل النظام لإرسال آلي 24/7.

---

## 📋 ما تحتاجه قبل البدء

- حساب Facebook شخصي
- رقم جوال غير مستخدم في WhatsApp شخصي (سيُحوَّل لـ Business)
- عنوان نشاط تجاري (يفضّل سجل تجاري)
- 30-60 دقيقة للإعداد + 1-3 أيام انتظار موافقات Meta

---

## 🚀 الخطوات

### الخطوة 1: إنشاء Meta Business Account

1. اذهب إلى: https://business.facebook.com
2. اضغط **"Create Account"**
3. أدخل:
   - اسم النشاط: مثلاً "Vista Rise Real Estate"
   - الاسم الكامل
   - البريد الإلكتروني (يُفضل بريد العمل)
4. اتبع التحقق

---

### الخطوة 2: إنشاء WhatsApp Business App

1. اذهب إلى: https://developers.facebook.com/apps
2. اضغط **"Create App"** → اختار **"Business"**
3. أدخل اسم التطبيق (مثلاً "Wasit Pro WA")
4. اربطه بـ Business Account اللي أنشأته
5. في القائمة اليسرى → اختار **"WhatsApp"** → **"Set up"**

---

### الخطوة 3: إضافة رقم WhatsApp Business

داخل WhatsApp app → **API Setup**:

1. **اختار رقم اختبار مؤقت** للبدء (Meta توفّره مجاناً)
   - يكفي للاختبار
   - أو أضف رقمك الحقيقي (يحتاج تحقق SMS أو مكالمة)

2. **انسخ هذه القيم — راح تستخدمها في وسيط برو:**
   - **Phone Number ID** (مثل: `123456789012345`)
   - **WhatsApp Business Account ID**

---

### الخطوة 4: توليد Access Token دائم

> Token الافتراضي ينتهي بعد 24 ساعة. تحتاج System User Token دائم:

1. في Business Settings → **System Users** → اضغط Add
2. اسم: مثلاً "Wasit Pro Bot"، Role: **Admin**
3. اضغط **"Generate New Token"**:
   - App: اختار التطبيق اللي أنشأته
   - **Permissions:** فعّل:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - **Token expiration:** **Never** (دائم)
4. **انسخ التوكن واحفظه فوراً** (يظهر مرة واحدة فقط)
   - يبدأ بـ `EAAGm...` تقريباً

---

### الخطوة 5: ربط الإعدادات في وسيط برو

1. ادخل: `dashboard/whatsapp/settings` على موقعك
2. الصق:
   - **Phone Number ID**
   - **Business Account ID**
   - **Access Token** (الدائم)
   - **رقم WhatsApp المعروض** (للعملاء)
3. اضغط **"توليد"** بجانب Verify Token (يولّد قيمة عشوائية آمنة)
4. **انسخ الـ Verify Token** — راح تستخدمه في الخطوة التالية

---

### الخطوة 6: إضافة متغير البيئة في Vercel

> هذي خطوة لازم تُسوى مرة واحدة فقط

1. اذهب: https://vercel.com → مشروعك → **Settings** → **Environment Variables**
2. أضف متغير جديد:
   - **Name:** `META_WEBHOOK_VERIFY_TOKEN`
   - **Value:** نفس Verify Token اللي توّك ولّدته في الخطوة 5
   - **Environment:** Production + Preview
3. اضغط **Save**
4. **مهم:** Redeploy المشروع (Deployments → ⋮ → Redeploy)

---

### الخطوة 7: إعداد Webhook في Meta

1. ارجع لـ Meta Developers → تطبيقك → **WhatsApp** → **Configuration**
2. في قسم Webhook اضغط **"Edit"**:
   - **Callback URL:** الرابط الذي ظهر لك في صفحة إعدادات وسيط برو (شي مثل `https://your-domain.com/api/whatsapp/webhook`)
   - **Verify Token:** نفس قيمة `META_WEBHOOK_VERIFY_TOKEN` اللي حطيتها في Vercel
3. اضغط **"Verify and Save"**
   - إذا نجح: ✅ ستظهر علامة خضراء
   - إذا فشل: تأكد إن Vercel أعاد النشر بعد إضافة المتغير

4. **اشترك في الأحداث:**
   - في قسم Webhook fields → اضغط **"Manage"**
   - فعّل: `messages`
   - احفظ

---

### الخطوة 8: تفعيل الإرسال في وسيط برو

1. ارجع لـ `dashboard/whatsapp/settings`
2. شغّل خيار **"تفعيل WhatsApp Business"**
3. (اختياري) شغّل **"تفعيل الرد التلقائي"** للرد الذكي على رسائل العملاء
4. احفظ

---

### الخطوة 9: اختبار

1. أرسل رسالة من جوّال آخر إلى رقم WhatsApp Business
2. ادخل: `dashboard/whatsapp/inbox`
3. خلال ثوانٍ راح تظهر:
   - الرسالة الواردة في القائمة
   - رد تلقائي من AI (إذا الرد التلقائي مفعَّل)

---

## 🎯 إنشاء قوالب رسائل (Message Templates)

> القوالب مطلوبة لبدء محادثة جديدة مع عميل لم يردّ خلال 24 ساعة (سياسة Meta).

1. اذهب: Meta Business Manager → **WhatsApp Manager** → **Message Templates**
2. اضغط **"Create Template"**
3. اختر:
   - **Category:** Marketing / Utility / Authentication
   - **Language:** العربية (ar)
4. **مثال قالب متابعة عميل:**
   ```
   مرحباً {{1}}،
   
   شكراً لاهتمامك بالعقار {{2}}.
   هل تودّ معاينته أو الحصول على تفاصيل إضافية؟
   
   {{3}}
   ```
5. أرسل للموافقة (Meta توافق خلال دقائق إلى ساعات)
6. لما يُوافق عليه، يصير متاحاً للاستخدام تلقائياً

---

## 💰 التكلفة

Meta Cloud API:
- **1000 محادثة/شهرياً مجاناً** (لكل WhatsApp Business Account)
- بعدها: 0.01-0.06$ لكل محادثة (تختلف حسب الفئة)
- **نصيحة:** ابدأ بالحد المجاني كافٍ لـ 30+ صفقة شهرياً

---

## 🔐 الأمن

- **Access Token مشفَّر** في قاعدة البيانات (AES-256-GCM) — لا يظهر بالنص الواضح
- **Webhook signature verification** يحمي من الطلبات المزوّرة
- كل مستأجر له إعداداته المنفصلة (multi-tenant آمن)

---

## ❓ مشاكل شائعة

| المشكلة | الحل |
|---|---|
| Webhook verification failed | تأكد إن `META_WEBHOOK_VERIFY_TOKEN` في Vercel **مطابق تماماً** للتوكن في Meta + redeploy |
| Token Expired | ولّد System User Token دائم (Step 4) |
| لا تصل الرسائل | افحص Meta → Webhook → "messages" event مفعَّل + اختبار رسالة من Test Number |
| AI ما يردّ | تأكد `OPENAI_API_KEY` (أو غيره) موجود في Vercel، وخيار "auto_reply_enabled" مفعَّل |
| رسائل مرفوضة | ابدأ بقالب معتمد (محادثة جديدة) أو أرسل لعميل ردّ خلال 24 ساعة (free-form) |

---

## 📞 احتجت مساعدة؟

افتح المشروع في Cowork وقول: "ساعدني في إعداد Meta WhatsApp" — سأتحقق من حالة الإعدادات وأرشدك للخطوة التالية.

---

**آخر تحديث:** أبريل 2026 — Meta Cloud API v22
