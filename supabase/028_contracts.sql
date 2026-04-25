-- ══════════════════════════════════════════════════════════════
-- 028: نظام العقود الإلكترونية (E-Contracts)
--   ملاحظة: استخدمنا بادئة `e_` لتجنّب التعارض مع جدول `contracts`
--   القديم المستخدم في tenant-portal وreminders (تتبع عقود الإيجار).
--
--   e_contract_templates: قوالب جاهزة (إيجار سكني/تجاري، بيع، حصر)
--   e_contracts:          العقد الفعلي (HTML + متغيرات + حالة + توقيع)
--   e_contract_signatures: توقيعات الأطراف (canvas → base64)
--   e_contract_audit:      سجل تغييرات العقد
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. قوالب العقود
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.e_contract_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  code            text UNIQUE,
  title           text NOT NULL,
  category        text NOT NULL,
  body_html       text NOT NULL,
  variables       jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active       boolean NOT NULL DEFAULT true,
  is_system       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS e_contract_templates_tenant_idx ON public.e_contract_templates(tenant_id, category);

ALTER TABLE public.e_contract_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS e_contract_templates_read ON public.e_contract_templates;
CREATE POLICY e_contract_templates_read ON public.e_contract_templates
  FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS e_contract_templates_write ON public.e_contract_templates;
CREATE POLICY e_contract_templates_write ON public.e_contract_templates
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id() AND NOT is_system)
  WITH CHECK (tenant_id = public.my_tenant_id() AND NOT is_system);


-- ─────────────────────────────────────────────────────────────
-- 2. العقود
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.e_contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id     uuid REFERENCES public.e_contract_templates(id) ON DELETE SET NULL,
  contract_number text,
  title           text NOT NULL,
  category        text NOT NULL,
  party_first     jsonb NOT NULL DEFAULT '{}'::jsonb,
  party_second    jsonb NOT NULL DEFAULT '{}'::jsonb,
  party_witness   jsonb,
  property_id     uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  client_id       uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  deal_id         uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  body_html       text NOT NULL,
  variables_used  jsonb DEFAULT '{}'::jsonb,
  amount          numeric,
  currency        text DEFAULT 'SAR',
  start_date      date,
  end_date        date,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent_for_signature','partially_signed','signed','expired','void')),
  signing_token   text UNIQUE,
  signing_expires_at timestamptz,
  final_hash      text,
  finalized_at    timestamptz,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS e_contracts_tenant_idx        ON public.e_contracts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS e_contracts_status_idx        ON public.e_contracts(tenant_id, status);
CREATE INDEX IF NOT EXISTS e_contracts_signing_token_idx ON public.e_contracts(signing_token);
CREATE INDEX IF NOT EXISTS e_contracts_property_idx      ON public.e_contracts(property_id);
CREATE INDEX IF NOT EXISTS e_contracts_client_idx        ON public.e_contracts(client_id);

ALTER TABLE public.e_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS e_contracts_tenant ON public.e_contracts;
CREATE POLICY e_contracts_tenant ON public.e_contracts
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS e_contracts_public_by_token ON public.e_contracts;
CREATE POLICY e_contracts_public_by_token ON public.e_contracts
  FOR SELECT TO anon, authenticated
  USING (
    signing_token IS NOT NULL
    AND signing_expires_at > now()
    AND status IN ('sent_for_signature','partially_signed')
  );


-- ─────────────────────────────────────────────────────────────
-- 3. التوقيعات
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.e_contract_signatures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   uuid NOT NULL REFERENCES public.e_contracts(id) ON DELETE CASCADE,
  party         text NOT NULL CHECK (party IN ('first','second','witness')),
  signer_name   text NOT NULL,
  signer_id_number text,
  signer_phone  text,
  signature_data text NOT NULL,
  ip_address    text,
  user_agent    text,
  signed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, party)
);
CREATE INDEX IF NOT EXISTS e_contract_signatures_contract_idx ON public.e_contract_signatures(contract_id);

ALTER TABLE public.e_contract_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS e_contract_signatures_tenant_read ON public.e_contract_signatures;
CREATE POLICY e_contract_signatures_tenant_read ON public.e_contract_signatures
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.e_contracts c
    WHERE c.id = e_contract_signatures.contract_id
      AND c.tenant_id = public.my_tenant_id()
  ));

DROP POLICY IF EXISTS e_contract_signatures_public_insert ON public.e_contract_signatures;
CREATE POLICY e_contract_signatures_public_insert ON public.e_contract_signatures
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.e_contracts c
    WHERE c.id = e_contract_signatures.contract_id
      AND c.signing_token IS NOT NULL
      AND c.signing_expires_at > now()
      AND c.status IN ('sent_for_signature','partially_signed')
  ));


-- ─────────────────────────────────────────────────────────────
-- 4. سجل التدقيق
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.e_contract_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   uuid NOT NULL REFERENCES public.e_contracts(id) ON DELETE CASCADE,
  action        text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label   text,
  details       jsonb DEFAULT '{}'::jsonb,
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS e_contract_audit_contract_idx ON public.e_contract_audit(contract_id, created_at DESC);

ALTER TABLE public.e_contract_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS e_contract_audit_tenant_read ON public.e_contract_audit;
CREATE POLICY e_contract_audit_tenant_read ON public.e_contract_audit
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.e_contracts c
    WHERE c.id = e_contract_audit.contract_id
      AND c.tenant_id = public.my_tenant_id()
  ));


-- ─────────────────────────────────────────────────────────────
-- 5. عدّاد رقم العقد لكل مستأجر
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.next_e_contract_number(tid uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_seq int;
  yr int := extract(year from now())::int;
BEGIN
  SELECT COALESCE(MAX(
    CASE
      WHEN contract_number ~ ('^EC-' || yr || '-[0-9]+$')
      THEN substring(contract_number FROM length('EC-' || yr || '-') + 1)::int
      ELSE 0
    END
  ), 0) + 1 INTO next_seq
  FROM public.e_contracts
  WHERE tenant_id = tid;
  RETURN format('EC-%s-%s', yr, lpad(next_seq::text, 4, '0'));
END;
$$;
GRANT EXECUTE ON FUNCTION public.next_e_contract_number(uuid) TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 6. triggers
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.e_contracts_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS e_contracts_touch_trg ON public.e_contracts;
CREATE TRIGGER e_contracts_touch_trg
  BEFORE UPDATE ON public.e_contracts
  FOR EACH ROW EXECUTE FUNCTION public.e_contracts_touch();

DROP TRIGGER IF EXISTS e_contract_templates_touch_trg ON public.e_contract_templates;
CREATE TRIGGER e_contract_templates_touch_trg
  BEFORE UPDATE ON public.e_contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.e_contracts_touch();


CREATE OR REPLACE FUNCTION public.e_contracts_update_status_on_signature()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parties_signed int;
BEGIN
  SELECT count(*) INTO parties_signed
    FROM public.e_contract_signatures
    WHERE contract_id = NEW.contract_id AND party IN ('first','second');
  IF parties_signed >= 2 THEN
    UPDATE public.e_contracts SET status = 'signed', updated_at = now()
     WHERE id = NEW.contract_id AND status <> 'signed';
  ELSIF parties_signed = 1 THEN
    UPDATE public.e_contracts SET status = 'partially_signed', updated_at = now()
     WHERE id = NEW.contract_id AND status = 'sent_for_signature';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS e_contracts_status_on_signature ON public.e_contract_signatures;
CREATE TRIGGER e_contracts_status_on_signature
  AFTER INSERT ON public.e_contract_signatures
  FOR EACH ROW EXECUTE FUNCTION public.e_contracts_update_status_on_signature();


-- ─────────────────────────────────────────────────────────────
-- 7. Seed: 4 قوالب نظام افتراضية (إيجار سكني/تجاري، بيع، حصر)
-- ─────────────────────────────────────────────────────────────
-- ملاحظة: الـ seeds مُطبَّقة فعلياً عبر migration 028_e_contracts_seed_templates.
-- محفوظة هنا للمرجع وللتطبيق على بيئة جديدة.
-- (يمكن العثور على نص قوالب النظام في 028_e_contracts_seed_templates migration على Supabase)
