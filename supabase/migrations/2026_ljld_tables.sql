-- LJLD LLC invoice builder tables.
-- ljld_invoices: parent row per LJLD billing event (usually tied to one draw).
-- ljld_line_items: underlying PP receipts and labor lines that roll into the parent.
--
-- When an LJLD invoice is finalized, a single aggregate row is also written to
-- the main invoices table with vendor = 'LJLD LLC' so it flows into draws,
-- vendor totals, and AI assistants like any other invoice. The per-line detail
-- stays in ljld_line_items as audit backup.

create table if not exists ljld_invoices (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  draw_id uuid references draws(id) on delete set null,
  invoice_number text,
  invoice_date text,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  subtotal numeric(12,2) default 0,
  tax_rate numeric(5,4) default 0,
  other numeric(12,2) default 0,
  total numeric(12,2) default 0,
  aggregate_invoice_id uuid references invoices(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ljld_invoices_property_idx on ljld_invoices(property_id);
create index if not exists ljld_invoices_draw_idx on ljld_invoices(draw_id);

create table if not exists ljld_line_items (
  id uuid primary key default gen_random_uuid(),
  ljld_invoice_id uuid not null references ljld_invoices(id) on delete cascade,
  position integer not null default 0,
  type text not null default 'prepaid' check (type in ('prepaid', 'labor')),
  description text not null default '',
  vendor text,
  line_invoice_number text,
  invoice_date text,
  amount numeric(12,2) not null default 0,
  source_file text,
  flags text[] default array[]::text[],
  created_at timestamptz default now()
);

create index if not exists ljld_line_items_invoice_idx on ljld_line_items(ljld_invoice_id);

alter table ljld_invoices enable row level security;
alter table ljld_line_items enable row level security;

-- Authenticated users can do everything on their LJLD tables (same model as
-- the rest of the app — auth is binary).
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'ljld_invoices_all_authenticated'
  ) then
    create policy ljld_invoices_all_authenticated on ljld_invoices
      for all to authenticated using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'ljld_line_items_all_authenticated'
  ) then
    create policy ljld_line_items_all_authenticated on ljld_line_items
      for all to authenticated using (true) with check (true);
  end if;
end $$;
