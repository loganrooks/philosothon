-- Migration: Create partial_registrations table
-- Date: 20250422113204

BEGIN;

-- Ensure the moddatetime function exists
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the table to store partial registration progress for signed-in users
CREATE TABLE public.partial_registrations (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, -- Link directly to profiles which links to auth.users
  partial_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores answers keyed by question ID (e.g., {"firstName": "Test", "email": "test@example.com", ...})
  last_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.partial_registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own partial registration data
CREATE POLICY "Allow individual user access" ON public.partial_registrations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow admins to view/delete any partial registration (for cleanup/support)
-- Note: This assumes an 'admin' role exists in the profiles table.
CREATE POLICY "Allow admin read access" ON public.partial_registrations
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete access" ON public.partial_registrations
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger to automatically update last_updated_at timestamp on modification
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.partial_registrations
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (last_updated_at); -- Pass column name as argument

-- Optional: Index on last_updated_at for potential cleanup jobs
CREATE INDEX IF NOT EXISTS idx_partial_registrations_last_updated_at ON public.partial_registrations(last_updated_at);

COMMIT;