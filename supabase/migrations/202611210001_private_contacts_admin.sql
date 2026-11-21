-- Private reporter details, owner verification, and atomic report submission.
-- Personal contact information never enters the public reports table.
create table if not exists public.reporter_contacts (
  report_id uuid primary key references public.reports(id) on delete cascade,
  reporter_name text not null check (char_length(trim(reporter_name)) between 2 and 100),
  contact_phone text not null check (contact_phone ~ '^[+0-9() -]{7,20}$'),
  hide_identity boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reporter_contacts enable row level security;

create or replace function public.is_pc2_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = (select auth.uid())
      and lower(coalesce(u.email, '')) = 'mia.saavedra@usil.pe'
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_pc2_admin() from public;
grant execute on function public.is_pc2_admin() to anon, authenticated;

drop policy if exists "Anyone can submit a report" on public.reports;
drop policy if exists "Municipal staff can update report status" on public.reports;
create policy "Authorized managers can update report status" on public.reports
  for update to authenticated using (
    public.is_pc2_admin()
    or exists (select 1 from public.municipal_staff s where s.user_id = (select auth.uid()))
  ) with check (
    public.is_pc2_admin()
    or exists (select 1 from public.municipal_staff s where s.user_id = (select auth.uid()))
  );

drop policy if exists "Staff can read own staff membership" on public.municipal_staff;
create policy "Staff can read own staff membership" on public.municipal_staff
  for select to authenticated using (
    user_id = (select auth.uid()) or public.is_pc2_admin()
  );

drop policy if exists "Managers can read private reporter contacts" on public.reporter_contacts;
create policy "Managers can read private reporter contacts" on public.reporter_contacts
  for select to authenticated using (
    public.is_pc2_admin()
    or exists (select 1 from public.municipal_staff s where s.user_id = (select auth.uid()))
  );

create or replace function public.submit_report(
  p_title text,
  p_location text,
  p_district text,
  p_kind text,
  p_lat double precision,
  p_lng double precision,
  p_reporter_name text,
  p_contact_phone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_report_id uuid;
begin
  if char_length(trim(coalesce(p_title, ''))) not between 8 and 100 then
    raise exception 'Invalid report description';
  end if;
  if char_length(trim(coalesce(p_location, ''))) not between 4 and 120 then
    raise exception 'Invalid location reference';
  end if;
  if p_district not in ('Los Olivos', 'Comas', 'San Martín de Porres', 'Independencia') then
    raise exception 'Invalid district';
  end if;
  if p_kind not in ('Heces en vía pública', 'Orina / mal olor', 'Mascota sin supervisión', 'Otro problema de salubridad') then
    raise exception 'Invalid report kind';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -12.2 and -11.7 or p_lng not between -77.3 and -76.8 then
    raise exception 'Coordinates outside the service area';
  end if;
  if char_length(trim(coalesce(p_reporter_name, ''))) not between 2 and 100 then
    raise exception 'Invalid reporter name';
  end if;
  if trim(coalesce(p_contact_phone, '')) !~ '^[+0-9() -]{7,20}$' then
    raise exception 'Invalid contact phone';
  end if;

  insert into public.reports (title, location, district, kind, lat, lng, status, anonymous)
  values (trim(p_title), trim(p_location), p_district, p_kind, p_lat, p_lng, 'open', true)
  returning id into new_report_id;

  insert into public.reporter_contacts (report_id, reporter_name, contact_phone, hide_identity)
  values (new_report_id, trim(p_reporter_name), trim(p_contact_phone), true);

  return new_report_id;
end;
$$;

revoke all on function public.submit_report(text, text, text, text, double precision, double precision, text, text) from public;
grant execute on function public.submit_report(text, text, text, text, double precision, double precision, text, text) to anon, authenticated;
