create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin')),
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique(room_id, user_id)
);

create table if not exists availability_day_notes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  title text,
  updated_at timestamptz not null default now(),
  unique(room_id, user_id, date)
);

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  slot_time time not null,
  title text,
  status text not null check (status in ('available', 'unavailable')),
  updated_at timestamptz not null default now(),
  unique(room_id, user_id, date, slot_time)
);

create table if not exists personal_availability_day_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  title text,
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists personal_availability_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  slot_time time not null,
  title text,
  status text not null check (status in ('available', 'unavailable')),
  updated_at timestamptz not null default now(),
  unique(user_id, date, slot_time)
);

alter table if exists availability_slots add column if not exists title text;
alter table if exists personal_availability_slots add column if not exists title text;

create table if not exists user_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  issue_type text not null check (issue_type in ('bug', 'improvement', 'feature')),
  title text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.join_room_by_invite_code(input_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select id
    into target_room_id
  from rooms
  where invite_code = upper(trim(input_invite_code));

  if target_room_id is null then
    raise exception 'INVITE_CODE_NOT_FOUND';
  end if;

  insert into room_members (room_id, user_id, role)
  values (target_room_id, auth.uid(), 'member')
  on conflict (room_id, user_id) do nothing;

  return target_room_id;
end;
$$;

grant execute on function public.join_room_by_invite_code(text) to authenticated;

create index if not exists room_members_user_id_idx on room_members(user_id);
create index if not exists room_members_room_id_idx on room_members(room_id);
create index if not exists availability_slots_room_date_idx on availability_slots(room_id, date);
create index if not exists availability_day_notes_room_date_idx on availability_day_notes(room_id, date);
create index if not exists personal_availability_slots_user_date_idx on personal_availability_slots(user_id, date);
create index if not exists personal_availability_day_notes_user_date_idx on personal_availability_day_notes(user_id, date);
create index if not exists user_issues_status_idx on user_issues(status);
