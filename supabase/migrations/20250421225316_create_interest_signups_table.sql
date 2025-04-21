-- Create the table
CREATE TABLE public.interest_signups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add comments to the table and columns
COMMENT ON TABLE public.interest_signups IS 'Collects email addresses from users interested in registration updates.';
COMMENT ON COLUMN public.interest_signups.email IS 'Email address provided by the user.';
COMMENT ON COLUMN public.interest_signups.created_at IS 'Timestamp when the email was submitted.';

-- Enable Row Level Security
ALTER TABLE public.interest_signups ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Allow public insert access
CREATE POLICY "Allow public insert access" ON public.interest_signups
    FOR INSERT
    WITH CHECK (true);

-- Restrict read/update/delete to service_role
CREATE POLICY "Allow service_role full access" ON public.interest_signups
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');