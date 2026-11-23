create table if not exists public.workout_sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source text not null check (source in ('program', 'generated', 'custom')),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_at desc);

create table if not exists public.workout_sets (
  id text primary key,
  session_id text not null references public.workout_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  set_number integer not null check (set_number > 0),
  reps integer not null check (reps > 0),
  weight_kg numeric(7, 2) not null default 0 check (weight_kg >= 0),
  completed_at timestamptz not null
);

create index if not exists workout_sets_session_idx
  on public.workout_sets (session_id, set_number);

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

revoke all on public.workout_sessions from anon;
revoke all on public.workout_sets from anon;
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.workout_sets to authenticated;

drop policy if exists "Users can read their own workout sessions" on public.workout_sessions;
create policy "Users can read their own workout sessions"
  on public.workout_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own workout sessions" on public.workout_sessions;
create policy "Users can create their own workout sessions"
  on public.workout_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own workout sessions" on public.workout_sessions;
create policy "Users can update their own workout sessions"
  on public.workout_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own workout sessions" on public.workout_sessions;
create policy "Users can delete their own workout sessions"
  on public.workout_sessions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own workout sets" on public.workout_sets;
create policy "Users can read their own workout sets"
  on public.workout_sets for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own workout sets" on public.workout_sets;
create policy "Users can create their own workout sets"
  on public.workout_sets for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.workout_sessions session
      where session.id = session_id
        and session.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update their own workout sets" on public.workout_sets;
create policy "Users can update their own workout sets"
  on public.workout_sets for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.workout_sessions session
      where session.id = session_id
        and session.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete their own workout sets" on public.workout_sets;
create policy "Users can delete their own workout sets"
  on public.workout_sets for delete
  to authenticated
  using ((select auth.uid()) = user_id);
