-- ══════════════════════════════════════════════════════════════
-- 021: جدول التنبيهات + أعمدة مساعدة للـ cron jobs
-- ══════════════════════════════════════════════════════════════

-- ── جدول التنبيهات العام ──
CREATE TABLE IF NOT EXISTS public.notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = للجميع في الـ tenant
  kind           text NOT NULL,              -- invoice_overdue_7, contract_expiry_30, etc.
  title          text NOT NULL,
  body           text,
  reference_id   uuid,
  reference_type text,                        -- invoice | contract | property | client
  read_at        timestamptz,
  action_url     text,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_tenant_idx
  ON public.notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications(tenant_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_kind_ref_idx
  ON public.notifications(tenant_id, kind, reference_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_tenant ON public.notifications;
CREATE POLICY notifications_tenant ON public.notifications
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ── عمود last_availability_check في properties (لو مو موجود) ──
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS last_availability_check timestamptz;

-- ── جدول contracts الأساسي (للـ cron يتعامل بهدوء لو مفقود) ──
CREATE TABLE IF NOT EXISTS public.contracts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id   uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  tenant_name   text,                    -- اسم المستأجر
  tenant_phone  text,
  contract_type text DEFAULT 'rental',   -- rental | sale
  start_date    date,
  end_date      date,
  monthly_rent  numeric,
  deposit       numeric,
  status        text DEFAULT 'active' CHECK (status IN ('active','expired','terminated','pending')),
  auto_renew    boolean DEFAULT false,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contracts_tenant_idx  ON public.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS contracts_end_idx     ON public.contracts(tenant_id, end_date);
CREATE INDEX IF NOT EXISTS contracts_status_idx  ON public.contracts(tenant_id, status);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contracts_tenant ON public.contracts;
CREATE POLICY contracts_tenant ON public.contracts
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ── دالة helper لتأشير تنبيه كمقروء ──
CREATE OR REPLACE FUNCTION public.mark_notification_read(n_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = n_id AND tenant_id = public.my_tenant_id();
$$;
