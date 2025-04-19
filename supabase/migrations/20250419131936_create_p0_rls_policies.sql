-- Helper function to get the role of the currently authenticated user
-- SECURITY DEFINER is used to allow the function to read the profiles table
-- even if the user's direct access might be restricted by other RLS policies.
-- This is generally safe here as it only reads the role based on auth.uid().
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result FROM public.profiles WHERE id = auth.uid();
  RETURN user_role_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the helper function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ==== PROFILES ====

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY; -- Ensures table owner is also subject to RLS

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

-- ==== THEMES ====

-- Enable RLS on themes table
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes FORCE ROW LEVEL SECURITY;

-- Policy: Allow public read access to themes
CREATE POLICY "Allow public read access on themes" ON public.themes
  FOR SELECT
  USING (true); -- Everyone can read

-- Policy: Allow admin full access to themes
CREATE POLICY "Allow admin full access on themes" ON public.themes
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ==== WORKSHOPS ====

-- Enable RLS on workshops table
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops FORCE ROW LEVEL SECURITY;

-- Policy: Allow public read access to workshops
CREATE POLICY "Allow public read access on workshops" ON public.workshops
  FOR SELECT
  USING (true); -- Everyone can read

-- Policy: Allow admin full access to workshops
CREATE POLICY "Allow admin full access on workshops" ON public.workshops
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ==== FAQ ITEMS ====

-- Enable RLS on faq_items table
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items FORCE ROW LEVEL SECURITY;

-- Policy: Allow public read access to faq_items
CREATE POLICY "Allow public read access on faq_items" ON public.faq_items
  FOR SELECT
  USING (true); -- Everyone can read

-- Policy: Allow admin full access to faq_items
CREATE POLICY "Allow admin full access on faq_items" ON public.faq_items
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');