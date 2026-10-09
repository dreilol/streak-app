-- Run AFTER schema.sql. Safe to run more than once.
alter table profiles enable row level security;
alter table logs     enable row level security;

drop policy if exists "read profiles" on profiles;
drop policy if exists "update own profile" on profiles;
drop policy if exists "admin manage profiles" on profiles;
drop policy if exists "read own logs" on logs;

-- "Am I an admin?" without triggering RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- Everyone signed in can see the leaderboard and search students.
create policy "read profiles" on profiles
  for select to authenticated using (true);

-- SECURITY FIX: the old "update own profile" policy let any student edit their
-- own row, including role (make themselves admin) and current_streak. Only
-- admins can change profiles now. The tap functions use the service role,
-- which bypasses RLS, so streak updates still work.
create policy "admin manage profiles" on profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "read own logs" on logs
  for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin());
