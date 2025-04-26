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
// Define the Registration type based on spec FR-REG-005 and data model (V1.1 + user_id)
// This should reflect the current DB schema before V2 migrations
export interface Registration {
  id: string; // Assuming UUID
  user_id: string | null; // UUID from auth.users, nullable initially
  email: string; // Stored for matching if user_id is null initially
  full_name: string;
  university: string;
  program: string;
  year_of_study: number; // V1.1 field
  can_attend_may_3_4: AttendanceOption; // V1.1 field
  may_3_4_comment: string | null; // V1.1 field
  prior_courses: string[] | null; // V1.1 field
  discussion_confidence: number; // V1.1 field
  writing_confidence: number; // V1.1 field
  familiarity_analytic: number; // V1.1 field
  familiarity_continental: number; // V1.1 field
  familiarity_other: number; // V1.1 field
  areas_of_interest: string | null; // V1.1 field
  philosophical_traditions: string[]; // V1.1 field
  philosophical_interests: string[]; // V1.1 field
  theme_rankings: Json; // V1.1 field
  theme_suggestion: string | null; // V1.1 field
  workshop_rankings: Json; // V1.1 field
  preferred_working_style: WorkingStyle; // V1.1 field
  teammate_similarity: number; // V1.1 field
  skill_writing: number; // V1.1 field
  skill_speaking: number; // V1.1 field
  skill_research: number; // V1.1 field
  skill_synthesis: number; // V1.1 field
  skill_critique: number; // V1.1 field
  preferred_teammates: string | null; // V1.1 field
  complementary_perspectives: string | null; // V1.1 field
  mentorship_preference: MentorshipRole | null; // V1.1 field
  mentorship_areas: string | null; // V1.1 field
  familiarity_tech_concepts: number; // V1.1 field
  prior_hackathon_experience: boolean; // V1.1 field
  prior_hackathon_details: string | null; // V1.1 field
  dietary_restrictions: string | null; // V1.1 field (also in V2)
  accessibility_needs: string | null; // V1.1 field (also in V2)
  additional_notes: string | null; // V1.1 field
  how_heard: ReferralSource; // V1.1 field
  how_heard_other: string | null; // V1.1 field
  created_at: string;
  updated_at: string;
  // V2 fields not in V1.1 (like pronouns, student_id, academic_year, consents) are assumed not yet in DB
}

// Define input type for insert/update (reflecting V3.1 schema)
export interface RegistrationInput {
  user_id?: string | null; // Keep optional for initial insert
  // Personal Information
  firstName: string; // order 1
  lastName: string; // order 2
  email: string; // order 3 (also in auth.users)
  academicYear: string; // order 6
  academicYearOther?: string | null; // order 7
  universityInstitution: string; // order 8
  programOfStudy: string; // order 9
  // Philosophy Background
  philosophyCoursework: string; // order 10 (replaces prior_courses)
  philosophyConfidenceDiscussion: number; // order 11
  philosophyConfidenceWriting: number; // order 12
  philosophyTraditions: string[]; // order 13 (replaces familiarity_analytic/continental/other)
  philosophyTraditionsOther?: string | null; // order 14
  philosophyInterests: string[]; // order 15 (replaces areas_of_interest)
  philosophyInterestsOther?: string | null; // order 16
  philosophyInfluences?: string | null; // order 17
  // Working Style & Preferences
  workingStyle: string[]; // order 18 (replaces preferred_working_style)
  workingStyleOther?: string | null; // order 19
  communicationStyle: string; // order 20
  collaborationRole: string[]; // order 21 (replaces skills?)
  collaborationRoleOther?: string | null; // order 22
  presentationComfort: number; // order 23
  previousCollaborationExperience: string; // order 24
  previousCollaborationExperienceOther?: string | null; // order 25
  // Technical Background
  technicalFamiliarity: number; // order 26 (replaces familiarity_tech_concepts)
  technicalInterests?: string | null; // order 27
  hackathonExperience: boolean; // order 28 (replaces prior_hackathon_experience)
  hackathonExperienceDetails?: string | null; // order 29 (replaces prior_hackathon_details)
  // Communication & Community
  discordMember: boolean; // order 30
  discordUsername?: string | null; // order 31
  // Logistics & Consent
  availability: string[]; // order 32 (replaces can_attend_may_3_4)
  availabilityDetails?: string | null; // order 33 (replaces may_3_4_comment)
  dietaryRestrictions?: string | null; // order 34 (matches old)
  accessibilityNeeds?: string | null; // order 35 (matches old)
  codeOfConductAgreement: boolean; // order 36
  photoConsent: boolean; // order 37 (new)
  dataPrivacyConsent: boolean; // order 38 (new)
  finalConfirmation: boolean; // order 39 (new, likely UI only, but map if needed)
  // Note: Ensure DB schema matches these fields. Old V1.1 fields are removed.
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


// Added updateRegistrationById function
/**
 * Updates an existing registration by user ID.
 * @param userId The UUID of the user whose registration is to be updated.
 * @param registrationData The partial data to update.
 * @returns An object containing the updated registration or an error.
 */
export async function updateRegistrationById(userId: string, registrationData: Partial<RegistrationInput>): Promise<{ registration: Registration | null; error: Error | null }> {
  if (!userId) {
    return { registration: null, error: new Error('User ID is required for update.') };
  }
  try {
    const supabase = await createClient();
    // Ensure user_id is not part of the update payload itself
    const { user_id, ...updateData } = registrationData;

    const { data, error } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating registration for user ${userId}:`, error);
      throw new Error(`Database error updating registration: ${error.message}`);
    }

    return { registration: data as Registration, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred updating registration for user ${userId}.`);
    console.error(`updateRegistrationById(${userId}) failed:`, error);
    return { registration: null, error };
  }
}

// Added deleteRegistrationByUserId function
/**
 * Deletes a registration by user ID.
 * @param userId The UUID of the user whose registration is to be deleted.
 * @returns An object indicating success or an error.
 */
export async function deleteRegistrationByUserId(userId: string): Promise<{ success: boolean; error: Error | null }> {
  if (!userId) {
    return { success: false, error: new Error('User ID is required for deletion.') };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error(`Error deleting registration for user ${userId}:`, error);
      throw new Error(`Database error deleting registration: ${error.message}`);
    }

    return { success: true, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred deleting registration for user ${userId}.`);
    console.error(`deleteRegistrationByUserId(${userId}) failed:`, error);
    return { success: false, error };
  }
}

// Removed TODO comments as functions are now added
// TODO: Implement fetchRegistrationByEmail if needed for linking during OTP flow

// TODO: Implement updateRegistrationById if needed
// TODO: Implement fetchRegistrationByEmail if needed for linking during OTP flow