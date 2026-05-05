-- ══════════════════════════════════════════════════════════════
-- 042: ceo_identity — هوية المدير التنفيذي
-- نظام تعريف موحَّد للـ CEO يربط جميع نقاط التماس (واتساب، إيميل،
-- داشبورد) بشخص واحد، ويُربط تلقائياً بالسكرتير الذكي.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ceo_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- الهوية الأساسية
  full_name text NOT NULL DEFAULT 'الرئيس التنفيذي',
  title text DEFAULT 'الرئيس التنفيذي',
  email text,
  photo_url text,

  -- الأرقام (متعددة بصيغة منظَّمة)
  -- [{"label":"شخصي","number":"966539920003","is_primary":true}, ...]
  phones jsonb DEFAULT '[]'::jsonb,

  -- تفضيلات التواصل
  preferred_address text DEFAULT 'الأستاذ',     -- اللقب المفضل في المخاطبة
  tone_preference   text DEFAULT 'professional', -- professional / friendly / mixed

  -- ربط تلقائي بالسكرتير
  assistant_employee_code text DEFAULT 'ceo_assistant',

  -- ملاحظات / معلومات إضافية
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ceo_identity_tenant ON public.ceo_identity(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ceo_identity_user   ON public.ceo_identity(user_id);

-- ══════════════════════════════════════════════════════════════
-- RLS — مالك الـ tenant فقط يقرأ/يكتب هويته
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.ceo_identity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ceo_identity_owner_select" ON public.ceo_identity;
CREATE POLICY "ceo_identity_owner_select"
  ON public.ceo_identity FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = ceo_identity.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "ceo_identity_owner_write" ON public.ceo_identity;
CREATE POLICY "ceo_identity_owner_write"
  ON public.ceo_identity FOR ALL
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- ══════════════════════════════════════════════════════════════
-- Trigger لتحديث updated_at تلقائياً
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.touch_ceo_identity_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ceo_identity_touch ON public.ceo_identity;
CREATE TRIGGER trg_ceo_identity_touch
  BEFORE UPDATE ON public.ceo_identity
  FOR EACH ROW EXECUTE FUNCTION public.touch_ceo_identity_updated_at();

-- ══════════════════════════════════════════════════════════════
-- دالة فحص هل الرقم هو رقم CEO — للاستخدام من webhook
-- تفحص ceo_identity أولاً، ثم تعود إلى ceo_phones القديم كـ fallback
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_ceo_phone(p_tenant_id uuid, p_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean := false;
BEGIN
  -- 1) فحص ceo_identity (المصدر الجديد)
  SELECT EXISTS (
    SELECT 1
    FROM public.ceo_identity ci, jsonb_array_elements(ci.phones) phone
    WHERE ci.tenant_id = p_tenant_id
      AND phone->>'number' = p_phone
  ) INTO v_found;

  IF v_found THEN RETURN true; END IF;

  -- 2) Fallback: ceo_phones في tenant_ai_config (المصدر القديم — للتوافق)
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_ai_config tac
    WHERE tac.tenant_id = p_tenant_id
      AND tac.ceo_phones ? p_phone
  ) INTO v_found;

  RETURN v_found;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_ceo_phone(uuid, text) TO authenticated, service_role;

-- ══════════════════════════════════════════════════════════════
-- ترحيل تلقائي: لكل tenant فيه ceo_phones، أنشئ ceo_identity مبدئية
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.ceo_identity (tenant_id, user_id, full_name, title, phones)
SELECT
  t.id,
  t.owner_id,
  COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = t.owner_id),
    'المالك'
  ),
  'الرئيس التنفيذي',
  COALESCE(
    (
      SELECT jsonb_agg(jsonb_build_object(
        'label', 'رقم مُرحَّل',
        'number', phone_value,
        'is_primary', false
      ))
      FROM jsonb_array_elements_text(COALESCE(tac.ceo_phones, '[]'::jsonb)) phone_value
      WHERE phone_value IS NOT NULL AND phone_value <> ''
    ),
    '[]'::jsonb
  )
FROM public.tenants t
LEFT JOIN public.tenant_ai_config tac
  ON tac.tenant_id = t.id AND tac.ceo_phones IS NOT NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.ceo_identity ci WHERE ci.tenant_id = t.id
)
ON CONFLICT (tenant_id) DO NOTHING;

COMMENT ON TABLE public.ceo_identity IS
  'هوية المدير التنفيذي — مصدر موحَّد لتعريف الـ CEO عبر كل نقاط التماس (WhatsApp، Email، Dashboard)';
