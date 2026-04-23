-- ══════════════════════════════════════════════════════════════
-- 027: تصلّب أمني شامل (Security Hardening)
-- يعالج 30 تنبيهاً من Supabase Advisor
-- ══════════════════════════════════════════════════════════════
--
-- ما يُصلحه هذا الـ migration:
--   1. إزالة سياسات RLS الفضفاضة `USING (true)` على role=anon
--      (كانت تسمح لأي زائر مجهول بقراءة وتعديل بيانات كل المستأجرين!)
--   2. تفعيل RLS على 12 جدولاً كانت بلا حماية
--   3. إضافة search_path للدوال الثمان غير المحصَّنة
--   4. إعادة إنشاء view `property_distribution_summary` بدون SECURITY DEFINER
-- ══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- القسم 1: حذف سياسات `USING (true)` على role=anon (ثغرة خطيرة)
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS dashboard_all_identity   ON public.broker_identity;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.broker_identity;
DROP POLICY IF EXISTS broker_identity_own_read ON public.broker_identity;  -- buggy OR clause
DROP POLICY IF EXISTS dashboard_all_clients    ON public.clients;
DROP POLICY IF EXISTS dashboard_all_content    ON public.content;
DROP POLICY IF EXISTS dashboard_all_deals      ON public.deals;
DROP POLICY IF EXISTS dashboard_all_properties ON public.properties;
DROP POLICY IF EXISTS dashboard_all_requests   ON public.property_requests;
DROP POLICY IF EXISTS dashboard_all_settings   ON public.site_settings;
DROP POLICY IF EXISTS site_settings_own_read   ON public.site_settings;  -- buggy tenant_id=auth.uid()
DROP POLICY IF EXISTS site_settings_own_write  ON public.site_settings;  -- buggy
DROP POLICY IF EXISTS dashboard_all_tasks      ON public.tasks;
DROP POLICY IF EXISTS allow_all                ON public.legal_documents;
DROP POLICY IF EXISTS public_insert_analytics  ON public.site_analytics;
DROP POLICY IF EXISTS public_read_analytics    ON public.site_analytics;


-- ═══════════════════════════════════════════════════════════════
-- القسم 2: سياسات عامة محدودة للصفحات العمومية (public-facing)
-- ═══════════════════════════════════════════════════════════════

-- broker_identity — القراءة العامة لصفحات /broker/[slug] (البيانات معروضة للعموم أصلاً)
DROP POLICY IF EXISTS broker_identity_public_read ON public.broker_identity;
CREATE POLICY broker_identity_public_read ON public.broker_identity
  FOR SELECT TO anon, authenticated
  USING (true);

-- site_settings — القراءة العامة لصفحات /broker/[slug]
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
DROP POLICY IF EXISTS public_read_settings ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (true);


-- ═══════════════════════════════════════════════════════════════
-- القسم 3: تفعيل RLS على الجداول غير المحمية (12 جدولاً)
-- ═══════════════════════════════════════════════════════════════

-- ── جداول بيانات مرجعية عامة (قراءة للجميع، كتابة محظورة) ──
ALTER TABLE public.property_categories   ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_categories_read ON public.property_categories;
CREATE POLICY property_categories_read ON public.property_categories
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.property_features_ref ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_features_ref_read ON public.property_features_ref;
CREATE POLICY property_features_ref_read ON public.property_features_ref
  FOR SELECT TO anon, authenticated USING (true);

-- ── جداول مرتبطة بـ tenant عبر FK ──
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_files_tenant ON public.client_files;
CREATE POLICY client_files_tenant ON public.client_files
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_files.client_id
      AND c.tenant_id = public.my_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_files.client_id
      AND c.tenant_id = public.my_tenant_id()
  ));

ALTER TABLE public.deal_followups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deal_followups_tenant ON public.deal_followups;
CREATE POLICY deal_followups_tenant ON public.deal_followups
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_followups.deal_id
      AND d.tenant_id = public.my_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_followups.deal_id
      AND d.tenant_id = public.my_tenant_id()
  ));

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS matches_tenant ON public.matches;
CREATE POLICY matches_tenant ON public.matches
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = matches.request_id  AND r.tenant_id = public.my_tenant_id())
    OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = matches.property_id AND p.tenant_id = public.my_tenant_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.property_requests r WHERE r.id = matches.request_id  AND r.tenant_id = public.my_tenant_id())
    OR EXISTS (SELECT 1 FROM public.properties p WHERE p.id = matches.property_id AND p.tenant_id = public.my_tenant_id())
  );

ALTER TABLE public.content_platforms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_platforms_tenant ON public.content_platforms;
CREATE POLICY content_platforms_tenant ON public.content_platforms
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.content c
    WHERE c.id = content_platforms.content_id
      AND c.tenant_id = public.my_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.content c
    WHERE c.id = content_platforms.content_id
      AND c.tenant_id = public.my_tenant_id()
  ));

ALTER TABLE public.property_features_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_features_entries_tenant ON public.property_features_entries;
CREATE POLICY property_features_entries_tenant ON public.property_features_entries
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_features_entries.property_id
      AND p.tenant_id = public.my_tenant_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_features_entries.property_id
      AND p.tenant_id = public.my_tenant_id()
  ));

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partners_tenant ON public.partners;
CREATE POLICY partners_tenant ON public.partners
  FOR ALL
  USING (
    client_id IS NULL OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = partners.client_id
        AND c.tenant_id = public.my_tenant_id()
    )
  )
  WITH CHECK (
    client_id IS NULL OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = partners.client_id
        AND c.tenant_id = public.my_tenant_id()
    )
  );

-- ── جداول يتيمة (فارغة + غير مستخدمة في الكود) — إغلاق كامل ──
-- يمكن توسيع السياسات لاحقاً إذا احتاج التطبيق هذه الجداول
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_deny_all ON public.users;
CREATE POLICY users_deny_all ON public.users
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE public.documents      ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_deny_all ON public.documents;
CREATE POLICY documents_deny_all ON public.documents
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE public.events         ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_deny_all ON public.events;
CREATE POLICY events_deny_all ON public.events
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE public.event_clients  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS event_clients_deny_all ON public.event_clients;
CREATE POLICY event_clients_deny_all ON public.event_clients
  FOR ALL USING (false) WITH CHECK (false);


-- ═══════════════════════════════════════════════════════════════
-- القسم 4: تحصين search_path على 8 دوال
-- ═══════════════════════════════════════════════════════════════

ALTER FUNCTION public.set_goals_tenant_id()          SET search_path = public;
ALTER FUNCTION public.update_updated_at()            SET search_path = public;
ALTER FUNCTION public.set_tenant_id()                SET search_path = public;
ALTER FUNCTION public.is_valid_saudi_vat(text)       SET search_path = public;
ALTER FUNCTION public.next_invoice_counter(uuid)     SET search_path = public;
ALTER FUNCTION public.set_invoice_counter()          SET search_path = public;
ALTER FUNCTION public.mark_notification_read(uuid)   SET search_path = public;
ALTER FUNCTION public.set_work_order_number()        SET search_path = public;
ALTER FUNCTION public.update_work_order_timestamps() SET search_path = public;


-- ═══════════════════════════════════════════════════════════════
-- القسم 5: إعادة إنشاء view بدون SECURITY DEFINER
-- ═══════════════════════════════════════════════════════════════

-- نجعل الـ view يستخدم سياق المستخدم (security_invoker) بدل صاحب الـ view
ALTER VIEW IF EXISTS public.property_distribution_summary SET (security_invoker = true);
