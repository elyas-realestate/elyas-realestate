-- ══════════════════════════════════════════════════════════════════
-- Migration 050 — إدارة الأملاك (Property Management)
-- مدفوعات الإيجار + تذكيرات + متأخرات
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. عقود الإيجار (rent_contracts) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.rent_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,

  -- المستأجر
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  tenant_email TEXT,
  tenant_id_number TEXT,

  -- شروط العقد
  monthly_rent NUMERIC(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_day INTEGER DEFAULT 1 CHECK (payment_day BETWEEN 1 AND 28),
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'yearly')),

  -- ملاحظات + ملفات
  notes TEXT,
  contract_pdf_url TEXT,

  -- الحالة
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rent_contracts_tenant_idx ON public.rent_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS rent_contracts_property_idx ON public.rent_contracts(property_id);
CREATE INDEX IF NOT EXISTS rent_contracts_status_idx ON public.rent_contracts(status);

ALTER TABLE public.rent_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rent_contracts_owner_select ON public.rent_contracts;
CREATE POLICY rent_contracts_owner_select ON public.rent_contracts
  FOR SELECT TO authenticated
  USING (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS rent_contracts_owner_insert ON public.rent_contracts;
CREATE POLICY rent_contracts_owner_insert ON public.rent_contracts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS rent_contracts_owner_update ON public.rent_contracts;
CREATE POLICY rent_contracts_owner_update ON public.rent_contracts
  FOR UPDATE TO authenticated
  USING (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS rent_contracts_owner_delete ON public.rent_contracts;
CREATE POLICY rent_contracts_owner_delete ON public.rent_contracts
  FOR DELETE TO authenticated
  USING (tenant_id = public.my_tenant_id());


-- ─── 2. مدفوعات الإيجار (rent_payments) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.rent_contracts(id) ON DELETE CASCADE,

  due_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  paid_at TIMESTAMPTZ,

  payment_method TEXT, -- نقدي / تحويل / شيك / بطاقة
  reference_number TEXT,
  notes TEXT,

  -- حالة الدفعة (محسوبة)
  -- paid: paid_amount >= amount
  -- partial: 0 < paid_amount < amount
  -- pending: paid_amount = 0 AND due_date >= today
  -- overdue: paid_amount = 0 AND due_date < today
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),

  -- تذكيرات
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rent_payments_tenant_idx ON public.rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS rent_payments_contract_idx ON public.rent_payments(contract_id);
CREATE INDEX IF NOT EXISTS rent_payments_status_idx ON public.rent_payments(status);
CREATE INDEX IF NOT EXISTS rent_payments_due_date_idx ON public.rent_payments(due_date);

ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rent_payments_owner_all ON public.rent_payments;
CREATE POLICY rent_payments_owner_all ON public.rent_payments
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());


-- ─── 3. دالة لتحديث status تلقائياً ──────────────────────────────
CREATE OR REPLACE FUNCTION public.update_rent_payment_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.paid_amount >= NEW.amount THEN
    NEW.status := 'paid';
    IF NEW.paid_at IS NULL THEN NEW.paid_at := NOW(); END IF;
  ELSIF NEW.paid_amount > 0 AND NEW.paid_amount < NEW.amount THEN
    NEW.status := 'partial';
  ELSIF NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'pending';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_rent_payment_status_trigger ON public.rent_payments;
CREATE TRIGGER update_rent_payment_status_trigger
  BEFORE INSERT OR UPDATE ON public.rent_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_rent_payment_status();


-- ─── 4. دالة لتوليد دفعات شهرية تلقائياً عند إنشاء عقد ───────────
CREATE OR REPLACE FUNCTION public.generate_rent_payments(p_contract_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_contract RECORD;
  v_current_date DATE;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_contract FROM public.rent_contracts WHERE id = p_contract_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  v_current_date := v_contract.start_date;

  WHILE v_current_date <= v_contract.end_date LOOP
    INSERT INTO public.rent_payments (
      tenant_id, contract_id, due_date, amount, status
    ) VALUES (
      v_contract.tenant_id, p_contract_id, v_current_date, v_contract.monthly_rent, 'pending'
    )
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;

    -- زيادة بالشهر/الربع/السنة
    IF v_contract.payment_frequency = 'monthly' THEN
      v_current_date := v_current_date + INTERVAL '1 month';
    ELSIF v_contract.payment_frequency = 'quarterly' THEN
      v_current_date := v_current_date + INTERVAL '3 months';
    ELSE
      v_current_date := v_current_date + INTERVAL '1 year';
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_rent_payments(UUID) TO authenticated;


-- ─── 5. View للإحصائيات السريعة ──────────────────────────────────
CREATE OR REPLACE VIEW public.rent_dashboard_stats AS
SELECT
  tenant_id,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
  COUNT(*) FILTER (WHERE status = 'partial') AS partial_count,
  COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0) AS overdue_amount,
  COALESCE(SUM(amount - paid_amount) FILTER (WHERE status IN ('pending', 'overdue', 'partial')), 0) AS unpaid_total,
  COALESCE(SUM(paid_amount) FILTER (WHERE EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM NOW())), 0) AS month_collected
FROM public.rent_payments
GROUP BY tenant_id;

GRANT SELECT ON public.rent_dashboard_stats TO authenticated;


-- ─── 6. تعليق ─────────────────────────────────────────────────────
COMMENT ON TABLE public.rent_contracts IS 'عقود إيجار العقارات للوسيط — D2 Property Management';
COMMENT ON TABLE public.rent_payments IS 'دفعات الإيجار الشهرية مع متابعة الحالة (paid/pending/overdue/partial)';
COMMENT ON FUNCTION public.generate_rent_payments IS 'يولّد دفعات شهرية تلقائياً للعقد بناءً على start_date/end_date/frequency';

-- ✅ Migration 050 جاهزة. شغّلها في Supabase SQL editor.
