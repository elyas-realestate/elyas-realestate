-- ══════════════════════════════════════════════════════════════
-- وسيط برو — جدول المصروفات
-- شغّل هذا الملف في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        REFERENCES public.tenants(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL DEFAULT 'أخرى'
                          CHECK (category IN ('إيجار مكتب','رواتب','تسويق','مواصلات','اتصالات','صيانة','رسوم قانونية','أخرى')),
  amount      NUMERIC(14,2) NOT NULL,
  note        TEXT,
  expense_date DATE       NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_tenant_idx ON public.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx   ON public.expenses(expense_date DESC);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_tenant_rw" ON public.expenses;
CREATE POLICY "expenses_tenant_rw"
  ON public.expenses FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.expenses;
CREATE TRIGGER set_tenant_id_trigger
  BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
