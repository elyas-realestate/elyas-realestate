# وسيط برو — خارطة الطريق الموحَّدة

> ملف ذاكرة مرجعي. يُحدَّث بعد كل مرحلة. كل المراحل الأساسية والثانوية مدمجة هنا.

---

## 🎯 رؤية المنصّة

شركة عقارية رقمية كاملة تعمل بـ **Multi-Agent System (MAS)**:

- أنت **CEO** (وسيط ومسوّق عقاري سعودي مرخّص).
- ٥ مدراء AI تحتك، تحت كل مدير ٢-٥ موظفين.
- ٨٠٪ من العمل يتم تلقائياً، ٢٠٪ تتدخّل أنت (إغلاقات، زيارات، نزاعات قانونية).
- منصّة SaaS متعدّدة المستأجرين: كل وسيط يحصل على نفس الهيكل + يخصّصه بتوجيهاته الخاصة.

---

## ✅ المُنجَز (15 مرحلة، أبريل 2026)

### الأساسيات (A → B)

- **A:** ZATCA QR + XML، Cron تذكيرات يومية، Work Orders، 2FA TOTP
- **B:** CSV Import، Monthly Reports PDF، توزيع على ٨ بوّابات، RSS feed

### التشغيل (C → E)

- **C — Super Admin** (migration 025): جدول `super_admins` + `is_super_admin()` + 4 صفحات إدارية للمالك (`/admin/tenants`, `/subscriptions`, `/audit`, `/ai-providers`)
- **D — AI Employees الأصلي** (migration 026): جداول `ai_employee_settings`, `marketing_queue`, `followup_queue`, `weekly_insights`, `ai_conversations`
- **E — Security Hardening** (migration 027): سدّ ٢٩/٣٠ ثغرة Supabase Advisor

### الميزات الرئيسية (F → I)

- **F — E-Contracts** (migration 028): ٤ قوالب + توقيع canvas + ختم SHA-256 + رابط `/sign/[token]` + RLS عام محصَّن
- **G — PWA** (migration 029): manifest + service worker + ٦ أيقونات + push subscriptions table
- **H — WhatsApp Business** (migration 030): Meta Cloud API integration + بوت رد ذكي + inbox UI + إعدادات
- **I — تجهيز الإطلاق التجاري:** صفحات مراجعة AI queues + insights + onboarding wizard + landing محدَّث

### تحسينات تشغيلية (J)

- **J:** إصلاح TypeScript errors قديمة (cron/reminders, zatca, ai-content) + Push notifications (web-push + VAPID + triggers)

### نظام MAS الكامل (K-1 → K-7)

- **K-1:** `/admin/ai-providers` — مركز صحة المزوّدين السبعة + balance + billing links
- **K-2** (migration 031): ٧ جداول للهيكل التنظيمي (`ai_managers`, `ai_employees`, `tenant_ai_config`, `directives`, `knowledge_base`, `org_escalations`, `org_activity_log`) + ٥ مدراء + ١٢ موظف seeded
- **K-3:** ٣ صفحات (`/dashboard/organization` + `manager/[id]` + `employee/[id]`) — تحرير توجيهات + KB + إدارة الفريق
- **K-4:** `/api/org/suggest-directives` — محرّك يحوّل استراتيجية المدير إلى توجيهات تشغيلية مقترحة لكل موظف
- **K-5:** `lib/ai-org-context.ts` — قلب النظام، يبني system prompt ديناميكي من DB. كل cron الآن يستخدم التوجيهات + KB. + لوحة `/dashboard/ceo`
- **K-7** (migration 032): **بوابات الموافقة** — `lib/approval-gates.ts` + `approval_rules` على ai_employees + `/api/org/approvals` + `/dashboard/ceo/approvals` + ربط webhook واتساب: قبل أي رد يحتوي سعر/التزام قانوني/جوال مالك، يتوقّف ويصعّد للـ CEO ويرسل رد آمن مؤقت
- **K-8** (migration 033): **Manager Loop — التعلّم التنظيمي** — جدول `manager_reviews` + cron `/api/cron/manager-loop` يومياً ٨م. كل مدير يقرأ نشاط فريقه آخر ٢٤س + تصعيدات + توجيهات، ويولّد JSON: `{summary, highlights, concerns, suggestions}`. الاقتراحات تُحفظ كـ directives بحالة pending. concerns حرجة تصعَّد للـ CEO تلقائياً. بطاقة "آخر مراجعة" في صفحة المدير
- **K-9 المرحلة ١** (migration 034): **CEO Assistant — السكرتير الشخصي عبر WhatsApp**
  - موظف `ceo_assistant` تحت cs_manager + ٧ توجيهات + ٣ عناصر KB
  - عمود `tenant_ai_config.ceo_phones` (jsonb) — يحفظ أرقام CEO المسموح بها
  - أرقام CEO الحالية: `["966598588787", "966539920003"]` (شخصي + عمل)
  - webhook عُدِّل: `isCEOPhone()` ثم `handleCEOMessage()` لأوامر CEO
  - النية: WhatsApp بوت يصبح **سكرتير CEO شخصي** بدلاً من قناة عملاء

### ⏸️ معلَّق — اختبار WhatsApp Webhook حقيقي

**الحالة في ٣٠ أبريل ٢٠٢٦ ١١م الرياض:**

- ✅ Webhook URL مسجَّل في Meta + verified
- ✅ messages event subscribed على App
- ✅ Wasit Pro مشترك على WABA (`/subscribed_apps`)
- ✅ Test Number CONNECTED (TIER_250)
- ✅ رقم 0539920003 + 0598588787 verified في Recipients
- ✅ **Test Webhook من Meta يصل لـ Vercel بنجاح (200)** — البنية ١٠٠٪ سليمة
- ❌ **رسائل WhatsApp الحقيقية لا تصل** — السبب: التطبيق في وضع "غير منشور"
- ❌ زر "نشر" غير مرئي في الواجهة الجديدة (Use Case mode + BSP classification)

**اكتشافات مهمة:**

- التطبيق مصنّف داخلياً كـ Business Solution Provider (BSP) — flow نشر مختلف
- Test Webhook نجح (تم في 00:50 يوم ١ مايو): يثبت أن endpoint Vercel يعمل، Verify Token صحيح، DNS/SSL سليم
- المشكلة مقصورة على **Meta لا يطلق webhook events للرسائل الحقيقية** في وضع Development

**خطوات التشخيص التالية (لما نعود):**

1. تجربة المستخدم نقر يدوي على وسم "غير منشور" في `/go_live/`
2. فحص Display Name للرقم التجريبي في Business Suite — قد يحتاج تعيين قبل تفعيل inbound webhook
3. التحقق من Admin role للمستخدم في `/roles/roles/`
4. لو كل ما سبق فشل: استخدام Meta Business Suite > Account Settings كآخر مسار

**معلومات حاسمة:**

- Phone Number ID: 1088586447672844
- WABA ID: 1394833282684191
- App ID: 1469992254871548
- META_WEBHOOK_VERIFY_TOKEN في Vercel: `WasitPro_vT_9xQ3mK7pR2hL8sF4nB6yJ1dC5wZ`
- قيم whatsapp_config مدخَلة في DB + is_active=true + auto_reply_enabled=true

### ✅ نظام الثيمات (T-1 → T-4) — مكتمل ٣٠ أبريل ٢٠٢٦

- `app/globals.css` — CSS variables شامل (٤٠+ متغير) لـ dark + cream
- Python script حوّل ٩٩ ملف من hex hardcoded → `var(--*)`
- `app/components/ThemeSwitcher.tsx` — مكوّن تبديل بين الثيمين
- مدمج في `/dashboard/theme` (في الأعلى)
- Init script في `app/layout.tsx` `<head>` لتجنّب FOUC
- التفضيل في `localStorage` بمفتاح `wasit_theme`
- الذهبي `#E8B86D` و `#C6914C` ثابت في الثيمين (هوية وسيط برو)
- الثيم الكريمي يستخدم: bg `#FAF7F2` + text `#1A1206` + cards `#FFFFFF` + borders `#E5DFD0`

### الخطط المعلَّقة الأخرى

- **K-9 المراحل ٢ و٣** — tools/استعلامات + تنبيهات استباقية
- Push Notifications تفعيل (Desktop)
- شحن xAI ($5)
- Manager Loop reviews (يتحقق منه عند الفتح القادم — ليلة ٣٠ أبريل اشتغل cron)
- Social Media APIs
- K-6 RAG + pgvector
- WhatsApp Production (SIM جديد لاحقاً + Business Verification)

---

## 🏢 الهيكل التنظيمي الحالي (٥ مدراء + ١٢ موظف)

### قسم خدمة العملاء (Gemini Flash)

- `whatsapp_qualifier` (DeepSeek) — رد ٢٤/٧
- `lead_scorer` (DeepSeek) — تصنيف Hot/Warm/Cold

### قسم التسويق (Gemini Flash)

- `content_creator` (Gemini Flash) — كتابة منشورات
- `trend_scout` (Grok) — مراقبة X
- `social_publisher` (DeepSeek) — نشر مجدوَل
- `community_manager` (DeepSeek) — رد على تعليقات
- `visual_director` (Gemini Pro) — صور + سكربتات Reels

### قسم إدارة الأملاك (Gemini Flash)

- `leasing_agent` (DeepSeek) — متابعة + تذكيرات إيجار
- `maintenance_coordinator` (GPT-4o-mini) — تذاكر صيانة
- `vacancy_filler` (DeepSeek) — تسويق الوحدات الفارغة

### القسم المالي (Gemini Flash)

- `bookkeeper` (DeepSeek) — قيود يومية
- `financial_analyst` (Gemini Pro) — تقرير أسبوعي
- `collections_specialist` (DeepSeek) — متابعة الفواتير المتأخرة

### قسم التطوير + BizDev (Gemini Flash)

- `bizdev_scout` (Grok) — مشاريع جديدة
- `dev_lead` (Claude Sonnet) — صيانة الكود

---

## 💰 سلّم ترقية النماذج

| المرحلة               | المدراء                                  | الموظفون                | تكلفة/وسيط/شهر | متى ترقّي        |
| --------------------- | ---------------------------------------- | ----------------------- | -------------- | ---------------- |
| ✅ **التجربة (الآن)** | Gemini 2.5 Flash                         | DeepSeek + Gemini Flash | **~$1.40**     | (الإعداد الحالي) |
| 🚀 أول ٥-١٠ مشتركين   | Claude Haiku 4.5                         | كما هو                  | ~$5            | عند MRR > $500   |
| 🏢 ٥٠-١٠٠ مشترك       | Haiku + Sonnet لـ critical فقط + Caching | كما هو                  | ~$1-2 (cached) | عند MRR > $5K    |
| 🌍 توسّع كبير         | Fine-tuning + RAG عبر pgvector           | كما هو                  | حسب الاستخدام  | عند MRR > $20K   |

**Concepts:**

- **Prompt Caching:** توفير تقني ٨٠-٩٠٪ على input متكرر (التوجيهات + KB).
- **RAG (Self-Learning الحقيقي):** بحث دلالي في KB عبر embeddings + pgvector.
- **Fine-tuning:** تدريب نموذج مخصّص — متقدم، تكلفة عالية.

---

## 🚧 المتبقي (Pending) — مرتَّب حسب القيمة

### ✅ المنظومة مُعبَّأة بمحتوى حقيقي (٢٩ أبريل ٢٠٢٦)

- **١٧ توجيه استراتيجي** على ٥ مدراء + **٥٥ توجيه تشغيلي** على ١٢ موظف
- اختبار شامل عبر Claude in Chrome مرتين، K-4 شغّال، الجودة 96%

### 🔥 أولوية عالية (يستحق التنفيذ قريباً)

#### 1. خيار K-6: RAG + pgvector

لما KB تكبر (50+ عنصر)، نضيف بحث دلالي:

- تفعيل `pgvector` في Supabase
- توليد embeddings عند إدخال KB
- بدل تحميل كل الـ KB في system prompt، نختار أهم ٥-١٠ بناءً على الاستفسار
- يقفز جودة الردود + يقلّل تكلفة input بنسبة ٧٠٪

#### 2. مراجعة Manager Loop الليلية

- cron يشتغل ٢٠:٠٠ UTC = ١١م الرياض
- بعد ١-٢ يوم سيكون عندنا مراجعات يومية فعلية على ٥ مدراء
- اقتراحات جديدة تتولّد آلياً بدون تدخل

### 🟡 أولوية متوسطة (تحتاج خطوات خارجية)

#### 5. تفعيل Push Notifications الفعلي

- VAPID keys مولَّدة ومحفوظة في الذاكرة
- يحتاج إضافتها لـ Vercel env vars (٥ دقائق)
- بعدها كل cron يطلق إشعاراً عند events مهمة

#### 6. تفعيل WhatsApp Business API الكامل

- اتباع `META_SETUP.md` (٩ خطوات، ١-٣ أيام موافقات Meta)
- بعدها بوت الاستقبال يبدأ يرد فعلياً عبر API بدل wa.me

#### 7. شحن xAI Grok ($5-10)

- لتفعيل `trend_scout` و `bizdev_scout`
- البحث في X/Twitter + الويب

#### 8. ربط Social Media APIs

- X API (1500 منشور مجاناً/شهر) — لـ `social_publisher`
- Instagram + Facebook (Meta Business)
- TikTok for Developers

#### 9. ربط Nafath

- تحقق هوية الطرف الثاني في العقود
- يتطلب اتفاقية مع نفاذ الحكومي

### 🔵 ميزات تجارية (للنمو)

#### 10. صفحة تسويقية متقدمة

- Hero بفيديو إيضاحي لـ MAS
- شهادات من أول وسطاء
- Case studies
- Live demo

#### 11. نظام Referral

- كل وسيط يدعو آخرين
- خصم ٢٠٪ على الاشتراك لكل دعوة ناجحة

#### 12. تحليل صور AI متقدم

- visual_director يحلل صور كل عقار جديد
- يقترح زوايا تصوير، إضاءة، crop
- يكشف عيوب بصرية تضعف العرض

#### 13. لوحة Analytics متقدمة

- Funnel تحليل (من أول لمسة إلى توقيع)
- A/B testing للمنشورات
- ROI لكل قناة سوشل ميديا

---

## ⚠️ حالة البيئة (Environment State) — محدَّثة

### Supabase

- **Project ID:** `apmdwautyqoqjlabxysz`
- **Migrations مُطبَّقة:** 019 → 033 (٢٤ migration)
- **Owner user_id (super_admin):** `d5162dae-e3bf-48fa-91a6-b0e0c2c5c43a` (`vip.elyas@gmail.com`)
- **Plan:** Free (الترقية لـ Pro تفعّل Leaked Password Protection)

### Vercel

- **Project ID:** `prj_OUZaoGOj0PJqCM1Z6hRJGP6ZZSa9`
- **Org:** `team_ZsF4MPBHFOGtB2pSe4jZJFoJ`
- **Crons (5):** reminders 8ص + ai-marketing 10ص + ai-followup 6م + ai-analyst أحد 9ص + manager-loop 11م

### مزوّدو AI (آخر فحص)

- ✅ OpenAI ($10) — يعمل
- ✅ Google Gemini (مجاني) — يعمل
- ✅ Groq (مجاني تجريبي) — يعمل
- ✅ Anthropic Claude ($13.03) — مشحون ويعمل
- ✅ DeepSeek ($9.00) — مشحون ويعمل
- ❌ xAI Grok — يحتاج شحن $5
- ❌ Manus — تجاهله

### Env Vars المضبوطة

- Supabase keys (URL + anon + service_role)
- AI keys (OpenAI, Anthropic, Google, Groq, DeepSeek, xAI, Manus)
- CRON_SECRET
- VAPID keys (مولَّدة، تحتاج إضافة لـ Vercel: `VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:vip.elyas@gmail.com`)
- ENCRYPTION_SECRET (لـ access tokens)
- Moyasar payment keys

### آخر commits

- `f58409a` — K-5 wire crons + CEO dashboard ✅
- `55f9afd` — K-4 auto-suggestion engine ✅
- `b4f862f` — K-2+K-3 org tables + UI ✅

---

## 🐛 ملاحظات معلَّقة (تتجمّع عبر الجلسات)

- جدول `ai_config` (legacy) عمود `api_key_encrypted` غير موجود — لا يستخدم فعلياً، النظام يعتمد على env vars
- صفحة `/admin/settings` القديمة تعرض env vars بشكل مضلِّل (server-only تظهر "مفقود") — استبدلها بـ `/admin/ai-providers` أو احذفها
- الجدول القديم `contracts` لا يستخدم — استبدلناه بـ `e_contracts`. يمكن حذفه لاحقاً
- جدول `audit_log` يستخدم `tenant_id = auth.uid()` (خطأ تاريخي) — يعمل لأنه يُكتب من service_role

---

## 🛠️ قواعد التطوير (لا تخالفها)

### UI

- Dark theme فقط
- Raw divs + inline styles (لا shadcn/ui)
- RTL دائماً، خط Tajawal
- ألوان الأقسام في `lib/org-constants.ts`

### الكود

- Next.js 16: `proxy.ts` (ليس middleware)
- Supabase client: `lib/supabase-browser` للكلاينت، `createServerClient` للسيرفر
- كل جدول جديد → `tenant_id` + RLS `USING (tenant_id = my_tenant_id())`
- لا `any` — عرّف types

### الأمن

- `/api/admin/*` → `requireSuperAdmin(req)`
- API عادي: `auth.getUser()` ثم استخراج tenant_id
- service_role فقط بعد auth + استخدم RPC SECURITY DEFINER عند الإمكان

### SQL

- `IF NOT EXISTS` + `CREATE OR REPLACE` + `DROP POLICY IF EXISTS` (idempotent)
- `SET search_path = public` في كل function

### Git

- Commits صغيرة، رسائل English
- Co-Authored-By: Claude
- push بعد كل ميزة

---

## 📦 ملفات محورية (للرجوع)

### Core Infrastructure

- `proxy.ts` — auth + 2FA + admin gate
- `lib/supabase-browser.ts` — client
- `lib/admin-auth.ts` — `requireSuperAdmin`
- `lib/ai-call.ts` — مُوحِّد AI (٦ مزودين)
- `lib/ai-org-context.ts` — **قلب MAS** — يبني system prompt ديناميكي
- `lib/whatsapp.ts` — Meta API + wa.me fallback
- `lib/push.ts` — web-push wrapper
- `lib/org-constants.ts` — ثوابت الأقسام

### Migrations الرئيسية

- `025_super_admin.sql` — لوحة المالك
- `026_ai_employees.sql` — الموظفين الأصلي (ai_employee_settings legacy)
- `027_security_hardening.sql` — RLS تصلّب
- `028_contracts.sql` — العقود الإلكترونية
- `029_push_subscriptions.sql` — PWA push
- `030_whatsapp.sql` — WhatsApp Business
- `031_org_structure.sql` — **الهيكل التنظيمي الكامل**

### واجهات محورية

- `/dashboard/ceo` — لوحة CEO الجديدة
- `/dashboard/organization` — الهيكل التنظيمي
- `/dashboard/contracts` — العقود
- `/dashboard/whatsapp/inbox` — محادثات
- `/admin/ai-providers` — صحة المزوّدين

---

## 🔁 سير العمل المعتاد

١. كتابة SQL migration (`supabase/0XX_*.sql`)
٢. تطبيقها فوراً عبر Supabase MCP
٣. كتابة API routes (مع `requireSuperAdmin` أو `auth.getUser()`)
٤. كتابة UI (`app/dashboard/...` أو `app/admin/...`)
٥. تحديث nav في layout المناسب
٦. type check محلي
٧. تحديث هذا الملف
٨. commit + push (المستخدم يطلق الأمر من PowerShell)

---

## 📌 ملاحظات للجلسة القادمة

### ما اكتمل في جلسة ٢٩ أبريل ٢٠٢٦

- K-7 Approval Gates + K-8 Manager Loop
- ١٤ bug fix بعد جولتين اختبار من Claude in Chrome
- Provider Fallback (Gemini → DeepSeek آلياً عند quota)
- Gemini 2.5 thinking budget fix
- ٢٣ اقتراحاً معتمد + ١ مرفوض (٩٦٪ جودة)
- تعبئة المنظومة: **١٧ توجيه استراتيجي + ٥٥ توجيه تشغيلي**
- VAPID keys فعلياً موجودة في Vercel
- SUPABASE_SERVICE_ROLE_KEY مضاف لـ Vercel

### Landing Page (Claude Design) ✅ مفعّلة على /

- `wasit-pro-landing.html` (344K) — نسخة احتياطية في الجذر
- `public/landing.html` — Landing احترافي يُقدَّم على `/landing.html` و `/`
- `next.config.ts` rewrite: `/` → `/landing.html` (URL يبقى `/`)
- **CSP موسّع لـ landing في `vercel.json`** (يحتاج blob: + unsafe-eval لتشغيل bundler runtime)
  - **مهم:** `next.config.ts` headers لا تطبَّق على static files في public/. لذلك CSP لـ landing موضوعة في `vercel.json` (يطبَّق على Edge قبل Next.js)
- ⚠️ ملاحظة: app/page.tsx القديمة لا تُعرض بعد الآن (الـ rewrite يطغى)

### الصفحات القانونية الجديدة (مفيدة لـ Meta + حماية قانونية)

- `/privacy` — سياسة الخصوصية (متوافقة PDPL + REGA + ZATCA)
- `/terms` — شروط الاستخدام
- `/data-processing` — اتفاقية معالجة البيانات
- `/license` — الترخيص الإعلاني (يقرأ تلقائياً من broker_identity)

### في الانتظار / لم يكتمل

- **WhatsApp Cloud API:** Claude in Chrome توقف عند Webhook Verify (احتاج META_WEBHOOK_VERIFY_TOKEN في Vercel)
  - الكود يستخدم: `META_WEBHOOK_VERIFY_TOKEN` فقط في Vercel
  - باقي القيم (phone_number_id, business_account_id, access_token, display_phone, display_name) → DB عبر `/dashboard/whatsapp/settings`
  - App Secret غير مستخدم حالياً
- **Push Notifications:** Safari iOS يحتاج "Add to Home Screen" أولاً (PWA install). على desktop يعمل مباشرة من /dashboard/settings/notifications
- **xAI Grok:** يحتاج $5 شحن (Provider Fallback يحلّ مكانه حالياً بنجاح)

### ما الذي يجب البدء به في الجلسة القادمة (مرتّب)

1. مراجعة Manager Loop reviews من ليلة ٢٩→٣٠ أبريل (إذا اشتغل cron)
2. دمج wasit-pro-landing.html كصفحة Next.js (~٣٠ دقيقة)
3. إكمال WhatsApp API (إضافة META_WEBHOOK_VERIFY_TOKEN لـ Vercel + redeploy + إعادة Verify في Meta + إدخال القيم في /dashboard/whatsapp/settings)
4. ميزات جانبية: KB إضافي، Push على Desktop، xAI شحن
