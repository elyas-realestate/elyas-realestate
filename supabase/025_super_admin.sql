-- ══════════════════════════════════════════════════════════════
-- 025: Super Admin — جدول + دوال SECURITY DEFINER للمالك (platform owner)
-- يعتمد على: 001_multi_tenancy, 009_quotations_invoices, 010_audit_log
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. جدول super_admins
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  notes      text
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- قراءة: كل مستخدم يعرف هل هو super admin (صفه فقط)
DROP POLICY IF EXISTS super_admins_self_read ON public.super_admins;
CREATE POLICY super_admins_self_read ON public.super_admins
  FOR SELECT
  USING (user_id = auth.uid());

-- الكتابة تتم فقط عبر service role أو SQL مباشر — لا INSERT/UPDATE/DELETE من anon/auth

-- ─────────────────────────────────────────────────────────────
-- 2. دالة is_super_admin()
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. نظرة عامة للمنصّة (KPIs)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_platform_overview()
RETURNS TABLE (
  total_tenants         bigint,
  active_tenants        bigint,
  suspended_tenants     bigint,
  free_plan_count       bigint,
  basic_plan_count      bigint,
  pro_plan_count        bigint,
  total_properties      bigint,
  published_properties  bigint,
  total_clients         bigint,
  total_deals           bigint,
  total_invoices        bigint,
  paid_invoices_total   numeric,
  new_tenants_30d       bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.tenants),
    (SELECT count(*) FROM public.tenants WHERE is_active = true),
    (SELECT count(*) FROM public.tenants WHERE is_active = false),
    (SELECT count(*) FROM public.tenants WHERE plan = 'free'),
    (SELECT count(*) FROM public.tenants WHERE plan = 'basic'),
    (SELECT count(*) FROM public.tenants WHERE plan = 'pro'),
    (SELECT count(*) FROM public.properties),
    (SELECT count(*) FROM public.properties WHERE is_published = true),
    (SELECT count(*) FROM public.clients),
    (SELECT count(*) FROM public.deals),
    (SELECT count(*) FROM public.invoices),
    COALESCE((SELECT sum(total_amount) FROM public.invoices WHERE status = 'مدفوع'), 0),
    (SELECT count(*) FROM public.tenants WHERE created_at > now() - interval '30 days')
  WHERE public.is_super_admin();
$$;

GRANT EXECUTE ON FUNCTION public.admin_platform_overview() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. قائمة المستأجرين مع إحصائيات
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_tenants()
RETURNS TABLE (
  id             uuid,
  slug           text,
  owner_id       uuid,
  owner_email    text,
  broker_name    text,
  plan           text,
  is_active      boolean,
  created_at     timestamptz,
  property_count bigint,
  client_count   bigint,
  deal_count     bigint,
  last_activity  timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.slug,
    t.owner_id,
    u.email::text,
    ss.broker_name,
    t.plan,
    t.is_active,
    t.created_at,
    (SELECT count(*) FROM public.properties p WHERE p.tenant_id = t.id),
    (SELECT count(*) FROM public.clients   c WHERE c.tenant_id = t.id),
    (SELECT count(*) FROM public.deals     d WHERE d.tenant_id = t.id),
    GREATEST(
      t.updated_at,
      (SELECT max(created_at) FROM public.properties p WHERE p.tenant_id = t.id),
      (SELECT max(created_at) FROM public.clients   c WHERE c.tenant_id = t.id)
    )
  FROM public.tenants t
  LEFT JOIN auth.users u ON u.id = t.owner_id
  LEFT JOIN public.site_settings ss ON ss.tenant_id = t.id
  WHERE public.is_super_admin()
  ORDER BY t.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_tenants() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. تفاصيل مستأجر واحد
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_tenant_detail(tid uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'tenant', to_jsonb(t.*),
    'owner_email', (SELECT email FROM auth.users WHERE id = t.owner_id),
    'site_settings', (SELECT to_jsonb(ss.*) FROM public.site_settings ss WHERE ss.tenant_id = t.id LIMIT 1),
    'broker_identity', (SELECT to_jsonb(bi.*) FROM public.broker_identity bi WHERE bi.tenant_id = t.id LIMIT 1),
    'stats', jsonb_build_object(
      'properties',  (SELECT count(*) FROM public.properties p WHERE p.tenant_id = t.id),
      'clients',     (SELECT count(*) FROM public.clients   c WHERE c.tenant_id = t.id),
      'deals',       (SELECT count(*) FROM public.deals     d WHERE d.tenant_id = t.id),
      'invoices',    (SELECT count(*) FROM public.invoices  i WHERE i.tenant_id = t.id),
      'paid_total',  COALESCE((SELECT sum(total_amount) FROM public.invoices WHERE tenant_id = t.id AND status = 'مدفوع'), 0)
    ),
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', tm.user_id,
        'role', tm.role,
        'email', u.email,
        'status', tm.status,
        'joined_at', tm.joined_at
      ))
      FROM public.team_members tm
      LEFT JOIN auth.users u ON u.id = tm.user_id
      WHERE tm.tenant_id = t.id
    ), '[]'::jsonb),
    'recent_invoices', COALESCE((
      SELECT jsonb_agg(to_jsonb(i.*) ORDER BY i.created_at DESC)
      FROM (
        SELECT * FROM public.invoices WHERE tenant_id = t.id
        ORDER BY created_at DESC LIMIT 10
      ) i
    ), '[]'::jsonb)
  ) INTO result
  FROM public.tenants t
  WHERE t.id = tid;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_tenant_detail(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. تعليق/تفعيل مستأجر
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_suspend_tenant(tid uuid, suspend boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.tenants
     SET is_active = NOT suspend, updated_at = now()
   WHERE id = tid;

  -- سجلّ في audit_log
  INSERT INTO public.audit_log (tenant_id, user_id, user_email, action, entity_type, entity_id, details)
  VALUES (
    tid,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    CASE WHEN suspend THEN 'suspend' ELSE 'activate' END,
    'tenant',
    tid,
    jsonb_build_object('by_super_admin', true, 'suspend', suspend)
  );

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_suspend_tenant(uuid, boolean) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6b. تعديل خطّة مستأجر
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_tenant_plan(tid uuid, new_plan text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF new_plan NOT IN ('free','basic','pro') THEN
    RAISE EXCEPTION 'invalid plan: %', new_plan;
  END IF;

  UPDATE public.tenants
     SET plan = new_plan, updated_at = now()
   WHERE id = tid;

  INSERT INTO public.audit_log (tenant_id, user_id, user_email, action, entity_type, entity_id, details)
  VALUES (
    tid,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'plan_change',
    'tenant',
    tid,
    jsonb_build_object('by_super_admin', true, 'new_plan', new_plan)
  );

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_tenant_plan(uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 7. الاشتراكات — نظرة كلّية
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_subscriptions()
RETURNS TABLE (
  tenant_id      uuid,
  slug           text,
  broker_name    text,
  plan           text,
  is_active      boolean,
  monthly_value  numeric,
  started_at     timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.slug,
    ss.broker_name,
    t.plan,
    t.is_active,
    CASE t.plan
      WHEN 'free'  THEN 0::numeric
      WHEN 'basic' THEN 199::numeric
      WHEN 'pro'   THEN 499::numeric
      ELSE 0::numeric
    END,
    t.created_at
  FROM public.tenants t
  LEFT JOIN public.site_settings ss ON ss.tenant_id = t.id
  WHERE public.is_super_admin()
  ORDER BY
    CASE t.plan WHEN 'pro' THEN 1 WHEN 'basic' THEN 2 ELSE 3 END,
    t.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_subscriptions() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8. سجل التدقيق الإداري
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_audit_recent(limit_n int DEFAULT 100)
RETURNS TABLE (
  id          uuid,
  tenant_id   uuid,
  tenant_slug text,
  user_email  text,
  action      text,
  entity_type text,
  entity_name text,
  ip_address  text,
  created_at  timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.tenant_id,
    t.slug,
    a.user_email,
    a.action,
    a.entity_type,
    a.entity_name,
    a.ip_address,
    a.created_at
  FROM public.audit_log a
  LEFT JOIN public.tenants t ON t.id = a.tenant_id
  WHERE public.is_super_admin()
  ORDER BY a.created_at DESC
  LIMIT limit_n;
$$;

GRANT EXECUTE ON FUNCTION public.admin_audit_recent(int) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 9. Seed — منح المالك الأول super_admin
--    (يبحث بالبريد — لن يفشل لو المستخدم لم يُسجّل بعد)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id INTO owner_id
  FROM auth.users
  WHERE email = 'ggm4h4wkxw@privaterelay.appleid.com'
  LIMIT 1;

  IF owner_id IS NOT NULL THEN
    INSERT INTO public.super_admins (user_id, notes)
    VALUES (owner_id, 'Platform owner — seeded by migration 025')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
