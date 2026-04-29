-- ══════════════════════════════════════════════════════════════
-- K-8: Manager Loop — التعلّم التنظيمي اليومي
-- جدول لحفظ مراجعات المدراء اليومية + اقتراحاتهم
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.manager_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.ai_managers(id) ON DELETE CASCADE,

  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,

  summary text NOT NULL,
  highlights jsonb DEFAULT '[]'::jsonb,
  concerns jsonb DEFAULT '[]'::jsonb,

  metrics jsonb DEFAULT '{}'::jsonb,

  suggestions_count int DEFAULT 0,

  generated_by_model text,

  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manager_reviews_tenant_manager
  ON public.manager_reviews (tenant_id, manager_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manager_reviews_period
  ON public.manager_reviews (period_end DESC);

ALTER TABLE public.manager_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manager_reviews_tenant_select" ON public.manager_reviews;
CREATE POLICY "manager_reviews_tenant_select" ON public.manager_reviews
  FOR SELECT USING (tenant_id = my_tenant_id());

DROP POLICY IF EXISTS "manager_reviews_service_role_all" ON public.manager_reviews;
CREATE POLICY "manager_reviews_service_role_all" ON public.manager_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.manager_reviews IS
  'K-8: ملخّص يومي يولّده كل مدير AI من نشاط فريقه. يساعد CEO على الفهم السريع';

CREATE OR REPLACE FUNCTION public.latest_manager_reviews()
RETURNS TABLE (
  manager_id uuid,
  manager_code text,
  manager_name text,
  review_id uuid,
  summary text,
  highlights jsonb,
  concerns jsonb,
  metrics jsonb,
  suggestions_count int,
  period_end timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT DISTINCT ON (m.id)
    m.id, m.code, m.name,
    r.id, r.summary, r.highlights, r.concerns, r.metrics,
    r.suggestions_count, r.period_end, r.created_at
  FROM public.ai_managers m
  LEFT JOIN public.manager_reviews r
    ON r.manager_id = m.id AND r.tenant_id = my_tenant_id()
  ORDER BY m.id, r.created_at DESC NULLS LAST;
$$;
