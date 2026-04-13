-- ══════════════════════════════════════════════════════════════
-- 010: سجل التدقيق والأمان (Audit Log)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID DEFAULT auth.uid(),
  
  -- من فعل ماذا
  user_id     UUID,
  user_email  TEXT,
  action      TEXT NOT NULL,        -- 'create', 'update', 'delete', 'login', 'export'
  entity_type TEXT,                  -- 'property', 'client', 'deal', 'task', etc.
  entity_id   UUID,
  entity_name TEXT,                  -- اسم العنصر للعرض
  
  -- التفاصيل
  details     JSONB DEFAULT '{}',   -- تغييرات محددة
  ip_address  TEXT,
  user_agent  TEXT,
  
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_tenant" ON audit_log
  FOR ALL USING (tenant_id = auth.uid());
