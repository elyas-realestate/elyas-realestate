-- ══════════════════════════════════════════════════════════════
-- 013: الحماية النهائية للصلاحيات (Final Security & RLS Fixes)
-- ══════════════════════════════════════════════════════════════
-- بعض الجداول (عروض الأسعار والفواتير) كانت تستخدم auth.uid() بدلاً من my_tenant_id().

-- 1. تعديل القيم الافتراضية لأعمدة tenant_id في الفواتير والعروض فقط
ALTER TABLE IF EXISTS quotations ALTER COLUMN tenant_id SET DEFAULT public.my_tenant_id();
ALTER TABLE IF EXISTS invoices   ALTER COLUMN tenant_id SET DEFAULT public.my_tenant_id();

-- 2. إجبار تشغيل RLS على الجداول
ALTER TABLE IF EXISTS quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices   ENABLE ROW LEVEL SECURITY;

-- 3. تصحيح السياسات (حذف القديمة المعتمدة على auth.uid وإنشاء جديدة)

-- Quotations
DROP POLICY IF EXISTS "quotations_tenant" ON quotations;
CREATE POLICY "quotations_tenant_rw" ON quotations FOR ALL 
USING (tenant_id = public.my_tenant_id()) WITH CHECK (tenant_id = public.my_tenant_id());

-- Invoices
DROP POLICY IF EXISTS "invoices_tenant" ON invoices;
CREATE POLICY "invoices_tenant_rw" ON invoices FOR ALL 
USING (tenant_id = public.my_tenant_id()) WITH CHECK (tenant_id = public.my_tenant_id());
