-- ══════════════════════════════════════════════════════════════
-- وسيط برو — الحملات التسويقية
-- شغّل هذا الملف في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- حذف الجدول القديم إن وُجد ثم إعادة إنشائه بشكل صحيح
DROP TABLE IF EXISTS public.campaigns CASCADE;

CREATE TABLE public.campaigns (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        REFERENCES public.tenants(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  property_id UUID        REFERENCES public.properties(id) ON DELETE SET NULL,
  platforms   TEXT[]      NOT NULL DEFAULT '{}',
  budget      NUMERIC(12,2),
  start_date  DATE,
  end_date    DATE,
  status      TEXT        NOT NULL DEFAULT 'مسودة'
                          CHECK (status IN ('مسودة','نشطة','منتهية','موقوفة')),
  leads_count INT         NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS campaigns_tenant_idx   ON public.campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx   ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_property_idx ON public.campaigns(property_id);

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_tenant_rw" ON public.campaigns;
CREATE POLICY "campaigns_tenant_rw"
  ON public.campaigns FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- Trigger — tenant_id تلقائي
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.campaigns;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
