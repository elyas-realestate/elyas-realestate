-- ══════════════════════════════════════════════════════════════
-- 019: إصلاح أمني — الـ trigger يربط الدعوة فقط بعد تأكيد البريد
-- الثغرة: 018 كان يربط المستخدم فور إنشاء الصف في auth.users
--         قبل التأكد من ملكية البريد. مهاجم يعرف بريد مدعو
--         يقدر يسجّل بنفسه ويستولي على صلاحيات العضو.
-- الإصلاح: (1) لا تربط إذا email_confirmed_at IS NULL
--          (2) أضف trigger ثاني على UPDATE لتأكيد البريد لاحقاً
--          (3) ثبّت search_path لـ SECURITY DEFINER (دفاع متعدد)
-- ══════════════════════════════════════════════════════════════

-- ── 1. تحديث دالة الربط: تشترط البريد مؤكّد ──
CREATE OR REPLACE FUNCTION public.link_pending_invites()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- لا تربط الدعوة إلا بعد تأكيد البريد
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.tenant_members
  SET user_id      = NEW.id,
      status       = 'active',
      activated_at = now()
  WHERE lower(email) = lower(NEW.email)
    AND status     = 'invited'
    AND user_id    IS NULL;

  RETURN NEW;
END;
$$;

-- ── 2. Trigger جديد: يعمل لما يتأكد البريد لاحقاً ──
-- السيناريو: المستخدم سجّل، ثم أكّد بريده بعد فترة.
-- الـ trigger القديم (AFTER INSERT) ما يشتغل في هذه الحالة.
CREATE OR REPLACE FUNCTION public.link_invites_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- نشتغل فقط لما تتغيّر email_confirmed_at من NULL إلى قيمة
  IF OLD.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.tenant_members
  SET user_id      = NEW.id,
      status       = 'active',
      activated_at = now()
  WHERE lower(email) = lower(NEW.email)
    AND status     = 'invited'
    AND user_id    IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_invites_on_confirm ON auth.users;
CREATE TRIGGER link_invites_on_confirm
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_invites_on_confirm();

-- ── 3. تنظيف: أي صف في tenant_members تم تفعيله خطأً قبل تأكيد البريد ──
-- نعيده إلى حالة "invited" لو المستخدم المربوط ما زال بريده غير مؤكد
UPDATE public.tenant_members m
SET user_id      = NULL,
    status       = 'invited',
    activated_at = NULL
FROM auth.users u
WHERE m.user_id = u.id
  AND m.status  = 'active'
  AND u.email_confirmed_at IS NULL
  AND m.role   <> 'owner';   -- لا تلمس المالك الأصلي

-- ── 4. تثبيت search_path لباقي دوال SECURITY DEFINER في 018 ──
ALTER FUNCTION public.my_tenant_id() SET search_path = public, auth;
ALTER FUNCTION public.my_role()      SET search_path = public, auth;
ALTER FUNCTION public.activate_existing_invites() SET search_path = public, auth;

-- ── 5. حماية دالة activate_existing_invites من سوء الاستخدام ──
-- كانت تربط أي دعوة مطابقة بالبريد بدون التحقق من التأكيد.
CREATE OR REPLACE FUNCTION public.activate_existing_invites()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.tenant_members m
  SET user_id      = u.id,
      status       = 'active',
      activated_at = now()
  FROM auth.users u
  WHERE lower(m.email)       = lower(u.email)
    AND m.status             = 'invited'
    AND m.user_id            IS NULL
    AND u.email_confirmed_at IS NOT NULL;   -- ← الشرط الجديد
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
