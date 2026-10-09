-- Safe to run more than once (also on a database that already has these tables).

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null check (role in ('student','admin')) default 'student',
  rfid_tag text unique,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_log_date date,
  created_at timestamptz default now()
);

-- logs
create table if not exists logs (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  tag text not null,
  logged_at timestamptz not null default now(),
  log_date date not null default ((now() at time zone 'Asia/Manila')::date)
);
create index if not exists logs_profile_date on logs (profile_id, log_date);

-- FIX: "today" must be the Philippine date. The old default (current_date)
-- used UTC, so taps between 12:00 AM and 8:00 AM PH time counted as yesterday.
alter table logs alter column log_date
  set default ((now() at time zone 'Asia/Manila')::date);

-- auto-create profile on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), 'student');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- streak trigger
create or replace function apply_streak() returns trigger
language plpgsql as $$
declare last_date date; cur int; longest int;
begin
  select last_log_date, current_streak, longest_streak
    into last_date, cur, longest
    from profiles where id = NEW.profile_id for update;

  -- FIX: ignore a same-day tap AND any older/backfilled log. Before, an older
  -- log fell through to the "else" branch and reset the streak to 1.
  if last_date is not null and NEW.log_date <= last_date then return NEW; end if;

  if last_date = NEW.log_date - 1 then cur := cur + 1;
  else cur := 1; end if;

  if cur > longest then longest := cur; end if;

  update profiles
    set current_streak = cur, longest_streak = longest, last_log_date = NEW.log_date
    where id = NEW.profile_id;

  return NEW;
end $$;

drop trigger if exists trg_streak on logs;
create trigger trg_streak
  after insert on logs
  for each row execute function apply_streak();

-- FIX: the leaderboard listens for live changes on profiles, which only works
-- if the table is part of the realtime publication.
do $$ begin
  alter publication supabase_realtime add table profiles;
exception when duplicate_object then null;
end $$;
