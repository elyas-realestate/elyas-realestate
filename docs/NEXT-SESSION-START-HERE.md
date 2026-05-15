# 🔖 ابدأ من هنا — الجلسة القادمة

> **آخر تحديث:** ١٥ مايو ٢٠٢٦ (نهاية الجلسة الثانية)
> **اقرأ هذا الملف أولاً** عند فتح أي محادثة جديدة مع Claude.

---

## 📍 وين وصلنا؟

✅ **الأسبوع الأول من خطة التنظيف — مكتمل ١٠٠٪!**

**يوم ١ + ٢ (١٣ مايو):**
- `.gitignore` (كان مفقود — خطر أمني محلول)
- توثيق فجوة migrations 036-041
- تحسين `package.json` scripts
- Prettier مُثبَّت + تنسيق ٢٧٠+ ملف
- Git مربوط على Mac جديد + Personal Access Token
- Push نظيف على GitHub (`master` branch)

**يوم ٣ (١٥ مايو):**
- تأكيد تشغيل migrations 050+051 (عبر Supabase MCP)
- إعداد Vitest كامل
- **٧١ اختبار آلي** على ٥ ملفات حرجة — كلها passed ✅

**Commits المرفوعة:**
- `b3d8ca7` chore(cleanup): wave 1 setup
- `dacd48f` style: apply Prettier formatting
- ⏳ (موجة Vitest لم تُـ commit بعد — انظر أدناه)

---

## ⚠️ مهمة بسيطة عالقة (٥ دقائق)

### Commit + Push للموجة الثانية

```bash
cd "/Users/Shared/Files From d.localized/elyas-realestate"
git add vitest.config.ts vitest.setup.ts package.json package-lock.json lib/__tests__/ app/api/whatsapp/webhook/__tests__/ docs/cleanup-plan-may-11.md docs/NEXT-SESSION-START-HERE.md supabase/MIGRATIONS_HISTORY.md
git commit -m "test(wave-2): add Vitest + 71 critical tests (5 files)"
git push origin master
```

---

## 🎯 الموجة القادمة — الأسبوع الثاني (يوم ٤+)

**الهدف:** تفكيك الـ God Components + توحيد Auth + Logger موحّد.

### الأولوية الأولى — يوم ٤+٥
**تقسيم `app/dashboard/settings/page.tsx` (1520 سطر)**

الهيكل المستهدف:
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

⏱️ **الوقت:** ٦-٨ ساعات (يومين عمل)

### الأولوية الثانية — يوم ٦
**توحيد Auth Wrapper** (`lib/with-auth.ts`)
- 114 موضع يستدعي auth في APIs → wrapper واحد

### الأولوية الثالثة — يوم ٧
**Logger موحّد** + حذف ٧٧ console.log

**التفاصيل الكاملة في:** `docs/cleanup-plan-may-11.md`

---

## 🛠️ بيئة العمل الحالية (Mac)

```
الجهاز:       MacBook-Air-Elyas
المستخدم:     elyasaldakhil
Shell:        zsh
Node:         v24.15.0
npm:          11.12.1
git config:   user.name = Elyas Aldakhil
              user.email = elyasaldakhil@gmail.com
              credential.helper = osxkeychain
              core.filemode = false
```

**مجلد المشروع:**
```
/Users/Shared/Files From d.localized/elyas-realestate
```

**GitHub Repo:**
```
https://github.com/elyas-realestate/elyas-realestate
Branch: master (مش main!)
```

---

## ⚡ أوامر Terminal للجلسة القادمة

```bash
# ادخل مجلد المشروع
cd "/Users/Shared/Files From d.localized/elyas-realestate"

# تأكد إن كل شي up-to-date
git pull origin master

# شف حالة git
git status

# لو احتجت لـ format جديد
npm run format
```

---

## 🧠 برومت Claude للجلسة القادمة

```
أنا إلياس، نواصل خطة تنظيف Wasit Pro.
اقرأ أولاً:
- docs/NEXT-SESSION-START-HERE.md (هذا الملف)
- docs/cleanup-plan-may-11.md (الخطة الكاملة)

أنجزنا الموجة الأولى. متبقّى: تحقّق Vercel + تشغيل migrations 050/051،
ثم نبدأ يوم ٣ (Vitest + 5 اختبارات حرجة).

أنا على Mac (لا أعرف PowerShell — استخدم أوامر macOS Terminal).
```

---

## 🌙 ملاحظات للذاكرة

١) إلياس يعمل على ماك حديثاً — تجنّب أوامر Windows (PowerShell, `D:\`)
٢) Git على ماك يستخدم HTTPS + Personal Access Token محفوظ في Keychain
٣) الـ branch اسمه `master` (legacy) — ليس `main`
٤) المشروع كان مرتبط بـ Vercel من ٢٣ مارس ٢٠٢٦
٥) GitHub username: `elyas-realestate` (مش `elyasaldakhil`)

---

**ختام:** كان يوم استثنائي. خرجنا من "كود لا يوجد له .gitignore" إلى "repo نظيف + مُنسَّق + موثَّق". 🎯
