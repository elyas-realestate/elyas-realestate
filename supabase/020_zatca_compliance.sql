-- ══════════════════════════════════════════════════════════════
-- 020: ZATCA (فاتورة) Phase 1 & Phase 2 Foundation
-- امتثال ضريبة القيمة المضافة السعودية
-- ══════════════════════════════════════════════════════════════

-- ── 1. حقول ZATCA في هوية الوسيط ───────────────────────────
ALTER TABLE public.broker_identity
  ADD COLUMN IF NOT EXISTS vat_number           text,   -- الرقم الضريبي (15 رقم)
  ADD COLUMN IF NOT EXISTS commercial_street    text,   -- عنوان الفوترة
  ADD COLUMN IF NOT EXISTS commercial_district  text,
  ADD COLUMN IF NOT EXISTS commercial_city      text,
  ADD COLUMN IF NOT EXISTS commercial_postal    text,
  ADD COLUMN IF NOT EXISTS commercial_building  text,
  ADD COLUMN IF NOT EXISTS zatca_enabled        boolean DEFAULT false;

-- فحص صحّة الرقم الضريبي (15 رقم يبدأ بـ 3 وينتهي بـ 3)
-- مثال: 310123456700003
CREATE OR REPLACE FUNCTION public.is_valid_saudi_vat(v text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT v ~ '^3[0-9]{13}3$';
$$;

-- ── 2. حقول ZATCA في الفواتير ──────────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_type     text DEFAULT 'standard',  -- standard | simplified
  ADD COLUMN IF NOT EXISTS invoice_counter  bigint,                   -- تسلسل رقمي متواصل (ICV)
  ADD COLUMN IF NOT EXISTS invoice_hash     text,                     -- SHA-256 base64
  ADD COLUMN IF NOT EXISTS previous_hash    text,                     -- hash الفاتورة السابقة (سلسلة)
  ADD COLUMN IF NOT EXISTS qr_code          text,                     -- TLV base64
  ADD COLUMN IF NOT EXISTS xml_uuid         uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS xml_submitted    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS zatca_response   jsonb;                    -- رد ZATCA عند الإرسال

-- دالة للحصول على التسلسل التالي للفاتورة (لكل tenant)
CREATE OR REPLACE FUNCTION public.next_invoice_counter(t_id uuid)
RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(MAX(invoice_counter), 0) + 1
  FROM public.invoices
  WHERE tenant_id = t_id;
$$;

-- Trigger: تعبئة invoice_counter تلقائياً عند الإنشاء
CREATE OR REPLACE FUNCTION public.set_invoice_counter()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_counter IS NULL THEN
    NEW.invoice_counter := public.next_invoice_counter(NEW.tenant_id);
  END IF;
  -- رقم الفاتورة الافتراضي إذا ما تم تحديده
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' ||
                          lpad(NEW.invoice_counter::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoice_counter_trigger ON public.invoices;
CREATE TRIGGER invoice_counter_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invoice_counter();

-- ── 3. فهرس للبحث بالتسلسل ──
CREATE INDEX IF NOT EXISTS invoices_counter_idx
  ON public.invoices(tenant_id, invoice_counter);

-- ── 4. سجل تسليم ZATCA (audit trail) ──
CREATE TABLE IF NOT EXISTS public.zatca_submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id     uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  submitted_at   timestamptz DEFAULT now(),
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','rejected','cleared','reported')),
  xml_payload    text,
  response_body  jsonb,
  error_message  text
);

CREATE INDEX IF NOT EXISTS zatca_submissions_tenant_idx
  ON public.zatca_submissions(tenant_id, submitted_at DESC);

ALTER TABLE public.zatca_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS zatca_submissions_tenant ON public.zatca_submissions;
CREATE POLICY zatca_submissions_tenant ON public.zatca_submissions
  FOR ALL
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());
