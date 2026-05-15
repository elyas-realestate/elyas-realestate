# 🧹 خطة تنظيف الكود — Wasit Pro

> **تاريخ الإنشاء:** ١١ مايو ٢٠٢٦
> **آخر تحديث:** ١٣ مايو ٢٠٢٦ — نهاية الجلسة الأولى
> **المصدر:** تدقيق تقني شامل من ٣٠ خبير افتراضي
> **المالك:** إلياس الدخيل
> **الهدف:** تحويل الكود من "Beta سريع" إلى "Production-grade SaaS"

---

## 🎯 سجل التقدم

### ✅ الجلسة الأولى — ١٣ مايو ٢٠٢٦ (يوم ١ + ٢)

**المهام المنجزة:**

- ✅ **1.1** إنشاء `.gitignore` كامل + أنماط Claude Code
- ✅ **1.2** توثيق فجوة migrations 036-041 (`supabase/MIGRATIONS_HISTORY.md`)
- ✅ **2.1** فحص `/properties/new` (تبيّن أنها redirect مفيد — وُثّقت بدل الحذف)
- ✅ **2.2** تحسين `package.json` scripts (typecheck, format, ci, db:types)
- ✅ **2.3** تثبيت Prettier + `.prettierrc.json` + `.prettierignore`
- ✅ **بونص** تنسيق ٢٧٠+ ملف بـ Prettier
- ✅ **بونص** إعداد Git على Mac من الصفر (clone + remote + auth)
- ✅ **بونص** إنشاء Personal Access Token وحفظه في Keychain
- ✅ **بونص** Push نظيف لـ GitHub (commit 1 = إعداد، commit 2 = formatting)

**Commits المرفوعة:**

- `b3d8ca7` chore(cleanup): wave 1 setup — gitignore + Prettier + docs
- `dacd48f` style: apply Prettier formatting across codebase

---

### ✅ الجلسة الثانية — ١٥ مايو ٢٠٢٦ (يوم ٣)

**المهام المنجزة:**

- ✅ **1.3** تأكيد تشغيل migrations 050+051 في Supabase عبر MCP query
- ✅ **3.1** إعداد Vitest كامل (`vitest.config.ts`, `vitest.setup.ts`, package scripts)
- ✅ **3.2** كتابة **٧١ اختبار** في ٥ ملفات — **كلها passed من أول محاولة!**

**نتيجة الاختبارات:**

```
Test Files  5 passed (5)
Tests      71 passed (71)
Duration   789ms
```

**الفائدة المباشرة:**

- 🛡️ VAT 15% محمي من أي تعديل عرضي
- 🔐 تشفير WhatsApp tokens مضمون (AES-256-GCM)
- 🚦 Rate limiting يكشف نفسه لو كُسر
- 🎯 Reserved slugs محمية (admin, api, dashboard, إلخ)
- ✅ Meta webhook verification مختبر

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

- [x] إنشاء `.gitignore` احترافي يغطّي:
  - `.env*` (كل المتغيرات السرّية)
  - `node_modules/`
  - `.next/`
  - `*.log`, `*.tsbuildinfo`
  - `.DS_Store`, `Thumbs.db`
  - `.vercel/`, `.turbo/`
  - `coverage/`, `dist/`, `build/`
  - `.claude/launch.json` + `.claude/settings.local.json`
- [x] فحص `git log -p | grep -i "env\|secret\|key"` للتأكد من عدم تسريب سابق

**الوقت:** ٣٠ دقيقة
**الحالة:** ✅ مُنجز (١٣ مايو)

#### ✅ مهمة 1.2 — توثيق فجوة migrations 036-041

- [x] فحص git log لمعرفة هل أُنشئت ثم حُذفت
- [x] إنشاء `supabase/MIGRATIONS_HISTORY.md` يوضح الفجوة + الجدول الكامل لكل الـ migrations
- [x] قرار رسمي: لن تُستخدم الأرقام 036-041 — التسلسل الجديد من 052+

**الوقت:** ٤٥ دقيقة
**الحالة:** ✅ مُنجز (١٣ مايو)

#### ✅ مهمة 1.3 — تشغيل migrations 050 + 051

- [x] التحقق من الجداول في Supabase عبر MCP
- [x] `rent_contracts` (17 عمود + 4 RLS) ✅
- [x] `rent_payments` (15 عمود + 1 RLS) ✅
- [x] `beta_feedback` (14 عمود + 2 RLS) ✅

**الوقت:** ١٥ دقيقة
**الحالة:** ✅ مُنجز — كانت مُشغَّلة سابقاً (تأكّدنا في ١٥ مايو)

### يوم ٢ — حذف الكود الميت + الـ scripts

#### ✅ مهمة 2.1 — حذف المسارات الميتة

- [x] فحص `app/dashboard/properties/new/page.tsx` — **تبيّن أنها redirect مفيد**، ليست dead code
- [x] إضافة تعليقات توثيق توضّح أنها alias لـ `/add` (مثل `/finance → /financial`)
- [x] **القرار:** الإبقاء عليها (تصحيح للخطة الأصلية)

**الوقت:** ٢٠ دقيقة
**الحالة:** ✅ مُنجز — تصحيح للخطة (١٣ مايو)

#### ✅ مهمة 2.2 — تحسين `package.json` scripts

- [x] إضافة scripts: `lint:fix`, `typecheck`, `format`, `format:check`, `ci`, `db:types`
- [x] الـ `test` script محجوز رسالة "لم يُعدّ Vitest بعد" — سيُفعّل في يوم ٣

**الوقت:** ١٠ دقائق
**الحالة:** ✅ مُنجز (١٣ مايو)

#### ✅ مهمة 2.3 — إضافة Prettier

- [x] `npm install -D prettier prettier-plugin-tailwindcss`
- [x] إنشاء `.prettierrc.json` بإعدادات موحّدة (printWidth: 100, semi, es5, LF)
- [x] إنشاء `.prettierignore` (يستثني SQL + binaries + lock files)
- [x] تشغيل `npm run format` — **نسّق ٢٧٠+ ملف بنجاح**

**الوقت:** ٤٥ دقيقة
**الحالة:** ✅ مُنجز (١٣ مايو)

### يوم ٣ — اختبارات حرجة (٥ minimum)

#### ✅ مهمة 3.1 — إعداد Vitest

- [x] `npm install -D vitest @vitest/ui @vitejs/plugin-react jsdom @testing-library/*`
- [x] `vitest.config.ts` مع alias `@/*` + coverage v8
- [x] `vitest.setup.ts` للـ env mocks (ENCRYPTION_SECRET, META_WEBHOOK_VERIFY_TOKEN, ...)
- [x] `package.json` scripts: `test`, `test:watch`, `test:ui`, `test:coverage`

**الوقت:** ١ ساعة
**الحالة:** ✅ مُنجز (١٥ مايو)

#### ✅ مهمة 3.2 — كتابة ٥ اختبارات حرجة — **٧١ اختبار نجح من أول محاولة**

- [x] `lib/__tests__/rate-limit.test.ts` — **10 اختبارات** (sliding window + multi-key isolation)
- [x] `lib/__tests__/crypto.test.ts` — **11 اختبار** (round-trip + tampering protection + safeDecrypt)
- [x] `lib/__tests__/vat.test.ts` — **12 اختبار** (calculateVAT + reverseVAT + halalas + formatSAR)
- [x] `lib/__tests__/slug-validation.test.ts` — **32 اختبار** (valid/empty/length/chars/reserved)
- [x] `app/api/whatsapp/webhook/__tests__/route.test.ts` — **6 اختبارات** (Meta verification GET)

**النتيجة:** Test Files 5 passed (5) — Tests 71 passed (71) — 789ms

**الوقت:** ٤ ساعات (الفعلي: < ساعة!)
**الحالة:** ✅ مُنجز (١٥ مايو)

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
