# وسيط برو — خارطة الطريق (Project Roadmap)

ملف ذاكرة مرجعي لأي جلسة قادمة. يُحدَّث بعد كل مرحلة.

## ✅ المُنجَز (Completed)

### المرحلة A — أساسيات
1. **ZATCA** — QR (مرحلة 1) + XML foundation (مرحلة 2) للفواتير السعودية
2. **Cron yardımcısı** — تذكيرات يومية على `/api/cron/reminders`
3. **Work Orders** — نظام أصول + فنيين + تذاكر صيانة
4. **2FA** — TOTP + recovery codes + فرض عبر `proxy.ts`

### المرحلة B — أدوات الإنتاجية
1. **CSV Import** — مع BOM/quote parser
2. **Monthly Reports** — PDF شهري عبر طباعة المتصفح
3. **Portal Distribution** — 8 بوّابات خارجية
4. **RSS Feed** — `/api/feed/properties?tenant=SLUG`

### إصلاحات أمنية
- سد ثغرة `invite_trigger` email-confirmation bypass
- فصل branding بين المستأجرين في PDF
- حل تعارض `middleware.ts` ← `proxy.ts` (Next.js 16)

### المرحلة C — Super Admin (2026-04-23)
1. **SQL migration 025** — `super_admins` table + `is_super_admin()` + SECURITY DEFINER helpers
2. **proxy.ts** — يستخدم `is_super_admin()` بدل owner_id
3. **صفحات إدارية جديدة:**
   - `/admin/tenants` — قائمة المستأجرين مع فلاتر وبحث
   - `/admin/tenants/[id]` — تفاصيل كاملة + تعليق/تفعيل + تغيير خطة
   - `/admin/subscriptions` — MRR/ARR + قائمة اشتراكات
   - `/admin/audit` — سجل التدقيق عبر كل المستأجرين
4. **API routes** — `/api/admin/{tenants,stats,subscriptions,audit}` مع `requireSuperAdmin`
5. **lib/admin-auth.ts** — helper `requireSuperAdmin(req)`
6. **تحديث admin layout nav** — إضافة روابط tenants/subscriptions/audit

### المرحلة D — AI Employees (2026-04-23)
1. **SQL migration 026** — جداول: `ai_employee_settings`, `ai_conversations`, `marketing_queue`, `followup_queue`, `weekly_insights` + RLS + `ensure_ai_employee_settings()` helper
2. **lib/ai-call.ts** — مُوحِّد لطلبات AI (6 مزودين: OpenAI, Anthropic, Google, Groq, DeepSeek, xAI)
3. **موظف التسويق** — `/api/cron/ai-marketing` (يومياً 7 UTC = 10ص السعودية) → يولِّد 3 منشورات لكل عقار جديد في 3 قنوات
4. **موظف المتابعة** — `/api/cron/ai-followup` (يومياً 15 UTC = 6م) → رسائل واتساب للعملاء الباردين
5. **محلل البيانات** — `/api/cron/ai-analyst` (أحد 6 UTC = 9ص) → تقرير أسبوعي (ملخص + توصيات)
6. **UI** — `/dashboard/ai-employees` — toggle لكل موظف، اختيار مزود/نموذج، إعدادات
7. **Vercel crons** — 4 مجدولات في `vercel.json` (reminders + 3 AI)
8. **موظف الاستقبال (receiver)** — الجدول جاهز، لكن تفعيله يحتاج Meta Business API يدوياً (قادم)

---

## 🚧 المتبقي (Pending) — حسب الأولوية

### تكميل AI Employees
- **موظف الاستقبال** — WhatsApp Auto-Reply عبر Edge Function
  - يستقبل webhook من Meta Business API / Twilio
  - يرد بصوت الوسيط (broker_identity.voice_description)
  - يبحث في properties ويرسل 3 مطابقات
  - يسجل في جدول `ai_conversations`
- **موظف التسويق** — Cron يومي 10ص
  - يختار أفضل 3 عقارات جديدة
  - ينشئ منشورات Twitter/IG/WhatsApp
  - يحفظ في `marketing_queue` للموافقة اليدوية
- **موظف المتابعة** — Cron يومي 6م
  - يبحث عن عملاء `sentiment='cold'` لم يُلمَسوا 14 يومًا
  - ينشئ رسائل WhatsApp مخصصة
  - يحفظ في `followup_queue`
- **محلّل البيانات** — Cron أسبوعي الأحد 9ص
  - يحلل أنواع عقارات تبيع أسرع، مناطق ساخنة، أهم عملاء
  - يولّد PDF توصيات، يُرسل بالبريد
  - يحفظ في `weekly_insights`
- **SQL migration 026** — `ai_conversations`, `marketing_queue`, `followup_queue`, `weekly_insights`, `ai_employee_settings` (كل جدول + tenant_id + RLS)
- **UI** — `/dashboard/ai-employees`

### 3️⃣ PWA — تطبيق جوّال
- `public/manifest.json` (icons 192/512/maskable, theme #C6914C, ar/rtl)
- `public/service-worker.js` (cache-first static، network-first API)
- `app/layout.tsx` — إضافة link rel=manifest + theme-color
- Web Push عبر `web-push` npm
- `/dashboard/settings/notifications`
- **SQL migration 027** — `push_subscriptions`

### 4️⃣ WhatsApp Business API رسمي
- استبدال `wa.me` بـ Meta Business API
- قوالب معتمدة يدوياً في Meta Business Manager
- `lib/whatsapp.ts` — `sendTemplate(to, template, vars)`
- Webhook receiver
- `/dashboard/whatsapp`

### 5️⃣ نظام العقود الإلكترونية
- قوالب: إيجار سكني، إيجار تجاري، بيع، حصر
- محرر رسمي (contenteditable + متغيرات)
- توقيع إلكتروني (canvas → base64)
- ربط Nafath (ابحث `nafath-integration` للمرجع)
- PDF نهائي + SHA-256 hash → `contract_hashes`
- **SQL migration 028** — `contracts`

---

## 🛠️ قواعد التطوير (يجب احترامها)

### UI
- Dark theme فقط — الوضع الحالي: bg `#09090B`/`#0F0F12`, accent بنفسجي `#7C3AED`/`#A78BFA`
  (الخطة تذكر gold `#C6914C` — هذا لون البراند للعامة، محفوظ في PLAN_META للخطط المدفوعة)
- Raw divs + inline styles (المشروع لا يستخدم shadcn/ui)
- RTL دائمًا، خط Tajawal (من Google Fonts)
- الكومبوننتات المحلية المتوفرة: `components/ui/{Button,Card,EmptyState,Input,Skeleton}`

### الكود
- Next.js 16: `proxy.ts` (ليس middleware)، دالة `proxy` (ليست middleware)
- Supabase client:
  - Client-side: `import { supabase } from "@/lib/supabase-browser"`
  - Server-side: `createServerClient` من `@supabase/ssr`
- كل جدول جديد → `tenant_id uuid NOT NULL REFERENCES public.tenants(id)` + RLS `USING (tenant_id = public.my_tenant_id())`
- لا `any` — عرّف interfaces في `types/database.ts`

### الأمن
- كل `/api/admin/*` → استخدم `requireSuperAdmin(req)` من `lib/admin-auth.ts`
- كل API route عادي: `auth.getUser()` → استخراج `tenant_id` من `tenants.owner_id = user.id`
- لا تستخدم `user.id` كـ tenant_id — `tenants.id` UUID مستقل
- `service_role` فقط في API routes بعد فحص auth صريح (وحتى لا نحتاج service_role في معظم الحالات — استخدم RPC SECURITY DEFINER)

### SQL
- كل migration: `IF NOT EXISTS` + `CREATE OR REPLACE` + `DROP POLICY IF EXISTS` (idempotent)
- `GRANT EXECUTE` + `GRANT SELECT` لـ `authenticated` عند الحاجة
- `SET search_path = public` في كل function

### Git
- commits صغيرة، رسائل بالإنجليزية
- Co-Authored-By: Claude <noreply@anthropic.com>
- push بعد كل ميزة مكتملة

---

## 📦 ملفات مهمّة للرجوع

| المسار | الوصف |
|---|---|
| `app/dashboard/layout.tsx` | nav + sidebar داشبورد الوسيط |
| `app/admin/layout.tsx` | nav لوحة المالك |
| `lib/supabase-browser.ts` | client |
| `lib/admin-auth.ts` | **جديد** — `requireSuperAdmin` للـ API |
| `lib/plan-limits.ts` | حدود الخطط |
| `lib/i18n.tsx` | نصوص AR/EN |
| `types/database.ts` | TypeScript types |
| `proxy.ts` | auth + security headers + 2FA + admin check |
| `supabase/024_portal_listings.sql` | أحدث نموذج migration قبل Super Admin |
| `supabase/025_super_admin.sql` | **جديد** — Super Admin + RPC helpers |

---

## ⚠️ حالة البيئة (Environment State)
- Supabase migrations 019–025 جاهزة — **025 يحتاج تشغيل يدوي** في Supabase SQL Editor بعد أول deploy
- Vercel env vars: OpenAI, Anthropic, Google, Groq, DeepSeek, xAI, Manus, Moyasar, CRON_SECRET + Supabase keys
- Cron يومي 8ص على `/api/cron/reminders`
- Owner email (seeded كـ super_admin في migration 025): `ggm4h4wkxw@privaterelay.appleid.com`

## 🔁 سير العمل بعد أي مرحلة
1. كتابة SQL migration (`supabase/0XX_*.sql`)
2. API routes (`app/api/...`)
3. UI (`app/dashboard/...` أو `app/admin/...`)
4. تحديث nav في layout المناسب
5. فحص محلي: `npm run build`
6. commit + push
7. تحديث هذا الملف
