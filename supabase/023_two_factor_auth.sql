-- ══════════════════════════════════════════════════════════════
-- 023: المصادقة الثنائية (2FA / TOTP) + رموز الاسترداد
-- متطلب من PDPL + هيئة الاتصالات لحماية حسابات الوسطاء
-- ══════════════════════════════════════════════════════════════

-- ── 1. أسرار TOTP لكل مستخدم ──
CREATE TABLE IF NOT EXISTS public.user_2fa_secrets (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret         text NOT NULL,          -- base32 secret (32 chars)
  is_enabled     boolean DEFAULT false,  -- false = enrolled but not confirmed yet
  enabled_at     timestamptz,
  last_used_at   timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.user_2fa_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_2fa_self_select ON public.user_2fa_secrets;
CREATE POLICY user_2fa_self_select ON public.user_2fa_secrets
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_2fa_self_insert ON public.user_2fa_secrets;
CREATE POLICY user_2fa_self_insert ON public.user_2fa_secrets
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_2fa_self_update ON public.user_2fa_secrets;
CREATE POLICY user_2fa_self_update ON public.user_2fa_secrets
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_2fa_self_delete ON public.user_2fa_secrets;
CREATE POLICY user_2fa_self_delete ON public.user_2fa_secrets
  FOR DELETE USING (user_id = auth.uid());

-- ── 2. رموز الاسترداد ──
CREATE TABLE IF NOT EXISTS public.user_recovery_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash   text NOT NULL,          -- SHA-256 للرمز
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recovery_codes_user_idx ON public.user_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS recovery_codes_unused_idx
  ON public.user_recovery_codes(user_id) WHERE used_at IS NULL;

ALTER TABLE public.user_recovery_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recovery_codes_self ON public.user_recovery_codes;
CREATE POLICY recovery_codes_self ON public.user_recovery_codes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 3. سجلّ محاولات 2FA ──
CREATE TABLE IF NOT EXISTS public.user_2fa_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  success     boolean NOT NULL,
  method      text,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS twofa_attempts_user_idx
  ON public.user_2fa_attempts(user_id, created_at DESC);

ALTER TABLE public.user_2fa_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS twofa_attempts_self ON public.user_2fa_attempts;
CREATE POLICY twofa_attempts_self ON public.user_2fa_attempts
  FOR SELECT USING (user_id = auth.uid());

-- ── 4. دوال مساعدة ──
CREATE OR REPLACE FUNCTION public.user_has_2fa(u_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.user_2fa_secrets WHERE user_id = u_id LIMIT 1),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.tenant_2fa_coverage()
RETURNS TABLE (total_users int, with_2fa int, pct numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH t AS (SELECT public.my_tenant_id() AS tid)
  SELECT
    COUNT(DISTINCT tm.user_id)::int AS total_users,
    COUNT(DISTINCT tm.user_id) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM public.user_2fa_secrets s
        WHERE s.user_id = tm.user_id AND s.is_enabled = true
      )
    )::int AS with_2fa,
    ROUND(
      100.0 * COUNT(DISTINCT tm.user_id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM public.user_2fa_secrets s
          WHERE s.user_id = tm.user_id AND s.is_enabled = true
        )
      ) / NULLIF(COUNT(DISTINCT tm.user_id), 0),
      1
    ) AS pct
  FROM public.tenant_members tm, t
  WHERE tm.tenant_id = t.tid AND tm.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.user_has_2fa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_2fa_coverage() TO authenticated;
