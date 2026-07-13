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

-- The payload is written freely by the client — it is the user's own progress,
-- kept here only so it survives a reinstall or a new device. It is bounded, since
-- a member could otherwise store megabytes of jsonb.
--
-- It is NOT what a parent sees. Everything the family dashboard reports about
-- effort — sessions done, time spent, streak, XP — comes from `daily_sessions`,
-- which only `record_daily_session()` can write. A child editing this row can
-- change what their own device shows them, and nothing more.
create table if not exists public.user_state_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_state_snapshots
  drop constraint if exists user_state_snapshots_payload_size;
alter table public.user_state_snapshots
  add constraint user_state_snapshots_payload_size
  check (pg_column_size(payload) <= 1048576);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text unique not null,
  max_children integer not null default 4 check (max_children between 1 and 10),
  max_members integer not null default 5 check (max_members between 2 and 10),
  created_at timestamptz not null default now()
);

alter table public.families
  add column if not exists max_children integer not null default 4;

alter table public.families
  add column if not exists max_members integer not null default 5;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'families_max_members_check'
  ) then
    alter table public.families
      add constraint families_max_members_check
      check (max_members between 2 and 10);
  end if;
end
$$;

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
-- One row per user per day, accumulated by record_daily_session().
alter table public.daily_sessions
  add column if not exists active_seconds integer not null default 0,
  add column if not exists session_count integer not null default 0,
  -- Verses replayed in sabqi or in a final recitation. A different unit from a
  -- surah review, and conflating them made the server refuse honest work.
  add column if not exists recited_verses integer not null default 0;

-- Sessions are submitted from a queue that survives being offline, so the same
-- one can arrive twice. Without this, a retry would double a child's streak day.
create table if not exists public.session_submissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  session_date date not null,
  received_at timestamptz not null default now(),
  primary key (user_id, client_id)
);

alter table public.session_submissions enable row level security;
drop policy if exists "session_submissions_select_own" on public.session_submissions;
create policy "session_submissions_select_own" on public.session_submissions
  for select using (auth.uid() = user_id);

-- `revoke all` then `grant select`, rather than revoking the three write verbs:
-- Supabase grants ALL on public tables by default, and ALL includes TRUNCATE —
-- which RLS does not police. Naming the writes left the table truncatable.
revoke all on public.session_submissions from authenticated;
revoke all on public.session_submissions from anon;
grant select on public.session_submissions to authenticated;

-- daily_sessions is the ONLY thing a parent's dashboard trusts, so the client can
-- read its own rows but never write them: everything goes through
-- record_daily_session(), which refuses a session that could not have been worked.
-- It used to be `for all`, i.e. a child could simply PATCH themselves a streak.
drop policy if exists "daily_sessions_own_rows" on public.daily_sessions;
create policy "daily_sessions_select_own_rows" on public.daily_sessions
  for select using (auth.uid() = user_id);

revoke all on public.daily_sessions from authenticated;
revoke all on public.daily_sessions from anon;
grant select on public.daily_sessions to authenticated;
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
    'parentCount', (
      select count(*) from public.family_members parents
      where parents.family_id = family.id and parents.role = 'parent'
    ),
    'childCount', (
      select count(*) from public.family_members children
      where children.family_id = family.id and children.role = 'child'
    ),
    'maxChildren', family.max_children,
    'maxMembers', family.max_members,
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

  insert into public.families (name, owner_id, invite_code, max_children, max_members)
  values (
    nullif(trim(family_name), ''),
    current_user_id,
    generated_code,
    4,
    5
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

-- Internal: rotate the invite code so a code that has already been shared can be
-- invalidated. Not granted to `authenticated` — callers go through the RPCs below.
create or replace function public.rotate_family_invite_code(target_family_id uuid)
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
  where id = target_family_id;

  return new_code;
end;
$$;

revoke all on function public.rotate_family_invite_code(uuid) from public;
revoke all on function public.rotate_family_invite_code(uuid) from anon;
revoke all on function public.rotate_family_invite_code(uuid) from authenticated;

drop function if exists public.join_family_space(text);
drop function if exists public.join_family_space(text, text);

-- Joining is always as a child. The role must never come from the client: the
-- invite code is shared with the very people we are guarding against, so a
-- client-supplied role let any invitee join as `parent` and read the whole
-- family's session history, evict members and rotate the invite code.
-- Promotion is a deliberate act of the owner (see promote_family_member).
create or replace function public.join_family_space(family_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_family public.families%rowtype;
  current_member_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1 from public.family_members where user_id = current_user_id
  ) then
    raise exception 'Ce compte appartient déjà à une famille.';
  end if;

  -- `for update` serialises concurrent joins against the member-count check
  -- below, which would otherwise let simultaneous joins exceed max_members.
  select *
  into target_family
  from public.families
  where invite_code = upper(trim(family_code))
  for update;

  if target_family.id is null or not public.family_owner_has_access(target_family.id) then
    raise exception 'Code familial invalide ou abonnement inactif.';
  end if;

  select count(*)
  into current_member_count
  from public.family_members
  where family_id = target_family.id;

  if current_member_count >= target_family.max_members then
    raise exception 'Cette famille a atteint sa limite de % comptes.', target_family.max_members;
  end if;

  if (
    select count(*)
    from public.family_members
    where family_id = target_family.id
      and role = 'child'
  ) >= target_family.max_children then
    raise exception 'Cette famille a atteint sa limite de % profils enfants.', target_family.max_children;
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

-- Only the subscription owner may hand out the parent role, and only to someone
-- who is already a member of their own family.
create or replace function public.promote_family_member(member_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_family_id uuid;
begin
  select family.id
  into owner_family_id
  from public.families family
  where family.owner_id = auth.uid()
    and public.family_owner_has_access(family.id);

  if owner_family_id is null then
    raise exception 'Seul le propriétaire de l’abonnement peut nommer un parent.';
  end if;

  update public.family_members
  set role = 'parent'
  where family_id = owner_family_id
    and user_id = member_user_id;

  if not found then
    raise exception 'Membre familial introuvable.';
  end if;

  update public.profiles
  set is_parent = true,
      updated_at = now()
  where id = member_user_id;
end;
$$;

revoke all on function public.promote_family_member(uuid) from public;
revoke all on function public.promote_family_member(uuid) from anon;
grant execute on function public.promote_family_member(uuid) to authenticated;

create or replace function public.regenerate_family_invite_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_family_id uuid;
begin
  select member.family_id
  into parent_family_id
  from public.family_members member
  where member.user_id = auth.uid()
    and member.role = 'parent'
    and public.family_owner_has_access(member.family_id);

  if parent_family_id is null then
    raise exception 'Un espace Famille actif est nécessaire.';
  end if;

  return public.rotate_family_invite_code(parent_family_id);
end;
$$;

revoke all on function public.regenerate_family_invite_code() from public;
revoke all on function public.regenerate_family_invite_code() from anon;
grant execute on function public.regenerate_family_invite_code() to authenticated;

create or replace function public.remove_family_member(member_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_family_id uuid;
  removed_role text;
begin
  select member.family_id
  into parent_family_id
  from public.family_members member
  where member.user_id = auth.uid()
    and member.role = 'parent'
    and public.family_owner_has_access(member.family_id);

  if parent_family_id is null then
    raise exception 'Un espace Famille actif est nécessaire.';
  end if;

  if member_user_id = auth.uid() then
    raise exception 'Utilise plutôt l’action Quitter la famille.';
  end if;

  if exists (
    select 1
    from public.families family
    where family.id = parent_family_id
      and family.owner_id = member_user_id
  ) then
    raise exception 'Le propriétaire de l’abonnement ne peut pas être retiré.';
  end if;

  -- Only the owner may remove another parent. Without this, any promoted parent
  -- could evict the other parents (and rotate the invite code behind them) —
  -- the `parent` role would be far more powerful than its name suggests.
  if
    exists (
      select 1
      from public.family_members member
      where member.family_id = parent_family_id
        and member.user_id = member_user_id
        and member.role = 'parent'
    )
    and not exists (
      select 1
      from public.families family
      where family.id = parent_family_id
        and family.owner_id = auth.uid()
    )
  then
    raise exception 'Seul le propriétaire de l’abonnement peut retirer un parent.';
  end if;

  delete from public.family_members
  where family_id = parent_family_id
    and user_id = member_user_id
  returning role into removed_role;

  if removed_role is null then
    raise exception 'Membre familial introuvable.';
  end if;

  update public.profiles
  set family_id = null,
      is_parent = false,
      updated_at = now()
  where id = member_user_id;

  -- The invite code never expires, so an evicted member who still holds it
  -- could simply re-join. Rotating it is what makes the eviction stick.
  perform public.rotate_family_invite_code(parent_family_id);
end;
$$;

revoke all on function public.remove_family_member(uuid) from public;
revoke all on function public.remove_family_member(uuid) from anon;
grant execute on function public.remove_family_member(uuid) to authenticated;

create or replace function public.remove_family_child(child_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.remove_family_member(child_user_id);
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
  if exists (
    select 1 from public.families family
    where family.owner_id = auth.uid()
  ) then
    raise exception 'Le propriétaire doit supprimer l’espace familial pour le fermer.';
  end if;

  delete from public.family_members
  where user_id = auth.uid();

  if not found then
    raise exception 'Aucun compte à retirer de la famille.';
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
  select member.family_id
  into owned_family_id
  from public.family_members member
  where member.user_id = auth.uid()
    and member.role = 'parent'
    and public.family_owner_has_access(member.family_id);

  if owned_family_id is null then
    raise exception 'Un espace Famille actif est nécessaire.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'userId', member.user_id,
        'displayName', coalesce(snapshot.payload #>> '{profile,displayName}', profile.display_name, 'Profil'),
        'role', member.role,
        'isOwner', family.owner_id = member.user_id,
        'joinedAt', member.joined_at,
        -- VERIFIED: from daily_sessions, which only record_daily_session() can
        -- write and which refuses a session that could not have been worked.
        -- These used to come from the snapshot — a blob the child writes — so a
        -- child could simply hand their parents a 365-day streak.
        'currentStreak', public.verified_streak(member.user_id),
        'longestStreak', coalesce(verified.longest_streak, 0),
        'totalXP', coalesce(verified.total_xp, 0),
        'totalSessions', coalesce(verified.total_sessions, 0),
        'totalMinutes', coalesce(verified.total_minutes, 0),
        -- DECLARATIVE: the child's own claim about their memorisation. Not a
        -- cheat vector for the daily habit a parent follows, but not proof either.
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
        -- VERIFIED history, straight from the accepted sessions. Another parent's
        -- day-by-day history is none of a parent's business, so it is only
        -- returned for children and for the caller themselves.
        'history', case
          when member.role = 'child' or member.user_id = auth.uid() then coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'date', day.session_date,
                'completedAt', day.completed_at,
                'durationSeconds', day.active_seconds,
                'xpEarned', day.xp_earned,
                'surahsReviewed', day.surahs_reviewed,
                'versesLearned', day.verses_learned,
                'isPerfect', day.is_perfect,
                'sessionCount', day.session_count
              )
              order by day.session_date desc
            )
            from public.daily_sessions day
            where day.user_id = member.user_id
              and day.session_count > 0
              and day.session_date >= current_date - 90
          ), '[]'::jsonb)
          else '[]'::jsonb
        end,
        -- VERIFIED: whether today's work actually happened, and how long it
        -- actually took. This is the question the family plan exists to answer.
        'todayCompleted', coalesce(today.session_count, 0) > 0,
        'todayReviews', coalesce(today.surahs_reviewed, 0),
        'todayVersesLearned', coalesce(today.verses_learned, 0),
        'todayXPEarned', coalesce(today.xp_earned, 0),
        'todayMinutes', round(coalesce(today.active_seconds, 0) / 60.0),
        'lastSessionDate', verified.last_session_date,
        'snapshotUpdatedAt', snapshot.updated_at
      )
      order by member.role desc, member.joined_at
    ),
    '[]'::jsonb
  )
  into result
  from public.family_members member
  join public.families family on family.id = member.family_id
  join public.profiles profile on profile.id = member.user_id
  left join public.user_state_snapshots snapshot on snapshot.user_id = member.user_id
  left join lateral (
    select
      sum(day.xp_earned)::integer as total_xp,
      sum(day.session_count)::integer as total_sessions,
      round(sum(day.active_seconds) / 60.0)::integer as total_minutes,
      max(day.session_date) as last_session_date,
      public.verified_longest_streak(member.user_id) as longest_streak
    from public.daily_sessions day
    where day.user_id = member.user_id
      and day.session_count > 0
  ) verified on true
  left join lateral (
    select day.session_count, day.surahs_reviewed, day.verses_learned,
           day.xp_earned, day.active_seconds
    from public.daily_sessions day
    where day.user_id = member.user_id
      -- The child's day, not the server's. `current_date` is UTC on Supabase, so
      -- a Paris session finished at 00:30 landed on a date the parent's "today"
      -- would never match — the dashboard showed the routine as not done, minutes
      -- after it was.
      and day.session_date = (
        now() at time zone coalesce(profile.timezone, 'UTC')
      )::date
      and day.session_count > 0
  ) today on true
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

-- ---------------------------------------------------------------------------
-- Sessions: the server decides whether a session counts
-- ---------------------------------------------------------------------------

-- Mirrors SERVER_MIN_SECONDS_PER_ITEM in src/utils/effort.ts, and MUST stay below
-- the smallest floor the app itself enforces. Anything higher refuses work that
-- was honestly done: sabqi verses are reported as reviews, the app only gates a
-- short verse at 4 s, and a 5 s-per-review floor here rejected four honest sabqi
-- verses on Al-Ikhlas outright.
--
-- This is only a sanity net. The real gate is the client's, and the real
-- protection is that the time is credited exactly as it was spent.
create or replace function public.session_items(
  verses_learned integer,
  surahs_reviewed integer,
  recited_verses integer
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(0, verses_learned)
       + greatest(0, surahs_reviewed)
       + greatest(0, recited_verses);
$$;

revoke all on function public.session_items(integer, integer, integer) from public;
revoke all on function public.session_items(integer, integer, integer) from anon;

drop function if exists public.session_time_floor(integer, integer);

create or replace function public.session_time_floor(
  verses_learned integer,
  surahs_reviewed integer,
  recited_verses integer
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select public.session_items(verses_learned, surahs_reviewed, recited_verses) * 3;
$$;

revoke all on function public.session_time_floor(integer, integer, integer) from public;
revoke all on function public.session_time_floor(integer, integer, integer) from anon;

/*
 * Records one completed session, or refuses it.
 *
 * This is what makes the family dashboard mean something. Everything a parent
 * sees used to come from a JSON blob the child wrote themselves, so a child could
 * simply hand their parents a 365-day streak. The figures now come from this
 * table, and this table only accepts sessions that could actually have been
 * worked:
 *
 *  - the time claimed must cover a plausible minimum per item, which is what
 *    stops tapping straight through;
 *  - it cannot exceed the wall-clock time between start and finish, so no amount
 *    of tapping fabricates minutes;
 *  - it is bounded, so idling does not fabricate them either;
 *  - it cannot be back-dated, so a missed day stays missed;
 *  - a resubmitted session (the offline queue retries) is accepted once.
 *
 * Every parameter is prefixed `p_`. This is not cosmetic: `session_date`,
 * `completed_at` and friends are also column names, and an unprefixed parameter
 * makes `ON CONFLICT (user_id, session_date)` ambiguous — PL/pgSQL then raises
 * "column reference is ambiguous" at runtime, on every single call, while the
 * script still installs cleanly. The whole feature would have been silently dead.
 *
 * Honest limit, stated plainly: a determined child who calls this RPC directly can
 * still submit plausible-but-false numbers for today. What they cannot do is
 * rebuild a history: back-dating is refused.
 */

-- Both older shapes must go. `create or replace` cannot rename input parameters,
-- and the 9-argument version predates `recited_verses`.
drop function if exists public.record_daily_session(
  text, date, timestamptz, timestamptz, integer, integer, integer, integer, boolean
);
drop function if exists public.record_daily_session(
  text, date, timestamptz, timestamptz, integer, integer, integer, integer, boolean, integer
);

create or replace function public.record_daily_session(
  p_client_id text,
  p_session_date date,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_active_seconds integer,
  p_xp_earned integer,
  p_surahs_reviewed integer,
  p_verses_learned integer,
  p_is_perfect boolean default false,
  p_recited_verses integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  elapsed_seconds integer;
  floor_seconds integer;
  item_count integer;
  day_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- A null slips through every comparison below (null < 0 is null, not true), so
  -- it is rejected up front rather than blowing up on a NOT NULL constraint and
  -- being retried forever by the offline queue.
  if p_client_id is null or length(p_client_id) = 0 or length(p_client_id) > 100
     or p_session_date is null
     or p_active_seconds is null or p_xp_earned is null
     or p_surahs_reviewed is null or p_verses_learned is null
     or p_recited_verses is null
  then
    return jsonb_build_object('accepted', false, 'reason', 'invalid_payload');
  end if;

  -- Already recorded: the offline queue retried. Accept without counting twice.
  if exists (
    select 1
    from public.session_submissions submission
    where submission.user_id = current_user_id
      and submission.client_id = p_client_id
  ) then
    return jsonb_build_object('accepted', true, 'duplicate', true);
  end if;

  -- A full recitation of Al-Baqara is 286 recited verses, so that bound is wide;
  -- the other two are not.
  if p_verses_learned < 0 or p_verses_learned > 50
     or p_surahs_reviewed < 0 or p_surahs_reviewed > 20
     or p_recited_verses < 0 or p_recited_verses > 300
     or p_xp_earned < 0 or p_xp_earned > 6000
  then
    return jsonb_build_object('accepted', false, 'reason', 'implausible_counts');
  end if;

  item_count := public.session_items(
    p_verses_learned, p_surahs_reviewed, p_recited_verses
  );

  if item_count = 0 then
    return jsonb_build_object('accepted', false, 'reason', 'empty_session');
  end if;

  if p_started_at is null or p_completed_at is null
     or p_completed_at < p_started_at
     or p_completed_at > now() + interval '5 minutes'
     -- No lower bound meant a child could post a session dated two years ago, one
     -- call per day, and hand their parents a fabricated year of history — in the
     -- very table that claims to only hold work that was really done.
     or p_completed_at < now() - interval '2 days'
  then
    return jsonb_build_object('accepted', false, 'reason', 'implausible_timestamps');
  end if;

  -- The session must be filed on the day it was finished. A one-day slack would
  -- let a missed day be filled in from the next one — which is exactly the hole
  -- this is supposed to close — so the only tolerance is the timezone one: a
  -- session finished just after midnight UTC may still belong to the previous
  -- local day.
  if p_session_date <> p_completed_at::date
     and not (
       p_session_date = p_completed_at::date - 1
       and p_completed_at::time < time '14:00'
     )
  then
    return jsonb_build_object('accepted', false, 'reason', 'date_mismatch');
  end if;

  elapsed_seconds := ceil(
    extract(epoch from (p_completed_at - p_started_at))
  )::integer;
  floor_seconds := public.session_time_floor(
    p_verses_learned, p_surahs_reviewed, p_recited_verses
  );

  -- Tapped straight through: not enough time to have read anything.
  if p_active_seconds < floor_seconds then
    return jsonb_build_object(
      'accepted', false,
      'reason', 'too_fast',
      'required_seconds', floor_seconds
    );
  end if;

  -- Cannot claim more focused time than the session actually lasted, nor more
  -- than an hour, nor more than its items could plausibly hold.
  if p_active_seconds > elapsed_seconds + 5
     or p_active_seconds > 3600
     or p_active_seconds > 180 * item_count
  then
    return jsonb_build_object('accepted', false, 'reason', 'implausible_duration');
  end if;

  select coalesce(day.session_count, 0)
  into day_count
  from public.daily_sessions day
  where day.user_id = current_user_id
    and day.session_date = p_session_date;

  if coalesce(day_count, 0) >= 20 then
    return jsonb_build_object('accepted', false, 'reason', 'daily_limit');
  end if;

  insert into public.session_submissions (user_id, client_id, session_date)
  values (current_user_id, p_client_id, p_session_date);

  insert into public.daily_sessions as day (
    user_id, session_date, completed, completed_at,
    duration_seconds, active_seconds, session_count,
    xp_earned, surahs_reviewed, recited_verses, verses_learned, is_perfect
  )
  values (
    current_user_id,
    p_session_date,
    true,
    p_completed_at,
    p_active_seconds,
    p_active_seconds,
    1,
    p_xp_earned,
    p_surahs_reviewed,
    p_recited_verses,
    p_verses_learned,
    p_is_perfect
  )
  on conflict (user_id, session_date) do update
  set completed = true,
      completed_at = greatest(day.completed_at, excluded.completed_at),
      duration_seconds = day.duration_seconds + excluded.duration_seconds,
      active_seconds = day.active_seconds + excluded.active_seconds,
      session_count = day.session_count + 1,
      xp_earned = day.xp_earned + excluded.xp_earned,
      surahs_reviewed = day.surahs_reviewed + excluded.surahs_reviewed,
      recited_verses = day.recited_verses + excluded.recited_verses,
      verses_learned = day.verses_learned + excluded.verses_learned,
      is_perfect = day.is_perfect or excluded.is_perfect;

  return jsonb_build_object('accepted', true, 'duplicate', false);
end;
$$;

revoke all on function public.record_daily_session(
  text, date, timestamptz, timestamptz, integer, integer, integer, integer, boolean, integer
) from public;
revoke all on function public.record_daily_session(
  text, date, timestamptz, timestamptz, integer, integer, integer, integer, boolean, integer
) from anon;
grant execute on function public.record_daily_session(
  text, date, timestamptz, timestamptz, integer, integer, integer, integer, boolean, integer
) to authenticated;

-- Consecutive days ending today or yesterday, computed from what the server
-- accepted -- not from what the device claims.
--
-- "Today" is the member's own day: `current_date` is UTC on Supabase, so for a
-- user west of it the server rolls over hours early and a live streak read as
-- broken.
create or replace function public.verified_streak(target_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with member_today as (
    select (
      now() at time zone coalesce(profile.timezone, 'UTC')
    )::date as today
    from public.profiles profile
    where profile.id = target_user_id
  ),
  days as (
    select distinct day.session_date
    from public.daily_sessions day
    where day.user_id = target_user_id
      and day.session_count > 0
  ),
  ordered as (
    select
      days.session_date,
      days.session_date
        + ((row_number() over (order by days.session_date desc)) || ' days')::interval
        as anchor
    from days
  ),
  latest as (
    select ordered.anchor
    from ordered
    where ordered.session_date
      >= coalesce((select member_today.today from member_today), current_date) - 1
    order by ordered.session_date desc
    limit 1
  )
  select coalesce((
    select count(*)::integer
    from ordered
    where ordered.anchor = (select latest.anchor from latest)
  ), 0);
$$;

revoke all on function public.verified_streak(uuid) from public;
revoke all on function public.verified_streak(uuid) from anon;
revoke all on function public.verified_streak(uuid) from authenticated;

-- The longest run of consecutive days ever recorded, from accepted sessions only.
create or replace function public.verified_longest_streak(target_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with days as (
    select distinct day.session_date
    from public.daily_sessions day
    where day.user_id = target_user_id
      and day.session_count > 0
  ),
  islands as (
    select
      days.session_date
        - ((row_number() over (order by days.session_date)) || ' days')::interval
        as island
    from days
  )
  select coalesce(max(run.length), 0)::integer
  from (
    select count(*) as length
    from islands
    group by islands.island
  ) run;
$$;

revoke all on function public.verified_longest_streak(uuid) from public;
revoke all on function public.verified_longest_streak(uuid) from anon;
revoke all on function public.verified_longest_streak(uuid) from authenticated;
