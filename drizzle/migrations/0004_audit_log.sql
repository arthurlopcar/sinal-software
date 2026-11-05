-- Append-only audit trail. Rows are written only by triggers; nobody (not even the owner or service_role) can change or delete them.
-- No personal data is stored: only ids, the action and the network address.
create table public.audit_log (
  id bigint generated always as identity primary key,
  clinic_id uuid,
  user_id uuid,
  action text not null,
  table_name text not null,
  record_id uuid,
  ip text,
  created_at timestamptz not null default now()
);
create index audit_log_clinic_created_idx on public.audit_log (clinic_id, created_at desc);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from public, anon, authenticated, service_role;
grant select on public.audit_log to authenticated;
grant select, insert on public.audit_log to service_role;

create policy "owner reads audit" on public.audit_log for select to authenticated
  using (public.is_owner(clinic_id) or public.has_role(auth.uid(), 'admin'));

create or replace function public.audit_block_changes()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log é somente de inserção';
end $$;
create trigger audit_log_no_update_delete before update or delete on public.audit_log
  for each row execute function public.audit_block_changes();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_block_changes();

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _row jsonb;
  _ip text;
begin
  _row := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  begin
    _ip := nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for';
  exception when others then
    _ip := null;
  end;
  insert into public.audit_log (clinic_id, user_id, action, table_name, record_id, ip)
  values (
    (case when tg_table_name = 'clinics' then _row ->> 'id' else _row ->> 'clinic_id' end)::uuid,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    (_row ->> 'id')::uuid,
    _ip
  );
  return null;
end $$;

create trigger audit_patients after insert or update or delete on public.patients
  for each row execute function public.audit_row();
create trigger audit_clinic_members after insert or update or delete on public.clinic_members
  for each row execute function public.audit_row();
create trigger audit_clinics_update after update on public.clinics
  for each row execute function public.audit_row();
