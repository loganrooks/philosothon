-- Apply Row Level Security (RLS) policies to core tables:
-- schedule_items, event_details, profiles, registrations

-- ==== SCHEDULE ITEMS ====

-- Enable RLS
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items FORCE ROW LEVEL SECURITY;

-- Drop existing policies (if any) for idempotency
DROP POLICY IF EXISTS "Allow public read access on schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "Allow admin full access on schedule_items" ON public.schedule_items;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access on schedule_items" ON public.schedule_items
  FOR SELECT
  USING (true);

-- Policy: Allow admin full access
CREATE POLICY "Allow admin full access on schedule_items" ON public.schedule_items
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ==== EVENT DETAILS ====

-- Enable RLS
ALTER TABLE public.event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_details FORCE ROW LEVEL SECURITY;

-- Drop existing policies (if any) for idempotency
DROP POLICY IF EXISTS "Allow public read access on event_details" ON public.event_details;
DROP POLICY IF EXISTS "Allow admin full access on event_details" ON public.event_details;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access on event_details" ON public.event_details
  FOR SELECT
  USING (true);

-- Policy: Allow admin full access
CREATE POLICY "Allow admin full access on event_details" ON public.event_details
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ==== PROFILES ====
-- Note: RLS and policies likely already exist from 20250419131936_create_p0_rls_policies.sql
-- Ensuring RLS is enabled and forced as a safety measure.
-- Re-applying policies defensively after dropping existing ones.

-- Enable RLS (should be idempotent if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow admin full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile (excluding role)" ON public.profiles;

-- Policy: Admins have full access to profiles
CREATE POLICY "Allow admin full access on profiles" ON public.profiles
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Policy: Users can select their own profile
CREATE POLICY "Allow users to select own profile" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Users can update their own profile (excluding role)
CREATE POLICY "Allow users to update own profile (excluding role)" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Ensure the role column is not being changed during the update
    role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );


-- ==== REGISTRATIONS ====

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations FORCE ROW LEVEL SECURITY;

-- Drop existing policies (if any) for idempotency
DROP POLICY IF EXISTS "Allow users full access to own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow admin full access on registrations" ON public.registrations;

-- Policy: Allow users full access to their own registration record(s)
-- Assuming the column linking to auth.users is named 'user_id'
CREATE POLICY "Allow users full access to own registrations" ON public.registrations
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Allow admin full access
CREATE POLICY "Allow admin full access on registrations" ON public.registrations
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');