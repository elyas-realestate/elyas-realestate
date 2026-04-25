-- ══════════════════════════════════════════════════════════════
-- 029: Push Notifications Subscriptions (PWA Web Push)
-- يحفظ subscription endpoints لكل مستخدم لكل جهاز
-- يُستخدم لإرسال إشعارات Push (تنبيهات عقار جديد، عميل ساخن، إلخ)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     text NOT NULL,         -- URL من Push service (FCM/APNs)
  p256dh       text NOT NULL,         -- public key للتشفير
  auth_secret  text NOT NULL,         -- auth secret
  user_agent   text,
  device_label text,                  -- "iPhone — Safari" مثلاً (للعرض)
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_tenant_idx ON public.push_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx   ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_active_idx ON public.push_subscriptions(tenant_id, is_active);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_self ON public.push_subscriptions;
CREATE POLICY push_subscriptions_self ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id = public.my_tenant_id());

CREATE OR REPLACE FUNCTION public.my_push_subscriptions()
RETURNS SETOF public.push_subscriptions
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.push_subscriptions
  WHERE user_id = auth.uid() AND is_active = true
  ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.my_push_subscriptions() TO authenticated;
