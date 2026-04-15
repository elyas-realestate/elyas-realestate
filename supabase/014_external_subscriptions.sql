-- ══════════════════════════════════════════════════════════════
-- 014: External Subscriptions Tracker
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS external_subscriptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID DEFAULT auth.uid(),
  
  app_name        TEXT NOT NULL, -- e.g., 'Aqar', 'Deal', 'X/Twitter'
  plan_name       TEXT DEFAULT 'Basic',
  cost            NUMERIC DEFAULT 0,
  billing_cycle   TEXT DEFAULT 'monthly', -- monthly, yearly
  start_date      DATE DEFAULT CURRENT_DATE,
  end_date        DATE,
  
  status          TEXT DEFAULT 'active', -- active, expired, cancelled
  remind_before_days INTEGER DEFAULT 7,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE external_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_subscriptions_tenant" ON external_subscriptions
  FOR ALL USING (tenant_id = auth.uid());
