create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'premium', 'family')),
  subscription_expires_at timestamptz,
  family_id uuid,
  is_parent boolean not null default false,
  daily_goal_verses integer not null default 3 check (daily_goal_verses between 1 and 20),
  daily_goal_reviews integer not null default 3 check (daily_goal_reviews between 0 and 20),
  preferred_reciter text not null default 'mishary',
  notification_time time not null default '20:00',
  timezone text not null default 'Europe/Paris',
  language text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.surah_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  surah_number integer not null check (surah_number between 1 and 114),
  status text not null default 'locked' check (status in ('locked', 'learning', 'known')),
  verses_learned integer not null default 0 check (verses_learned >= 0),
  total_verses integer not null check (total_verses > 0),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  review_interval_days integer not null default 1 check (review_interval_days between 1 and 30),
  ease_factor real not null default 2.5 check (ease_factor between 1.3 and 3.0),
  review_count integer not null default 0,
  started_learning_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, surah_number)
);

create table if not exists public.daily_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  duration_seconds integer not null default 0,
  xp_earned integer not null default 0,
  surahs_reviewed integer not null default 0,
  verses_learned integer not null default 0,
  is_perfect boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, session_date)
);

create table if not exists public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_session_date date,
  freeze_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_xp (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp integer not null default 0,
  current_level integer not null default 1,
  weekly_xp integer not null default 0,
  week_start date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.user_state_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text unique not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_family_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_family_id_fkey
      foreign key (family_id) references public.families(id) on delete set null
      deferrable initially deferred;
  end if;
end
$$;

alter table public.profiles enable row level security;
alter table public.surah_progress enable row level security;
alter table public.daily_sessions enable row level security;
alter table public.streaks enable row level security;
alter table public.user_xp enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_state_snapshots enable row level security;
alter table public.families enable row level security;

revoke all on public.user_state_snapshots from anon;
grant select, insert, update, delete on public.user_state_snapshots to authenticated;

drop policy if exists "profiles_own_row" on public.profiles;
create policy "profiles_own_row" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "surah_progress_own_rows" on public.surah_progress;
create policy "surah_progress_own_rows" on public.surah_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "daily_sessions_own_rows" on public.daily_sessions;
create policy "daily_sessions_own_rows" on public.daily_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "streaks_own_row" on public.streaks;
create policy "streaks_own_row" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_xp_own_row" on public.user_xp;
create policy "user_xp_own_row" on public.user_xp
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_badges_own_rows" on public.user_badges;
create policy "user_badges_own_rows" on public.user_badges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_state_snapshots_own_row" on public.user_state_snapshots;
create policy "user_state_snapshots_own_row" on public.user_state_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "families_owner_row" on public.families;
create policy "families_owner_row" on public.families
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, 'Utilisateur'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
