-- ══════════════════════════════════════════════════════════════
-- 018: Team / Multi-user داخل الحساب الواحد
-- يسمح لعدة مستخدمين بالوصول لنفس الـ tenant بأدوار مختلفة
-- ══════════════════════════════════════════════════════════════

-- ── 1. جدول الأعضاء ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  full_name    text,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  status       text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','removed')),
  invited_by   uuid REFERENCES auth.users(id),
  invited_at   timestamptz DEFAULT now(),
  activated_at timestamptz,
  last_seen_at timestamptz,
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS tenant_members_tenant_idx ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx   ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS tenant_members_email_idx  ON public.tenant_members(lower(email));

-- ── 2. تحديث my_tenant_id() ليشمل الأعضاء ──────────────────
CREATE OR REPLACE FUNCTION public.my_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.tenants WHERE owner_id = auth.uid()
  UNION ALL
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- ── 3. دالة مساعدة: دور المستخدم الحالي ──────────────────
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.tenants WHERE owner_id = auth.uid()) THEN 'owner'
    ELSE COALESCE(
      (SELECT role FROM public.tenant_members
       WHERE user_id = auth.uid() AND status = 'active' LIMIT 1),
      'none'
    )
  END;
$$;

-- ── 4. Trigger: ربط user_id تلقائياً عند تسجيل المدعو ──────
-- عند تسجيل الدخول أول مرة، نربط الدعوات المعلّقة بالبريد
CREATE OR REPLACE FUNCTION public.link_pending_invites()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tenant_members
  SET user_id = NEW.id,
      status = 'active',
      activated_at = now()
  WHERE lower(email) = lower(NEW.email)
    AND status = 'invited'
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_invites_on_signup ON auth.users;
CREATE TRIGGER link_invites_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_pending_invites();

-- ── 5. RLS on tenant_members ───────────────────────────────
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- قراءة: أعضاء نفس الـ tenant يشوفون بعض
DROP POLICY IF EXISTS tenant_members_read ON public.tenant_members;
CREATE POLICY tenant_members_read ON public.tenant_members
  FOR SELECT
  USING (tenant_id = public.my_tenant_id());

-- كتابة: owner/admin فقط يضيف/يحذف/يعدّل
DROP POLICY IF EXISTS tenant_members_write ON public.tenant_members;
CREATE POLICY tenant_members_write ON public.tenant_members
  FOR ALL
  USING (
    tenant_id = public.my_tenant_id()
    AND public.my_role() IN ('owner','admin')
  )
  WITH CHECK (
    tenant_id = public.my_tenant_id()
    AND public.my_role() IN ('owner','admin')
  );

-- ── 6. دالة ربط فوري للمستخدمين الموجودين أصلاً ────────────
-- شغّل هذه مرة بعد إضافة دعوات لأشخاص عندهم حساب بالفعل
CREATE OR REPLACE FUNCTION public.activate_existing_invites()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.tenant_members m
  SET user_id = u.id,
      status = 'active',
      activated_at = now()
  FROM auth.users u
  WHERE lower(m.email) = lower(u.email)
    AND m.status = 'invited'
    AND m.user_id IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── 7. seed: إضافة المالك الحالي كعضو 'owner' ─────────────
INSERT INTO public.tenant_members (tenant_id, user_id, email, role, status, activated_at)
SELECT t.id, t.owner_id, u.email, 'owner', 'active', now()
FROM public.tenants t
JOIN auth.users u ON u.id = t.owner_id
ON CONFLICT (tenant_id, email) DO NOTHING;
