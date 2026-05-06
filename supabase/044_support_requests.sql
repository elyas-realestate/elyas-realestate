-- ══════════════════════════════════════════════════════════════
-- 044: support_requests — طلبات دعم العملاء
-- جدول لاستقبال أسئلة/شكاوى/طلبات مساعدة من الوسطاء
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- محتوى الطلب
  subject text NOT NULL,
  message text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN (
    'general', 'bug', 'feature_request', 'billing', 'urgent', 'other'
  )),

  -- معلومات اتصال احتياطية
  contact_email text,
  contact_phone text,
  preferred_method text DEFAULT 'whatsapp' CHECK (preferred_method IN ('whatsapp', 'email', 'phone')),

  -- بيانات تشخيص
  user_agent text,
  page_url text,

  -- معالجة
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note text,
  resolved_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_tenant ON public.support_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created ON public.support_requests(created_at DESC);

-- RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_owner_select" ON public.support_requests;
CREATE POLICY "support_owner_select"
  ON public.support_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "support_owner_insert" ON public.support_requests;
CREATE POLICY "support_owner_insert"
  ON public.support_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.touch_support_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_requests_touch ON public.support_requests;
CREATE TRIGGER trg_support_requests_touch
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_requests_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 045: tenant_onboarding — حالة الـ onboarding لكل tenant
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tenant_onboarding (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- الخطوات
  step_profile_completed boolean DEFAULT false,
  step_property_added boolean DEFAULT false,
  step_whatsapp_connected boolean DEFAULT false,
  step_assistant_tested boolean DEFAULT false,

  -- إخفاء الـ checklist لو المالك ما يحبه
  dismissed boolean DEFAULT false,
  dismissed_at timestamptz,

  -- timestamps
  completed_at timestamptz, -- لما كل الخطوات تكتمل
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tenant_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_owner_all" ON public.tenant_onboarding;
CREATE POLICY "onboarding_owner_all"
  ON public.tenant_onboarding FOR ALL
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.touch_onboarding_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  -- لو كل الخطوات صارت true، عيّن completed_at
  IF NEW.step_profile_completed AND NEW.step_property_added
     AND NEW.step_whatsapp_connected AND NEW.step_assistant_tested
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_onboarding_touch ON public.tenant_onboarding;
CREATE TRIGGER trg_onboarding_touch
  BEFORE UPDATE ON public.tenant_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.touch_onboarding_updated_at();

COMMENT ON TABLE public.support_requests IS
  'طلبات دعم العملاء — يصلها المالك في الداشبورد';

COMMENT ON TABLE public.tenant_onboarding IS
  'حالة Onboarding لكل tenant — يحدد متى نخفي الـ checklist';
