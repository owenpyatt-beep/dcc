-- Collapse draw status lifecycle from 4 states to 2.
-- Old: compiling → in_review → submitted → funded
-- New: submitted → funded
--
-- Run in Supabase SQL editor.

alter table draws drop constraint if exists draws_status_check;

update draws set status = 'submitted'
where status in ('compiling', 'in_review');

alter table draws alter column status set default 'submitted';

alter table draws
  add constraint draws_status_check
  check (status in ('submitted', 'funded'));
