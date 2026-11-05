
create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  message_template text not null default 'Olá, {nome}! Aqui é da {clinica}. Já faz {intervalo} do seu último atendimento ({servico}). Vamos agendar seu retorno?',
  plan_status text not null default 'teste',
  trial_ends_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);
create table public.clinic_members (
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null,
  email text,
  role text not null default 'equipe',
  created_at timestamptz not null default now(),
  primary key (clinic_id, user_id)
);
create table public.clinic_invites (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (clinic_id, email)
);
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  phone text not null,
  service text not null default '',
  interval_months int not null default 3,
  last_visit date not null default current_date,
  consent boolean not null default false,
  opted_out boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.contact_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  patient_name text not null default '',
  kind text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.clinics, public.clinic_members, public.clinic_invites, public.patients, public.contact_events to authenticated;
grant all on public.clinics, public.clinic_members, public.clinic_invites, public.patients, public.contact_events to service_role;

create or replace function public.is_member(_clinic uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.clinic_members where clinic_id = _clinic and user_id = auth.uid())
$$;
create or replace function public.is_owner(_clinic uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.clinics where id = _clinic and owner_id = auth.uid())
$$;

alter table public.clinics enable row level security;
alter table public.clinic_members enable row level security;
alter table public.clinic_invites enable row level security;
alter table public.patients enable row level security;
alter table public.contact_events enable row level security;

create policy "members read clinic" on public.clinics for select to authenticated using (public.is_member(id) or public.has_role(auth.uid(),'admin'));
create policy "create own clinic" on public.clinics for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates clinic" on public.clinics for update to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "members read members" on public.clinic_members for select to authenticated using (public.is_member(clinic_id) or public.has_role(auth.uid(),'admin'));
create policy "owner removes members" on public.clinic_members for delete to authenticated using (public.is_owner(clinic_id) and user_id <> auth.uid());

create policy "owner reads invites" on public.clinic_invites for select to authenticated using (public.is_owner(clinic_id));
create policy "owner adds invites" on public.clinic_invites for insert to authenticated with check (public.is_owner(clinic_id));
create policy "owner deletes invites" on public.clinic_invites for delete to authenticated using (public.is_owner(clinic_id));

create policy "members all patients" on public.patients for all to authenticated using (public.is_member(clinic_id)) with check (public.is_member(clinic_id));
create policy "members read events" on public.contact_events for select to authenticated using (public.is_member(clinic_id));
create policy "members add events" on public.contact_events for insert to authenticated with check (public.is_member(clinic_id) and created_by = auth.uid());

-- owner auto-membership
create or replace function public.add_owner_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.clinic_members (clinic_id, user_id, email, role)
  values (new.id, new.owner_id, (select email from auth.users where id = new.owner_id), 'dono');
  return new;
end $$;
create trigger clinics_owner_member after insert on public.clinics for each row execute function public.add_owner_member();

-- accept pending invites for current user
create or replace function public.accept_invites()
returns int language plpgsql security definer set search_path = public as $$
declare _email text; _n int;
begin
  select lower(email) into _email from auth.users where id = auth.uid();
  if _email is null then return 0; end if;
  insert into public.clinic_members (clinic_id, user_id, email, role)
  select clinic_id, auth.uid(), _email, 'equipe' from public.clinic_invites where lower(email) = _email
  on conflict do nothing;
  get diagnostics _n = row_count;
  delete from public.clinic_invites where lower(email) = _email;
  return _n;
end $$;
revoke execute on function public.accept_invites() from anon;
grant execute on function public.accept_invites() to authenticated;
