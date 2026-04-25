-- ══════════════════════════════════════════════════════════════
-- 030: WhatsApp Business API (Meta Cloud API)
--   whatsapp_config:    إعدادات Meta لكل مستأجر (مفاتيح، توكن، ...)
--   whatsapp_templates: قوالب Meta المعتمدة
--   whatsapp_messages:  سجل كامل للمحادثات (incoming + outgoing)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  tenant_id            uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number_id      text,
  business_account_id  text,
  access_token_enc     text,
  webhook_verify_token text,
  display_phone        text,
  display_name         text,
  is_active            boolean NOT NULL DEFAULT false,
  auto_reply_enabled   boolean NOT NULL DEFAULT true,
  ai_provider          text DEFAULT 'openai',
  ai_model             text DEFAULT 'gpt-4o-mini',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_config_tenant ON public.whatsapp_config;
CREATE POLICY whatsapp_config_tenant ON public.whatsapp_config
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  meta_template_name text NOT NULL,
  display_name       text NOT NULL,
  category           text,
  language           text DEFAULT 'ar',
  body_text          text,
  variables          jsonb DEFAULT '[]'::jsonb,
  meta_status        text DEFAULT 'pending'
                     CHECK (meta_status IN ('pending','approved','rejected','paused')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, meta_template_name)
);
CREATE INDEX IF NOT EXISTS whatsapp_templates_tenant_idx ON public.whatsapp_templates(tenant_id);
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_templates_tenant ON public.whatsapp_templates;
CREATE POLICY whatsapp_templates_tenant ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_phone   text NOT NULL,
  contact_name    text,
  client_id       uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  direction       text NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type    text DEFAULT 'text'
                  CHECK (message_type IN ('text','image','document','template','location','audio','video','interactive')),
  body_text       text,
  media_url       text,
  template_name   text,
  meta_message_id text,
  status          text DEFAULT 'sent'
                  CHECK (status IN ('sent','delivered','read','failed','received')),
  failure_reason  text,
  ai_intent       text,
  ai_replied      boolean DEFAULT false,
  matched_property_ids uuid[],
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_messages_tenant_idx  ON public.whatsapp_messages(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_idx   ON public.whatsapp_messages(tenant_id, contact_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_messages_meta_id_idx ON public.whatsapp_messages(meta_message_id);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_messages_tenant ON public.whatsapp_messages;
CREATE POLICY whatsapp_messages_tenant ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

CREATE OR REPLACE FUNCTION public.tenant_by_whatsapp_phone_id(pn_id text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.whatsapp_config
  WHERE phone_number_id = pn_id AND is_active = true
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.tenant_by_whatsapp_phone_id(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.whatsapp_config_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS whatsapp_config_touch_trg ON public.whatsapp_config;
CREATE TRIGGER whatsapp_config_touch_trg
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.whatsapp_config_touch();

DROP TRIGGER IF EXISTS whatsapp_templates_touch_trg ON public.whatsapp_templates;
CREATE TRIGGER whatsapp_templates_touch_trg
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.whatsapp_config_touch();
