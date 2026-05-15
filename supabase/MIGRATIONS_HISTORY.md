# 📜 سجل تاريخ الـ Migrations — Wasit Pro

> **آخر تحديث:** ١١ مايو ٢٠٢٦
> **الغرض:** توثيق التسلسل التاريخي للـ migrations + أي فجوات أو حالات خاصة، حتى يستطيع أي مطوّر يعيد بناء قاعدة البيانات من الصفر.

---

## ⚠️ فجوة معروفة: 036 → 041 (٦ أرقام محجوزة)

**الحالة:** الأرقام `036`، `037`، `038`، `039`، `040`، `041` **غير مستخدمة** في تسلسل الـ migrations.

### ما السبب؟

خلال التطوير السريع (أبريل-مايو ٢٠٢٦)، تم حجز هذه الأرقام لـ migrations كانت مخططة ثم:

- إما دُمجت لاحقاً في migrations لاحقة (042+)
- أو ألغيت قبل التطبيق
- أو طُبقت محلياً في Supabase ولم يتم committing الملف SQL إلى الـ repo

### هل هذا يكسر شيئاً؟

**❌ لا** — Supabase يطبّق الـ migrations بترتيب اسم الملف، والفجوة في الترقيم لا تؤثر على التطبيق طالما لا يوجد ملف بهذه الأرقام.

**✅ لكن** — يجب توثيقها لمنع الالتباس عند:

- إعادة بناء DB من الصفر
- مراجعة الكود من مطوّر جديد
- تدقيق CI/CD

### قرار رسمي

- **لن تُستخدم الأرقام 036-041** في أي migration مستقبلي.
- التسلسل الجديد يبدأ من **052** فأعلى.
- لو احتجت إضافة شيء بأثر رجعي قبل 042، استخدم رقماً جديداً (مثلاً 052) مع توضيح في التعليق الرأسي.

---

## 📅 الجدول الزمني الكامل

| Migration   | الموضوع                                             |       الحالة        |
| ----------- | --------------------------------------------------- | :-----------------: |
| 001         | Multi-tenancy foundation                            |         ✅          |
| 002         | Client activities                                   |         ✅          |
| 003         | Commissions                                         |         ✅          |
| 004         | Campaigns                                           |         ✅          |
| 005         | Expenses                                            |         ✅          |
| 006         | Projects                                            |         ✅          |
| 007         | Upgrade plan                                        |         ✅          |
| 008         | Security fixes                                      |         ✅          |
| 009         | Quotations + Invoices                               |         ✅          |
| 010         | Audit log                                           |         ✅          |
| 011         | Owner availability                                  |         ✅          |
| 012         | AI config                                           |         ✅          |
| 013         | Final security                                      |         ✅          |
| 014         | External subscriptions                              |         ✅          |
| 015         | Client sentiment                                    |         ✅          |
| 016         | Tenant portal                                       |         ✅          |
| 017         | Monthly goals                                       |         ✅          |
| 018         | Team members                                        |         ✅          |
| 019         | Fix invite trigger                                  |         ✅          |
| 020         | ZATCA compliance                                    |         ✅          |
| 021         | Notifications + Cron                                |         ✅          |
| 022         | Work orders                                         |         ✅          |
| 023         | Two-factor auth                                     |         ✅          |
| 024         | Portal listings                                     |         ✅          |
| 025         | Super admin                                         |         ✅          |
| 026         | AI employees                                        |         ✅          |
| 027         | Security hardening                                  |         ✅          |
| 028         | Contracts                                           |         ✅          |
| 029         | Push subscriptions                                  |         ✅          |
| 030         | WhatsApp                                            |         ✅          |
| 031         | Org structure                                       |         ✅          |
| 032         | Approval gates                                      |         ✅          |
| 033         | Manager loop                                        |         ✅          |
| 034         | CEO assistant                                       |         ✅          |
| 035         | Site settings extras                                |         ✅          |
| **036-041** | **فجوة مقصودة — لا تستخدم**                         |         ⛔          |
| 042         | CEO identity                                        |         ✅          |
| 043         | Subscription invoices                               |         ✅          |
| 044         | Support requests                                    |         ✅          |
| 045         | Storage buckets                                     |         ✅          |
| 046         | Beta invites + Waitlist                             |         ✅          |
| 047         | Phase 1 — Card features (lead capture, vCard, etc.) |         ✅          |
| 048         | Phase 2 — Themes + Testimonials + Licenses          |         ✅          |
| 049         | Phase 4 — AI Innovations (voice, matching, intel)   |         ✅          |
| 050         | Property management (rent contracts + payments)     |         ✅          |
| 051         | Beta feedback                                       |         ✅          |

---

## 🔧 إعادة بناء DB من الصفر

```bash
# في Supabase SQL Editor، شغّل بالترتيب:
for file in $(ls supabase/*.sql | sort); do
    psql -h <HOST> -U postgres -d postgres -f "$file"
done
```

أو من Supabase Dashboard:

1. افتح SQL Editor
2. شغّل كل ملف `.sql` في `supabase/` بالترتيب الرقمي
3. تخطّى الأرقام 036-041 (لا توجد ملفات بها — هذا متوقع)

---

## 📋 قواعد للمستقبل

عند إنشاء migration جديد:

1. **استخدم الرقم التالي بالتسلسل** (لا تتخطّى)
2. **أضف rollback إن أمكن** (`-- ROLLBACK:` كتعليق)
3. **اختبر على بيئة Staging** قبل Production
4. **حدّث هذا الملف** بسطر جديد في الجدول
5. **استخدم تعليق رأسي موحّد**:

```sql
-- ════════════════════════════════════════════════════════════
-- XXX: عنوان الـ migration
-- التاريخ: YYYY-MM-DD
-- الهدف: شرح بجملة واحدة
-- المتطلبات: أي migrations سابقة لازمة
-- ════════════════════════════════════════════════════════════
```
