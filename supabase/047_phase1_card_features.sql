-- ══════════════════════════════════════════════════════════════
-- 047: Phase 1 — Profile Card Rebuild
--   1. lead_captures — نموذج جمع leads قبل عرض العقار/البطاقة (الميزة القاتلة)
--   2. property_visit_bookings — احجز معاينة بتقويم
--   3. property_views_log — analytics محدّدة لكل عقار (مشاهدات/clicks)
--   4. require_lead_capture على properties — تفعيل الـ gate
--   5. vcard_extra على broker_identity — بيانات vCard إضافية
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1) lead_captures — الميزة القاتلة
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- ما الذي يحاول الزائر مشاهدته؟
  context_type text NOT NULL CHECK (context_type IN ('property', 'card', 'pdf', 'video', 'phone')),
  context_id text,                              -- property_id لو property، slug لو card

  -- بيانات الزائر
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  intent text,                                  -- شراء / إيجار / استثمار / استفسار

  -- تتبّع
  ip_address text,
  user_agent text,
  referer text,
  utm_source text,
  utm_campaign text,

  -- التصنيف
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  temperature text DEFAULT 'warm' CHECK (temperature IN ('cold', 'warm', 'hot')),
  notes text,

  -- التحويل لعميل فعلي
  converted_to_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  converted_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_captures_tenant   ON public.lead_captures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_captures_context  ON public.lead_captures(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_lead_captures_status   ON public.lead_captures(status);
CREATE INDEX IF NOT EXISTS idx_lead_captures_created  ON public.lead_captures(created_at DESC);

ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_captures_owner_read" ON public.lead_captures;
CREATE POLICY "lead_captures_owner_read"
  ON public.lead_captures FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.tenant_members tm
               WHERE tm.tenant_id = lead_captures.tenant_id AND tm.user_id = auth.uid() AND tm.status='active')
  );

DROP POLICY IF EXISTS "lead_captures_owner_update" ON public.lead_captures;
CREATE POLICY "lead_captures_owner_update"
  ON public.lead_captures FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- إدراج علني (الزائر يقدر يقدّم — لكن service_role هو من يدخل فعلياً)
DROP POLICY IF EXISTS "lead_captures_public_insert" ON public.lead_captures;
CREATE POLICY "lead_captures_public_insert"
  ON public.lead_captures FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 2) property_visit_bookings — حجز معاينة
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_visit_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  lead_capture_id uuid REFERENCES public.lead_captures(id) ON DELETE SET NULL,

  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  visitor_email text,

  preferred_date date NOT NULL,
  preferred_time time,
  flexible boolean DEFAULT false,                  -- "أي وقت في اليوم"

  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rescheduled','completed','cancelled','no_show')),
  agent_notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_bookings_tenant   ON public.property_visit_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visit_bookings_property ON public.property_visit_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_visit_bookings_date     ON public.property_visit_bookings(preferred_date);

ALTER TABLE public.property_visit_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visit_bookings_owner" ON public.property_visit_bookings;
CREATE POLICY "visit_bookings_owner"
  ON public.property_visit_bookings FOR ALL
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "visit_bookings_public_insert" ON public.property_visit_bookings;
CREATE POLICY "visit_bookings_public_insert"
  ON public.property_visit_bookings FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3) property_views_log — analytics لكل عقار
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_views_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,

  -- التتبّع
  visitor_id text,                                -- session/cookie للتمييز بين الزوار
  ip_hash text,                                    -- IP مُهَشَّر لحماية الخصوصية
  user_agent text,
  referer text,
  utm_source text,
  utm_campaign text,
  device_type text CHECK (device_type IN ('mobile','tablet','desktop','unknown')),
  country text,
  city text,

  -- نوع الحدث
  event_type text NOT NULL DEFAULT 'view' CHECK (event_type IN ('view','phone_click','whatsapp_click','email_click','book_visit','share','save')),

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_views_log_tenant     ON public.property_views_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_views_log_property   ON public.property_views_log(property_id);
CREATE INDEX IF NOT EXISTS idx_views_log_event      ON public.property_views_log(event_type);
CREATE INDEX IF NOT EXISTS idx_views_log_created    ON public.property_views_log(created_at DESC);

ALTER TABLE public.property_views_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "views_log_owner_read" ON public.property_views_log;
CREATE POLICY "views_log_owner_read"
  ON public.property_views_log FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "views_log_public_insert" ON public.property_views_log;
CREATE POLICY "views_log_public_insert"
  ON public.property_views_log FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 4) Properties: تفعيل lead capture gate
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS require_lead_capture boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_capture_message text,
  ADD COLUMN IF NOT EXISTS allow_visit_booking boolean DEFAULT true;

-- ─────────────────────────────────────────────────────────────
-- 5) broker_identity: بيانات vCard إضافية
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.broker_identity
  ADD COLUMN IF NOT EXISTS vcard_org text,                 -- اسم المنشأة على الـ vCard
  ADD COLUMN IF NOT EXISTS vcard_title text,                -- المسمى الوظيفي
  ADD COLUMN IF NOT EXISTS vcard_address text,              -- العنوان الكامل
  ADD COLUMN IF NOT EXISTS vcard_website text;              -- الموقع

-- ─────────────────────────────────────────────────────────────
-- 6) Triggers لتحديث updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_phase1_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_captures_touch ON public.lead_captures;
CREATE TRIGGER trg_lead_captures_touch
  BEFORE UPDATE ON public.lead_captures
  FOR EACH ROW EXECUTE FUNCTION public.touch_phase1_updated_at();

DROP TRIGGER IF EXISTS trg_visit_bookings_touch ON public.property_visit_bookings;
CREATE TRIGGER trg_visit_bookings_touch
  BEFORE UPDATE ON public.property_visit_bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_phase1_updated_at();

COMMENT ON TABLE public.lead_captures IS 'Lead Capture Gate — جمع بيانات الزائر قبل عرض العقار/البطاقة';
COMMENT ON TABLE public.property_visit_bookings IS 'حجز معاينة — تقويم زيارات العقارات';
COMMENT ON TABLE public.property_views_log IS 'Analytics مفصّلة لكل عقار — مشاهدات/clicks/source';
