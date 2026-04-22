-- ══════════════════════════════════════════════════════════════
-- 022: نظام أوامر العمل (Work Orders) — لإدارة المرافق
-- يفتح سوق Facility Management للمنصة
-- ══════════════════════════════════════════════════════════════

-- ── 1. جدول الأصول (Asset Register) ──
CREATE TABLE IF NOT EXISTS public.assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id  uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  name         text NOT NULL,
  category     text,   -- HVAC | Electrical | Plumbing | Elevator | Generator | Fire | Other
  serial_no    text,
  brand        text,
  model        text,
  install_date date,
  warranty_end date,
  status       text DEFAULT 'operational'
               CHECK (status IN ('operational','needs_maintenance','out_of_service','retired')),
  location     text,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assets_tenant_idx    ON public.assets(tenant_id);
CREATE INDEX IF NOT EXISTS assets_property_idx  ON public.assets(property_id);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assets_tenant ON public.assets;
CREATE POLICY assets_tenant ON public.assets
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ── 2. جدول فنيين الصيانة ──
CREATE TABLE IF NOT EXISTS public.technicians (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name        text NOT NULL,
  phone       text,
  email       text,
  specialty   text,   -- plumbing | electrical | hvac | general
  is_active   boolean DEFAULT true,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS technicians_tenant_idx ON public.technicians(tenant_id);

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS technicians_tenant ON public.technicians;
CREATE POLICY technicians_tenant ON public.technicians
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ── 3. جدول أوامر العمل ──
CREATE TABLE IF NOT EXISTS public.work_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ticket_number   text,                -- WO-2026-00001
  property_id     uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  asset_id        uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  technician_id   uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  reported_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name   text,                -- اسم مقدّم الطلب (مستأجر أو موظف)
  reporter_phone  text,

  title           text NOT NULL,
  description     text,
  category        text,                -- plumbing | electrical | hvac | cleaning | safety | other
  priority        text DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','urgent')),
  kind            text DEFAULT 'corrective'
                  CHECK (kind IN ('corrective','preventive','inspection')),

  status          text DEFAULT 'open'
                  CHECK (status IN ('open','assigned','in_progress','on_hold','completed','cancelled')),

  scheduled_for   timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz,
  estimated_cost  numeric,
  actual_cost     numeric,

  photos          text[],              -- روابط الصور قبل/بعد
  resolution      text,                -- ملخص ما تم عمله

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_orders_tenant_idx    ON public.work_orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS work_orders_status_idx    ON public.work_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS work_orders_property_idx  ON public.work_orders(property_id);
CREATE INDEX IF NOT EXISTS work_orders_tech_idx      ON public.work_orders(technician_id);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS work_orders_tenant ON public.work_orders;
CREATE POLICY work_orders_tenant ON public.work_orders
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ── 4. auto-number للـ tickets ──
CREATE OR REPLACE FUNCTION public.set_work_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_counter bigint;
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    SELECT COALESCE(MAX(CAST(regexp_replace(ticket_number, '.*-', '') AS bigint)), 0) + 1
    INTO v_counter
    FROM public.work_orders
    WHERE tenant_id = NEW.tenant_id
      AND ticket_number ~ ('^WO-' || extract(year from now())::text || '-[0-9]+$');

    NEW.ticket_number := 'WO-' || to_char(now(), 'YYYY') || '-' ||
                         lpad(v_counter::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS work_orders_number_trigger ON public.work_orders;
CREATE TRIGGER work_orders_number_trigger
  BEFORE INSERT ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_work_order_number();

-- ── 5. auto-update started_at/completed_at when status changes ──
CREATE OR REPLACE FUNCTION public.update_work_order_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- بدء الشغل
  IF NEW.status = 'in_progress' AND OLD.status <> 'in_progress' AND NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  -- إغلاق
  IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS work_orders_timestamps_trigger ON public.work_orders;
CREATE TRIGGER work_orders_timestamps_trigger
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_work_order_timestamps();

-- ── 6. جدول الصيانة الوقائية المجدولة ──
CREATE TABLE IF NOT EXISTS public.preventive_maintenance (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_id       uuid REFERENCES public.assets(id) ON DELETE CASCADE,
  property_id    uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  title          text NOT NULL,
  description    text,
  frequency_days int NOT NULL,         -- كل كم يوم
  last_done_at   timestamptz,
  next_due_at    timestamptz,
  assigned_tech  uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pm_tenant_idx ON public.preventive_maintenance(tenant_id);
CREATE INDEX IF NOT EXISTS pm_next_due_idx ON public.preventive_maintenance(next_due_at) WHERE is_active = true;

ALTER TABLE public.preventive_maintenance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pm_tenant ON public.preventive_maintenance;
CREATE POLICY pm_tenant ON public.preventive_maintenance
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());
