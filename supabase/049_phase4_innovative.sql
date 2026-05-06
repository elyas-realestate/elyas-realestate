-- ══════════════════════════════════════════════════════════════
-- 049: Phase 4 — Innovative AI Features Foundation
--   1. property_voice_intakes — AI Voice-to-Property
--   2. virtual_staging_jobs — Virtual Staging AI
--   3. client_property_alerts — Smart Property Matching
--   4. whatsapp_catalog_sync_log — WhatsApp Catalog
--   5. neighborhood_intel — Neighborhood Intel cards
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1) Voice-to-Property: تخزين عمليات تحويل الصوت لعقار
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_voice_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  audio_url text,                                 -- مسار الصوت في storage
  transcript text,                                -- النص الناتج من Whisper
  extracted_fields jsonb,                         -- الحقول المستخرجة من GPT
  confidence_score numeric(3,2),                  -- 0.00 - 1.00

  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL, -- العقار اللي أُنشئ من هذا الصوت

  status text DEFAULT 'pending' CHECK (status IN ('pending','transcribing','extracting','review','completed','failed')),
  error text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_intakes_tenant ON public.property_voice_intakes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voice_intakes_status ON public.property_voice_intakes(status);

ALTER TABLE public.property_voice_intakes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "voice_intakes_owner" ON public.property_voice_intakes;
CREATE POLICY "voice_intakes_owner"
  ON public.property_voice_intakes FOR ALL
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 2) Virtual Staging: تخزين عمليات تأثيث AI للصور
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.virtual_staging_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,

  source_image_url text NOT NULL,
  result_image_url text,
  style text,                                     -- "modern", "classic", "luxury", "minimal"
  room_type text,                                 -- "living", "bedroom", "kitchen", etc.

  provider text DEFAULT 'placeholder',            -- "stable-diffusion", "dalle", إلخ
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  cost_estimate numeric(10,2),
  error text,

  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_staging_tenant   ON public.virtual_staging_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staging_property ON public.virtual_staging_jobs(property_id);

ALTER TABLE public.virtual_staging_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staging_owner" ON public.virtual_staging_jobs;
CREATE POLICY "staging_owner"
  ON public.virtual_staging_jobs FOR ALL
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 3) Smart Matching: تنبيهات تطابق العقارات
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_property_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,

  -- معايير البحث
  city text,
  district text,
  main_category text,                            -- سكني / تجاري / أرض
  sub_category text,
  offer_type text,                                -- بيع / إيجار
  min_price numeric,
  max_price numeric,
  min_rooms int,
  min_area numeric,

  -- التنبيه
  is_active boolean DEFAULT true,
  notify_via text[] DEFAULT ARRAY['whatsapp', 'in_app']::text[],
  last_matched_at timestamptz,
  matches_sent_count int DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON public.client_property_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_client ON public.client_property_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.client_property_alerts(is_active);

ALTER TABLE public.client_property_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alerts_owner" ON public.client_property_alerts;
CREATE POLICY "alerts_owner"
  ON public.client_property_alerts FOR ALL
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- جدول matches الفعلية (لمنع تكرار الإرسال)
CREATE TABLE IF NOT EXISTS public.property_alert_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.client_property_alerts(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  notified_at timestamptz,
  match_score numeric(3,2),                       -- 0.00 - 1.00
  created_at timestamptz DEFAULT now(),
  UNIQUE (alert_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_alert ON public.property_alert_matches(alert_id);

ALTER TABLE public.property_alert_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "matches_via_alert" ON public.property_alert_matches;
CREATE POLICY "matches_via_alert"
  ON public.property_alert_matches FOR SELECT
  USING (
    alert_id IN (
      SELECT id FROM public.client_property_alerts
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 4) WhatsApp Catalog Sync: سجل المزامنة
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_catalog_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,

  meta_product_id text,                           -- المعرف في Meta Catalog
  action text NOT NULL CHECK (action IN ('create','update','delete','sync_check')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),

  payload jsonb,
  response jsonb,
  error text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_sync_tenant   ON public.whatsapp_catalog_sync_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_catalog_sync_property ON public.whatsapp_catalog_sync_log(property_id);

ALTER TABLE public.whatsapp_catalog_sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "catalog_sync_owner" ON public.whatsapp_catalog_sync_log;
CREATE POLICY "catalog_sync_owner"
  ON public.whatsapp_catalog_sync_log FOR ALL
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 5) Neighborhood Intel: معلومات الحي لكل عقار
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.neighborhood_intel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  district text NOT NULL,

  -- البيانات (تُولَّد بالـ AI ثم تُكاش)
  description_ar text,                            -- وصف عام للحي
  description_en text,
  highlights jsonb DEFAULT '[]'::jsonb,           -- ["قريب من المسجد", "مدارس متميزة", ...]
  amenities jsonb DEFAULT '[]'::jsonb,            -- [{ "type": "school", "name": "...", "distance_km": 0.5 }]
  schools_count int,
  mosques_count int,
  hospitals_count int,
  restaurants_count int,

  -- التحديث
  ai_generated boolean DEFAULT true,
  last_updated_at timestamptz DEFAULT now(),

  -- التفرّد
  UNIQUE (city, district)
);

CREATE INDEX IF NOT EXISTS idx_neighborhood_city_district ON public.neighborhood_intel(city, district);

-- قابل للقراءة العامة (المعلومات عن الأحياء عامة)
ALTER TABLE public.neighborhood_intel ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "neighborhood_public_read" ON public.neighborhood_intel;
CREATE POLICY "neighborhood_public_read"
  ON public.neighborhood_intel FOR SELECT
  USING (true);

-- Triggers
DROP TRIGGER IF EXISTS trg_voice_intakes_touch ON public.property_voice_intakes;
CREATE TRIGGER trg_voice_intakes_touch
  BEFORE UPDATE ON public.property_voice_intakes
  FOR EACH ROW EXECUTE FUNCTION public.touch_phase1_updated_at();

DROP TRIGGER IF EXISTS trg_alerts_touch ON public.client_property_alerts;
CREATE TRIGGER trg_alerts_touch
  BEFORE UPDATE ON public.client_property_alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_phase1_updated_at();

COMMENT ON TABLE public.property_voice_intakes IS 'AI Voice-to-Property — الوسيط يتكلم، AI يستخرج بيانات العقار';
COMMENT ON TABLE public.virtual_staging_jobs IS 'Virtual Staging AI — تأثير غرف فارغة بالـ AI';
COMMENT ON TABLE public.client_property_alerts IS 'Smart Matching — تنبيه عند ظهور عقار يطابق طلب عميل';
COMMENT ON TABLE public.whatsapp_catalog_sync_log IS 'WhatsApp Catalog Sync — مزامنة العقارات مع كتالوج WhatsApp';
COMMENT ON TABLE public.neighborhood_intel IS 'معلومات الأحياء (مدارس/مساجد/خدمات) — مولّدة بالـ AI ومُكاشة';
