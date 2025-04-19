-- Define ENUM type for roles
CREATE TYPE user_role AS ENUM ('admin', 'participant', 'judge', 'team_member');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, -- Consider NOT NULL depending on requirements
  avatar_url TEXT, -- URL to user's avatar image
  role user_role DEFAULT 'participant' NOT NULL,
  -- team_id UUID REFERENCES teams(id) ON DELETE SET NULL, -- Add in a later migration after teams table exists
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Note: RLS policies and updated_at trigger will be added in separate migrations.