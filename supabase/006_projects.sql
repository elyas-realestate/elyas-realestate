-- ══════════════════════════════════════════════════════════════
-- وسيط برو — المشاريع العقارية والوحدات
-- شغّل هذا الملف في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ─── جدول المشاريع ────────────────────────────────────────────
DROP TABLE IF EXISTS public.project_units   CASCADE;
DROP TABLE IF EXISTS public.projects        CASCADE;

CREATE TABLE public.projects (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  city         TEXT,
  district     TEXT,
  location_url TEXT,
  main_image   TEXT,
  images       TEXT[]      DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'قيد التطوير'
                           CHECK (status IN ('قيد التطوير','جاهز للتسليم','مكتمل','موقوف')),
  delivery_date DATE,
  developer    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── جدول الوحدات ─────────────────────────────────────────────
CREATE TABLE public.project_units (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tenant_id    UUID        REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_number  TEXT        NOT NULL,
  unit_type    TEXT        DEFAULT 'شقة'
                           CHECK (unit_type IN ('شقة','فيلا','استوديو','دوبلكس','محل','مكتب','مستودع','أخرى')),
  floor        INT,
  area         NUMERIC(10,2),
  price        NUMERIC(14,2),
  rooms        INT,
  bathrooms    INT,
  status       TEXT        NOT NULL DEFAULT 'متاح'
                           CHECK (status IN ('متاح','محجوز','مُباع')),
  client_name  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS projects_tenant_idx      ON public.projects(tenant_id);
CREATE INDEX IF NOT EXISTS proj_units_project_idx   ON public.project_units(project_id);
CREATE INDEX IF NOT EXISTS proj_units_tenant_idx    ON public.project_units(tenant_id);
CREATE INDEX IF NOT EXISTS proj_units_status_idx    ON public.project_units(status);

-- RLS — projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_tenant_rw" ON public.projects;
CREATE POLICY "projects_tenant_rw"
  ON public.projects FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- RLS — project_units
ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proj_units_tenant_rw" ON public.project_units;
CREATE POLICY "proj_units_tenant_rw"
  ON public.project_units FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- Triggers
DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.projects;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.project_units;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON public.project_units
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
