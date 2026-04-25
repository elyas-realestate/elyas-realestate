-- ══════════════════════════════════════════════════════════════
-- 031: Organization Structure (Multi-Agent System Hierarchy)
--
-- معماريّاً:
--   - 5 مدراء + 10 موظفين على مستوى المنصّة (system-wide, seeded)
--   - كل tenant يخصّص: التفعيل، تجاوز المزوّد/النموذج، التوجيهات، KB
--   - Directives + Knowledge Base متعدّدا الشكل (target_kind: manager | employee)
--   - Escalations: قرارات تنتظر CEO
--   - Activity log: تتبّع كل إجراء من المدراء/الموظفين
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. ai_managers — system-wide list of 5 managers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_managers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  text UNIQUE NOT NULL,    -- cs_manager, marketing_manager, ...
  name                  text NOT NULL,           -- "مدير خدمة العملاء"
  department            text NOT NULL,           -- cs | marketing | asset | financial | dev_bizdev
  description           text NOT NULL,
  default_ai_provider   text NOT NULL DEFAULT 'anthropic',
  default_ai_model      text NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  display_order         int  NOT NULL DEFAULT 0,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_managers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_managers_read ON public.ai_managers;
CREATE POLICY ai_managers_read ON public.ai_managers
  FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────
-- 2. ai_employees — system-wide list of employees under managers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_employees (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  text UNIQUE NOT NULL,
  name                  text NOT NULL,
  manager_id            uuid NOT NULL REFERENCES public.ai_managers(id) ON DELETE CASCADE,
  department            text NOT NULL,
  description           text NOT NULL,
  default_ai_provider   text NOT NULL DEFAULT 'deepseek',
  default_ai_model      text NOT NULL DEFAULT 'deepseek-chat',
  trigger_type          text,                    -- cron_daily | cron_hourly | webhook | on_event
  trigger_config        jsonb DEFAULT '{}'::jsonb,
  display_order         int  NOT NULL DEFAULT 0,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_employees_manager_idx ON public.ai_employees(manager_id);

ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_employees_read ON public.ai_employees;
CREATE POLICY ai_employees_read ON public.ai_employees
  FOR SELECT TO authenticated USING (true);

-- ─────────────────────────────────────────────────────────────
-- 3. tenant_ai_config — per-tenant overrides + enable/disable
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_ai_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  target_kind         text NOT NULL CHECK (target_kind IN ('manager','employee')),
  target_id           uuid NOT NULL,             -- references ai_managers.id OR ai_employees.id
  is_enabled          boolean NOT NULL DEFAULT true,
  ai_provider_override text,
  ai_model_override   text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, target_kind, target_id)
);
CREATE INDEX IF NOT EXISTS tenant_ai_config_tenant_idx ON public.tenant_ai_config(tenant_id);

ALTER TABLE public.tenant_ai_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_ai_config_tenant ON public.tenant_ai_config;
CREATE POLICY tenant_ai_config_tenant ON public.tenant_ai_config
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 4. directives — توجيهات (polymorphic: manager OR employee)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.directives (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  target_kind         text NOT NULL CHECK (target_kind IN ('manager','employee')),
  target_id           uuid NOT NULL,
  title               text NOT NULL,
  content             text NOT NULL,
  structured_rules    jsonb DEFAULT '{}'::jsonb, -- {tone, max_response_length, escalation_threshold, ...}
  source              text NOT NULL DEFAULT 'custom'
                      CHECK (source IN ('custom','inherited','suggested')),
  parent_directive_id uuid REFERENCES public.directives(id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','pending','rejected','archived')),
  display_order       int NOT NULL DEFAULT 0,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS directives_tenant_target_idx ON public.directives(tenant_id, target_kind, target_id);
CREATE INDEX IF NOT EXISTS directives_status_idx ON public.directives(tenant_id, status);

ALTER TABLE public.directives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS directives_tenant ON public.directives;
CREATE POLICY directives_tenant ON public.directives
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 5. knowledge_base — قاعدة معرفة
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  target_kind         text NOT NULL CHECK (target_kind IN ('manager','employee')),
  target_id           uuid NOT NULL,
  title               text NOT NULL,
  content             text NOT NULL,
  category            text NOT NULL DEFAULT 'general'
                      CHECK (category IN ('general','faq','brand','policy','property_data','client_history','market_intel')),
  tags                text[],
  is_active           boolean NOT NULL DEFAULT true,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kb_tenant_target_idx ON public.knowledge_base(tenant_id, target_kind, target_id);
CREATE INDEX IF NOT EXISTS kb_category_idx ON public.knowledge_base(tenant_id, category);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kb_tenant ON public.knowledge_base;
CREATE POLICY kb_tenant ON public.knowledge_base
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 6. org_escalations — قرارات تنتظر CEO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_escalations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  raised_by_kind      text NOT NULL CHECK (raised_by_kind IN ('manager','employee')),
  raised_by_id        uuid NOT NULL,
  severity            text NOT NULL DEFAULT 'info'
                      CHECK (severity IN ('info','warning','critical')),
  type                text NOT NULL,             -- discount_request | lease_dispute | large_transaction | ...
  title               text NOT NULL,
  description         text NOT NULL,
  payload             jsonb DEFAULT '{}'::jsonb,
  action_required     text,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected','resolved')),
  ceo_decision        text,
  decided_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS org_escalations_tenant_idx ON public.org_escalations(tenant_id, status, created_at DESC);

ALTER TABLE public.org_escalations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_escalations_tenant ON public.org_escalations;
CREATE POLICY org_escalations_tenant ON public.org_escalations
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 7. org_activity_log — سجل تتبّع
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_activity_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_kind          text NOT NULL CHECK (actor_kind IN ('manager','employee','ceo','system')),
  actor_id            uuid,                      -- nullable for system/ceo
  action              text NOT NULL,             -- e.g., 'sent_message', 'created_directive', 'escalated'
  target_kind         text,
  target_id           uuid,
  details             jsonb DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS org_activity_tenant_idx ON public.org_activity_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS org_activity_actor_idx ON public.org_activity_log(actor_kind, actor_id);

ALTER TABLE public.org_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_activity_tenant ON public.org_activity_log;
CREATE POLICY org_activity_tenant ON public.org_activity_log
  FOR ALL TO authenticated
  USING (tenant_id = public.my_tenant_id())
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- 8. updated_at triggers
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS tenant_ai_config_touch ON public.tenant_ai_config;
CREATE TRIGGER tenant_ai_config_touch
  BEFORE UPDATE ON public.tenant_ai_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS directives_touch ON public.directives;
CREATE TRIGGER directives_touch
  BEFORE UPDATE ON public.directives
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS kb_touch ON public.knowledge_base;
CREATE TRIGGER kb_touch
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 9. Helper functions
-- ─────────────────────────────────────────────────────────────

-- استرجاع كل التوجيهات النشطة لمدير معيَّن (موروثة لموظفيه + مخصّصة لكل واحد)
CREATE OR REPLACE FUNCTION public.get_directives_for_target(
  p_tenant_id uuid,
  p_target_kind text,
  p_target_id uuid
)
RETURNS SETOF public.directives
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.directives
  WHERE tenant_id = p_tenant_id
    AND target_kind = p_target_kind
    AND target_id = p_target_id
    AND status = 'active'
  ORDER BY display_order, created_at;
$$;
GRANT EXECUTE ON FUNCTION public.get_directives_for_target(uuid, text, uuid) TO authenticated;

-- استرجاع KB لهدف معيَّن
CREATE OR REPLACE FUNCTION public.get_kb_for_target(
  p_tenant_id uuid,
  p_target_kind text,
  p_target_id uuid
)
RETURNS SETOF public.knowledge_base
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.knowledge_base
  WHERE tenant_id = p_tenant_id
    AND target_kind = p_target_kind
    AND target_id = p_target_id
    AND is_active = true
  ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_kb_for_target(uuid, text, uuid) TO authenticated;

-- نظرة عامة على الهيكل التنظيمي للمستأجر الحالي
CREATE OR REPLACE FUNCTION public.org_structure_for_tenant()
RETURNS TABLE (
  manager_id          uuid,
  manager_code        text,
  manager_name        text,
  department          text,
  manager_enabled     boolean,
  employee_count      bigint,
  active_directives   bigint,
  pending_suggestions bigint,
  kb_items            bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH tid AS (SELECT public.my_tenant_id() AS id)
  SELECT
    m.id,
    m.code,
    m.name,
    m.department,
    COALESCE(
      (SELECT is_enabled FROM public.tenant_ai_config c
       WHERE c.tenant_id = (SELECT id FROM tid)
         AND c.target_kind = 'manager' AND c.target_id = m.id),
      true
    ),
    (SELECT count(*) FROM public.ai_employees e WHERE e.manager_id = m.id),
    (SELECT count(*) FROM public.directives d
     WHERE d.tenant_id = (SELECT id FROM tid)
       AND d.target_kind = 'manager' AND d.target_id = m.id
       AND d.status = 'active'),
    (SELECT count(*) FROM public.directives d
     WHERE d.tenant_id = (SELECT id FROM tid)
       AND d.status = 'pending'
       AND (
         (d.target_kind = 'manager' AND d.target_id = m.id)
         OR (d.target_kind = 'employee' AND d.target_id IN
             (SELECT id FROM public.ai_employees WHERE manager_id = m.id))
       )),
    (SELECT count(*) FROM public.knowledge_base k
     WHERE k.tenant_id = (SELECT id FROM tid)
       AND k.target_kind = 'manager' AND k.target_id = m.id
       AND k.is_active = true)
  FROM public.ai_managers m
  WHERE m.is_active = true
  ORDER BY m.display_order, m.name;
$$;
GRANT EXECUTE ON FUNCTION public.org_structure_for_tenant() TO authenticated;
