-- ── Phase 13.3: Tenant Portal ─────────────────────────────────────────────
-- Adds contracts, tenant_payments, maintenance_requests tables

-- 1. contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  property_id   UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'rent',   -- rent | sale | management
  start_date    DATE,
  end_date      DATE,
  monthly_rent  NUMERIC(12,2),
  total_value   NUMERIC(12,2),
  status        TEXT NOT NULL DEFAULT 'active', -- active | expired | cancelled
  notes         TEXT,
  file_url      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contracts_tenant_idx   ON public.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS contracts_client_idx   ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx   ON public.contracts(status);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_tenant_rls" ON public.contracts
  FOR ALL USING (
    tenant_id = (SELECT id FROM public.tenants WHERE owner_id = auth.uid() LIMIT 1)
  );

-- 2. tenant_payments (دفعات الإيجار)
CREATE TABLE IF NOT EXISTS public.tenant_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id  UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  amount       NUMERIC(12,2) NOT NULL,
  due_date     DATE NOT NULL,
  paid_date    DATE,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | paid | late | cancelled
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_payments_tenant_idx   ON public.tenant_payments(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_payments_contract_idx ON public.tenant_payments(contract_id);
CREATE INDEX IF NOT EXISTS tenant_payments_status_idx   ON public.tenant_payments(status);

ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_payments_rls" ON public.tenant_payments
  FOR ALL USING (
    tenant_id = (SELECT id FROM public.tenants WHERE owner_id = auth.uid() LIMIT 1)
  );

-- 3. maintenance_requests (طلبات الصيانة)
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id  UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  client_id    UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  property_id  UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  priority     TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | urgent
  status       TEXT NOT NULL DEFAULT 'open',   -- open | in_progress | resolved | cancelled
  cost         NUMERIC(12,2),
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_tenant_idx   ON public.maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS maintenance_status_idx   ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS maintenance_priority_idx ON public.maintenance_requests(priority);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance_rls" ON public.maintenance_requests
  FOR ALL USING (
    tenant_id = (SELECT id FROM public.tenants WHERE owner_id = auth.uid() LIMIT 1)
  );
