-- ══════════════════════════════════════════════════════════════
-- وسيط برو — نظام المستخدمين المتعددين (Multi-Tenancy)
-- شغّل هذا الملف في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. جدول tenants (المستأجرون / الوسطاء)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT        UNIQUE NOT NULL,
  owner_id   UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  plan       TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- فهرس سريع للبحث بـ slug
CREATE INDEX IF NOT EXISTS tenants_slug_idx     ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS tenants_owner_id_idx ON public.tenants(owner_id);

-- ─────────────────────────────────────────────────────────────
-- 2. إضافة عمود tenant_id لكل الجداول
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.properties        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.clients           ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.deals             ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.property_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.tasks             ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.content           ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.legal_documents   ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.site_settings     ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.broker_identity   ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.site_analytics    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- فهارس على tenant_id
CREATE INDEX IF NOT EXISTS properties_tenant_idx        ON public.properties(tenant_id);
CREATE INDEX IF NOT EXISTS clients_tenant_idx           ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS deals_tenant_idx             ON public.deals(tenant_id);
CREATE INDEX IF NOT EXISTS property_requests_tenant_idx ON public.property_requests(tenant_id);
CREATE INDEX IF NOT EXISTS tasks_tenant_idx             ON public.tasks(tenant_id);
CREATE INDEX IF NOT EXISTS content_tenant_idx           ON public.content(tenant_id);
CREATE INDEX IF NOT EXISTS legal_documents_tenant_idx   ON public.legal_documents(tenant_id);
CREATE INDEX IF NOT EXISTS site_settings_tenant_idx     ON public.site_settings(tenant_id);
CREATE INDEX IF NOT EXISTS broker_identity_tenant_idx   ON public.broker_identity(tenant_id);
CREATE INDEX IF NOT EXISTS site_analytics_tenant_idx    ON public.site_analytics(tenant_id);

-- ─────────────────────────────────────────────────────────────
-- 3. دالة مساعدة — tenant_id للمستخدم الحالي
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_tenant_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.tenants WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. RLS على جدول tenants
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- أي شخص يقرأ tenants (ضروري لصفحة /broker/[slug] العامة)
CREATE POLICY "tenants_public_read"
  ON public.tenants FOR SELECT
  USING (is_active = true);

-- المالك فقط يعدّل مستأجره
CREATE POLICY "tenants_owner_update"
  ON public.tenants FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- إنشاء مستأجر جديد — أي مستخدم مسجّل
CREATE POLICY "tenants_insert_self"
  ON public.tenants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 5. RLS على الجداول الداخلية (الداشبورد)
-- ─────────────────────────────────────────────────────────────

-- properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties_tenant_rw"
  ON public.properties FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());
-- السماح بقراءة العقارات المنشورة للعامة (لصفحة الوسيط)
CREATE POLICY "properties_public_published"
  ON public.properties FOR SELECT
  USING (is_published = true);

-- clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_tenant_rw"
  ON public.clients FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_tenant_rw"
  ON public.deals FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- property_requests
ALTER TABLE public.property_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests_tenant_rw"
  ON public.property_requests FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());
-- العملاء يستطيعون إضافة طلبات (لنموذج الاتصال)
CREATE POLICY "requests_public_insert"
  ON public.property_requests FOR INSERT
  WITH CHECK (true);

-- tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_tenant_rw"
  ON public.tasks FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- content
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_tenant_rw"
  ON public.content FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- legal_documents
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_docs_tenant_rw"
  ON public.legal_documents FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- site_settings (قراءة عامة لصفحة الوسيط، كتابة للمالك فقط)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read"
  ON public.site_settings FOR SELECT
  USING (true);
CREATE POLICY "site_settings_tenant_write"
  ON public.site_settings FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- broker_identity (قراءة عامة لصفحة الوسيط، كتابة للمالك فقط)
ALTER TABLE public.broker_identity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "broker_identity_public_read"
  ON public.broker_identity FOR SELECT
  USING (true);
CREATE POLICY "broker_identity_tenant_write"
  ON public.broker_identity FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- site_analytics
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_tenant_rw"
  ON public.site_analytics FOR ALL
  USING   (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());
-- زوار الصفحة العامة يضيفون إحصائيات
CREATE POLICY "analytics_public_insert"
  ON public.site_analytics FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 6. ترحيل البيانات الحالية (المستخدم الوحيد الموجود)
-- ─────────────────────────────────────────────────────────────
-- شغّل هذا القسم بشكل منفصل بعد الحصول على owner_id من
-- Supabase → Authentication → Users → انسخ UUID أول مستخدم

DO $$
DECLARE
v_owner_id  UUID := 'd5162dae-e3bf-48fa-91a6-b0e0c2c5c43a';
  v_slug      TEXT := 'elyas'; -- ← ضع هنا الـ slug المطلوب
  v_tenant_id UUID;
BEGIN
  -- توقف إذا لم يُحدد owner_id
  IF v_owner_id IS NULL THEN
    RAISE NOTICE 'تخطي الترحيل — حدد v_owner_id أولاً';
    RETURN;
  END IF;

  -- أنشئ tenant
  INSERT INTO public.tenants (slug, owner_id, plan)
  VALUES (v_slug, v_owner_id, 'free')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_tenant_id;

  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = v_slug;
  END IF;

  -- حدّث كل الجداول
  UPDATE public.properties        SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.clients           SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.deals             SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.property_requests SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.tasks             SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.content           SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.legal_documents   SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.site_settings     SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.broker_identity   SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.site_analytics    SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;

  RAISE NOTICE 'تم الترحيل بنجاح. tenant_id = %', v_tenant_id;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 7. دالة Trigger — إضافة tenant_id تلقائياً لبيانات جديدة
-- ─────────────────────────────────────────────────────────────
-- (اختياري — يسهّل الكود، لكن يمكن الاعتماد على الكود بدلاً منه)
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.my_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

-- طبّق الـ trigger على كل جدول
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'properties','clients','deals','property_requests',
    'tasks','content','legal_documents','site_settings',
    'broker_identity','site_analytics'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_tenant_id_trigger ON public.%I;
       CREATE TRIGGER set_tenant_id_trigger
       BEFORE INSERT ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();',
      tbl, tbl
    );
  END LOOP;
END $$;
