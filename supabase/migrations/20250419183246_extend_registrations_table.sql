-- Define ENUM types used in registration
CREATE TYPE attendance_option AS ENUM ('yes', 'no', 'maybe');
CREATE TYPE working_style AS ENUM ('structured', 'exploratory', 'balanced');
CREATE TYPE mentorship_role AS ENUM ('mentor', 'mentee', 'no_preference');
CREATE TYPE referral_source AS ENUM ('email', 'professor', 'friend', 'department', 'social_media', 'other');

-- Create registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- For matching before user_id is known
  -- Basic Info
  full_name TEXT NOT NULL,
  university TEXT NOT NULL,
  program TEXT NOT NULL,
  year_of_study INTEGER NOT NULL,
  -- Date Flexibility
  can_attend_may_3_4 attendance_option NOT NULL,
  may_3_4_comment TEXT,
  -- Philosophical Background
  prior_courses TEXT[],
  discussion_confidence INTEGER NOT NULL CHECK (discussion_confidence BETWEEN 1 AND 10),
  writing_confidence INTEGER NOT NULL CHECK (writing_confidence BETWEEN 1 AND 10),
  familiarity_analytic INTEGER NOT NULL CHECK (familiarity_analytic BETWEEN 1 AND 5),
  familiarity_continental INTEGER NOT NULL CHECK (familiarity_continental BETWEEN 1 AND 5),
  familiarity_other INTEGER NOT NULL CHECK (familiarity_other BETWEEN 1 AND 5),
  philosophical_traditions TEXT[] NOT NULL,
  philosophical_interests TEXT[] NOT NULL,
  areas_of_interest TEXT,
  -- Theme and Workshop Preferences
  theme_rankings JSONB NOT NULL,
  theme_suggestion TEXT,
  workshop_rankings JSONB NOT NULL,
  -- Team Formation Preferences
  preferred_working_style working_style NOT NULL,
  teammate_similarity INTEGER NOT NULL CHECK (teammate_similarity BETWEEN 1 AND 10),
  skill_writing INTEGER NOT NULL CHECK (skill_writing BETWEEN 1 AND 5),
  skill_speaking INTEGER NOT NULL CHECK (skill_speaking BETWEEN 1 AND 5),
  skill_research INTEGER NOT NULL CHECK (skill_research BETWEEN 1 AND 5),
  skill_synthesis INTEGER NOT NULL CHECK (skill_synthesis BETWEEN 1 AND 5),
  skill_critique INTEGER NOT NULL CHECK (skill_critique BETWEEN 1 AND 5),
  mentorship_preference mentorship_role,
  mentorship_areas TEXT,
  preferred_teammates TEXT,
  complementary_perspectives TEXT,
  -- Technical Experience & Accessibility
  familiarity_tech_concepts INTEGER NOT NULL CHECK (familiarity_tech_concepts BETWEEN 1 AND 5),
  prior_hackathon_experience BOOLEAN NOT NULL,
  prior_hackathon_details TEXT,
  dietary_restrictions TEXT,
  accessibility_needs TEXT,
  additional_notes TEXT,
  how_heard referral_source NOT NULL,
  how_heard_other TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add index for user_id lookup
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_email ON registrations(email); -- Index email for matching

-- Note: RLS policies and updated_at trigger will be added in separate migrations.