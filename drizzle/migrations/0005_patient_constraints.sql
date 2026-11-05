-- The app talks to Supabase straight from the browser, so the database is the only server-side validation.
-- NOT VALID: enforced for every new write, without failing on rows that already exist.
alter table public.patients
  add constraint patients_name_len check (char_length(btrim(name)) between 1 and 120) not valid,
  add constraint patients_phone_fmt check (phone ~ '^[0-9+()\s-]{8,20}$') not valid,
  add constraint patients_service_len check (char_length(service) <= 80) not valid,
  add constraint patients_interval_range check (interval_months between 1 and 36) not valid;

alter table public.clinics
  add constraint clinics_name_len check (char_length(btrim(name)) between 1 and 120) not valid;
