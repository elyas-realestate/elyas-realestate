-- ══════════════════════════════════════════════════════════════
-- 024: تتبّع نشر العقارات على المنصّات الخارجية
-- Aqar, Bayut, SRETT, Twitter, WhatsApp, Instagram, Facebook
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.portal_listings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id    uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  portal         text NOT NULL,
  status         text DEFAULT 'draft'
                 CHECK (status IN ('draft','published','expired','removed')),
  external_url   text,
  external_id    text,
  published_at   timestamptz,
  expires_at     timestamptz,
  notes          text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (property_id, portal)
);

CREATE INDEX IF NOT EXISTS portal_listings_tenant_idx
  ON public.portal_listings(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS portal_listings_property_idx
  ON public.portal_listings(property_id);
CREATE INDEX IF NOT EXISTS portal_listings_status_idx
  ON public.portal_listings(tenant_id, status);

ALTER TABLE public.portal_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS portal_listings_tenant ON public.portal_listings;
CREATE POLICY portal_listings_tenant ON public.portal_listings
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

CREATE OR REPLACE FUNCTION public.update_portal_listing_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status <> 'published')
     AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS portal_listings_ts ON public.portal_listings;
CREATE TRIGGER portal_listings_ts
  BEFORE INSERT OR UPDATE ON public.portal_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_portal_listing_timestamps();

CREATE OR REPLACE VIEW public.property_distribution_summary AS
SELECT
  p.id AS property_id,
  p.tenant_id,
  p.title,
  COUNT(pl.id) FILTER (WHERE pl.status = 'published')::int AS published_count,
  COUNT(pl.id) FILTER (WHERE pl.status = 'draft')::int     AS draft_count,
  COUNT(pl.id) FILTER (WHERE pl.status = 'expired')::int   AS expired_count,
  ARRAY_AGG(DISTINCT pl.portal) FILTER (WHERE pl.status = 'published') AS active_portals
FROM public.properties p
LEFT JOIN public.portal_listings pl ON pl.property_id = p.id
GROUP BY p.id;

GRANT SELECT ON public.property_distribution_summary TO authenticated;
