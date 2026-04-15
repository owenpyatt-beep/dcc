-- Allow anon (frontend) to insert, update, and delete
-- We'll add proper auth later — for now, full access

create policy "anon_insert_properties" on properties for insert with check (true);
create policy "anon_update_properties" on properties for update using (true);
create policy "anon_delete_properties" on properties for delete using (true);

create policy "anon_insert_draws" on draws for insert with check (true);
create policy "anon_update_draws" on draws for update using (true);
create policy "anon_delete_draws" on draws for delete using (true);

create policy "anon_insert_invoices" on invoices for insert with check (true);
create policy "anon_update_invoices" on invoices for update using (true);
create policy "anon_delete_invoices" on invoices for delete using (true);

create policy "anon_insert_extraction_logs" on extraction_logs for insert with check (true);

create policy "anon_insert_cashflow" on cashflow for insert with check (true);
create policy "anon_update_cashflow" on cashflow for update using (true);
