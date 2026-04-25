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

### المرحلة F — العقود الإلكترونية (2026-04-25)
1. **SQL migration 028** — `e_contract_templates`, `e_contracts`, `e_contract_signatures`, `e_contract_audit` (بادئة `e_` لتجنّب التعارض مع جدول `contracts` القديم في tenant-portal)
2. **4 قوالب نظام seed**: إيجار سكني، إيجار تجاري، عقد بيع، عقد حصر تسويق (بمتغيرات مرنة عبر JSONB)
3. **`/dashboard/contracts`** — قائمة العقود + فلاتر (حالة + فئة) + بحث + KPIs
4. **`/dashboard/contracts/new`** — اختيار قالب + ملء حقول ديناميكي + معاينة حية
5. **`/dashboard/contracts/[id]`** — تفاصيل العقد + إجراءات (إرسال للتوقيع، تثبيت بختم رقمي SHA-256، طباعة/PDF، إلغاء، حذف) + رابط مشاركة عبر واتساب
6. **`components/SignaturePad.tsx`** — لوحة توقيع canvas (لمس + ماوس) قابلة لإعادة الاستخدام
7. **`/sign/[token]`** — صفحة عامة (بدون تسجيل دخول) للطرف الثاني للاطلاع والتوقيع
8. **RLS عامة محصَّنة** — الطرف الثاني يصل عبر `signing_token` فقط، صلاحية 30 يومًا
9. **trigger ذكي** — يحدّث حالة العقد تلقائياً عند إكتمال التوقيعات (draft→sent→partial→signed)
10. **رقم تسلسلي** — `next_e_contract_number(tid)` يُولّد `EC-2026-0001`

### المرحلة E — Security Hardening (2026-04-23)
**أُصلحت 29 ثغرة من أصل 30 من Supabase Advisor** (الباقي إعداد Auth يحتاج تفعيل يدوي):
1. **Migration 027** — حذف سياسات RLS الفضفاضة `USING (true)` على role=anon من 10 جداول حساسة (كانت تخرق multi-tenancy!)
2. **تفعيل RLS على 12 جدول** كانت بلا حماية:
   - مرجعية (قراءة عامة): `property_categories`, `property_features_ref`
   - مرتبطة بـ tenant عبر FK (via subquery): `client_files`, `deal_followups`, `matches`, `content_platforms`, `property_features_entries`, `partners`
   - يتيمة غير مستخدمة (إغلاق كامل): `users`, `documents`, `events`, `event_clients`
3. **تحصين search_path** على 9 دوال (`set_goals_tenant_id`, `update_updated_at`, إلخ)
4. **إعادة إنشاء view** `property_distribution_summary` بـ `security_invoker=true` بدل SECURITY DEFINER
5. **تقييد Storage bucket** `assets` — إزالة السياسات الفضفاضة، إبقاء الـ public URLs فقط للملفات الفردية (بدون listing)

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

### 1️⃣ اختبار شامل وإصلاح bugs (موصى به أولاً)
- اختبار `/admin` و`/admin/tenants` و`/admin/subscriptions` و`/admin/audit`
- اختبار `/dashboard/ai-employees` (تفعيل/تعطيل، حفظ إعدادات)
- اختبار عزل البيانات بحساب وسيط ثاني (multi-tenancy)
- اختبار توليد محتوى من cron يدوياً (مع `Authorization: Bearer $CRON_SECRET`)

### 2️⃣ تحسينات العقود الإلكترونية (المرحلة F مكتملة، هذي إضافات)
- ربط Nafath (تحقق هوية الطرف الثاني عبر تطبيق نفاذ الحكومي)
- إرسال تلقائي عبر WhatsApp Business API (بدل النسخ اليدوي للرابط)
- إشعار للوسيط لما الطرف الثاني يفتح الرابط أو يوقّع
- تنزيل PDF موقَّع كملف بدل طباعة المتصفح (مكتبة pdf-lib مثلاً)

### 3️⃣ PWA — تطبيق جوّال
- `public/manifest.json` (icons 192/512/maskable, theme #7C3AED, ar/rtl)
- `public/service-worker.js` (cache-first static، network-first API)
- `app/layout.tsx` — إضافة link rel=manifest + theme-color
- Web Push عبر `web-push` npm
- `/dashboard/settings/notifications`
- **SQL migration 029** — `push_subscriptions`

### 4️⃣ موظف الاستقبال (WhatsApp Auto-Reply) — يحتاج Meta setup يدوي
- يستقبل webhook من Meta Business API
- يرد بصوت الوسيط (`broker_identity.writing_tone`)
- يبحث في `properties` ويرسل 3 مطابقات
- يسجل في `ai_conversations` (الجدول جاهز من migration 026)
- **يحتاج منك أولاً:** إنشاء حساب Meta Business + توثيق رقم WhatsApp + قوالب رسائل معتمدة

### 5️⃣ WhatsApp Business API رسمي (يبدأ مع #4)
- استبدال `wa.me` بـ Meta Business API للإرسال الفعلي
- `lib/whatsapp.ts` — `sendTemplate(to, template, vars)`
- زرّ "إرسال" في `followup_queue` و`marketing_queue` (whatsapp channel)
- `/dashboard/whatsapp` — عرض المحادثات والقوالب

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
| `supabase/025_super_admin.sql` | Super Admin + RPC helpers |
| `supabase/026_ai_employees.sql` | جداول الموظفين الذكيين |
| `supabase/027_security_hardening.sql` | إصلاح 29 ثغرة Supabase Advisor |
| `lib/ai-call.ts` | مُوحِّد طلبات AI (server-side) |
| `app/api/cron/ai-{marketing,followup,analyst}/route.ts` | crons الموظفين الذكيين |

---

## ⚠️ حالة البيئة (Environment State)
- **Supabase migrations 019–027 مُطبَّقة فعلياً على قاعدة البيانات** (عبر MCP)
- **Supabase project_id:** `apmdwautyqoqjlabxysz`
- **Vercel project_id:** `prj_OUZaoGOj0PJqCM1Z6hRJGP6ZZSa9` (org `team_ZsF4MPBHFOGtB2pSe4jZJFoJ`)
- Vercel env vars: OpenAI, Anthropic, Google, Groq, DeepSeek, xAI, Manus, Moyasar, CRON_SECRET + Supabase keys
- **Vercel crons (4):** reminders 8ص، ai-marketing 10ص، ai-followup 6م، ai-analyst أحد 9ص (كلها بتوقيت السعودية، الـ schedule بـ UTC)
- **Owner Supabase user_id (super_admin):** `d5162dae-e3bf-48fa-91a6-b0e0c2c5c43a` (email: `vip.elyas@gmail.com`)
- Cowork/Anthropic relay email: `ggm4h4wkxw@privaterelay.appleid.com` (مختلف عن Supabase email)
- **Supabase plan: Free** — Leaked Password Protection يحتاج Pro للتفعيل
- **آخر commit مدفوع:** `bbd5d4b feat(security): harden RLS - fix 29 Supabase advisor warnings`
- **بانتظار push:** المرحلة F (e-contracts) — الملفات جاهزة في المجلد لكن لم تُدفع بعد

## 🐛 ملاحظات معلَّقة (لا تنسَ)
- ملف `app/api/cron/reminders/route.ts` فيه TypeScript errors قديمة (`property X does not exist on type 'never'`) — لكن `next.config.ts` فيه `ignoreBuildErrors: true` فالـ deploy يمر. يستحق إصلاح في جلسة قادمة.
- `lib/zatca.ts` فيه TypeScript error مشابه (`Uint8Array<ArrayBufferLike>` not assignable to `BufferSource`) — نفس الحل.
- جدول `ai_config` لا يحتوي عمودي `provider` و`api_key_encrypted` لكن `app/api/ai-content/route.ts` يحاول الاستعلام عليهما — bug موجود لكن لا أحد لاحظه لأن الجدول فارغ. إصلاحه لاحقاً.

## 🔁 سير العمل بعد أي مرحلة
1. كتابة SQL migration (`supabase/0XX_*.sql`)
2. API routes (`app/api/...`)
3. UI (`app/dashboard/...` أو `app/admin/...`)
4. تحديث nav في layout المناسب
5. فحص محلي: `npm run build`
6. commit + push
7. تحديث هذا الملف
