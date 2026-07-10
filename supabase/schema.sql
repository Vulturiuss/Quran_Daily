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
  max_children integer not null default 4 check (max_children between 1 and 10),
  created_at timestamptz not null default now()
);

alter table public.families
  add column if not exists max_children integer not null default 4;

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('parent', 'child')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id),
  unique (user_id)
);

create index if not exists family_members_family_id_idx
  on public.family_members(family_id);

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

insert into public.family_members (family_id, user_id, role)
select family.id, family.owner_id, 'parent'
from public.families family
on conflict (user_id) do nothing;

insert into public.family_members (family_id, user_id, role)
select profile.family_id, profile.id, 'child'
from public.profiles profile
where profile.family_id is not null
  and not profile.is_parent
on conflict (user_id) do nothing;

update public.profiles profile
set family_id = family.id,
    is_parent = true
from public.families family
where family.owner_id = profile.id
  and (
    profile.family_id is distinct from family.id
    or not profile.is_parent
  );

alter table public.profiles enable row level security;
alter table public.surah_progress enable row level security;
alter table public.daily_sessions enable row level security;
alter table public.streaks enable row level security;
alter table public.user_xp enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_state_snapshots enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;

revoke all on public.user_state_snapshots from anon;
grant select, insert, update, delete on public.user_state_snapshots to authenticated;

drop policy if exists "profiles_own_row" on public.profiles;
drop policy if exists "profiles_select_own_row" on public.profiles;
create policy "profiles_select_own_row" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own_row" on public.profiles;
create policy "profiles_update_own_row" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

revoke all on public.profiles from anon;
revoke insert, delete, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (
  username,
  display_name,
  avatar_url,
  daily_goal_verses,
  daily_goal_reviews,
  preferred_reciter,
  notification_time,
  timezone,
  language,
  updated_at
) on public.profiles to authenticated;
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
drop policy if exists "family_members_no_direct_access" on public.family_members;
create policy "family_members_no_direct_access" on public.family_members
  for select using (false);

revoke all on public.families from anon, authenticated;
revoke all on public.family_members from anon, authenticated;

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

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public;
revoke all on function public.delete_current_user() from anon;
grant execute on function public.delete_current_user() to authenticated;

create or replace function public.family_owner_has_access(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.families family
    join public.profiles owner_profile on owner_profile.id = family.owner_id
    where family.id = target_family_id
      and owner_profile.subscription_tier = 'family'
      and (
        owner_profile.subscription_expires_at is null
        or owner_profile.subscription_expires_at > now()
      )
  );
$$;

revoke all on function public.family_owner_has_access(uuid) from public;
revoke all on function public.family_owner_has_access(uuid) from anon;
revoke all on function public.family_owner_has_access(uuid) from authenticated;

create or replace function public.get_my_family_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    return null;
  end if;

  select jsonb_build_object(
    'familyId', family.id,
    'familyName', coalesce(family.name, 'Ma famille'),
    'role', member.role,
    'inviteCode', case when member.role = 'parent' then family.invite_code else null end,
    'memberCount', (
      select count(*) from public.family_members all_members
      where all_members.family_id = family.id
    ),
    'childCount', (
      select count(*) from public.family_members children
      where children.family_id = family.id and children.role = 'child'
    ),
    'maxChildren', family.max_children,
    'ownerDisplayName', coalesce(owner_snapshot.payload #>> '{profile,displayName}', owner_profile.display_name, 'Parent'),
    'active', public.family_owner_has_access(family.id)
  )
  into result
  from public.family_members member
  join public.families family on family.id = member.family_id
  join public.profiles owner_profile on owner_profile.id = family.owner_id
  left join public.user_state_snapshots owner_snapshot on owner_snapshot.user_id = family.owner_id
  where member.user_id = auth.uid();

  return result;
end;
$$;

revoke all on function public.get_my_family_context() from public;
revoke all on function public.get_my_family_context() from anon;
grant execute on function public.get_my_family_context() to authenticated;

create or replace function public.create_family_space(family_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_family_id uuid;
  generated_code text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1 from public.family_members where user_id = current_user_id
  ) then
    raise exception 'Ce compte appartient déjà à une famille.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
      and subscription_tier = 'family'
      and (
        subscription_expires_at is null
        or subscription_expires_at > now()
      )
  ) then
    raise exception 'Un abonnement Famille actif est nécessaire.';
  end if;

  generated_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.families (name, owner_id, invite_code, max_children)
  values (
    nullif(trim(family_name), ''),
    current_user_id,
    generated_code,
    4
  )
  returning id into created_family_id;

  insert into public.family_members (family_id, user_id, role)
  values (created_family_id, current_user_id, 'parent');

  update public.profiles
  set family_id = created_family_id,
      is_parent = true,
      updated_at = now()
  where id = current_user_id;

  return public.get_my_family_context();
end;
$$;

revoke all on function public.create_family_space(text) from public;
revoke all on function public.create_family_space(text) from anon;
grant execute on function public.create_family_space(text) to authenticated;

create or replace function public.join_family_space(family_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_family public.families%rowtype;
  current_child_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1 from public.family_members where user_id = current_user_id
  ) then
    raise exception 'Ce compte appartient déjà à une famille.';
  end if;

  select *
  into target_family
  from public.families
  where invite_code = upper(trim(family_code));

  if target_family.id is null or not public.family_owner_has_access(target_family.id) then
    raise exception 'Code familial invalide ou abonnement inactif.';
  end if;

  select count(*)
  into current_child_count
  from public.family_members
  where family_id = target_family.id and role = 'child';

  if current_child_count >= target_family.max_children then
    raise exception 'Cette famille a atteint sa limite de profils enfants.';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (target_family.id, current_user_id, 'child');

  update public.profiles
  set family_id = target_family.id,
      is_parent = false,
      updated_at = now()
  where id = current_user_id;

  return public.get_my_family_context();
end;
$$;

revoke all on function public.join_family_space(text) from public;
revoke all on function public.join_family_space(text) from anon;
grant execute on function public.join_family_space(text) to authenticated;

create or replace function public.regenerate_family_invite_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
begin
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  update public.families
  set invite_code = new_code
  where owner_id = auth.uid();

  if not found then
    raise exception 'Seul le parent peut renouveler le code familial.';
  end if;

  return new_code;
end;
$$;

revoke all on function public.regenerate_family_invite_code() from public;
revoke all on function public.regenerate_family_invite_code() from anon;
grant execute on function public.regenerate_family_invite_code() to authenticated;

create or replace function public.remove_family_child(child_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owned_family_id uuid;
begin
  select id into owned_family_id
  from public.families
  where owner_id = auth.uid();

  if owned_family_id is null then
    raise exception 'Seul le parent peut retirer un enfant.';
  end if;

  delete from public.family_members
  where family_id = owned_family_id
    and user_id = child_user_id
    and role = 'child';

  if not found then
    raise exception 'Profil enfant introuvable.';
  end if;

  update public.profiles
  set family_id = null,
      is_parent = false,
      updated_at = now()
  where id = child_user_id;
end;
$$;

revoke all on function public.remove_family_child(uuid) from public;
revoke all on function public.remove_family_child(uuid) from anon;
grant execute on function public.remove_family_child(uuid) to authenticated;

create or replace function public.leave_family_space()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.family_members
  where user_id = auth.uid() and role = 'child';

  if not found then
    raise exception 'Aucun profil enfant à retirer de la famille.';
  end if;

  update public.profiles
  set family_id = null,
      is_parent = false,
      updated_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.leave_family_space() from public;
revoke all on function public.leave_family_space() from anon;
grant execute on function public.leave_family_space() to authenticated;

create or replace function public.delete_family_space()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owned_family_id uuid;
begin
  select id into owned_family_id
  from public.families
  where owner_id = auth.uid();

  if owned_family_id is null then
    raise exception 'Espace familial introuvable.';
  end if;

  update public.profiles
  set family_id = null,
      is_parent = false,
      updated_at = now()
  where family_id = owned_family_id;

  delete from public.families where id = owned_family_id;
end;
$$;

revoke all on function public.delete_family_space() from public;
revoke all on function public.delete_family_space() from anon;
grant execute on function public.delete_family_space() to authenticated;

create or replace function public.get_family_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  owned_family_id uuid;
  result jsonb;
begin
  select family.id
  into owned_family_id
  from public.families family
  where family.owner_id = auth.uid()
    and public.family_owner_has_access(family.id);

  if owned_family_id is null then
    raise exception 'Un espace Famille actif est nécessaire.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'userId', member.user_id,
        'displayName', coalesce(snapshot.payload #>> '{profile,displayName}', profile.display_name, 'Profil'),
        'role', member.role,
        'joinedAt', member.joined_at,
        'currentStreak', coalesce((snapshot.payload #>> '{stats,currentStreak}')::integer, 0),
        'longestStreak', coalesce((snapshot.payload #>> '{stats,longestStreak}')::integer, 0),
        'totalXP', coalesce((snapshot.payload #>> '{stats,totalXP}')::integer, 0),
        'totalSessions', coalesce((snapshot.payload #>> '{stats,totalSessions}')::integer, 0),
        'totalMinutes', coalesce((snapshot.payload #>> '{stats,totalMinutes}')::integer, 0),
        'knownSurahs', coalesce((
          select count(*)
          from jsonb_each(coalesce(snapshot.payload -> 'progress', '{}'::jsonb)) progress_item
          where progress_item.value ->> 'status' = 'known'
        ), 0),
        'versesLearned', coalesce((
          select sum(coalesce((progress_item.value ->> 'versesLearned')::integer, 0))
          from jsonb_each(coalesce(snapshot.payload -> 'progress', '{}'::jsonb)) progress_item
        ), 0),
        'learningSurah', (
          select (progress_item.value ->> 'surahNumber')::integer
          from jsonb_each(coalesce(snapshot.payload -> 'progress', '{}'::jsonb)) progress_item
          where progress_item.value ->> 'status' = 'learning'
          limit 1
        ),
        'learningVersesLearned', (
          select coalesce((progress_item.value ->> 'versesLearned')::integer, 0)
          from jsonb_each(coalesce(snapshot.payload -> 'progress', '{}'::jsonb)) progress_item
          where progress_item.value ->> 'status' = 'learning'
          limit 1
        ),
        'learningTotalVerses', (
          select coalesce((progress_item.value ->> 'totalVerses')::integer, 0)
          from jsonb_each(coalesce(snapshot.payload -> 'progress', '{}'::jsonb)) progress_item
          where progress_item.value ->> 'status' = 'learning'
          limit 1
        ),
        'history', coalesce(snapshot.payload -> 'history', '[]'::jsonb),
        'snapshotUpdatedAt', snapshot.updated_at
      )
      order by member.role desc, member.joined_at
    ),
    '[]'::jsonb
  )
  into result
  from public.family_members member
  join public.profiles profile on profile.id = member.user_id
  left join public.user_state_snapshots snapshot on snapshot.user_id = member.user_id
  where member.family_id = owned_family_id;

  return result;
end;
$$;

revoke all on function public.get_family_dashboard() from public;
revoke all on function public.get_family_dashboard() from anon;
grant execute on function public.get_family_dashboard() to authenticated;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'family_members'
  ) then
    alter publication supabase_realtime add table public.family_members;
  end if;
end
$$;
