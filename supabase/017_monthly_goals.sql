-- ══════════════════════════════════════════════
-- 017: جدول أهداف المبيعات الشهرية
-- ══════════════════════════════════════════════

create table if not exists monthly_goals (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references tenants(id) on delete cascade,
  month          text not null,          -- format: YYYY-MM
  target_deals   int  not null default 0,
  target_revenue numeric(15,2) not null default 0,
  target_clients int  not null default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (tenant_id, month)
);

-- RLS
alter table monthly_goals enable row level security;

create policy "tenant_goals_select" on monthly_goals
  for select using (tenant_id = (
    select id from tenants where owner_id = auth.uid() limit 1
  ));

create policy "tenant_goals_insert" on monthly_goals
  for insert with check (tenant_id = (
    select id from tenants where owner_id = auth.uid() limit 1
  ));

create policy "tenant_goals_update" on monthly_goals
  for update using (tenant_id = (
    select id from tenants where owner_id = auth.uid() limit 1
  ));

create policy "tenant_goals_delete" on monthly_goals
  for delete using (tenant_id = (
    select id from tenants where owner_id = auth.uid() limit 1
  ));

-- Trigger: ضع tenant_id تلقائياً
create or replace function set_goals_tenant_id()
returns trigger language plpgsql as $$
begin
  if new.tenant_id is null then
    new.tenant_id := (select id from tenants where owner_id = auth.uid() limit 1);
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_goals_tenant_id on monthly_goals;
create trigger trg_goals_tenant_id
  before insert or update on monthly_goals
  for each row execute function set_goals_tenant_id();
