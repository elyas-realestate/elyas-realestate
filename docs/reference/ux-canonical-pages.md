# UX Canonical Pages — خريطة "الحقيقة الواحدة"

> آخر تحديث: ٦ مايو ٢٠٢٦
>
> القاعدة الذهبية: لو سأل المستخدم "أين أعدّل X؟" يجب أن يكون الجواب موقعاً واحداً فقط.

---

## 🎯 الميزات والصفحات الرسمية

| الميزة                                                | Canonical Page (الرسمية)                                           | تتعمل redirect / banner                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **الملف الشخصي + الهوية + الرخص**                     | `/dashboard/settings` (تبويب: الملف الشخصي)                        | تبويب "هوية الوسيط" في `/dashboard/content` → banner                |
| **بطاقة العميل العامة**                               | `/dashboard/profile-card` (روابط + بطاقة فقط — بدون editor للهوية) | —                                                                   |
| **الثيم والتصميم**                                    | `/dashboard/settings?tab=design`                                   | `/dashboard/theme`, `/dashboard/visual-editor` → redirect           |
| **التواصل (هاتف + بريد + سوشال)**                     | `/dashboard/settings?tab=contact`                                  | —                                                                   |
| **WhatsApp Cloud API (Tokens, Templates, Phone IDs)** | `/dashboard/whatsapp/settings`                                     | لينك من `/settings?tab=contact`                                     |
| **WhatsApp محادثات + قوالب**                          | `/dashboard/whatsapp` (hub بـ tabs)                                | —                                                                   |
| **الإشعارات**                                         | `/dashboard/settings/notifications`                                | —                                                                   |
| **هوية الرئيس التنفيذي**                              | `/dashboard/ceo/identity`                                          | —                                                                   |
| **AI Hub**                                            | `/dashboard/ai`                                                    | `ai-foundation`, `ai-employees`, `ai/control`, إلخ — كلها redirects |
| **المحتوى الذكي**                                     | `/dashboard/content`                                               | —                                                                   |
| **الحملات التسويقية**                                 | `/dashboard/marketing`                                             | —                                                                   |
| **توزيع العقارات**                                    | `/dashboard/distribute`                                            | —                                                                   |
| **مركز النمو**                                        | الـ ٣ أعلاه يشتركون في `<GrowthNav />`                             | —                                                                   |
| **إضافة عقار**                                        | `/dashboard/properties/add`                                        | `/properties/new` → redirect                                        |
| **إضافة عقار ذكية**                                   | `/dashboard/properties/smart-add`                                  | toggle بينها وبين `add` في الواجهة                                  |
| **طلبات العقار**                                      | `/dashboard/requests`                                              | `/property-requests/*` → redirects                                  |
| **الفواتير**                                          | `/dashboard/invoices`                                              | لينك من `/financial`                                                |
| **العمولات**                                          | `/dashboard/commissions`                                           | لينك من `/financial`                                                |
| **الأهداف**                                           | `/dashboard/goals`                                                 | لينك من `/financial`                                                |
| **العروض السعرية**                                    | `/dashboard/quotations`                                            | لينك من `/financial`                                                |
| **التقارير الشهرية**                                  | `/dashboard/reports`                                               | لينك من `/financial`                                                |
| **المستندات**                                         | `/dashboard/documents`                                             | لينك من Tools group                                                 |

---

## 🔁 الـ Redirects النشطة

| المسار القديم                       | يحوّل إلى                        | المهمة             |
| ----------------------------------- | -------------------------------- | ------------------ |
| `/dashboard/theme`                  | `/dashboard/settings?tab=design` | حذف تكرار الثيم    |
| `/dashboard/visual-editor`          | `/dashboard/settings?tab=design` | حذف تكرار          |
| `/dashboard/site-settings`          | `/dashboard/settings`            | دمج إعدادات الموقع |
| `/dashboard/property-requests`      | `/dashboard/requests`            | دمج طلبات العقار   |
| `/dashboard/property-requests/new`  | `/dashboard/requests?action=new` | دمج                |
| `/dashboard/property-requests/[id]` | `/dashboard/requests#id`         | دمج                |
| `/dashboard/properties/new`         | `/dashboard/properties/add`      | استبدال قديم       |
| `/dashboard/ai-foundation`          | `/dashboard/ai/control`          | legacy AI          |
| `/dashboard/ai-employees`           | `/dashboard/ai/assistants`       | legacy AI          |
| `/dashboard/ai`                     | `/dashboard/ai/control`          | hub default        |
| `/dashboard/ai/approvals`           | `/dashboard/ceo/approvals`       | توحيد الموافقات    |
| `/dashboard/ai/providers`           | `/admin/ai-providers`            | super-admin only   |
| `/dashboard/ceo/operations`         | `/dashboard/ai/control`          | توحيد التشغيل      |
| `/dashboard/ceo/test-mas`           | `/dashboard/ai/test`             | توحيد الاختبار     |
| `/dashboard/finance`                | `/dashboard/financial`           | إصلاح إملائي       |

---

## 🏛️ Hubs الموحَّدة (تبويبات داخلية)

| الـ Hub        | الـ Layout                          | التبويبات                                            |
| -------------- | ----------------------------------- | ---------------------------------------------------- |
| **AI**         | `app/dashboard/ai/layout.tsx`       | تحكم / مساعدون / اختبار / مخرجات / موافقات / مزوّدون |
| **CEO**        | `app/dashboard/ceo/layout.tsx`      | نظرة عامة / الهوية / الموافقات                       |
| **WhatsApp**   | `app/dashboard/whatsapp/layout.tsx` | المحادثات / القوالب / الإعدادات                      |
| **مركز النمو** | `<GrowthNav />` (شريط مشترك)        | المحتوى / الحملات / التوزيع                          |

---

## 🔗 Single Source of Truth Pattern

كل حقل DB يجب أن يُحرَّر من **endpoint واحد فقط**:

| الحقل                           | الـ Source of Truth               | يُقرَأ في                                                                                               |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `broker_identity.broker_name`   | `/dashboard/settings?tab=profile` | `/c/[slug]`, `/[slug]`, `/dashboard/profile-card` (fallback), `/dashboard/ceo/identity` (override only) |
| `broker_identity.photo_url`     | `/dashboard/settings?tab=profile` | نفس الأماكن أعلاه                                                                                       |
| `site_settings.phone`           | `/dashboard/settings?tab=contact` | كل العرض                                                                                                |
| `site_settings.color_*`         | `/dashboard/settings?tab=design`  | الثيم العام                                                                                             |
| `whatsapp_config.*`             | `/dashboard/whatsapp/settings`    | webhook, sendText, sendTemplate                                                                         |
| `ceo_identity.phones[*].number` | `/dashboard/ceo/identity`         | webhook isCEOPhone()                                                                                    |

---

## 📋 قواعد الإضافة المستقبلية

عند إضافة ميزة جديدة، اسأل:

1. **هل تكرّر ميزة موجودة؟** → ابحث في هذا الملف أولاً
2. **أين الحقل في DB؟** → اربطها بـ Source of Truth الموجود
3. **هل ستضيف صفحة جديدة؟** → فكّر في hub أو tab بدل صفحة منفصلة
4. **هل تحتاج navigation؟** → أضف لـ sidebar أو settings menu، وحدّث هذا الملف

---

## 🚫 لا تفعل

- ❌ لا تنشئ صفحة تكرّر حقول موجودة في صفحة أخرى
- ❌ لا تضف رابطاً في sidebar لصفحة سيتم redirect منها
- ❌ لا تستخدم `.update().not("id", "is", null)` — استخدم `.eq("tenant_id", tenantId)`
- ❌ لا تنسَ تحديث هذا الملف عند إضافة/حذف صفحة
