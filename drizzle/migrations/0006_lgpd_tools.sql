-- LGPD: data-subject rights and retention. All functions are owner-only and run with the owner's checks inside.

-- Replaces a patient's personal data with neutral values and removes their stored conversations.
-- The row stays so past results (returns, totals) are not lost; no name or phone remains.
create or replace function public.anonymize_patient(_patient uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  _clinic uuid;
  _digits text;
begin
  select clinic_id, right(regexp_replace(phone, '\D', '', 'g'), 10) into _clinic, _digits
    from public.patients where id = _patient;
  if _clinic is null or not public.is_owner(_clinic) then
    raise exception 'Somente o dono da clínica pode apagar os dados de um paciente';
  end if;

  delete from public.clinic_conversations
    where clinic_id = _clinic and right(regexp_replace(phone, '\D', '', 'g'), 10) = _digits;
  update public.contact_events set patient_name = 'Paciente removido' where clinic_id = _clinic and patient_id = _patient;
  update public.patients
    set name = 'Paciente removido', phone = '00000000', service = '', avg_value = null, consent = false, opted_out = true
    where id = _patient and clinic_id = _clinic;
end $$;

-- Deletes history older than the chosen number of months (6 to 60). Counts are returned so the screen can say what happened.
create or replace function public.purge_old_records(_clinic uuid, _months int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  _cutoff timestamptz;
  _events int;
  _messages int;
begin
  if not public.is_owner(_clinic) then
    raise exception 'Somente o dono da clínica pode limpar registros';
  end if;
  if _months is null or _months < 6 or _months > 60 then
    raise exception 'Prazo inválido: use de 6 a 60 meses';
  end if;
  _cutoff := now() - make_interval(months => _months);
  delete from public.contact_events where clinic_id = _clinic and created_at < _cutoff;
  get diagnostics _events = row_count;
  delete from public.clinic_messages where clinic_id = _clinic and created_at < _cutoff;
  get diagnostics _messages = row_count;
  return jsonb_build_object('events', _events, 'messages', _messages);
end $$;

-- The browser cannot write to audit_log, so exports are recorded through this function.
create or replace function public.log_export(_clinic uuid, _scope text)
returns void language plpgsql security definer set search_path = public as $$
declare _ip text;
begin
  if not public.is_owner(_clinic) then
    raise exception 'Somente o dono da clínica pode exportar dados';
  end if;
  begin
    _ip := nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for';
  exception when others then
    _ip := null;
  end;
  insert into public.audit_log (clinic_id, user_id, action, table_name, ip)
  values (_clinic, auth.uid(), 'export_' || left(regexp_replace(coalesce(_scope, ''), '[^a-z_]', '', 'g'), 20), 'patients', _ip);
end $$;

revoke execute on function public.anonymize_patient(uuid), public.purge_old_records(uuid, int), public.log_export(uuid, text) from public, anon;
grant execute on function public.anonymize_patient(uuid), public.purge_old_records(uuid, int), public.log_export(uuid, text) to authenticated;
