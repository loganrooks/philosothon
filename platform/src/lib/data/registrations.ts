import { createClient } from '@/lib/supabase/server';

import { Database, Json } from '@/lib/supabase/database.types'; // Import Database and Json types

// Define ENUM types using generated types for consistency
export type AttendanceOption = Database["public"]["Enums"]["attendance_option"];
export type WorkingStyle = Database["public"]["Enums"]["working_style"];
export type MentorshipRole = Database["public"]["Enums"]["mentorship_role"];
export type ReferralSource = Database["public"]["Enums"]["referral_source"];


// Define the Registration type based on spec FR-REG-005 and data model
// This should ideally align perfectly with Database['public']['Tables']['registrations']['Row']
// For now, keeping the manually defined one but adding missing fields based on spec v1.1
export interface Registration {
  id: string; // Assuming UUID
  user_id: string | null; // UUID from auth.users, nullable initially
  email: string; // Stored for matching if user_id is null initially
  full_name: string;
  university: string;
  program: string;
  year_of_study: number;
  can_attend_may_3_4: AttendanceOption; // Mapped to ENUM
  may_3_4_comment: string | null;
  prior_courses: string[] | null;
  discussion_confidence: number; // Added
  writing_confidence: number; // Added
  familiarity_analytic: number;
  familiarity_continental: number;
  familiarity_other: number; // integer 1-5
  areas_of_interest: string | null;
  philosophical_traditions: string[]; // Added, text[]
  philosophical_interests: string[]; // Added, text[]
  theme_rankings: Json; // Added, JSONB
  theme_suggestion: string | null; // Added
  workshop_rankings: Json; // Added, JSONB
  preferred_working_style: WorkingStyle;
  teammate_similarity: number; // Added, integer 1-10
  skill_writing: number;
  skill_speaking: number;
  skill_research: number; // integer 1-5
  skill_synthesis: number; // integer 1-5
  skill_critique: number; // integer 1-5
  preferred_teammates: string | null;
  complementary_perspectives: string | null;
  mentorship_preference: MentorshipRole | null; // Added
  mentorship_areas: string | null; // Added
  familiarity_tech_concepts: number;
  prior_hackathon_experience: boolean;
  prior_hackathon_details: string | null;
  dietary_restrictions: string | null; // Added
  accessibility_needs: string | null;
  additional_notes: string | null; // Added
  how_heard: ReferralSource; // Added
  how_heard_other: string | null; // Added
  created_at: string;
  updated_at: string;
}

// Define input type for insert/update (matches Zod schema in actions)
// Includes all fields from spec v1.1
export interface RegistrationInput {
  user_id?: string | null; // Optional for initial insert
  email: string;
  full_name: string;
  university: string;
  program: string;
  year_of_study: number;
  can_attend_may_3_4: AttendanceOption;
  may_3_4_comment?: string | null;
  prior_courses?: string[] | null;
  discussion_confidence: number; // Added
  writing_confidence: number; // Added
  familiarity_analytic: number;
  familiarity_continental: number;
  familiarity_other: number;
  philosophical_traditions: string[]; // Added
  philosophical_interests: string[]; // Added
  areas_of_interest?: string | null;
  theme_rankings: Json; // Added
  theme_suggestion?: string | null; // Added
  workshop_rankings: Json; // Added
  preferred_working_style: WorkingStyle;
  teammate_similarity: number; // Added
  skill_writing: number;
  skill_speaking: number;
  skill_research: number;
  skill_synthesis: number;
  skill_critique: number;
  preferred_teammates?: string | null;
  complementary_perspectives?: string | null;
  mentorship_preference?: MentorshipRole | null; // Added
  mentorship_areas?: string | null; // Added
  familiarity_tech_concepts: number;
  prior_hackathon_experience: boolean;
  prior_hackathon_details?: string | null;
  dietary_restrictions?: string | null; // Added
  accessibility_needs?: string | null;
  additional_notes?: string | null; // Added
  how_heard: ReferralSource; // Added
  how_heard_other?: string | null; // Added
}

/**
 * Inserts a new registration into the database.
 * @param registrationData The data for the new registration.
 * @returns An object containing the inserted registration or an error.
 */
export async function insertRegistration(registrationData: RegistrationInput): Promise<{ registration: Registration | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    // Assume data is validated by the caller (Server Action)
    const { data, error } = await supabase
      .from('registrations')
      .insert(registrationData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting registration:', error);
      throw new Error(`Database error inserting registration: ${error.message}`);
    }

    return { registration: data as Registration, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred inserting registration.');
    console.error('insertRegistration failed:', error);
    return { registration: null, error };
  }
}

/**
 * Fetches a registration by user ID.
 * @param userId The UUID of the user.
 * @returns An object containing the fetched registration or an error.
 */
export async function fetchRegistrationByUserId(userId: string): Promise<{ registration: Registration | null; error: Error | null }> {
  if (!userId) {
    return { registration: null, error: new Error('User ID is required.') };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle as registration might not exist yet

    if (error) {
      console.error(`Error fetching registration for user ${userId}:`, error);
      throw new Error(`Database error fetching registration for user ${userId}: ${error.message}`);
    }

    return { registration: data as Registration | null, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred fetching registration for user ${userId}.`);
    console.error(`fetchRegistrationByUserId(${userId}) failed:`, error);
    return { registration: null, error };
  }
}

// TODO: Implement updateRegistrationById if needed
// TODO: Implement fetchRegistrationByEmail if needed for linking during OTP flow