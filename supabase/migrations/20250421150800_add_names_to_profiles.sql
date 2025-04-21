-- Add first_name and last_name columns to profiles table

ALTER TABLE public.profiles
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Optional: Add email column if it doesn't exist and is needed separate from auth.users.email
-- Check profiles schema first (20250419181847_create_profiles_table.sql) - it doesn't have email, let's add it.
ALTER TABLE public.profiles
ADD COLUMN email TEXT; 

-- Consider adding a constraint if email should be unique in profiles too
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

COMMENT ON COLUMN public.profiles.first_name IS 'User''s first name, potentially synced from registration.';
COMMENT ON COLUMN public.profiles.last_name IS 'User''s last name, potentially synced from registration.';
COMMENT ON COLUMN public.profiles.email IS 'User''s email, potentially synced from auth.users.';