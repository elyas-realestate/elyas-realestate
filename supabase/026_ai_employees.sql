-- ══════════════════════════════════════════════════════════════
-- 026: الموظفون الذكيون (AI Employees)
--   1. موظف الاستقبال  — WhatsApp Auto-Reply  → ai_conversations
--   2. موظف التسويق    — Cron يومي 10ص        → marketing_queue
--   3. موظف المتابعة   — Cron يومي 6م          → followup_queue
--   4. محلل البيانات   — Cron أسبوعي أحد 9ص   → weekly_insights
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. إعدادات الموظفين — صف واحد لكل مستأجر
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_employee_settings (
  tenant_id            uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- تفعيل/تعطيل كل موظف
  receiver_enabled     boolean NOT NULL DEFAULT false,
  marketer_enabled     boolean NOT NULL DEFAULT true,
  followup_enabled     boolean NOT NULL DEFAULT true,
  analyst_enabled      boolean NOT NULL DEFAULT true,

  -- إعدادات مخصَّصة
  voice_style          text    DEFAULT 'professional',  -- professional | friendly | formal
  language             text    DEFAULT 'ar',            -- ar | en
  ai_provider          text    DEFAULT 'openai',        -- openai | anthropic | google | groq | deepseek | xai
  ai_model             text    DEFAULT 'gpt-4o-mini',

  -- إعدادات موظف المتابعة
  followup_cold_days   int     DEFAULT 14,              -- عدد أيام السكوت قبل التصنيف كـ "مبرود"

  -- إعدادات محلل البيانات
  analyst_report_email text,                            -- بريد استلام التقرير الأسبوعي (fallback: بريد المالك)

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_employee_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_employee_settings_tenant ON public.ai_employee_settings;
CREATE POLICY ai_employee_settings_tenant ON public.ai_employee_settings
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 2. سجل محادثات WhatsApp (موظف الاستقبال)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- المحادثة
  channel         text    NOT NULL DEFAULT 'whatsapp',  -- whatsapp | telegram | web
  contact_phone   text,
  contact_name    text,

  -- الرسائل
  direction       text    NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_body    text    NOT NULL,
  intent          text,                                 -- greeting | property_search | price_inquiry | other
  matched_property_ids uuid[],                          -- العقارات المطابقة المُرسلة للعميل

  -- ربط بعميل موجود إن وُجد
  client_id       uuid REFERENCES public.clients(id) ON DELETE SET NULL,

  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_conversations_tenant_idx  ON public.ai_conversations(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_conversations_phone_idx   ON public.ai_conversations(tenant_id, contact_phone);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_conversations_tenant ON public.ai_conversations;
CREATE POLICY ai_conversations_tenant ON public.ai_conversations
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 3. قائمة انتظار التسويق (موظف التسويق)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_queue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id    uuid REFERENCES public.properties(id) ON DELETE SET NULL,

  -- المنصّة والمحتوى
  channel        text NOT NULL CHECK (channel IN ('twitter','instagram','whatsapp','facebook','linkedin')),
  content        text NOT NULL,
  hashtags       text[],

  -- حالة
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','published')),
  published_at   timestamptz,
  published_url  text,
  rejection_reason text,

  -- المصدر
  generated_by_model text,
  generated_at   timestamptz NOT NULL DEFAULT now(),
  approved_at    timestamptz,
  approved_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_queue_tenant_idx  ON public.marketing_queue(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketing_queue_status_idx  ON public.marketing_queue(tenant_id, status);
CREATE INDEX IF NOT EXISTS marketing_queue_property_idx ON public.marketing_queue(property_id);

ALTER TABLE public.marketing_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketing_queue_tenant ON public.marketing_queue;
CREATE POLICY marketing_queue_tenant ON public.marketing_queue
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 4. قائمة انتظار المتابعة (موظف المتابعة)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.followup_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id     uuid REFERENCES public.clients(id) ON DELETE CASCADE,

  -- المحتوى المُقترح
  channel       text NOT NULL DEFAULT 'whatsapp',
  message       text NOT NULL,
  reason        text,                                  -- "عميل بارد منذ 14 يومًا" — سبب التوليد

  -- الحالة
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','sent','skipped','expired')),
  sent_at       timestamptz,
  sent_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  generated_by_model text,
  generated_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS followup_queue_tenant_idx  ON public.followup_queue(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS followup_queue_status_idx  ON public.followup_queue(tenant_id, status);
CREATE INDEX IF NOT EXISTS followup_queue_client_idx  ON public.followup_queue(client_id);

ALTER TABLE public.followup_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS followup_queue_tenant ON public.followup_queue;
CREATE POLICY followup_queue_tenant ON public.followup_queue
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 5. التقارير الأسبوعية (محلل البيانات)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_insights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- النطاق الزمني
  period_start  timestamptz NOT NULL,
  period_end    timestamptz NOT NULL,

  -- البيانات التحليلية الخام (JSON)
  raw_metrics   jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- الملخص والتوصيات (نصوص مولَّدة)
  summary_text  text,
  recommendations text,

  -- الإرسال
  email_sent_at timestamptz,
  email_to      text,

  generated_by_model text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_insights_tenant_idx  ON public.weekly_insights(tenant_id, created_at DESC);

ALTER TABLE public.weekly_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS weekly_insights_tenant ON public.weekly_insights;
CREATE POLICY weekly_insights_tenant ON public.weekly_insights
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 6. دالة مساعدة — إنشاء إعدادات افتراضية عند أول طلب
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_ai_employee_settings()
RETURNS public.ai_employee_settings
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  result public.ai_employee_settings;
BEGIN
  tid := public.my_tenant_id();
  IF tid IS NULL THEN
    RAISE EXCEPTION 'no tenant for current user';
  END IF;

  INSERT INTO public.ai_employee_settings (tenant_id)
  VALUES (tid)
  ON CONFLICT (tenant_id) DO NOTHING;

  SELECT * INTO result FROM public.ai_employee_settings WHERE tenant_id = tid;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_ai_employee_settings() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 7. تحديث updated_at تلقائيًا
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ai_employee_settings_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_employee_settings_touch_trg ON public.ai_employee_settings;
CREATE TRIGGER ai_employee_settings_touch_trg
  BEFORE UPDATE ON public.ai_employee_settings
  FOR EACH ROW EXECUTE FUNCTION public.ai_employee_settings_touch();
