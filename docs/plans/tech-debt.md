# 🔍 تقرير فحص الدين التقني — مايو ٢٠٢٦

**التاريخ:** ١٩ مايو ٢٠٢٦
**النطاق:** كامل الريبو بعد إغلاق Phase B (schema bugs) و Phase A (تغطية اختبارات المكوّنات إلى 100%).
**القاعدة:** فحص ساكن (Static Analysis) فقط. لم تُعدَّل أي ملفات في هذه الخطوة.

---

## 📊 خلاصة التنفيذي

| المحور | المقياس | الحالة | الخطر |
|---|---|---|---|
| اختبارات الـ unit | 877 / 877 ✓ | جيدة جدًا | منخفض |
| تغطية مكوّنات React | 24 / 24 (100%) | ممتازة | منخفض |
| ESLint errors | 0 | محقّق | منخفض |
| ESLint warnings | 39 (react-compiler structural فقط) | مقبول | منخفض |
| TypeScript errors | 0 | محقّق | منخفض |
| `as any` casts منتشرة | **93** in 48 ملف | **خطر** | متوسط |
| `eslint-disable no-explicit-any` | **93** | متوسط | متوسط |
| `as any` literal | 18 in 14 ملف | متوسط | منخفض |
| TODO / FIXME / HACK | 28 (نصفها في docs) | مقبول | منخفض |
| `console.*` في الكود | 1 (intentional في layout) | ممتاز | منخفض |
| Empty catch blocks | 7 (كلها legit — fire-and-forget) | جيد | منخفض |
| `process.env.X!` غير محمي | **84** in 30 ملف | **خطر** | عالٍ |
| API routes بدون tenant_id ref | 25 / 64 (39%) | يحتاج مراجعة | عالٍ |
| **Schema-related migrations مفقودة** | 1 معلّقة (052) | **خطر** | **حرج** |
| اختبارات API routes (route.ts) | 1 / 64 (٢٪) | **خطر** | عالٍ |

---

## 🚨 الحرج (Critical) — يجب التنفيذ قبل أي قرار توسّع

### C1. Migration 052 لم تُطبَّق على قاعدة الإنتاج

- **الموقع:** `supabase/052_add_clients_budget.sql`
- **الوضع:** الملف موجود محلياً، الـ types مُحدَّثة، لكن لم نتأكد أن `ALTER TABLE` نُفِّذ فعلاً على Supabase prod.
- **الخطر:** كل INSERT/UPDATE لجدول `clients` يحوي حقل `budget` سيفشل بصمت أو يحذف الحقل في الإنتاج.
- **الإجراء:**
  1. افتح Supabase Dashboard → SQL Editor.
  2. الصق محتوى `supabase/052_add_clients_budget.sql` ونفّذ.
  3. تحقق من `SELECT column_name FROM information_schema.columns WHERE table_name='clients' AND column_name='budget';`.

### C2. غياب tests لمسارات API الحرجة (route.ts)

- **الواقع:** ٦٤ API route، واحد فقط لديه اختبار (`whatsapp/webhook`).
- **الخطر:** أي تغيير في schema أو منطق auth ينكسر بصمت في الإنتاج. هذا ما حدث مع `broker_identity.phone` و `clients.budget` سابقاً.
- **الإجراء (موجة لاحقة):** كتابة integration tests لـ ≥٢٠ route حرج (auth, billing, lead-capture, webhook).

---

## 🔥 عالٍ (High) — يحتاج معالجة قريبة

### H1. `process.env.X!` بدون validation عند البدء

- **العدد:** 84 موضع في 30 ملف.
- **الأسوأ:**
  - `lib/supabase-browser.ts` × 2 (`NEXT_PUBLIC_SUPABASE_URL!`, `NEXT_PUBLIC_SUPABASE_ANON_KEY!`)
  - `lib/with-auth.ts` × 4
  - `lib/ai-org-context.ts` × 6
  - `lib/push.ts` × 4
  - `app/api/payment/route.ts` × 6
  - `app/api/team/invite/route.ts` × 8
  - `app/api/2fa/*` × 12+
- **الخطر:** إذا أي env var مفقود في الإنتاج، يحدث **TypeError بدون رسالة واضحة** عند الطلب الأول، ويُصعّب التشخيص.
- **الحل المقترح:**
  - إنشاء `lib/env.ts` يستخدم `zod` أو check يدوي عند module-load يرمي خطأ واضح ("Missing NEXT_PUBLIC_SUPABASE_URL").
  - استبدال جميع `process.env.X!` بـ `env.X` من الـ helper.

### H2. مراجعة isolation الـ tenant على API routes بدون tenant_id

- **القائمة (25 route):** admin/*, 2fa/*, slug/*, qr, maps/resolve, ai-extract, ai-content, ai-whatsapp, ai/neighborhood-intel, waitlist, sentry-test, pdpl/delete, push/notify, whatsapp/encrypt-token, property-requests/[id]/convert.
- **معظمها مشروعة** (admin routes، public utilities، user-level 2FA).
- **الحالات المشبوهة المؤكَّدة:**
  - `property-requests/[id]/convert/route.ts`: يعتمد على RLS فقط، لا يضع `tenant_id` على الـ deal الجديد → احتمال data leak لو RLS غير صارمة.
  - `pdpl/delete/route.ts`: عملية حذف PDPL لازم تتأكد المستخدم يملك البيانات.
  - `push/notify/route.ts`: يحتاج تأكيد أن المستخدم لا يستطيع push إلى tenant آخر.
- **الإجراء:** فحص يدوي لكل route من الثلاثة، إضافة tenant filter صريح حيث لزم.

### H3. `as any` cast hotspots

- **العدد الإجمالي:** 93 cast (مع eslint-disable + TODO docs لكل واحد).
- **الأسوأ (≥٥ casts في الملف):**
  - `app/dashboard/requests/page.tsx`: 7
  - `app/dashboard/profile-card/page.tsx`: 5
  - `app/dashboard/settings/page.tsx`: 5
  - `app/dashboard/properties/[id]/edit/page.tsx`: 5
  - `app/api/payment/route.ts`: 5
  - `app/api/team/invite/route.ts`: 6
- **الخطر:**
  1. ضياع type safety في صفحات تتعامل مع بيانات الإنتاج.
  2. عند تغيّر schema، الـ compiler لا يقبض الكسر — يخرج في runtime.
- **الإجراء:**
  - تخفيض إلى ≤30 في موجة منفصلة، تركيز على API routes أولاً.
  - حذف eslint-disable نهائياً للملفات التي صار schema لها واضحاً.

---

## ⚠️ متوسط (Medium) — تحسينات صحّية

### M1. تنافر أنماط Supabase client

- **الواقع:** 137 occurrence من 4 patterns:
  - `createBrowserClient<Database>` (lib/supabase-browser.ts) — نظيف
  - `getSupabaseAdmin()` (lib/with-auth.ts) — نظيف
  - `createClient` بـ cookie pass-through يدوي (في api/property-requests/[id]/convert) — متناثر
  - SSR clients متعددة الأنماط في pages
- **الخطر:** صعوبة قراءة + احتمال نسيان cookie إعادة في route جديد → فقدان session.
- **الإجراء:** توحيد إلى ٣ helpers موثّقة في `lib/`: `supabase` (browser), `getSupabaseAdmin` (service role), `getServerSupabase()` (cookie-bound). إعادة كتابة الـ inline `createClient` calls.

### M2. ٢٨ TODO/FIXME — مراجعة + تنظيف

- **الموقع المستحق:** `lib/totp.ts` (1), `lib/project-status.ts` (1), `app/api/2fa/*` (3), وغيرها.
- **الإجراء:** قراءة سريعة لكل واحد، حذف القديمة المُنجزة، تحويل الجديدة إلى GitHub issues إن لزم.

### M3. الـ docs قديمة في عدة أماكن

- `docs/NEXT-SESSION-START-HERE.md`: يدّعي 561 اختبار، الواقع 877.
- `docs/cleanup-plan-may-11.md`: قديم جداً، له ٣ TODO معلّقة.
- `docs/beta-launch-plan.md`: نفس الشيء.
- **الإجراء:** تحديث NEXT-SESSION-START-HERE.md ليعكس الواقع الحالي. أرشفة الباقي تحت `docs/archive/`.

---

## 🟢 منخفض (Low) — تجميلي

### L1. Empty catch blocks (٧)

- كلها legit:
  - `JSON.parse().catch(() => ({}))` — صحّ.
  - `navigator.share().catch(() => {})` — صحّ (user-cancel).
  - `.catch(() => {})` على fire-and-forget email/notification.
- **لا إجراء.**

### L2. ٣٩ تحذير react-compiler structural

- ظهرت بعد ترقية `eslint-config-next 16.2.1`. لا تكسر CI ولا تنتج أخطاء runtime.
- **الإجراء:** تجاهل، أو موجة منفصلة لإصلاح "Cannot access variable before it is declared" بإعادة ترتيب function declarations.

### L3. عدم وجود `<img>` → `<Image>` migration كاملة

- لا حصر مباشر هنا، لكن من الموجات السابقة معروف أن بعض الصور لا تستخدم `next/image`.
- **الإجراء:** موجة منفصلة عند الحاجة لتحسين أداء.

---

## 📋 خطة الإصلاح المقترحة (مرتّبة)

| ترتيب | الموجة | المدى المتوقع | المخرج |
|---|---|---|---|
| 1 | **C1**: تطبيق migration 052 على Supabase prod | ٥ دقائق (يدوي) | عمود `clients.budget` فعلي |
| 2 | **H1**: إنشاء `lib/env.ts` + استبدال 84 موضع | جلسة ١-٢ | runtime crash واضحة عند env missing |
| 3 | **H2**: فحص 3 routes مشبوهة + إضافة tenant filter حيث لزم | جلسة ١ | منع IDOR محتمل |
| 4 | **M1**: توحيد helpers الـ Supabase client + كتابة `getServerSupabase()` | جلسة ١ | API uniform عبر الـ codebase |
| 5 | **C2**: integration tests لـ ٢٠ API route حرج | موجة كبيرة | منع schema regressions |
| 6 | **H3**: تخفيض `as any` من 93 إلى ≤30 | موجة كبيرة | type safety حقيقي |
| 7 | **M3**: تحديث docs + أرشفة القديمة | ٣٠ دقيقة | reflection of reality |
| 8 | **M2**: مراجعة 28 TODO | جلسة ١ | تنظيف |

---

## 🎯 رأيي

البنية **لا تنهار** قريباً. القاعدة قوية: 0 errors, 0 lint, 877 tests, 100% component coverage.

لكن في **٣ نقاط ترقيع** كانت تنتظر الانفجار:
- ✅ `clients.budget` (أُصلح في Phase B لكن migration لم تُطبّق بعد على prod — **هذي نقطة خطر فعلية الآن**)
- ⏳ `process.env.X!` بدون validation
- ⏳ API routes بدون integration tests

ابدأ بـ C1 فوراً (٥ دقائق) ثم H1 لأنه يُغيّر سلوك runtime عند أول env-var مفقود — وقاية مهمة.

البقية يمكن تأجيلها لموجات قادمة دون قلق.
