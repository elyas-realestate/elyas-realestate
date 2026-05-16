# 🔖 ابدأ من هنا — الجلسة القادمة

> **آخر تحديث:** ١٥ مايو ٢٠٢٦ (نهاية الجلسة الثانية)
> **اقرأ هذا الملف أولاً** عند فتح أي محادثة جديدة مع Claude.

---

## 🏆 الحالة الحالية — نتيجة استثنائية

✅ **الأسبوع الأول مكتمل ١٠٠٪** (يوم ١-٣)
✅ **الأسبوع الثاني — تقسيم settings/page.tsx مكتمل ١٠٠٪** (يوم ٤-٥)

### `page.tsx` — تطوّر الحجم:

```
قبل اليوم:    2641 سطر  ████████████████████████████
بعد اليوم:    745 سطر   ███████
الفائدة:      -1896 (-72%) 🎯
```

---

## 📁 الهيكل الجديد لـ settings/

```
app/dashboard/settings/
├── page.tsx                  (745 — shell + tabs router)
├── _constants.ts             (230 — data منعزلة)
├── _components/
│   └── SaveBtn.tsx           (42 — reusable)
└── _tabs/
    ├── ProfileTab.tsx        (170)
    ├── SiteTab.tsx           (977 — الأكبر)
    ├── DesignTab.tsx         (650)
    ├── ContactTab.tsx        (114)
    ├── NotificationsTab.tsx  (58)
    └── AccountTab.tsx        (241)
```

---

## 📊 Commits المرفوعة (مرتبة من الأقدم)

### الجلسة الأولى (١٣ مايو):

- `b3d8ca7` chore(cleanup): wave 1 setup — gitignore + Prettier + docs
- `dacd48f` style: apply Prettier formatting across codebase

### الجلسة الثانية (١٥ مايو):

- `eec6c1d` refactor(settings): extract constants + fix typecheck errors
- `bfbfab2` test(wave-2): add Vitest + 71 critical tests
- `065da52` refactor(settings): extract SaveBtn + 3 tabs (-302 lines)
- `9ad2841` refactor(settings): extract ProfileTab (-132 lines)
- `b5422f5` refactor(settings): extract DesignTab (-609 lines)
- `2525e71` refactor(settings): extract SiteTab (-868 lines) — refactor complete

**Branch:** `master` (مش `main`!)

---

## 🛠️ أدوات الجودة الفعّالة

```bash
npm run test         # 71 tests ✅
npm run typecheck    # 0 errors ✅
npm run build        # 140 pages ✅
npm run ci           # كل اللي فوق + lint + format
npm run format       # Prettier فورمات
```

---

## 🎯 الموجة القادمة — الأسبوع الثالث

من خطة `docs/cleanup-plan-may-11.md`:

### أولوية ١ — توحيد Auth Wrapper (يوم ٦)

- ١١٤ موضع يستدعي auth في APIs → wrapper واحد
- إنشاء `lib/with-auth.ts`
- هجرة ٥ APIs كمثال

### أولوية ٢ — Logger موحّد (يوم ٧)

- إنشاء `lib/logger.ts`
- استبدال ٧٧ console.log
- إضافة ESLint rule: `no-console`

### أولوية ٣ — GitHub Actions CI (يوم ٨)

- `.github/workflows/ci.yml` (typecheck + lint + build + test)
- حماية branch `main`
- Husky + lint-staged

### أولوية ٤ — توليد Database types (يوم ١١)

- `npx supabase gen types typescript ... > types/database.ts`
- استبدال `any` تدريجياً (الـ 205 الحالية → < 50)

---

## ⚙️ بيئة العمل (Mac)

```
الجهاز:       MacBook-Air-Elyas
Node:         v24.15.0
npm:          11.12.1
GitHub user:  elyas-realestate
Repo:         github.com/elyas-realestate/elyas-realestate
Branch:       master
Vercel:       vercel.com/elyas-realestates-projects/elyas-realestate
Supabase:     apmdwautyqoqjlabxysz
```

**ملاحظات بيئة:**

- Git مربوط مع Personal Access Token في Keychain
- `.env.local` موجود (سُحب من Vercel)
- Vercel CLI: `npx vercel ...`

---

## ⚡ أوامر البداية للجلسة القادمة

```bash
cd "/Users/Shared/Files From d.localized/elyas-realestate"
git pull origin master
npm run ci  # تأكد إن كل شي شغّال قبل البدء
```

---

## 🧠 برومت Claude للجلسة القادمة

```
أنا إلياس، نواصل خطة تنظيف Wasit Pro.
اقرأ أولاً:
- docs/NEXT-SESSION-START-HERE.md (هذا الملف)
- docs/cleanup-plan-may-11.md (الخطة الكاملة)

أنجزنا الأسبوع الأول + الثاني كاملاً.
تقسيم settings/page.tsx مكتمل (من 2641 → 745 سطر، -72%).

ابدأ الموجة القادمة (الأسبوع الثالث):
- توحيد Auth Wrapper
- Logger موحّد
- GitHub Actions CI
- Database types من Supabase

أنا على Mac (لا أعرف PowerShell — استخدم أوامر macOS Terminal).
الـ branch اسمه master (مش main).
أعطني أمر واحد كل مرة وانتظر النتيجة.
```

---

## 🌙 ملاحظات للذاكرة

١) إلياس يفضّل أمر واحد في كل رسالة (مش متعدد بـ &&)
٢) لا تستخدم تعليقات `#` بعد الأوامر — الـ shell يحسبها arguments
٣) الـ branch اسمه `master`
٤) Site/Design tabs الكبيرة تم استخراجها بـ Python script في bash (لأن JSX أكبر من Edit tool)
٥) SaveBtn معاد استخدامه عبر كل الـ tabs الجديدة مع props `saving` و `saved`

---

**ختام:** جلستان فقط، تحويل كامل لصفحة Settings من god component إلى منظومة modular نظيفة. 🚀
