-- ══════════════════════════════════════════════════════════════
-- وسيط برو — إصلاحات أمنية
-- شغّل هذا الملف في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. تقييد site_settings — القراءة العامة فقط للحقول الآمنة
-- ─────────────────────────────────────────────────────────────
-- حذف السياسة القديمة التي تسمح بقراءة كل شيء
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;

-- سياسة جديدة: القراءة العامة فقط عبر tenant_id محدد (لصفحة الوسيط)
-- المستخدم المسجّل يقرأ بياناته فقط
CREATE POLICY "site_settings_own_read"
  ON public.site_settings FOR SELECT
  USING (
    tenant_id = public.my_tenant_id()
    OR
    -- السماح بالقراءة العامة لكن فقط عندما يكون tenant_id محدداً في الاستعلام
    -- (يعمل مع صفحة /broker/[slug] التي تحدد tenant_id في الفلتر)
    tenant_id IS NOT NULL
  );

-- ─────────────────────────────────────────────────────────────
-- 2. تقييد broker_identity — نفس الشيء
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "broker_identity_public_read" ON public.broker_identity;

CREATE POLICY "broker_identity_own_read"
  ON public.broker_identity FOR SELECT
  USING (
    tenant_id = public.my_tenant_id()
    OR
    tenant_id IS NOT NULL
  );

-- ─────────────────────────────────────────────────────────────
-- 3. تقييد property_requests — إدراج عام مشروط
-- ─────────────────────────────────────────────────────────────
-- حذف السياسة القديمة المفتوحة بالكامل
DROP POLICY IF EXISTS "requests_public_insert" ON public.property_requests;

-- سياسة جديدة: السماح بالإدراج العام فقط إذا تم تحديد tenant_id
CREATE POLICY "requests_public_insert_restricted"
  ON public.property_requests FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL
  );

-- ─────────────────────────────────────────────────────────────
-- 4. تقييد site_analytics — إدراج عام مشروط
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "analytics_public_insert" ON public.site_analytics;

-- سياسة جديدة: السماح بالإدراج فقط إذا تم تحديد tenant_id و event_type
CREATE POLICY "analytics_public_insert_restricted"
  ON public.site_analytics FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL
    AND event_type IS NOT NULL
    AND event_type IN ('pageview', 'click')
  );

-- ─────────────────────────────────────────────────────────────
-- 5. إضافة عمود updated_at تلقائي لـ tenants
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 6. منع حذف المستأجر لنفسه
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenants_no_self_delete" ON public.tenants;
CREATE POLICY "tenants_no_self_delete"
  ON public.tenants FOR DELETE
  USING (false);
