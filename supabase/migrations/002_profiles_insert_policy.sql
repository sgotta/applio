-- Allow users to insert their own profile row.
-- Needed for users who signed up before the migration was applied
-- (the on_auth_user_created trigger only fires for NEW signups).
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);
