-- ══════════════════════════════════════════════════════════════
-- وسيط برو — ترقية المالك لخطة Pro (صلاحيات كاملة)
-- شغّل هذا الملف في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ترقية خطة المستخدم في جدول tenants
UPDATE public.tenants
SET plan = 'pro', updated_at = NOW()
WHERE owner_id = 'd5162dae-e3bf-48fa-91a6-b0e0c2c5c43a';

-- تأكيد النتيجة
SELECT slug, plan FROM public.tenants
WHERE owner_id = 'd5162dae-e3bf-48fa-91a6-b0e0c2c5c43a';
