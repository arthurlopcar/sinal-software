alter table public.patients
  add column avg_value numeric(10,2) check (avg_value is null or (avg_value >= 0 and avg_value <= 1000000));
