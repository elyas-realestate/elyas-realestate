# 📍 Wasit Pro — حالة المشروع (مصدر واحد للحقيقة)

> **اقرأ هذا الملف فقط** عند فتح أي جلسة جديدة. كل ما عداه أرشيف أو خطة فرعية.
>
> **آخر تحديث:** 19 مايو 2026 — موجة 13 (توحيد التوثيق)
> **آخر commit:** `16a8a4c`
> **حالة CI:** 🟢 أخضر

---

## 📊 الأرقام الحقيقية الآن

| المقياس           | القيمة                                          |
| ----------------- | ----------------------------------------------- |
| الاختبارات        | **877 / 877 ✓**                                 |
| تغطية المكوّنات   | **24 / 24 (100%)**                              |
| ملفات اختبار      | 46 (lib + components + api)                     |
| TypeScript errors | 0                                               |
| ESLint errors     | 0                                               |
| ESLint warnings   | 39 (react-compiler structural فقط — لا تكسر CI) |
| Format (Prettier) | نظيف                                            |
| Build             | 140 صفحة                                        |

---

## ⚠️ مخاطر فعّالة الآن (يجب معالجتها)

| #   | الخطر                                                                                                             | الحالة                       |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| R1  | **migration `052_add_clients_budget.sql` لم تُطبَّق على Supabase prod** — كل INSERT لـ `clients.budget` يفشل بصمت | ⏳ ينتظر تطبيقك من Dashboard |
| R2  | 84 موضع `process.env.X!` بدون validation — أي env var مفقود = TypeError مبهم                                      | ⏳ موجة 14                   |
| R3  | 64 API route، اختبار واحد فقط لها (whatsapp/webhook). تغييرات schema تنكسر بصمت                                   | ⏳ موجة 15                   |
| R4  | 3 API routes بدون فلتر `tenant_id` صريح (تعتمد على RLS)                                                           | ⏳ موجة 14                   |

---

## ✅ الموجات المُكتملة (مرتّبة زمنياً مع commit hash)

| #       | الموجة                                   | المنجز                                                                                                                                                                                                            | Commit                          |
| ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1-6     | بنية تحتية أولى                          | settings extraction, vitest, logger, auth helpers, CI, Husky, Database types                                                                                                                                      | (قبل 16 مايو)                   |
| 6C      | ESLint deep cleanup                      | 449 → 166 warnings                                                                                                                                                                                                | `08987d0` → `93f08db`           |
| 7       | Wave 7 batch — unused/any cleanup        | 166 → 35 warnings                                                                                                                                                                                                 | `f7d5dc0` → `0bdc0c3`           |
| 8       | ESLint to zero                           | 55 explicit-any → 0، الوصول لـ 0 errors / 39 structural                                                                                                                                                           | `3c000df` → `e4d5ec9`           |
| 9       | اختبارات lib helpers (90+ test)          | format, social-normalize, matching, csv, card-themes, schema-org, portal-adapters, export, system-gate, totp, zatca, profile-elements, whatsapp, ai-call                                                          | `eb4bc07` → `df4fcd6`           |
| 10      | اختبارات مكوّنات أولى (5 مكوّنات)        | Breadcrumb, SARIcon, HelpHint, SocialIcon, LoadingStates, ServiceIcon, MapsLinkInput, SaveContactButton, CardThemePicker, BrokerQRModal, ThemeSwitcher                                                            | `86277eb` → `40bfe14`           |
| 11      | إصلاحات CI                               | vitest 4→3 downgrade، 13 + 4 اختبارات فاشلة                                                                                                                                                                       | `6710713`, `1d603f7`, `86ea6c8` |
| 12      | إصلاح 4 schema bugs مؤجّلة               | broker_identity.phone حُذف، clients.budget عبر migration 052، contracts.tenant_name كان إنذار كاذب                                                                                                                | `b26cdff`                       |
| 13      | تغطية المكوّنات إلى 100% (13 مكوّن جديد) | BrandIcons, SupportContact, WaitlistForm, TestimonialsSection, BrandColorProvider, OnboardingChecklist, FeedbackWidget, AnalyticsTracker, MobileNav, GrowthNav, NeighborhoodIntel, LeadCaptureGate, VoiceRecorder | `59d20f8`, `cac0d11`, `16a8a4c` |
| **13b** | **توحيد التوثيق (هذا الملف)**            | حذف 3 ملفات مخفية في `.claude/memory/`، نقل 8 ملفات قديمة لأرشيف، إنشاء `PROJECT-STATE.md`                                                                                                                        | (الجلسة الحالية)                |

---

## 🎯 القواعد الـ 7 الملزِمة بيننا

1. **`PROJECT-STATE.md` هو المصدر الوحيد.** ملف واحد. ≤200 سطر. يُحدَّث نهاية كل جلسة.
2. **لا ملفات مخفية في `.claude/memory/`.** كل شيء يُنقل لـ `docs/` المرئي.
3. **تسمية موحّدة:** "موجة N" + commit hash. لا "Phase A/B/C" ولا أسماء متبدّلة.
4. **ختام كل جلسة ٣ أسطر:** ما تم، ما التالي، أي مخاطر. لا مقالات.
5. **لا خطط جديدة بدون إذن.** المهام تُسجَّل في `TaskList` (widget). لا ملفات `.md` جديدة.
6. **Migration = ✅ بعد تأكيدك أنها طُبِّقت على prod.** حتى ذلك الحين تبقى ⏳ في R1 فوق.
7. **أي ملف جديد أنشئه = أعرض مساره ومحتواه في الرد فوراً.** تعرف ماذا أكتب.

---

## 📁 خريطة التوثيق (بعد التوحيد)

```
PROJECT-STATE.md            ← أنت هنا (المصدر الوحيد)
README.md                   ← نظرة عامة على المشروع
AGENTS.md                   ← قواعد Next.js للـ agents
CLAUDE.md                   ← redirect لـ AGENTS.md
META_SETUP.md               ← إعداد بيئة Meta (WhatsApp)
WA-REAL-CHECKPOINT.md       ← فحص حقيقي لـ WhatsApp

docs/
  README.md                 ← فهرس الـ docs
  plans/                    ← خطط نشطة (لم تُنفَّذ بعد)
    competitive-strategy.md ← (كان .claude/memory)
    architecture-MAS.md     ← (كان .claude/memory) — الذاكرة المؤسسية
    ux-consolidation.md     ← (كان .claude/memory)
    tech-debt.md            ← (كان TECH-DEBT-AUDIT-2026-05.md)
  reference/                ← مراجع ثابتة
    ux-canonical-pages.md
  archive/                  ← منتهية أو قديمة جداً
    01-gap-analysis-100-companies.md
    02-ai-organization-roadmap.md
    WAVE-6B-RESUME.md
    beta-launch-plan.md
    cib-verify-may6-deployment.md
    cleanup-plan-may-11.md
    next-session-handoff.md
    session-report-may6.md
    NEXT-SESSION-START-HERE.md (القديم)

supabase/
  MIGRATIONS_HISTORY.md     ← سجل الـ migrations
  ###_*.sql                 ← الـ migrations نفسها (آخر واحد: 052)
```

---

## 🚀 الموجات القادمة المقترحة (مرتّبة بالأولوية)

| موجة   | الهدف                                                 | المدى      | الأثر                               |
| ------ | ----------------------------------------------------- | ---------- | ----------------------------------- |
| **14** | إنشاء `lib/env.ts` + استبدال 84 موضع `process.env.X!` | جلسة 1-2   | runtime crash واضحة عند env missing |
| **15** | فحص 3 routes مشبوهة + إضافة tenant filter             | جلسة 1     | منع IDOR محتمل                      |
| 16     | integration tests لـ 20 API route حرج                 | موجة كبيرة | منع schema regressions              |
| 17     | تخفيض `as any` من 93 إلى ≤30                          | موجة كبيرة | type safety حقيقي                   |
| 18     | توحيد helpers الـ Supabase client                     | جلسة 1     | API uniform                         |
| 19     | مراجعة 28 TODO + تنظيف docs قديم متبقّي               | جلسة 1     | تنظيف                               |

---

## 📌 الخطط النشطة (يجب قراءتها قبل اتخاذ قرارات منتج)

- **`docs/plans/competitive-strategy.md`** — تموضع وسيط برو مقابل نزل/تعاريف/تداولكم + خطة 30 يوم (Z1-Z4, P1-P4, D1-D3) — **بعضها مُنفَّذ، يحتاج تحديث**
- **`docs/plans/architecture-MAS.md`** — معمارية النظام (5 مدراء AI + 12 موظف)، حالة كل migration حتى 033 — **يحتاج تحديث ليصل إلى 052**
- **`docs/plans/ux-consolidation.md`** — اقتراح `/dashboard/ai` كمركز موحّد — **لم يُنفَّذ بعد**
- **`docs/plans/tech-debt.md`** — تقرير الفحص التقني الكامل (R1-R4 + جميع المخاطر المتوسطة)

---

## 🔁 بروتوكول الجلسة القادمة

عند فتح أي جلسة:

1. اقرأ هذا الملف (`PROJECT-STATE.md`).
2. إذا في R1 (migration معلّقة) — اسأل المالك هل طُبِّقت.
3. اختر موجة من القائمة فوق وأخبر المالك.
4. ابدأ. كل تغيير = test + lint + format + typecheck قبل commit.
5. عند انتهاء الجلسة: حدّث هذا الملف في 3 مواضع:
   - "آخر تحديث" + "آخر commit"
   - أضف صف جديد في "الموجات المُكتملة"
   - حدّث "المخاطر الفعّالة" إذا تغيرت
