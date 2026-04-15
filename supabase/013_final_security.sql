-- ══════════════════════════════════════════════════════════════
-- 013: الحماية النهائية للصلاحيات (Final Security & RLS Fixes)
-- ══════════════════════════════════════════════════════════════
-- بعض الجداول كانت تستخدم auth.uid() بدلاً من my_tenant_id() في نظام المستأجرين.
-- هذا السكربت يقوم بتصحيح جميع سياسات الوصول لضمان العزل التام للمستأجرين.

-- 1. تعديل القيم الافتراضية لأعمدة tenant_id
ALTER TABLE IF EXISTS quotations ALTER COLUMN tenant_id SET DEFAULT public.my_tenant_id();
ALTER TABLE IF EXISTS invoices   ALTER COLUMN tenant_id SET DEFAULT public.my_tenant_id();
ALTER TABLE IF EXISTS commissions ALTER COLUMN tenant_id SET DEFAULT public.my_tenant_id();
ALTER TABLE IF EXISTS campaigns  ALTER COLUMN tenant_id SET DEFAULT public.my_tenant_id();
ALTER TABLE IF EXISTS expenses   ALTER COLUMN tenant_id SET DEFAULT public.my_tenant_id();
ALTER TABLE IF EXISTS projects   ALTER COLUMN tenant_id SET DEFAULT public.my_tenant_id();

-- 2. إجبار تشغيل RLS على الجداول
ALTER TABLE IF EXISTS quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects   ENABLE ROW LEVEL SECURITY;

-- 3. تصحيح السياسات (حذف القديمة المعتمدة على auth.uid وإنشاء جديدة)

-- Quotations
DROP POLICY IF EXISTS "quotations_tenant" ON quotations;
CREATE POLICY "quotations_tenant_rw" ON quotations FOR ALL 
USING (tenant_id = public.my_tenant_id()) WITH CHECK (tenant_id = public.my_tenant_id());

-- Invoices
DROP POLICY IF EXISTS "invoices_tenant" ON invoices;
CREATE POLICY "invoices_tenant_rw" ON invoices FOR ALL 
USING (tenant_id = public.my_tenant_id()) WITH CHECK (tenant_id = public.my_tenant_id());

-- Commissions
DROP POLICY IF EXISTS "commissions_tenant" ON commissions;
CREATE POLICY "commissions_tenant_rw" ON commissions FOR ALL 
USING (tenant_id = public.my_tenant_id()) WITH CHECK (tenant_id = public.my_tenant_id());

-- Campaigns
DROP POLICY IF EXISTS "campaigns_tenant" ON campaigns;
CREATE POLICY "campaigns_tenant_rw" ON campaigns FOR ALL 
USING (tenant_id = public.my_tenant_id()) WITH CHECK (tenant_id = public.my_tenant_id());

-- Expenses
DROP POLICY IF EXISTS "expenses_tenant" ON expenses;
CREATE POLICY "expenses_tenant_rw" ON expenses FOR ALL 
USING (tenant_id = public.my_tenant_id()) WITH CHECK (tenant_id = public.my_tenant_id());

-- Projects
DROP POLICY IF EXISTS "projects_tenant" ON projects;
CREATE POLICY "projects_tenant_rw" ON projects FOR ALL 
USING (tenant_id = public.my_tenant_id()) WITH CHECK (tenant_id = public.my_tenant_id());
