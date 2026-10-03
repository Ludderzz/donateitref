-- Run once in Supabase -> SQL Editor. Change the admin email at the bottom first.

-- ============ TABLES ============
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  forms_closed boolean not null default false,
  closed_message text not null default 'Referrals are temporarily closed. Please check back soon.',
  default_max_submissions int not null default 5 check (default_max_submissions >= 0),
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);

create table public.referrers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  organisation_name text,
  max_submissions int not null default 5 check (max_submissions >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  ref_no bigint generated always as identity,
  created_at timestamptz not null default now(),
  status text not null default 'submitted'
    check (status in ('submitted','validated','approved','dispatched','completed','rejected')),
  priority text not null default 'standard' check (priority in ('standard','urgent','emergency')),
  possible_duplicate boolean not null default false,
  admin_notes text,

  -- organisation level
  organisation_name text not null,
  organisation_type text not null,
  referrer_name text not null,
  referrer_email text not null,
  referrer_phone text not null,
  delivery_preference text not null check (delivery_preference in ('delivery','collection')),
  delivery_address text,
  delivery_postcode text,
  person_in_charge text not null,

  -- client level
  number_of_clients int not null check (number_of_clients > 0),
  age_range text not null,
  gender text not null,
  nationality text not null,
  ethnicity text not null,
  client_postcode text not null,
  local_authority text not null,
  referral_reason text not null,
  intended_use text not null,
  vulnerability_indicators text[] not null default '{}',
  is_high_risk boolean not null default false,
  safe_storage boolean,
  safe_charging boolean,
  contact_restrictions text,
  risk_notes text,

  -- device level
  devices jsonb not null,
  accessories text[] not null default '{}',
  distribution_plan text,
  bulk_stock boolean not null default false,
  storage_capacity text,
  distribution_timeline text,

  -- optional
  additional_context text,
  digital_skills_support boolean not null default false,
  preferred_brands text,

  -- outcome / reporting (admin only)
  received_date date,
  impact_notes text,
  followup_notes text
);
create index referrals_referrer_email_idx on public.referrals (referrer_email);

-- ============ HELPERS ============
create or replace function public.jwt_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = public.jwt_email());
$$;

create or replace function public.can_submit() returns boolean
language sql stable security definer set search_path = public as $$
  select not (select forms_closed from public.settings where id = 1)
    and exists (
      select 1 from public.referrers r
      where r.email = public.jwt_email()
        and r.active
        and (select count(*) from public.referrals f where f.referrer_email = r.email) < r.max_submissions
    );
$$;

-- ============ INSERT TRIGGER (locks fields, flags duplicates, bumps risk) ============
create or replace function public.referrals_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.referrer_email := public.jwt_email();
  new.status := 'submitted';
  new.admin_notes := null;
  new.received_date := null;
  new.impact_notes := null;
  new.followup_notes := null;

  if new.is_high_risk and new.priority = 'standard' then
    new.priority := 'urgent';
  end if;

  if new.number_of_clients = 1 and exists (
    select 1 from public.referrals r
    where r.referrer_email = new.referrer_email
      and upper(r.client_postcode) = upper(new.client_postcode)
      and r.age_range = new.age_range
      and r.gender = new.gender
      and r.referral_reason = new.referral_reason
      and r.created_at > now() - interval '30 days'
  ) then
    new.possible_duplicate := true;
  end if;
  return new;
end $$;

create trigger referrals_before_insert_trg
  before insert on public.referrals
  for each row execute function public.referrals_before_insert();

-- ============ USAGE VIEW ============
create view public.referrer_usage with (security_invoker = true) as
select
  r.id, r.email, r.organisation_name, r.max_submissions, r.active, r.created_at,
  (select count(*) from public.referrals f where f.referrer_email = r.email)::int as used,
  greatest(r.max_submissions - (select count(*) from public.referrals f where f.referrer_email = r.email), 0)::int as remaining
from public.referrers r;

-- ============ RLS ============
alter table public.admins    enable row level security;
alter table public.settings  enable row level security;
alter table public.referrers enable row level security;
alter table public.referrals enable row level security;

create policy "admins read admins" on public.admins for select to authenticated using (public.is_admin());

create policy "anyone reads settings" on public.settings for select to anon, authenticated using (true);
create policy "admin updates settings" on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin manages referrers" on public.referrers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "referrer reads own row" on public.referrers for select to authenticated
  using (email = public.jwt_email());

create policy "admin manages referrals" on public.referrals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "referrer reads own referrals" on public.referrals for select to authenticated
  using (referrer_email = public.jwt_email());
create policy "referrer inserts if allowed" on public.referrals for insert to authenticated
  with check (referrer_email = public.jwt_email() and public.can_submit());

-- ============ GRANTS ============
grant usage on schema public to anon, authenticated;
grant select on public.settings to anon, authenticated;
grant update on public.settings to authenticated;
grant select on public.admins to authenticated;
grant select, insert, update, delete on public.referrers, public.referrals to authenticated;
grant select on public.referrer_usage to authenticated;
grant execute on function public.is_admin(), public.can_submit() to authenticated;

-- ============ YOUR ADMIN LOGIN (change this!) ============
insert into public.admins (email) values (lower('YOUR_EMAIL@example.com'));

-- optional test referrer
insert into public.referrers (email, organisation_name, max_submissions)
values ('test.referrer@example.com', 'Test Org', 5);
