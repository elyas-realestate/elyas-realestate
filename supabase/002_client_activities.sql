-- ══════════════════════════════════════════════════════════════
-- وسيط برو — سجل نشاطات العملاء (CRM Timeline)
-- شغّل هذا الملف في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.client_activities (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_id   UUID        REFERENCES public.tenants(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL DEFAULT 'ملاحظة'
                          CHECK (type IN ('واتساب','مكالمة','زيارة','عرض','ملاحظة')),
  note        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS client_activities_client_idx ON public.client_activities(client_id);
CREATE INDEX IF NOT EXISTS client_activities_tenant_idx ON public.client_activities(tenant_id);
CREATE INDEX IF NOT EXISTS client_activities_date_idx   ON public.client_activities(created_at DESC);

-- RLS
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_tenant_rw"
  ON public.client_activities FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- Trigger — tenant_id تلقائي
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.client_activities;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON public.client_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
