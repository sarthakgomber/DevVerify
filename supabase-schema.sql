-- ============================================================
-- DevVerify Database Schema (Full)
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- 1. analyses — every profile scan ever run (multi-platform)
create table if not exists analyses (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  run_by          uuid references auth.users(id) on delete set null,

  -- platform usernames
  leetcode_username   text,
  github_username     text,
  codeforces_handle   text,

  -- scores per platform (null if not analyzed)
  leetcode_score      int,
  github_score        int,
  codeforces_score    int,

  -- combined score & verdict
  score           int not null,          -- 0-100
  verdict         text not null,         -- 'genuine' | 'suspicious' | 'highly_suspicious'

  -- raw signal values stored as JSON
  signals         jsonb not null default '{}',

  -- full submission data snapshot (so we don't re-fetch)
  raw_data        jsonb not null default '{}',

  -- shareable report
  report_id       text unique not null default substr(md5(random()::text), 0, 12)
);

-- 2. quiz_sessions — AI quiz data
create table if not exists quiz_sessions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  analysis_id     uuid references analyses(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete set null,

  -- quiz state
  status          text not null default 'pending',  -- 'pending' | 'in_progress' | 'completed' | 'expired'

  -- questions & answers stored as JSON
  questions       jsonb not null default '[]',
  answers         jsonb not null default '[]',
  evaluations     jsonb not null default '[]',

  -- scores
  quiz_score      int,  -- 0-100
  final_score     int,  -- combined: profile * 0.6 + quiz * 0.4

  -- timing
  started_at      timestamptz,
  completed_at    timestamptz,
  expires_at      timestamptz
);

-- 3. verified_profiles — links a DevVerify user to their own LeetCode account
create table if not exists verified_profiles (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  leetcode_username   text not null,
  leetcode_email      text not null,
  verified            boolean default false,
  verification_token  text,
  token_expires_at    timestamptz
);

-- 4. user_profiles — extra metadata about our app users
create table if not exists user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  full_name   text,
  avatar_url  text,
  role        text default 'user'   -- 'user' | 'recruiter'
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists analyses_run_by_idx          on analyses(run_by);
create index if not exists analyses_leetcode_idx        on analyses(leetcode_username);
create index if not exists analyses_github_idx          on analyses(github_username);
create index if not exists analyses_codeforces_idx      on analyses(codeforces_handle);
create index if not exists analyses_report_id_idx       on analyses(report_id);
create index if not exists quiz_sessions_analysis_idx   on quiz_sessions(analysis_id);
create index if not exists quiz_sessions_user_idx       on quiz_sessions(user_id);
create index if not exists verified_profiles_user_idx   on verified_profiles(user_id);
create index if not exists verified_profiles_lc_idx     on verified_profiles(leetcode_username);

-- ── Row Level Security ────────────────────────────────────────
alter table analyses           enable row level security;
alter table quiz_sessions      enable row level security;
alter table verified_profiles  enable row level security;
alter table user_profiles      enable row level security;

-- analyses: anyone can read a report by report_id (for shareable links)
create policy "Public reports are readable"
  on analyses for select
  using (true);

-- analyses: anyone can insert (anonymous analysis allowed)
create policy "Anyone can insert analyses"
  on analyses for insert
  with check (true);

-- quiz_sessions: users manage their own quizzes
create policy "Users manage own quiz sessions"
  on quiz_sessions for all
  using (true)
  with check (true);

-- verified_profiles: users manage only their own
create policy "Users manage own verified profile"
  on verified_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_profiles: users manage only their own
create policy "Users manage own profile"
  on user_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── Auto-create user_profile on signup ───────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
