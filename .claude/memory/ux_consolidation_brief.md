# UX Consolidation Brief — وسيط برو

## المشكلة كما عبّر عنها المالك (إلياس)

> "اشعر بالإرباك في كثرة الخيارات والإعدادات. نريد دمج بعض الخيارات مع بعضها لسهولة الاستخدام. مثلاً كل شي يخص الـ AI يكون في خيار واحد."

## الواقع الحالي — توزّع خيارات الذكاء الاصطناعي

| الموقع                              | الوظيفة                              | المشكلة                    |
| ----------------------------------- | ------------------------------------ | -------------------------- |
| `/dashboard/organization`           | عرض المدراء + الموظفين + توجيهات     | يكرّر بعض ما في `/ceo`     |
| `/dashboard/ceo`                    | KPIs + Manager Reviews + escalations | overlap مع `/organization` |
| `/dashboard/ceo/operations`         | مفتاح رئيسي + toggles + جدول         | جديد                       |
| `/dashboard/ceo/test-mas`           | اختبار يدوي للموظفين                 | معزول                      |
| `/dashboard/ceo/approvals`          | بوابات الموافقة                      | معزول                      |
| `/admin/ai-providers`               | مفاتيح API + الأرصدة                 | في layout مختلف            |
| `/dashboard/settings/notifications` | Push notifications                   | لا علاقة بالـ AI أصلاً     |
| `/dashboard/marketing/queue`        | منشورات AI للمراجعة                  | تابع للتسويق منطقياً       |
| `/dashboard/clients/followups`      | رسائل متابعة AI                      | تابع للعملاء منطقياً       |
| `/dashboard/insights`               | تقارير المحلل                        | لا يربط بالموظف            |

## الهدف المقترح — مركز AI موحَّد

### Information Architecture جديد:

**`/dashboard/ai`** ← مركز ذكاء صناعي موحَّد، تابات داخلية:

1. **🛡️ التحكم** = `/dashboard/ceo/operations` الحالي (مفتاح رئيسي + toggles + استهلاك)
2. **👥 المساعدون** = `/dashboard/organization` + `/dashboard/ceo` مدمج (هرم + reviews + توجيهات)
3. **🧪 الاختبار** = `/dashboard/ceo/test-mas`
4. **⚖️ الموافقات** = `/dashboard/ceo/approvals`
5. **🔌 المزوّدون** = `/admin/ai-providers` (نقله من admin layout)
6. **📦 المخرجات** = جدول موحَّد لكل: منشورات pending + رسائل متابعة pending + تقارير + اقتراحات

### المخرجات الـ AI تبقى مرتبطة في موقعها الأصلي أيضاً:

- منشورات → `/dashboard/marketing` (لا تُنقل، فقط تظهر مؤشّر في `/ai/المخرجات`)
- متابعات → `/dashboard/clients`
- تقارير → `/dashboard/insights`

## مهمة Claude in Browser

اطلب من Claude in Browser:

1. **افتح المنصة** على https://wsetbro.online (أو localhost:3000) واستعرض:
   - sidebar الكامل
   - كل الصفحات المذكورة أعلاه
   - أخذ screenshots للحالة الحالية

2. **حدّد نقاط الإرباك بالضبط:**
   - أين يتكرر العرض (نفس البيانات في صفحتين)؟
   - أين يحتاج المستخدم 3+ نقرات للوصول لشي بسيط؟
   - أي labels غامضة (مثلاً "CEO" vs "المنظومة" vs "AI")?

3. **اقترح IA جديد:**
   - مرر على الـ sidebar الحالي
   - اقترح merge/split/rename للعناصر
   - رسم mental model مبسّط (٥-٧ أقسام رئيسية كحد أقصى)

4. **مكوّنات يجب توحيدها:**
   - **Toggle pattern** — اعمل component موحَّد للسويتشات (master, employee, manager، notifications، features)
   - **Card pattern** — مدير/موظف/قسم — كلهم بنفس الـ visual hierarchy
   - **Color semantics** — أخضر=نشط، أحمر=موقَف، رمادي=معطّل، ذهبي=accent — التزم في الكل
   - **Label terminology** — وحّد: "موظف ذكي" أو "مساعد"؟ "تشغيل" أو "تفعيل"؟

5. **اختبر تدفقاً واقعياً:**
   - "أبي أشغّل موظف، أشوف لو شغّال، وأطفّيه" — كم نقرة؟
   - "أبي أشوف كم استهلكت اليوم" — كم نقرة؟
   - "أبي أراجع منشور AI قبل ما ينشر" — كم نقرة؟

6. **خرّج:**
   - تقرير قصير (markdown) فيه:
     • قبل/بعد لكل عنصر سيُغيَّر
     • diff في الـ sidebar (ماذا يُحذف/يُضاف/يُعاد تسميته)
     • أولوية كل تعديل (P0 لازم/P1 يستحسن/P2 ميزة)
   - mockup HTML أو نص للـ sidebar الجديد + الـ AI Hub

## القيود

- لا تحذف صفحات حالياً قبل التأكد من إعادة التوجيه
- حافظ على RTL + Arabic-first
- لا تكسر روابط تُستخدم في كرونات أو webhooks (لا تغيّر المسارات الـ API)
- سرعة التحميل أهم من جاذبية التصميم

## بعد إقرار الخطة

سأطبّقها على مراحل:

- M1: إنشاء `/dashboard/ai` مع الـ tabs (يُعيد توجيه القديمة)
- M2: توحيد الـ Toggle component
- M3: اختصار الـ sidebar + إعادة تسمية
- M4: smoke test + push
