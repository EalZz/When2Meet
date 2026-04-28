alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table availability_day_notes enable row level security;
alter table availability_slots enable row level security;
alter table personal_availability_day_notes enable row level security;
alter table personal_availability_slots enable row level security;
alter table user_issues enable row level security;

create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members
    where room_members.room_id = target_room_id
      and room_members.user_id = auth.uid()
  );
$$;

grant execute on function public.is_room_member(uuid) to authenticated;

create policy "profiles are readable by authenticated users"
on profiles for select
to authenticated
using (true);

create policy "users can insert their own profile"
on profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "users can update their own profile"
on profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "room members can read rooms"
on rooms for select
to authenticated
using (public.is_room_member(rooms.id));

create policy "authenticated users can create rooms"
on rooms for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy "members can read room memberships"
on room_members for select
to authenticated
using (public.is_room_member(room_members.room_id));

create policy "users can add themselves to rooms"
on room_members for insert
to authenticated
with check (user_id = auth.uid());

create policy "members can read availability notes"
on availability_day_notes for select
to authenticated
using (public.is_room_member(availability_day_notes.room_id));

create policy "users can manage their own availability notes"
on availability_day_notes for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "members can read availability slots"
on availability_slots for select
to authenticated
using (public.is_room_member(availability_slots.room_id));

create policy "users can manage their own availability slots"
on availability_slots for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users can read their own personal availability notes"
on personal_availability_day_notes for select
to authenticated
using (user_id = auth.uid());

create policy "users can manage their own personal availability notes"
on personal_availability_day_notes for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users can read their own personal availability slots"
on personal_availability_slots for select
to authenticated
using (user_id = auth.uid());

create policy "users can manage their own personal availability slots"
on personal_availability_slots for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users can create issues"
on user_issues for insert
to authenticated
with check (user_id = auth.uid());

create policy "users can read their own issues"
on user_issues for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "admins can update issues"
on user_issues for update
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
