-- Migration: update_registrations_for_incremental
-- Goal: Modify the existing registrations table to match the simplified V3.1 ADR schema.

-- 1. Ensure moddatetime extension is available (idempotent)
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- 2. Temporarily disable RLS if it exists (handle potential errors if not enabled)
DO $$
BEGIN
  ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_object THEN
    -- RLS was not enabled, ignore the error
    RAISE NOTICE 'RLS was not enabled on public.registrations. Skipping disable.';
END $$;

-- 3. Drop existing primary key constraint on 'id' (if it exists)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.registrations'::regclass AND contype = 'p';

  IF constraint_name IS NOT NULL AND constraint_name != 'registrations_pkey' THEN -- Avoid dropping the target PK if it somehow exists
    RAISE NOTICE 'Dropping existing primary key constraint: %', constraint_name;
    EXECUTE 'ALTER TABLE public.registrations DROP CONSTRAINT ' || quote_ident(constraint_name);
  ELSE
     RAISE NOTICE 'No conflicting primary key constraint found or target PK already exists.';
  END IF;
END $$;

-- 4. Drop unnecessary columns from the old V2 schema (handle potential errors if columns don't exist)
-- Using a loop for robustness in case some columns were already dropped
DO $$
DECLARE
  col_name TEXT;
  cols_to_drop TEXT[] := ARRAY[
    'id', 'email', 'full_name', 'university', 'program', 'year_of_study',
    'can_attend_may_3_4', 'may_3_4_comment', 'prior_courses', 'discussion_confidence',
    'writing_confidence', 'familiarity_analytic', 'familiarity_continental', 'familiarity_other',
    'philosophical_traditions', 'philosophical_interests', 'areas_of_interest', 'theme_rankings',
    'theme_suggestion', 'workshop_rankings', 'preferred_working_style', 'teammate_similarity',
    'skill_writing', 'skill_speaking', 'skill_research', 'skill_synthesis', 'skill_critique',
    'mentorship_preference', 'mentorship_areas', 'preferred_teammates', 'complementary_perspectives',
    'familiarity_tech_concepts', 'prior_hackathon_experience', 'prior_hackathon_details',
    'dietary_restrictions', 'accessibility_needs', 'additional_notes', 'how_heard',
    'how_heard_other', 'created_at' -- Keep updated_at
  ];
BEGIN
  FOREACH col_name IN ARRAY cols_to_drop
  LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.registrations DROP COLUMN IF EXISTS ' || quote_ident(col_name);
      RAISE NOTICE 'Dropped column (if existed): %', col_name;
    EXCEPTION
      WHEN dependent_objects_still_exist THEN
        RAISE WARNING 'Could not drop column % due to dependencies. Manual intervention might be required.', col_name;
      WHEN others THEN
        RAISE WARNING 'Error dropping column %: %', col_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- 5. Modify user_id column to be NOT NULL
-- Ensure user_id exists before altering
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'user_id') THEN
    ALTER TABLE public.registrations ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE 'Altered user_id to NOT NULL.';
  ELSE
    RAISE WARNING 'Column user_id not found. Cannot set to NOT NULL.';
  END IF;
END $$;

-- 6. Add primary key constraint on user_id (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.registrations'::regclass AND conname = 'registrations_pkey'
  ) THEN
    ALTER TABLE public.registrations ADD CONSTRAINT registrations_pkey PRIMARY KEY (user_id);
    RAISE NOTICE 'Added primary key constraint on user_id.';
  ELSE
    RAISE NOTICE 'Primary key constraint on user_id already exists.';
  END IF;
END $$;

-- 7. Add new columns required by ADR
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS last_completed_index INTEGER DEFAULT -1 NOT NULL;
-- 8. Ensure updated_at column exists and has default
-- Add column if it doesn't exist (e.g., if dropped previously)
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
-- Set default and NOT NULL constraint
ALTER TABLE public.registrations
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;
-- 9. Ensure updated_at trigger exists (idempotent creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'handle_updated_at' AND tgrelid = 'public.registrations'::regclass
  ) THEN
    CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime (updated_at);
    RAISE NOTICE 'Created handle_updated_at trigger.';
  ELSE
    RAISE NOTICE 'Trigger handle_updated_at already exists.';
  END IF;
END $$;

-- 10. Create the upsert SQL function
CREATE OR REPLACE FUNCTION public.upsert_registration_answer(p_user_id uuid, p_question_id text, p_answer jsonb, p_index integer)
RETURNS void AS $$
BEGIN
  INSERT INTO public.registrations (user_id, answers, last_completed_index, updated_at)
  VALUES (p_user_id, jsonb_build_object(p_question_id, p_answer), p_index, now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    answers = registrations.answers || jsonb_build_object(p_question_id, p_answer), -- Merge new answer
    last_completed_index = GREATEST(registrations.last_completed_index, p_index), -- Update index only if higher
    updated_at = now()
  WHERE registrations.user_id = p_user_id; -- Ensure update targets the correct row
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_registration_answer(uuid, text, jsonb, integer) TO authenticated;
-- 11. Define RLS policies
-- Drop existing policies first (if any) to avoid conflicts
-- Using DO block to handle potential "policy does not exist" errors gracefully
DO $$
DECLARE
  policy_name TEXT;
  policies_to_drop TEXT[] := ARRAY[
    'Allow individual select access',
    'Allow individual insert access',
    'Allow individual update access',
    'Allow individual delete access',
    'Allow admin select access',
    'Allow admin access' -- Catch-all just in case
  ];
BEGIN
  FOREACH policy_name IN ARRAY policies_to_drop
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_name) || ' ON public.registrations';
    RAISE NOTICE 'Dropped policy (if existed): %', policy_name;
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations FORCE ROW LEVEL SECURITY; -- Ensure RLS applies even to table owner
-- Policy: Users can SELECT their own registration row.
CREATE POLICY "Allow individual select access" ON public.registrations
  FOR SELECT
  USING (auth.uid() = user_id);
-- Policy: Users can INSERT their own registration row.
CREATE POLICY "Allow individual insert access" ON public.registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Policy: Users can UPDATE their own registration row.
CREATE POLICY "Allow individual update access" ON public.registrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Policy: Users can DELETE their own registration row.
CREATE POLICY "Allow individual delete access" ON public.registrations
  FOR DELETE
  USING (auth.uid() = user_id);
-- Policy: Admins can SELECT all registration rows.
-- Assumes a 'profiles' table exists with an 'id' (UUID, FK to auth.users) and 'role' (TEXT) column.
CREATE POLICY "Allow admin select access" ON public.registrations
  FOR SELECT
  USING ((SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'::text);
-- Note: Consider adding admin INSERT/UPDATE/DELETE if needed based on full requirements.