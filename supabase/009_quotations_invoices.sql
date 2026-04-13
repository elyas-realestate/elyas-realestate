-- ══════════════════════════════════════════════════════════════
-- 009: عروض الأسعار (Quotations)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS quotations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID DEFAULT auth.uid(),
  
  -- ربط بالعقار والعميل
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  
  -- تفاصيل العرض
  title        TEXT NOT NULL,
  amount       NUMERIC NOT NULL DEFAULT 0,
  currency     TEXT DEFAULT 'SAR',
  valid_until  DATE,
  notes        TEXT,
  
  -- الحالة
  status       TEXT DEFAULT 'مسودة' CHECK (status IN ('مسودة','مُرسل','مقبول','مرفوض','منتهي')),
  
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotations_tenant" ON quotations
  FOR ALL USING (tenant_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- 010: الفواتير (Invoices)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invoices (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID DEFAULT auth.uid(),
  
  -- ربط
  deal_id      UUID REFERENCES deals(id) ON DELETE SET NULL,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name  TEXT,
  
  -- تفاصيل الفاتورة
  invoice_number TEXT,
  title          TEXT NOT NULL,
  amount         NUMERIC NOT NULL DEFAULT 0,
  vat_amount     NUMERIC DEFAULT 0,
  total          NUMERIC GENERATED ALWAYS AS (amount + vat_amount) STORED,
  currency       TEXT DEFAULT 'SAR',
  due_date       DATE,
  notes          TEXT,
  
  -- الحالة
  status TEXT DEFAULT 'غير مدفوعة' CHECK (status IN ('غير مدفوعة','مدفوعة جزئياً','مدفوعة','ملغاة')),
  paid_amount NUMERIC DEFAULT 0,
  paid_at     TIMESTAMPTZ,
  
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_tenant" ON invoices
  FOR ALL USING (tenant_id = auth.uid());
