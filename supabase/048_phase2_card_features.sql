-- ══════════════════════════════════════════════════════════════
-- 048: Phase 2 — Visual differentiation
--   1. testimonials table
--   2. additional broker badges/credentials
--   3. property_comparisons (saved comparisons)
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1) testimonials — آراء العملاء
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- بيانات العميل
  client_name text NOT NULL,
  client_role text,                              -- "مالك فيلا" / "مستأجر" / "مستثمر"
  client_avatar_url text,

  -- المحتوى
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  testimonial_text text NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,

  -- الترتيب والعرض
  display_order int DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,

  -- التاريخ
  testimonial_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_tenant     ON public.testimonials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_published  ON public.testimonials(is_published, display_order);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testimonials_public_read" ON public.testimonials;
CREATE POLICY "testimonials_public_read"
  ON public.testimonials FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "testimonials_owner_all" ON public.testimonials;
CREATE POLICY "testimonials_owner_all"
  ON public.testimonials FOR ALL
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 2) إضافة رخص متعددة لـ broker_identity
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.broker_identity
  ADD COLUMN IF NOT EXISTS maroof_id text,                       -- معروف
  ADD COLUMN IF NOT EXISTS muthawiq_id text,                     -- موثوق
  ADD COLUMN IF NOT EXISTS realestate_authority_id text,         -- هيئة العقار
  ADD COLUMN IF NOT EXISTS years_experience int,
  ADD COLUMN IF NOT EXISTS specializations text[],               -- ["فلل", "شقق", "أراضي"]
  ADD COLUMN IF NOT EXISTS service_areas text[],                 -- ["الرياض", "جدة"]
  ADD COLUMN IF NOT EXISTS testimonials_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deals_closed_count int DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 3) property_comparisons — مقارنات محفوظة
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  share_token text UNIQUE,                          -- رابط قابل للمشاركة

  property_ids uuid[] NOT NULL,                     -- مصفوفة معرفات العقارات
  title text,
  notes text,

  view_count int DEFAULT 0,
  expires_at timestamptz,                           -- انتهاء صلاحية اختياري

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comparisons_tenant ON public.property_comparisons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_token  ON public.property_comparisons(share_token);

ALTER TABLE public.property_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comparisons_owner_all" ON public.property_comparisons;
CREATE POLICY "comparisons_owner_all"
  ON public.property_comparisons FOR ALL
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "comparisons_public_read_by_token" ON public.property_comparisons;
CREATE POLICY "comparisons_public_read_by_token"
  ON public.property_comparisons FOR SELECT
  USING (share_token IS NOT NULL);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_testimonials_touch ON public.testimonials;
CREATE TRIGGER trg_testimonials_touch
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.touch_phase1_updated_at();

DROP TRIGGER IF EXISTS trg_comparisons_touch ON public.property_comparisons;
CREATE TRIGGER trg_comparisons_touch
  BEFORE UPDATE ON public.property_comparisons
  FOR EACH ROW EXECUTE FUNCTION public.touch_phase1_updated_at();

COMMENT ON TABLE public.testimonials IS 'آراء العملاء — تظهر في بطاقة الوسيط العامة';
COMMENT ON TABLE public.property_comparisons IS 'مقارنات عقارات قابلة للمشاركة عبر رابط';
