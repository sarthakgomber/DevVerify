-- ============================================================
-- DevVerify Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ANALYSES TABLE
-- Stores every profile analysis run
-- ============================================================
create table public.analyses (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- who ran this analysis
  analyzed_by uuid references auth.users(id) on delete set null,

  -- the leetcode profile being analyzed
  leetcode_username text not null,

  -- scores
  profile_score integer not null check (profile_score >= 0 and profile_score <= 100),
  verdict text not null check (verdict in ('genuine', 'suspicious', 'highly_suspicious')),

  -- raw signal breakdown stored as JSON
  signals jsonb not null default '{}',

  -- submission stats
  total_solved integer default 0,
  easy_solved integer default 0,
  medium_solved integer default 0,
  hard_solved integer default 0,
  total_submissions integer default 0,
  account_age_days integer default 0,

  -- burst day data
  burst_days jsonb default '[]',
  submission_heatmap jsonb default '{}',

  -- shareable report
  report_id text unique not null default encode(gen_random_bytes(8), 'hex'),
  is_public boolean default true
);

-- ============================================================
-- VERIFIED PROFILES TABLE
-- Links a DevVerify user to a LeetCode username after email verification
-- ============================================================
create table public.verified_profiles (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  user_id uuid references auth.users(id) on delete cascade not null,
  leetcode_username text not null,

  -- verification state
  is_verified boolean default false,
  verification_token text unique,
  verification_token_expires_at timestamp with time zone,
  verified_at timestamp with time zone,

  -- leetcode email used for verification
  leetcode_email text,

  unique(user_id, leetcode_username)
);

-- ============================================================
-- QUIZ SESSIONS TABLE (Phase 2 - created now, used later)
-- ============================================================
create table public.quiz_sessions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  user_id uuid references auth.users(id) on delete cascade not null,
  analysis_id uuid references public.analyses(id) on delete cascade not null,
  leetcode_username text not null,

  -- questions and answers stored as JSON
  questions jsonb not null default '[]',
  answers jsonb not null default '[]',

  -- scoring
  quiz_score integer check (quiz_score >= 0 and quiz_score <= 100),
  final_score integer check (final_score >= 0 and final_score <= 100),

  status text default 'pending' check (status in ('pending', 'in_progress', 'completed'))
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.analyses enable row level security;
alter table public.verified_profiles enable row level security;
alter table public.quiz_sessions enable row level security;

-- Analyses: anyone can read public reports, only auth users can create
create policy "Public reports are viewable by everyone"
  on public.analyses for select
  using (is_public = true);

create policy "Authenticated users can create analyses"
  on public.analyses for insert
  to authenticated
  with check (analyzed_by = auth.uid());

create policy "Users can view their own analyses"
  on public.analyses for select
  to authenticated
  using (analyzed_by = auth.uid());

-- Verified profiles: users manage only their own
create policy "Users can view their own verified profiles"
  on public.verified_profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own verified profiles"
  on public.verified_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own verified profiles"
  on public.verified_profiles for update
  to authenticated
  using (user_id = auth.uid());

-- Quiz sessions: only the owner
create policy "Users can manage their own quiz sessions"
  on public.quiz_sessions for all
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index analyses_leetcode_username_idx on public.analyses(leetcode_username);
create index analyses_analyzed_by_idx on public.analyses(analyzed_by);
create index analyses_report_id_idx on public.analyses(report_id);
create index verified_profiles_user_id_idx on public.verified_profiles(user_id);
create index verified_profiles_username_idx on public.verified_profiles(leetcode_username);
