-- Alerta Vecinal: registro m�nimo para reportes geolocalizados.
-- No almacena nombres, correos ni tel�fonos en la tabla p�blica.
create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 8 and 100),
  location text not null check (char_length(trim(location)) between 4 and 120),
  district text not null check (district in ('Los Olivos','Comas','San Mart�n de Porres','Independencia')),
  kind text not null check (kind in ('Heces en v�a p�blica','Orina / mal olor','Mascota sin supervisi�n','Otro problema de salubridad')),
  lat double precision not null check (lat between -12.2 and -11.7),
  lng double precision not null check (lng between -77.3 and -76.8),
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.municipal_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_district_status_idx on public.reports (district, status);
alter table public.reports enable row level security;
alter table public.municipal_staff enable row level security;

drop policy if exists "Public can read community reports" on public.reports;
create policy "Public can read community reports" on public.reports
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can submit a report" on public.reports;
create policy "Anyone can submit a report" on public.reports
  for insert to anon, authenticated with check (
    status = 'open'
    and district in ('Los Olivos','Comas','San Mart�n de Porres','Independencia')
    and lat between -12.2 and -11.7 and lng between -77.3 and -76.8
  );

drop policy if exists "Municipal staff can update report status" on public.reports;
create policy "Municipal staff can update report status" on public.reports
  for update to authenticated using (
    exists (select 1 from public.municipal_staff s where s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.municipal_staff s where s.user_id = auth.uid())
  );

drop policy if exists "Staff can read own staff membership" on public.municipal_staff;
create policy "Staff can read own staff membership" on public.municipal_staff
  for select to authenticated using (user_id = auth.uid());

-- Alta inicial de personal municipal: ejecutar desde el editor SQL del proyecto
-- despu�s de crear el usuario autorizado en Supabase Auth. No habilitar acceso p�blico a esta tabla.

