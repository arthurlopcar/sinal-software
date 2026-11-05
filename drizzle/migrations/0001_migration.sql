
create or replace function public.protect_clinic_plan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.plan_status is distinct from old.plan_status or new.trial_ends_at is distinct from old.trial_ends_at or new.owner_id is distinct from old.owner_id)
     and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Somente a Sinal pode alterar o plano';
  end if;
  return new;
end $$;
create trigger clinics_protect_plan before update on public.clinics for each row execute function public.protect_clinic_plan();
