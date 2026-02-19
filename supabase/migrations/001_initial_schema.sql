-- ============================================================
-- Applio — Initial database schema
-- ============================================================

-- 1. PROFILES
-- Extends auth.users with app-specific data.
-- Created automatically via trigger on signup.
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email       text,
  avatar_url  text,
  plan        text not null default 'free',  -- 'free' | 'pro'
  locale      text,                          -- preferred language (e.g. 'es', 'en')
  theme       text,                          -- 'light' | 'dark'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. CVS
-- Each user can have multiple CVs (for now we create one on first sync).
-- cv_data stores the full CVData JSON, settings stores visual preferences.
-- ============================================================
create table cvs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null default 'Mi CV',
  cv_data     jsonb not null,       -- CVData (personalInfo, experience, education, etc.)
  settings    jsonb not null default '{}'::jsonb,
  -- settings shape: {
  --   colorScheme: string,
  --   fontFamily: string,
  --   fontSizeLevel: number,
  --   pattern: { name, sidebarIntensity, mainIntensity, scope }
  -- }
  is_published boolean not null default false,
  slug         text unique,          -- for /p/slug public sharing (pro feature)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index for fast lookup by user
create index idx_cvs_user_id on cvs(user_id);

-- Index for public profile lookup
create index idx_cvs_slug on cvs(slug) where slug is not null;

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table cvs enable row level security;

-- Profiles: users can read and update only their own
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- CVs: full CRUD on own data
create policy "Users can view own CVs"
  on cvs for select
  using (auth.uid() = user_id);

create policy "Users can insert own CVs"
  on cvs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own CVs"
  on cvs for update
  using (auth.uid() = user_id);

create policy "Users can delete own CVs"
  on cvs for delete
  using (auth.uid() = user_id);

-- Published CVs: anyone can read (for public profile pages)
create policy "Anyone can view published CVs"
  on cvs for select
  using (is_published = true);

-- ============================================================
-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 5. AUTO-UPDATE updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger cvs_updated_at
  before update on cvs
  for each row execute function update_updated_at();
