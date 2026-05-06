-- ══════════════════════════════════════════════════════════════
-- 043: subscription_invoices — فواتير اشتراكات SaaS
--
-- منفصلة عن جدول `invoices` (الذي يخص فواتير الوسيط لعملائه).
-- متوافقة مع ZATCA Phase 2 (UBL 2.1 + simplified tax invoice).
-- تُنشأ تلقائياً من Moyasar webhook عند نجاح الدفع.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- ── ZATCA fields ──
  invoice_number text NOT NULL,
  invoice_counter int NOT NULL,
  invoice_type text NOT NULL DEFAULT 'simplified', -- simplified | standard
  xml_uuid uuid DEFAULT gen_random_uuid(),
  invoice_hash text,
  qr_code text, -- TLV base64 QR لـ ZATCA

  -- ── Payment linkage ──
  payment_id text NOT NULL,
  payment_method text DEFAULT 'card', -- card | apple_pay | stc_pay

  -- ── Money breakdown (ZATCA يتطلب فصل صريح) ──
  subtotal numeric(10,2) NOT NULL,    -- المبلغ قبل الضريبة
  vat_amount numeric(10,2) NOT NULL,  -- ضريبة القيمة المضافة
  vat_rate numeric(5,4) NOT NULL DEFAULT 0.15,
  total numeric(10,2) NOT NULL,       -- الإجمالي شامل الضريبة
  currency text NOT NULL DEFAULT 'SAR',

  -- ── Subscription details ──
  plan text,           -- basic | pro
  billing text,        -- monthly | yearly
  description text,    -- "اشتراك الأساسي (شهري)"

  -- ── Status ──
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('pending','paid','refunded','failed','cancelled')),
  paid_at timestamptz,
  refunded_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- ── Constraints ──
  CONSTRAINT subscription_invoices_payment_unique UNIQUE (payment_id),
  CONSTRAINT subscription_invoices_counter_unique UNIQUE (tenant_id, invoice_counter)
);

CREATE INDEX IF NOT EXISTS idx_sub_invoices_tenant   ON public.subscription_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_payment  ON public.subscription_invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_status   ON public.subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_paid_at  ON public.subscription_invoices(paid_at DESC);

-- ══════════════════════════════════════════════════════════════
-- RLS — مالك الـ tenant يقرأ فواتيره فقط
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_invoices_owner_select" ON public.subscription_invoices;
CREATE POLICY "sub_invoices_owner_select"
  ON public.subscription_invoices FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = subscription_invoices.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- لا insert/update/delete من العميل — فقط service_role (webhook)
-- (RLS بدون POLICY = منع كامل، service_role يتجاوز RLS تلقائياً)

-- ══════════════════════════════════════════════════════════════
-- Trigger لتحديث updated_at
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.touch_sub_invoices_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sub_invoices_touch ON public.subscription_invoices;
CREATE TRIGGER trg_sub_invoices_touch
  BEFORE UPDATE ON public.subscription_invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_sub_invoices_updated_at();

-- ══════════════════════════════════════════════════════════════
-- Helper: العداد التالي للفاتورة
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.next_subscription_invoice_counter(p_tenant_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next int;
BEGIN
  SELECT COALESCE(MAX(invoice_counter), 0) + 1
    INTO v_next
    FROM public.subscription_invoices
    WHERE tenant_id = p_tenant_id;
  RETURN v_next;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_subscription_invoice_counter(uuid) TO authenticated, service_role;

COMMENT ON TABLE public.subscription_invoices IS
  'فواتير اشتراكات SaaS متوافقة مع ZATCA — تُنشأ تلقائياً من Moyasar webhook';
