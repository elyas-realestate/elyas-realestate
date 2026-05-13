# 🧹 خطة تنظيف الكود — Wasit Pro

> **تاريخ الإنشاء:** ١١ مايو ٢٠٢٦
> **المصدر:** تدقيق تقني شامل من ٣٠ خبير افتراضي
> **المالك:** إلياس الدخيل
> **الهدف:** تحويل الكود من "Beta سريع" إلى "Production-grade SaaS"

---

## 📋 ملخص الحالة قبل البدء

| المقياس            | القيمة الحالية |      الهدف بعد التنظيف      |
| ------------------ | :------------: | :-------------------------: |
| ملفات TS/TSX       |      270       |             270             |
| ملفات > 500 سطر    |     **24**     |            < 10             |
| أكبر ملف (أسطر)    |    **1520**    |            < 600            |
| `any` types        |    **205**     |            < 50             |
| `as any` casts     |     **29**     |            < 10             |
| `console.log`      |     **77**     |      0 (logger موحّد)       |
| TODO/FIXME         |       17       | < 5 موثّقة في GitHub Issues |
| اختبارات           |     **0**      |     ≥ 10 critical paths     |
| `use client` نسبة  |    **79%**     |            < 50%            |
| ملف `.gitignore`   |  **❌ مفقود**  |          ✅ موجود           |
| Migration gaps     |    036-041     |       موثّقة أو معبأة       |
| تكرار auth في APIs |    114 موضع    |        wrapper موحّد        |

---

## 🚦 خريطة الأولويات (Heat Map)

```
🔴 حرج   ████████░░  .gitignore + Tests + Migrations gap
🟠 عالي  ███████░░░  God Components + Route duplication + Components split
🟡 متوسط █████░░░░░  any/as any + Auth duplication + 'use client' overuse
🟢 منخفض ██░░░░░░░░  console.log + TODO + package scripts
```

---

# 🗓️ خطة التنفيذ — ٣ أسابيع

---

## 📍 الأسبوع الأول — الإنقاذ الفوري (٣ أيام عمل)

> **الهدف:** سدّ الثغرات الأمنية والمعمارية الحرجة قبل أي إطلاق Beta إضافي.

### يوم ١ — الأمان والنظافة الأولية

#### ✅ مهمة 1.1 — إنشاء `.gitignore` كامل

- [ ] إنشاء `.gitignore` احترافي يغطّي:
  - `.env*` (كل المتغيرات السرّية)
  - `node_modules/`
  - `.next/`
  - `*.log`, `*.tsbuildinfo`
  - `.DS_Store`, `Thumbs.db`
  - `.vercel/`, `.turbo/`
  - `coverage/`, `dist/`, `build/`
- [ ] فحص `git log -p | grep -i "env\|secret\|key"` للتأكد من عدم تسريب سابق
- [ ] إذا اكتُشف تسريب: **دوّر كل الـ tokens فوراً** (Meta + Supabase service role + Moyasar + OpenAI)

**الوقت:** ٣٠ دقيقة
**الحالة:** ⏳ معلَّق

#### ✅ مهمة 1.2 — توثيق فجوة migrations 036-041

- [ ] فحص git log لمعرفة هل أُنشئت ثم حُذفت
- [ ] إذا كانت تجارب: إنشاء `supabase/MIGRATIONS_HISTORY.md` يوضح السبب
- [ ] إذا مفقودة: إنشاء migrations فارغة (`-- intentionally skipped`) لمنع ارتباك CI/CD

**الوقت:** ٤٥ دقيقة
**الحالة:** ⏳ معلَّق

#### ✅ مهمة 1.3 — تشغيل migrations 050 + 051 (لو ما تم)

- [ ] فتح Supabase SQL Editor
- [ ] تشغيل `050_property_management.sql` ثم `051_beta_feedback.sql`
- [ ] التحقق: `SELECT * FROM rent_contracts LIMIT 1;`

**الوقت:** ١٥ دقيقة
**الحالة:** ⏳ معلَّق

### يوم ٢ — حذف الكود الميت + الـ scripts

#### ✅ مهمة 2.1 — حذف المسارات الميتة

- [ ] حذف `app/dashboard/properties/new/page.tsx` (٦ سطر فقط — placeholder)
- [ ] التحقق من عدم وجود روابط داخلية إليه: `grep -r "properties/new" --include="*.ts" --include="*.tsx"`
- [ ] إذا وُجدت روابط: تحويلها لـ `/properties/add`

**الوقت:** ٢٠ دقيقة
**الحالة:** ⏳ معلَّق

#### ✅ مهمة 2.2 — تحسين `package.json` scripts

أضف:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

**الوقت:** ١٠ دقائق
**الحالة:** ⏳ معلَّق

#### ✅ مهمة 2.3 — إضافة Prettier

- [ ] `npm install -D prettier prettier-plugin-tailwindcss`
- [ ] إنشاء `.prettierrc.json` بإعدادات موحّدة
- [ ] إنشاء `.prettierignore`
- [ ] تشغيل `npm run format` مرة واحدة (commit منفصل)

**الوقت:** ٤٥ دقيقة
**الحالة:** ⏳ معلَّق

### يوم ٣ — اختبارات حرجة (٥ minimum)

#### ✅ مهمة 3.1 — إعداد Vitest

- [ ] `npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom`
- [ ] `vitest.config.ts` مع alias `@/*`
- [ ] `vitest.setup.ts` للـ mocks

**الوقت:** ١ ساعة
**الحالة:** ⏳ معلَّق

#### ✅ مهمة 3.2 — كتابة ٥ اختبارات حرجة

- [ ] `lib/__tests__/rate-limit.test.ts` — منع تجاوز Rate Limit
- [ ] `lib/__tests__/crypto.test.ts` — AES-256-GCM encrypt/decrypt
- [ ] `lib/__tests__/vat.test.ts` — حساب VAT 15%
- [ ] `lib/__tests__/slug-validation.test.ts` — Reserved slugs guard
- [ ] `app/api/whatsapp/webhook/__tests__/route.test.ts` — verify signature

**الوقت:** ٤ ساعات
**الحالة:** ⏳ معلَّق

---

## 📍 الأسبوع الثاني — تفكيك الـ God Components (٥ أيام)

> **الهدف:** كسر الملفات الضخمة + توحيد منطق Auth + إزالة الضوضاء.

### يوم ٤-٥ — تقسيم `app/dashboard/settings/page.tsx` (1520 سطر)

#### ✅ مهمة 4.1 — تحليل الـ tabs

- [ ] قراءة الملف وتحديد الـ tabs/sections داخله
- [ ] رسم خريطة (mental map) لكل قسم وعلاقاته

**الوقت:** ١ ساعة
**الحالة:** ⏳ معلَّق

#### ✅ مهمة 4.2 — التقسيم العملي

الهيكل المقترح:

```
app/dashboard/settings/
├── page.tsx              (< 150 سطر — shell + tabs router)
├── _components/
│   ├── ProfileTab.tsx
│   ├── BillingTab.tsx
│   ├── NotificationsTab.tsx
│   ├── TeamTab.tsx
│   ├── IntegrationsTab.tsx
│   ├── SecurityTab.tsx
│   └── DangerZoneTab.tsx
└── _hooks/
    ├── useSettings.ts
    └── useUpdateProfile.ts
```

**الوقت:** ٦ ساعات
**الحالة:** ⏳ معلَّق

### يوم ٦ — توحيد Auth Wrapper (114 → 1)

#### ✅ مهمة 5.1 — إنشاء `lib/with-auth.ts`

- [ ] HOF يستقبل handler + options (requireOwner, requireTenant)
- [ ] يرجع `{ user, tenant_id, role, supabase }` للـ handler
- [ ] يعيد 401/403 تلقائياً عند الفشل
- [ ] دعم rate limiting اختياري

#### ✅ مهمة 5.2 — هجرة 5 APIs كمثال

- [ ] `app/api/lead-capture/route.ts`
- [ ] `app/api/beta-feedback/route.ts`
- [ ] `app/api/waitlist/route.ts`
- [ ] `app/api/profile-card/route.ts`
- [ ] `app/api/support-request/route.ts`

التوثيق في README لباقي المسارات (لا تهاجر كلها مرة واحدة — تدريجياً عبر الأسابيع).

**الوقت:** ٦ ساعات
**الحالة:** ⏳ معلَّق

### يوم ٧ — Logger موحّد + حذف console.log

#### ✅ مهمة 6.1 — إنشاء `lib/logger.ts`

- [ ] واجهة بسيطة: `logger.info/warn/error/debug`
- [ ] في dev: console
- [ ] في prod: Sentry (للأخطاء) + structured stdout
- [ ] دعم `logger.with({ user_id, tenant_id })` للسياق

#### ✅ مهمة 6.2 — استبدال 77 console.log

- [ ] `grep -rn "console\." --include="*.ts" --include="*.tsx" app lib`
- [ ] استبدال يدوي مع context مناسب
- [ ] إضافة ESLint rule: `no-console`

**الوقت:** ٤ ساعات
**الحالة:** ⏳ معلَّق

### يوم ٨ — GitHub Actions + Husky

#### ✅ مهمة 7.1 — CI/CD pipeline

- [ ] `.github/workflows/ci.yml`:
  - typecheck (tsc --noEmit)
  - lint (eslint)
  - format check (prettier --check)
  - build (next build)
  - test (vitest run)
- [ ] حماية branch `main` (PR + checks مطلوبة)

#### ✅ مهمة 7.2 — Husky + lint-staged

- [ ] `npm install -D husky lint-staged`
- [ ] pre-commit: lint + format + typecheck (الملفات المعدّلة فقط)
- [ ] pre-push: build (تحذير فقط لا blocking)

**الوقت:** ٣ ساعات
**الحالة:** ⏳ معلَّق

---

## 📍 الأسبوع الثالث — التنظيم المعماري (٤ أيام)

> **الهدف:** هيكل واضح للمكوّنات + توحيد المسارات + تقليل `any`.

### يوم ٩ — توحيد Components

#### ✅ مهمة 8.1 — الهيكل الجديد

```
components/
├── ui/                  (primitives موجودة)
├── features/            (domain components — من app/components)
│   ├── profile-card/
│   ├── property/
│   ├── whatsapp/
│   ├── ai/
│   └── beta/
├── layout/              (Nav, Sidebar, Header)
└── shared/              (Loading, Empty, Error states)
```

#### ✅ مهمة 8.2 — الهجرة

- [ ] نقل كل ملف من `app/components/` إلى مكانه الصحيح
- [ ] تحديث imports (script آلي بـ sed أو IDE refactor)
- [ ] حذف مجلد `app/components/` بعد التأكد

**الوقت:** ٤ ساعات
**الحالة:** ⏳ معلَّق

### يوم ١٠ — توحيد المسارات الـ AI

#### ✅ مهمة 9.1 — دمج `/ai-employees` + `/ai-foundation` في `/ai`

- [ ] الهيكل الجديد:
  ```
  /dashboard/ai
    ├── (overview)
    ├── /employees       (سابقاً /ai-employees)
    ├── /foundation      (سابقاً /ai-foundation)
    ├── /assistants
    ├── /providers
    ├── /approvals
    ├── /outputs
    └── /control
  ```
- [ ] إضافة redirects للمسارات القديمة
- [ ] تحديث navigation

**الوقت:** ٣ ساعات
**الحالة:** ⏳ معلَّق

#### ✅ مهمة 9.2 — تنظيم Property routes

- [ ] قرار معماري واضح: `/properties` (عرض) vs `/property-management` (إدارة عقود) vs `/property-requests` (طلبات شراء)
- [ ] توثيق في `docs/routing-architecture.md`

**الوقت:** ١ ساعة
**الحالة:** ⏳ معلَّق

### يوم ١١-١٢ — تقليل `any` + Types من Supabase

#### ✅ مهمة 10.1 — توليد Database types من Supabase

- [ ] `npx supabase gen types typescript --project-id apmdwautyqoqjlabxysz > types/database.ts`
- [ ] إضافة script في package.json: `db:types`
- [ ] استيراد `Database` type في `supabase-browser.ts` + `supabase-admin.ts`

#### ✅ مهمة 10.2 — استبدال `any` تدريجياً

- [ ] `grep -rn ": any" --include="*.ts" --include="*.tsx"` — قائمة الـ 205
- [ ] فرز:
  - من Supabase queries → استخدم Database types
  - من API responses → عرّف interfaces في `types/`
  - من event handlers → استخدم `React.ChangeEvent<HTMLInputElement>` إلخ
- [ ] الهدف: تقليل من 205 إلى < 50 في هذه الجلسة

**الوقت:** ٨ ساعات
**الحالة:** ⏳ معلَّق

---

## 📍 ما بعد الأسبوع الثالث — تحسينات مستمرة

### اختياري — تدريجي خلال الأشهر القادمة

- [ ] **تحويل صفحات Server Components**: ابدأ بـ `/[slug]/page.tsx` و `/c/[slug]/page.tsx` (أهم للـ SEO)
- [ ] **Playwright E2E tests** على ٥ مسارات:
  1. تسجيل وسيط جديد + onboarding
  2. إضافة عقار + لقطة شاشة
  3. Lead Capture + رسالة WhatsApp تلقائية
  4. تقديم اشتراك + Moyasar checkout
  5. تنزيل vCard + QR
- [ ] **PostHog analytics**
- [ ] **2FA enforcement** للحسابات الإدارية
- [ ] **Storybook** للـ components الـ UI (اختياري — لو الفريق كبر)

---

## 📊 خطة التتبع

سأنشئ tasks في TodoList لكل يوم. كل يوم نبدأ:

1. مراجعة todos أمس
2. تنفيذ todos اليوم
3. commit + push منفصل لكل مهمة (سهولة rollback)
4. تحديث هذا الملف بعلامة ✅

**شعار التنظيف:**

> "صفّي اليوم تَكسب الغد. الكود النظيف لا يُكتب — يُعاد كتابته بصبر."

---

## 🎯 نقطة البداية (الغد)

نبدأ بالأكثر أهمية وأقل وقتاً:

```
يوم ١ - الجلسة الأولى:
✓ مهمة 1.1 — .gitignore (٣٠ دقيقة)
✓ مهمة 1.2 — توثيق migration gap (٤٥ دقيقة)
✓ مهمة 1.3 — تشغيل migrations 050+051 (١٥ دقيقة)
✓ مهمة 2.1 — حذف /properties/new الميت (٢٠ دقيقة)
✓ مهمة 2.2 — تحسين package.json scripts (١٠ دقائق)

⏱️ إجمالي: ٢ ساعة عمل فعلي
🎁 المكسب: ٤ بنود حرجة محلولة + الأساس جاهز لباقي الخطة
```

---

**آخر تحديث:** ١١ مايو ٢٠٢٦
**الحالة:** ⏸️ بانتظار بدء التنفيذ يوم الغد
