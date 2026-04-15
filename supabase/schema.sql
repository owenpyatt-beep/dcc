-- Debrecht Command Center — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ── Properties ────────────────────────────────────────
create table properties (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('managed', 'build')),
  name text not null,
  short_name text not null,
  address text,
  type text default 'Multi-Family',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Managed property fields
  total_units integer default 0,
  occupied_units integer default 0,
  leased_units integer default 0,
  delinquent_30 integer default 0,
  delinquent_60 integer default 0,
  delinquent_amount_30 numeric(12,2) default 0,
  delinquent_amount_60 numeric(12,2) default 0,
  monthly_income numeric(12,2) default 0,
  collected_income numeric(12,2) default 0,
  vacant_rented integer default 0,
  vacant_unrented integer default 0,
  notice_rented integer default 0,
  notice_unrented integer default 0,
  month_rental_income numeric(12,2) default 0,
  month_total_income numeric(12,2) default 0,
  month_expenses numeric(12,2) default 0,
  month_noi numeric(12,2) default 0,
  ytd_rental_income numeric(12,2) default 0,
  ytd_total_income numeric(12,2) default 0,
  ytd_expenses numeric(12,2) default 0,
  ytd_noi numeric(12,2) default 0,
  last_synced timestamptz,

  -- Build property fields
  total_project_cost numeric(14,2) default 0,
  loan_amount numeric(14,2) default 0,
  equity_required numeric(14,2) default 0,
  equity_in numeric(14,2) default 0,
  drawn_to_date numeric(14,2) default 0,
  completion integer default 0,
  foreman text,
  pm text,
  start_date text,
  est_completion text,
  has_leasing boolean default false,
  total_buildings integer default 0,
  buildings_under_co integer default 0,
  units_ready_to_lease integer default 0
);

-- ── Draws ─────────────────────────────────────────────
create table draws (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  num integer not null,
  status text not null default 'compiling' check (status in ('compiling', 'in_review', 'submitted', 'funded')),
  amount numeric(12,2) default 0,
  invoice_count integer default 0,
  submitted_date text,
  funded_date text,
  accuracy numeric(5,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(property_id, num)
);

-- ── Invoices ──────────────────────────────────────────
create table invoices (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references draws(id) on delete set null,
  property_id uuid not null references properties(id) on delete cascade,
  vendor text not null,
  invoice_number text,
  invoice_date text,
  amount_due numeric(12,2) not null default 0,
  job_name text,
  trade_category text default 'General Construction',
  invoice_type text default 'standard' check (invoice_type in ('standard', 'pay_application', 'statement_line')),
  missing_data_flag text,
  source_file text,
  notes text,
  created_at timestamptz default now()
);

-- ── Extraction Logs ───────────────────────────────────
create table extraction_logs (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references draws(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  file_name text,
  invoice_count integer default 0,
  total_amount numeric(12,2) default 0,
  model text,
  accuracy numeric(5,2),
  raw_response text,
  created_at timestamptz default now()
);

-- ── Cashflow ──────────────────────────────────────────
create table cashflow (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  month text not null,
  drawn numeric(12,2) default 0,
  cumulative numeric(12,2) default 0,
  unique(property_id, month)
);

-- ── Indexes ───────────────────────────────────────────
create index idx_draws_property on draws(property_id);
create index idx_invoices_draw on invoices(draw_id);
create index idx_invoices_property on invoices(property_id);
create index idx_invoices_vendor on invoices(vendor);
create index idx_invoices_trade on invoices(trade_category);
create index idx_cashflow_property on cashflow(property_id);

-- ── Auto-update timestamps ────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger properties_updated_at
  before update on properties
  for each row execute function update_updated_at();

create trigger draws_updated_at
  before update on draws
  for each row execute function update_updated_at();

-- ── Row Level Security ────────────────────────────────
-- For now, allow all operations via service role (server-side)
-- and read-only for anon (frontend). We'll tighten this with auth later.

alter table properties enable row level security;
alter table draws enable row level security;
alter table invoices enable row level security;
alter table extraction_logs enable row level security;
alter table cashflow enable row level security;

-- Anon can read everything
create policy "anon_read_properties" on properties for select using (true);
create policy "anon_read_draws" on draws for select using (true);
create policy "anon_read_invoices" on invoices for select using (true);
create policy "anon_read_extraction_logs" on extraction_logs for select using (true);
create policy "anon_read_cashflow" on cashflow for select using (true);

-- Service role can do everything (via Vercel serverless functions)
-- This is automatic — service_role bypasses RLS
