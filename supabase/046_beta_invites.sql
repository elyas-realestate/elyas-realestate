-- ══════════════════════════════════════════════════════════════
-- 046: invite_codes — نظام دعوات Beta
-- يضبط مَن يقدر يسجّل في المرحلة المغلقة
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,

  -- ── من أنشأ ─ من استخدم ──
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- ── حدود الاستخدام ──
  max_uses int NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  use_count int NOT NULL DEFAULT 0 CHECK (use_count >= 0),

  -- ── انتهاء صلاحية اختياري ──
  expires_at timestamptz,
  used_at timestamptz,

  -- ── ميتاداتا ──
  notes text,
  cohort text,                                          -- مثل "beta-wave-1", "demo", "press"
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code   ON public.invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON public.invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON public.invite_codes(used_by);

-- RLS — فقط super_admin يقرأ/يكتب الكود؛ المستخدمون العاديون يستخدمون API
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invite_codes_admin_all" ON public.invite_codes;
CREATE POLICY "invite_codes_admin_all"
  ON public.invite_codes FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ══════════════════════════════════════════════════════════════
-- Beta Waitlist — قائمة الانتظار قبل صدور الدعوات
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.beta_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  city text,
  notes text,           -- ما الذي يبحث عنه / لماذا يهتم
  source text,          -- twitter, friend, search, etc.
  invited_at timestamptz,
  invite_code_id uuid REFERENCES public.invite_codes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'registered', 'rejected')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email  ON public.beta_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.beta_waitlist(status);

ALTER TABLE public.beta_waitlist ENABLE ROW LEVEL SECURITY;

-- إدراج علني (للتسجيل في القائمة) — لكن قراءة admin only
DROP POLICY IF EXISTS "waitlist_public_insert" ON public.beta_waitlist;
CREATE POLICY "waitlist_public_insert"
  ON public.beta_waitlist FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "waitlist_admin_read_write" ON public.beta_waitlist;
CREATE POLICY "waitlist_admin_read_write"
  ON public.beta_waitlist FOR SELECT
  USING (public.is_super_admin());

-- ══════════════════════════════════════════════════════════════
-- دالة التحقق من invite code (atomic، تمنع race conditions)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_invite
    FROM public.invite_codes
    WHERE code = p_code
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'الكود غير موجود');
  END IF;

  IF v_invite.status != 'active' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'الكود غير فعّال');
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'الكود منتهي الصلاحية');
  END IF;

  IF v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'تم استخدام الكود الحد الأقصى');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code_id', v_invite.id,
    'cohort', v_invite.cohort,
    'remaining_uses', v_invite.max_uses - v_invite.use_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- دالة استهلاك invite code (تُستدعى بعد التسجيل الناجح)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.consume_invite_code(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_invite
    FROM public.invite_codes
    WHERE code = p_code
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'الكود غير موجود');
  END IF;

  IF v_invite.status != 'active' OR v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'الكود غير صالح');
  END IF;

  UPDATE public.invite_codes
    SET use_count = use_count + 1,
        used_by = COALESCE(used_by, p_user_id),
        used_at = NOW(),
        updated_at = NOW(),
        status = CASE WHEN use_count + 1 >= max_uses THEN 'expired' ELSE status END
    WHERE id = v_invite.id;

  -- حدّث waitlist لو موجودة
  UPDATE public.beta_waitlist
    SET status = 'registered',
        invited_at = COALESCE(invited_at, NOW()),
        invite_code_id = v_invite.id,
        updated_at = NOW()
    WHERE invite_code_id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'code_id', v_invite.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_invite_code(text, uuid) TO authenticated;

-- ══════════════════════════════════════════════════════════════
-- Trigger لتحديث updated_at
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.touch_invite_codes_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invite_codes_touch ON public.invite_codes;
CREATE TRIGGER trg_invite_codes_touch
  BEFORE UPDATE ON public.invite_codes
  FOR EACH ROW EXECUTE FUNCTION public.touch_invite_codes_updated_at();

DROP TRIGGER IF EXISTS trg_waitlist_touch ON public.beta_waitlist;
CREATE TRIGGER trg_waitlist_touch
  BEFORE UPDATE ON public.beta_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.touch_invite_codes_updated_at();

-- ══════════════════════════════════════════════════════════════
-- بذور: ٣ أكواد Beta أولية للأصدقاء/الاختبار
-- (المالك يقدر يحذفها أو يستبدلها لاحقاً)
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.invite_codes (code, max_uses, cohort, notes)
VALUES
  ('WASIT-BETA-1', 1, 'beta-wave-1', 'كود تجريبي أولي'),
  ('WASIT-BETA-2', 1, 'beta-wave-1', 'كود تجريبي أولي'),
  ('WASIT-BETA-3', 1, 'beta-wave-1', 'كود تجريبي أولي')
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE public.invite_codes IS
  'دعوات Beta — تحكم في من يستطيع التسجيل في المرحلة المغلقة';
COMMENT ON TABLE public.beta_waitlist IS
  'قائمة انتظار Beta — يُسجَّل فيها من يطلب الدعوة قبل أن يُمنح كوداً';
