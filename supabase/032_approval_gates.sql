-- ══════════════════════════════════════════════════════════════
-- K-7: Approval Gates للقرارات الحرجة
-- يضيف قواعد موافقة على ai_employees ويوسّع org_escalations
-- لتعليق إجراءات حتى يقرر CEO
-- ══════════════════════════════════════════════════════════════

-- 1) قواعد الموافقة الافتراضية على مستوى الموظف
ALTER TABLE public.ai_employees
  ADD COLUMN IF NOT EXISTS approval_rules jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.ai_employees.approval_rules IS
  'قواعد متى يتطلب الموظف موافقة CEO. مثال: {"max_amount_sar": 10000, "block_actions": ["send_contract","publish_listing"], "require_approval_for": ["legal_promise","price_quote"]}';

-- 2) قواعد التخصيص على مستوى المستأجر (tenant overrides) داخل tenant_ai_config
ALTER TABLE public.tenant_ai_config
  ADD COLUMN IF NOT EXISTS approval_overrides jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tenant_ai_config.approval_overrides IS
  'تخصيص الوسيط لقواعد الموافقة. المفتاح: employee_code، القيمة: نفس بنية approval_rules. يدمج فوق الافتراضي.';

-- 3) توسعة org_escalations لاستقبال إجراءات معلَّقة
ALTER TABLE public.org_escalations
  ADD COLUMN IF NOT EXISTS approval_kind text DEFAULT 'info_only',
  ADD COLUMN IF NOT EXISTS pending_action jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS executed_at timestamptz,
  ADD COLUMN IF NOT EXISTS execution_result jsonb;

COMMENT ON COLUMN public.org_escalations.approval_kind IS
  'info_only | pre_action | post_action — pre_action يوقف الإجراء حتى الموافقة';
COMMENT ON COLUMN public.org_escalations.pending_action IS
  'وصف الإجراء المعلّق: {kind, target_table, target_id, payload, ...}';
COMMENT ON COLUMN public.org_escalations.expires_at IS
  'بعد هذا الوقت، إن لم يقرر CEO يصبح الإجراء منتهياً (rejected تلقائياً)';

-- 4) قيد على القيم المسموحة لـ approval_kind
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_escalations_approval_kind_chk') THEN
    ALTER TABLE public.org_escalations
      ADD CONSTRAINT org_escalations_approval_kind_chk
      CHECK (approval_kind IN ('info_only','pre_action','post_action'));
  END IF;
END $$;

-- 5) فهارس لتسريع لوحة CEO
CREATE INDEX IF NOT EXISTS idx_org_escalations_pending
  ON public.org_escalations (tenant_id, status, created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_org_escalations_expires
  ON public.org_escalations (expires_at)
  WHERE status = 'pending' AND expires_at IS NOT NULL;

-- 6) RPC: تقديم إجراء للموافقة
CREATE OR REPLACE FUNCTION public.submit_for_approval(
  p_tenant_id uuid,
  p_employee_id uuid,
  p_severity text,
  p_type text,
  p_title text,
  p_description text,
  p_pending_action jsonb,
  p_expires_in_minutes int DEFAULT 1440
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.org_escalations(
    tenant_id, raised_by_kind, raised_by_id,
    severity, type, title, description,
    approval_kind, pending_action,
    expires_at, status
  ) VALUES (
    p_tenant_id, 'employee', p_employee_id,
    p_severity, p_type, p_title, p_description,
    'pre_action', COALESCE(p_pending_action, '{}'::jsonb),
    NOW() + (p_expires_in_minutes || ' minutes')::interval,
    'pending'
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- 7) RPC: قرار CEO على الموافقة
CREATE OR REPLACE FUNCTION public.decide_approval(
  p_escalation_id uuid,
  p_decision text,
  p_ceo_decision text,
  p_user_id uuid
)
RETURNS public.org_escalations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.org_escalations;
BEGIN
  IF p_decision NOT IN ('approved','rejected','modified') THEN
    RAISE EXCEPTION 'invalid decision %', p_decision;
  END IF;

  UPDATE public.org_escalations
  SET status = p_decision,
      ceo_decision = p_ceo_decision,
      decided_by = p_user_id,
      decided_at = NOW()
  WHERE id = p_escalation_id
    AND status = 'pending'
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'escalation not found or not pending';
  END IF;

  RETURN v_row;
END $$;

-- 8) seed قواعد افتراضية للموظفين
UPDATE public.ai_employees SET approval_rules = '{
  "max_amount_sar": 0,
  "block_actions": ["send_contract","share_owner_contact","commit_to_price","legal_promise"],
  "require_approval_for": ["any_quote_above_listing","exclusivity_clause","commission_below_2pct"]
}'::jsonb
WHERE code = 'whatsapp_qualifier';

UPDATE public.ai_employees SET approval_rules = '{
  "max_amount_sar": 0,
  "block_actions": ["publish_listing_with_price","negotiate_offer"],
  "require_approval_for": ["lead_above_1M","exclusive_listing"]
}'::jsonb
WHERE code = 'lead_scorer';

UPDATE public.ai_employees SET approval_rules = '{
  "block_actions": ["publish_without_review","mention_specific_owner_name"],
  "require_approval_for": ["paid_promotion","brand_collab","price_disclosure"]
}'::jsonb
WHERE code IN ('content_creator','social_publisher','community_manager','visual_director');

UPDATE public.ai_employees SET approval_rules = '{
  "max_amount_sar": 5000,
  "block_actions": ["sign_lease","extend_contract","waive_penalty"],
  "require_approval_for": ["rent_discount","early_termination","payment_plan"]
}'::jsonb
WHERE code IN ('leasing_agent','vacancy_filler');

UPDATE public.ai_employees SET approval_rules = '{
  "max_amount_sar": 2000,
  "block_actions": ["dispatch_contractor","approve_repair_invoice"],
  "require_approval_for": ["repair_above_2k","owner_charge"]
}'::jsonb
WHERE code = 'maintenance_coordinator';

UPDATE public.ai_employees SET approval_rules = '{
  "max_amount_sar": 0,
  "block_actions": ["modify_invoice","write_off_debt","issue_refund"],
  "require_approval_for": ["debt_writeoff","invoice_correction"]
}'::jsonb
WHERE code IN ('bookkeeper','financial_analyst','collections_specialist');

UPDATE public.ai_employees SET approval_rules = '{
  "block_actions": ["share_internal_data","commit_to_partner"],
  "require_approval_for": ["new_partnership","public_announcement"]
}'::jsonb
WHERE code IN ('bizdev_scout','trend_scout');

UPDATE public.ai_employees SET approval_rules = '{
  "block_actions": ["deploy_to_production","modify_security_rules"],
  "require_approval_for": ["schema_change","payment_logic_change"]
}'::jsonb
WHERE code = 'dev_lead';
