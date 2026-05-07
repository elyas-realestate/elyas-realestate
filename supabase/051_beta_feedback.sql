-- ══════════════════════════════════════════════════════════════════
-- Migration 051 — Beta Feedback System
-- جدول لجمع تعليقات الوسطاء التجريبيين
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,

  -- التصنيف
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'compliment', 'other')),
  severity TEXT DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'critical')),

  -- المحتوى
  message TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,

  -- الحالة الإدارية
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS beta_feedback_tenant_idx ON public.beta_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS beta_feedback_status_idx ON public.beta_feedback(status);
CREATE INDEX IF NOT EXISTS beta_feedback_category_idx ON public.beta_feedback(category);
CREATE INDEX IF NOT EXISTS beta_feedback_created_idx ON public.beta_feedback(created_at DESC);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- المستخدم العادي يكتب فقط (insert) ولا يقرأ
DROP POLICY IF EXISTS beta_feedback_owner_insert ON public.beta_feedback;
CREATE POLICY beta_feedback_owner_insert ON public.beta_feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- public anon يكتب أيضاً (للزوار غير المسجّلين)
DROP POLICY IF EXISTS beta_feedback_anon_insert ON public.beta_feedback;
CREATE POLICY beta_feedback_anon_insert ON public.beta_feedback
  FOR INSERT TO anon
  WITH CHECK (tenant_id IS NULL);

COMMENT ON TABLE public.beta_feedback IS 'تعليقات وملاحظات الوسطاء التجريبيين خلال Beta';

-- ✅ Migration 051 جاهزة.
