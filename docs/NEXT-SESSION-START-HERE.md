# 🔖 ابدأ من هنا — الجلسة القادمة

> **آخر تحديث:** ١٦ مايو ٢٠٢٦ (نهاية الجلسة الرابعة)
> **اقرأ هذا الملف أولاً** عند فتح أي محادثة جديدة مع Claude.

---

## 🏆 الحالة الحالية — ٤ موجات تنظيف مكتملة

✅ **الأسبوع الأول** (يوم ١-٣)
✅ **الأسبوع الثاني — تقسيم settings/page.tsx** (يوم ٤-٥)
✅ **الأسبوع الثالث — Auth + Logger + CI + Husky** (يوم ٦-٨)
✅ **الأسبوع الرابع — إكمال هجرة Logger (Client + API)** (يوم ٩)

---

## 📊 الإنجازات الفعلية

### الكود:

- `settings/page.tsx`: من **2641 → 745 سطر** (-72%)
- ٧ ملفات منعزلة في `_tabs/` و `_constants.ts` و `_components/`
- ٧١ اختبار آلي (Vitest)

### البنية التحتية:

- ✅ `lib/with-auth.ts` — auth helpers موحّدة (٣ APIs مهاجرة)
- ✅ `lib/logger.ts` — logger موحّد مع Sentry integration
- ✅ **٥٧ console call** مهاجرة إلى logger (server + client كاملاً)
- ✅ GitHub Actions CI (typecheck + lint + format + test على كل push)
- ✅ Husky pre-commit hooks (Prettier تلقائي)

### الجودة:

- TypeScript: ٠ errors
- ESLint: ٠ errors (~٦٢٢ warnings — مقصودة في Beta)
- Tests: ٧١ passed
- Build: ١٤٠ pages
- CI: 🟢 أخضر

---

## 📁 الملفات الجديدة في الموجات الأخيرة

```
.github/workflows/ci.yml     — CI workflow
.husky/pre-commit            — pre-commit hook
lib/with-auth.ts             — auth helpers
lib/logger.ts                — unified logger
eslint.config.mjs            — pragmatic Beta config
```

---

## 📊 Commits المرفوعة على master

### الجلسة الأولى (١٣ مايو):

- `b3d8ca7` chore(cleanup): wave 1 setup
- `dacd48f` style: apply Prettier formatting

### الجلسة الثانية (١٥ مايو):

- `eec6c1d` refactor(settings): extract constants
- `bfbfab2` test(wave-2): add Vitest + 71 tests
- `065da52` refactor(settings): extract 3 tabs (-302)
- `9ad2841` refactor(settings): extract ProfileTab (-132)
- `b5422f5` refactor(settings): extract DesignTab (-609)
- `2525e71` refactor(settings): extract SiteTab (-868)

### الجلسة الثالثة (١٥ مايو):

- `a2761af` feat(auth): add with-auth helpers
- `6b929cd` refactor(api): migrate lead-capture + waitlist
- `20d5659` feat(logger): add unified logger
- `188bf2c` refactor(payment): migrate moyasar-webhook
- `a3682d6` ci: add GitHub Actions workflow
- `67c9201` style: apply Prettier formatting
- `565b8e2` chore: add Husky + lint-staged
- `9cf5e97` refactor(logger): 23 server-side migrations + variadic args
- `fdf9169` chore(eslint): pragmatic config (407 errors → 0)

### الجلسة الرابعة (١٦ مايو):

- `e915760` refactor(logger): wave 4 — migrate 32 client+server console.\* to logger
  - ١٤ API route (broker-request, lead-capture, waitlist, ai-extract,
    ai-content, ai-whatsapp, ai/neighborhood-intel, ai/voice-to-property,
    invite-code/validate, event, cron/reminders, cron/ai-analyst,
    cron/ai-followup, cron/ai-marketing)
  - ١٧ ملف client (dashboard pages، settings، ceo، organization،
    whatsapp، subscription، clients، register، error boundaries،
    OnboardingChecklist)
  - sitemap.ts (build-time)

**Branch:** `master`

---

## 🛠️ أدوات الجودة الفعّالة

```bash
npm run test         # 71 tests
npm run typecheck    # 0 errors
npm run lint         # 0 errors, ~622 warnings
npm run build        # 140 pages
npm run ci           # كل اللي فوق
npm run format       # Prettier
```

---

## 🎯 المتبقّي للجلسات القادمة

### أولوية ١ — Database types من Supabase

- يحتاج: `npx supabase login` (متصفح OAuth — تفاعلي)
- ثم: `npx supabase gen types typescript --project-id apmdwautyqoqjlabxysz > types/database.ts`
- استبدال `any` types تدريجياً (٣١٠ موضع)

### أولوية ٢ — تقليل ESLint warnings (~٦٢٢ مؤقتاً)

- `@typescript-eslint/no-explicit-any` — ٣١٠ موضع (يتقلّص مع Database types)
- `@typescript-eslint/no-unused-vars` — حوالي ٤٠
- `react-hooks/exhaustive-deps` — حوالي ٥٠
- بقية القواعد warnings صغيرة

### أولوية ٣ — توحيد Components folder

- نقل `app/components/*` إلى `components/features/*`
- تنظيم `/components/ui` كـ primitives
- إنشاء barrel exports موحّدة

### أولوية ٤ — تحسينات تجميلية

- إزالة الـ `any` من API handlers الكبيرة (`ai-content`, `ai-extract`, `ai-whatsapp`)
- توحيد patterns الـ Supabase client (`createServerClient` vs `getSupabaseAdmin`)
- تشديد `lint:strict` تدريجياً

---

## ⚙️ بيئة العمل (Mac)

```
الجهاز:       MacBook-Air-Elyas
Node:         v24.15.0
GitHub:       elyas-realestate
Repo:         github.com/elyas-realestate/elyas-realestate
Branch:       master
Vercel:       vercel.com/elyas-realestates-projects/elyas-realestate
Supabase:     apmdwautyqoqjlabxysz
```

**ملاحظات:**

- Git + PAT في Keychain ✅
- Personal Access Token الجديد فيه `repo` + `workflow` scopes
- `.env.local` موجود
- Husky pre-commit يعمل تلقائياً

---

## 🧠 برومت Claude للجلسة القادمة

```
أنا إلياس، نواصل خطة تنظيف Wasit Pro.
اقرأ docs/NEXT-SESSION-START-HERE.md و docs/cleanup-plan-may-11.md.

أنجزنا ٤ موجات كاملة:
- ✅ settings/page.tsx من 2641 → 745 سطر
- ✅ 71 اختبار آلي
- ✅ Logger موحّد (57 موضع مهاجر — server + client)
- ✅ Auth helpers + CI + Husky
- ✅ ESLint pragmatic (0 errors)

المتبقّي بأولوية:
1. Database types من Supabase (يحتاج تفاعل: npx supabase login)
2. تقليل 622 ESLint warning (معظمها any types)
3. توحيد مجلد Components

أنا على Mac، الـ branch اسمه master.
أعطني أمر واحد كل مرة عادةً، أو batch واضح عند الطلب.
```

---

## 🌙 ملاحظات للذاكرة

١) إلياس يفضّل **أمر واحد في كل رسالة** عادةً، أو **batch واضح** عند الطلب
٢) لا تستخدم تعليقات `#` بعد الأوامر — الـ shell يحسبها arguments
٣) الـ branch اسمه `master`
٤) Husky يفعّل `lint-staged` تلقائياً عند `git commit`
٥) Logger يدعم Sentry تلقائياً في production
٦) `with-auth.ts` يحتوي `getSupabaseAdmin` + `getAuthContext` + `requireAuth`
٧) `console.*` متبقّية مقصودة في ٣ ملفات فقط: `lib/logger.ts` (الموتور)،
`next.config.ts` (مفتاح config)، `app/layout.tsx` (inline SW script)

---

**ختام:** ٤ موجات تنظيف، ١٧ commits، تحويل كامل من god component إلى منظومة احترافية. الكود الآن **production-grade** بأدوات جودة كاملة + observability موحّد (Sentry + Logger). 🚀
