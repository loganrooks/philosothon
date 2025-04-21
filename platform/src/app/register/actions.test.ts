// Import actions (will fail initially as they don't exist/are renamed)
import { submitRegistration, updateRegistration, deleteRegistration, RegistrationState } from '@/app/register/actions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';

// --- Mocks ---
// Mock the module containing createClient (still needed for getSession, signInWithOtp)
// Define mocks for auth methods used in actions
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockSignInWithOtp = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({ // Mock implementation of createClient
    auth: { // Mock the auth object
      getSession: mockGetSession,
      signInWithOtp: mockSignInWithOtp,
      getUser: mockGetUser,
    },
    // Add other Supabase client methods if needed by actions
  })),
}));

// Mock the DAL module for registrations
vi.mock('@/lib/data/registrations', () => ({
  fetchRegistrationByUserId: vi.fn(),
  insertRegistration: vi.fn(),
  updateRegistrationById: vi.fn(), // Added mock
  deleteRegistrationByUserId: vi.fn(), // Added mock
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((headerName) => {
      if (headerName === 'origin') return 'http://localhost:3000';
      return null;
    }),
  })),
}));

// No longer mocking the schema, we rely on the real one imported by the action.

// Updated createTestFormData helper
const createTestFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  for (const key in data) {
    if (Array.isArray(data[key])) {
      // Append each value of the array with the same key
      data[key].forEach((value: string | number | boolean) => formData.append(key, String(value)));
    } else if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, String(data[key]));
    }
  }
  return formData;
};

// Get the mocked createClient function itself
const mockedCreateClient = vi.mocked(createClient);

// No need for mockSupabaseClient object anymore, mocks are handled in vi.mock factory

// Import mocked DAL functions at the top level (add update/delete)
const {
  fetchRegistrationByUserId: mockFetchReg,
  insertRegistration: mockInsertReg,
  updateRegistrationById: mockUpdateReg, // Corrected mock name
  deleteRegistrationByUserId: mockDeleteReg, // Corrected mock name
} = vi.mocked(await import('@/lib/data/registrations'));


// Placeholder for actual action functions - tests will fail
// const submitRegistration = vi.fn(); // Removed conflicting mock
// const updateRegistration = vi.fn(); // Removed conflicting mock
// const deleteRegistration = vi.fn(); // Removed conflicting mock


describe('Registration Server Actions', () => {
  let previousState: RegistrationState;

  // Define complete valid data based on the V3 schema from config/registrationSchema.ts
  const completeValidDataV3 = {
    // Section 1
    fullName: 'Valid Test User V3', // Q1
    email: 'valid-v3@example.com', // Q2
    // password/confirmPassword skipped (handled by auth)
    pronouns: 'they/them', // Q3 (Optional)
    studentId: '1001234567', // Q4
    university: 'University of Testing V3', // Q5
    academicYear: '3rd Year', // Q6
    programOfStudy: 'Philosophy V3', // Q7
    // Section 2
    philosophyCoursework: 'PHI101, PHI202', // Q8 (Optional)
    philosophyInterests: 'Ethics of Technology, AI Alignment', // Q9 (Optional)
    philosophyExpertise: '3', // Q10 (Scale 1-5) -> string for FormData
    attendedPhilosothonBefore: 'false', // Q11 (Boolean) -> string for FormData
    // previousPhilosothonDetails: '', // Q12 (Skipped as Q11 is false)
    // Section 3
    themeRanking: ['3', '1', '4'], // Q13 (Ranking - Array of numbers as strings for FormData)
    workshopPreference: ['1', '3'], // Q14 (Multi-select - Array of numbers as strings for FormData)
    teamFormationPreference: 'Assign me to a team', // Q15
    preformedTeamMembers: '', // Q16 (Add field, even if empty for this case)
    availability: 'true', // Q17 (Boolean) -> string for FormData
    // availabilityDetails: '', // Q18 (Skipped as Q17 is true)
    // Section 4
    technicalSkills: '4', // Q19 (Scale 1-5) -> string for FormData
    codingExperience: 'true', // Q20 (Boolean) -> string for FormData
    codingLanguages: 'Python, JavaScript', // Q21 (Optional, shown as Q20 is true)
    specificTools: 'Figma, VS Code', // Q22 (Optional)
    // Section 5
    dietaryRestrictions: 'None', // Q23 (Optional)
    accessibilityNeeds: 'None', // Q24 (Optional)
    emergencyContactName: 'Jane Doe', // Q25 (Optional)
    emergencyContactPhone: '555-123-4567', // Q26 (Optional)
    preferredCommunication: 'Email', // Q27
    preferredCommunicationOther: '', // Q28 (Add field, even if empty for this case)
    // Section 6
    codeOfConductAgreement: 'true', // Q29 (Boolean) -> string for FormData
    photoConsent: 'true', // Q30 (Boolean) -> string for FormData
    dataPrivacyConsent: 'true', // Q31 (Boolean) -> string for FormData
    finalConfirmation: 'true', // Q32 (Boolean) -> string for FormData
  };


  beforeEach(() => {
    vi.clearAllMocks();
    // No need to mockResolvedValue for createClient here, vi.mock handles it.

    // Reset individual mock functions directly
    mockGetSession.mockReset();
    mockSignInWithOtp.mockReset();
    mockGetUser.mockReset();

    // Reset DAL mocks
    mockFetchReg.mockReset();
    mockInsertReg.mockReset();


    previousState = { success: false, message: null, errors: {} }; // Reset state

    // Reset DAL mocks for update/delete
    mockUpdateReg.mockReset();
    mockDeleteReg.mockReset();
  });

  describe('submitRegistration', () => {
    // --- TDD Anchors for submitRegistration ---

    it('should return error if user cannot be retrieved', async () => { // Renamed test slightly
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('User fetch failed') }); // Mock getUser error
      const formData = createTestFormData(completeValidDataV3); // Use V3 data
      const result = await submitRegistration(previousState, formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication error: Could not retrieve user.'); // Updated expected message
      // expect(true).toBe(false); // Placeholder failure - REMOVED
    });

    it('should return error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null }); // Mock getUser returning null user
      const formData = createTestFormData(completeValidDataV3); // Use V3 data
      const result = await submitRegistration(previousState, formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication error: Could not retrieve user.'); // Updated expected message
      // expect(true).toBe(false); // Placeholder failure - REMOVED
    });


    it('should return validation errors for missing required fields', async () => {
      // TDD Anchor: Test validation failure returns correct error structure.
      mockGetSession.mockResolvedValue({ // Use direct mock
        data: { session: { user: { id: 'user-123', email: 'valid@example.com' } } } as any,
        error: null,
      });

      // Create data missing a required field (e.g., university) from V3 data
      const { university, ...incompleteData } = completeValidDataV3;
      const formData = createTestFormData(incompleteData);
      const result = await submitRegistration(previousState, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation failed');
      expect(result.errors).toBeDefined();
      // Check for a specific missing field based on V3 schema
      expect(result.errors?.university).toBeDefined();
      // expect(true).toBe(false); // Placeholder failure - REMOVED
    });

    it('should return error on database insertion failure', async () => {
      // TDD Anchor: Test database insertion error handling.
      const userId = 'user-123';
      mockGetUser.mockResolvedValue({ // Mock getUser succeeding
        data: { user: { id: userId, email: 'valid@example.com' } },
        error: null,
      });
      // Mock fetchReg to indicate no existing registration
      mockFetchReg.mockResolvedValue({ registration: null, error: null });
      mockInsertReg.mockResolvedValue({ registration: null, error: new Error('DB insert failed') }); // Insert fails

      const formData = createTestFormData(completeValidDataV3); // Use V3 data
      const result = await submitRegistration(previousState, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database Error: Failed to save registration. DB insert failed');
      // expect(true).toBe(false); // Placeholder failure - REMOVED
    });

    it('should call insert with user_id and redirect on success', async () => {
      // TDD Anchor: Test successful insertion linking to user_id.
      const userId = 'user-123';
      mockGetSession.mockResolvedValue({ // Use direct mock
        data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any,
        error: null,
      });
      mockInsertReg.mockResolvedValue({ registration: { id: 'new-reg-id' } as any, error: null }); // Successful insert

      const formData = createTestFormData(completeValidDataV3); // Use V3 data
      // Mock getUser to return the authenticated user
      mockGetUser.mockResolvedValue({ // Use direct mock
          data: { user: { id: userId, email: 'valid@example.com' } },
          error: null,
      });
      // Mock fetchReg to indicate no existing registration
      mockFetchReg.mockResolvedValue({ registration: null, error: null });

      await submitRegistration(previousState, formData);

      // Check against the V1.1 structure expected by the DAL mock, mapped from V3 data
      const expectedInsertDataV3 = {
          user_id: userId,
          email: completeValidDataV3.email, // V3
          full_name: completeValidDataV3.fullName, // V3
          university: completeValidDataV3.university, // V3
          program: completeValidDataV3.programOfStudy, // V3
          year_of_study: 3, // Mapped from V3 academicYear
          // V1.1 fields not in V3 schema - provide defaults or handle nulls
          can_attend_may_3_4: 'maybe', // Default value
          may_3_4_comment: null,
          prior_courses: completeValidDataV3.philosophyCoursework ? [completeValidDataV3.philosophyCoursework] : null, // Map V3 coursework
          discussion_confidence: 5, // Default value
          writing_confidence: 5, // Default value
          familiarity_analytic: 3, // Default value
          familiarity_continental: 3, // Default value
          familiarity_other: 3, // Default value
          areas_of_interest: completeValidDataV3.philosophyInterests, // Map V3 interests
          philosophical_traditions: [], // Default empty array for V1.1 field
          philosophical_interests: [], // Default empty array for V1.1 field
          theme_rankings: completeValidDataV3.themeRanking.map(Number), // Map V3 ranking (convert strings to numbers)
          theme_suggestion: null,
          workshop_rankings: completeValidDataV3.workshopPreference.map(Number), // Map V3 preference (convert strings to numbers)
          preferred_working_style: 'balanced', // Default value
          teammate_similarity: 5, // Default value
          skill_writing: 3, // Default value
          skill_speaking: 3, // Default value
          skill_research: 3, // Default value
          skill_synthesis: 3, // Default value
          skill_critique: 3, // Default value
          preferred_teammates: completeValidDataV3.teamFormationPreference === 'I have a pre-formed team' ? completeValidDataV3.preformedTeamMembers : null, // Map V3 preformedTeamMembers if applicable
          complementary_perspectives: null,
          mentorship_preference: 'no_preference', // Default value
          mentorship_areas: null,
          familiarity_tech_concepts: parseInt(completeValidDataV3.technicalSkills) || 3, // Map V3 technicalSkills
          prior_hackathon_experience: completeValidDataV3.codingExperience === 'true', // Map V3 codingExperience
          prior_hackathon_details: completeValidDataV3.codingLanguages, // Map V3 codingLanguages (approximate)
          dietary_restrictions: completeValidDataV3.dietaryRestrictions, // V3 field matches V1.1
          accessibility_needs: completeValidDataV3.accessibilityNeeds, // V3 field matches V1.1
          additional_notes: null,
          how_heard: 'other', // Default value
          how_heard_other: completeValidDataV3.preferredCommunication === 'Other (please specify)' ? completeValidDataV3.preferredCommunicationOther : null, // Map V3 how_heard_other
          // V3 fields like pronouns, studentId, consents are ignored as they are not in V1.1 RegistrationInput
      };
      expect(mockInsertReg).toHaveBeenCalledWith(
        expect.objectContaining(expectedInsertDataV3) // Use updated expected data
      );
      expect(revalidatePath).toHaveBeenCalledWith('/admin/registrations'); // Check revalidation
      expect(redirect).toHaveBeenCalledWith('/register/success'); // Check redirect path

      // expect(true).toBe(false); // Placeholder failure - REMOVED
    });
  }); // End describe submitRegistration

  describe('updateRegistration', () => {
    // --- TDD Anchors for updateRegistration ---
     it('should return error if user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null }); // Mock getUser failing
        const formData = createTestFormData(completeValidDataV3); // Use V3 data
       const result = await updateRegistration(previousState, formData);
       expect(result.success).toBe(false);
       expect(result.message).toContain('Authentication error: Could not retrieve user.');
       // expect(true).toBe(false); // Placeholder failure - REMOVED
   });

   it('should return validation errors for missing required fields', async () => {
      mockGetUser.mockResolvedValue({ // Mock getUser succeeding
        data: { user: { id: 'user-123', email: 'valid@example.com' } },
        error: null,
      });
       const { university, ...incompleteData } = completeValidDataV3; // Use V3 data
       const formData = createTestFormData(incompleteData);
       const result = await updateRegistration(previousState, formData);
       expect(result.success).toBe(false);
       expect(result.message).toContain('Validation failed');
       expect(result.errors?.university).toBeDefined(); // Check V3 field
       // expect(true).toBe(false); // Placeholder failure - REMOVED
   });

   it('should return error on database update failure', async () => {
      const userId = 'user-123';
      mockGetUser.mockResolvedValue({ // Mock getUser succeeding
        data: { user: { id: userId, email: 'valid@example.com' } },
        error: null,
      });
       mockUpdateReg.mockResolvedValue({ registration: null, error: new Error('DB update failed') }); // Update fails

       const formData = createTestFormData(completeValidDataV3); // Use V3 data
       const result = await updateRegistration(previousState, formData);
       expect(result.success).toBe(false);
       expect(result.message).toContain('Database Error: Failed to update registration. DB update failed');
       // expect(true).toBe(false); // Placeholder failure - REMOVED
   });

   it('should call update with user_id and redirect on success', async () => {
      const userId = 'user-123';
      mockGetUser.mockResolvedValue({ // Mock getUser succeeding
        data: { user: { id: userId, email: 'valid@example.com' } },
        error: null,
      });
       mockUpdateReg.mockResolvedValue({ registration: { id: 'reg-id-to-update' } as any, error: null }); // Successful update

       const formData = createTestFormData(completeValidDataV3); // Use V3 data
       // Mock getUser to return the authenticated user
       mockGetUser.mockResolvedValue({ // Use direct mock variable
           data: { user: { id: userId, email: 'valid@example.com' } },
           error: null,
       });

       await updateRegistration(previousState, formData);

       // Adjust expected data for update (V1.1 structure mapped from V3)
       const expectedUpdateDataV3 = {
           email: completeValidDataV3.email, // V3
           full_name: completeValidDataV3.fullName, // V3
           university: completeValidDataV3.university, // V3
           program: completeValidDataV3.programOfStudy, // V3
           year_of_study: 3, // Mapped from V3 academicYear
           prior_courses: completeValidDataV3.philosophyCoursework ? [completeValidDataV3.philosophyCoursework] : null, // Map V3 coursework
           areas_of_interest: completeValidDataV3.philosophyInterests, // Map V3 interests
           theme_rankings: completeValidDataV3.themeRanking.map(Number), // Map V3 ranking
           workshop_rankings: completeValidDataV3.workshopPreference.map(Number), // Map V3 preference
           familiarity_tech_concepts: parseInt(completeValidDataV3.technicalSkills) || undefined, // Map V3 technicalSkills
           prior_hackathon_experience: completeValidDataV3.codingExperience === 'true', // Map V3 codingExperience
           prior_hackathon_details: completeValidDataV3.codingLanguages, // Map V3 codingLanguages
           dietary_restrictions: completeValidDataV3.dietaryRestrictions, // V3 field matches V1.1
           accessibility_needs: completeValidDataV3.accessibilityNeeds, // V3 field matches V1.1
           // Other V1.1 fields not present in V3 schema will not be in the update payload unless explicitly added
       };

       expect(mockUpdateReg).toHaveBeenCalledWith(
         userId,
         expect.objectContaining(expectedUpdateDataV3) // Use updated expected data
       );
       expect(revalidatePath).toHaveBeenCalledWith('/register'); // Check revalidation
       expect(redirect).toHaveBeenCalledWith('/register/success?updated=true'); // Check redirect path

       // expect(true).toBe(false); // Placeholder failure - REMOVED
   });
  }); // End describe updateRegistration

  describe('deleteRegistration', () => {
    // --- TDD Anchors for deleteRegistration ---
     it('should return error if user is not authenticated', async () => {
       mockGetUser.mockResolvedValue({ data: { user: null }, error: null }); // Mock getUser failing
       // Assuming delete action takes confirmation or similar, not FormData
       const result = await deleteRegistration(); // No arguments needed
       expect(result.success).toBe(false);
       expect(result.message).toContain('Authentication error: Could not retrieve user.');
       // expect(true).toBe(false); // Placeholder failure - REMOVED
    });

     // Note: The delete action currently doesn't have a confirmation step internally
     // It relies on the UI to confirm before calling. This test might need adjustment
     // if the action's logic changes to include confirmation.
     it.skip('should return error if confirmation is not provided (if required by action)', async () => {
       const userId = 'user-123';
       mockGetUser.mockResolvedValue({ // Mock getUser succeeding
         data: { user: { id: userId, email: 'valid@example.com' } },
         error: null,
       });
       // Assuming delete action requires a specific confirmation flag/value
       const result = await deleteRegistration(); // No arguments needed
       expect(result.success).toBe(false);
       // expect(result.message).toContain('Deletion not confirmed'); // Adjust if action adds confirmation
       // expect(true).toBe(false); // Placeholder failure - REMOVED
    });

     it('should return error on database delete failure', async () => {
       const userId = 'user-123';
       mockGetUser.mockResolvedValue({ // Mock getUser succeeding
         data: { user: { id: userId, email: 'valid@example.com' } },
         error: null,
       });
       mockDeleteReg.mockResolvedValue({ success: false, error: new Error('DB delete failed') }); // Delete fails + add success prop

       const result = await deleteRegistration(); // No arguments needed
       expect(result.success).toBe(false);
       expect(result.message).toContain('Database Error: Failed to delete registration. DB delete failed');
       // expect(true).toBe(false); // Placeholder failure - REMOVED
    });

     it('should call delete with user_id and redirect on success', async () => {
       const userId = 'user-123';
       mockGetUser.mockResolvedValue({ // Mock getUser succeeding
         data: { user: { id: userId, email: 'valid@example.com' } },
         error: null,
       });
       mockDeleteReg.mockResolvedValue({ success: true, error: null }); // Successful delete

       await deleteRegistration(); // No arguments needed

       expect(mockDeleteReg).toHaveBeenCalledWith(userId); // Assuming action gets userId from session
       expect(revalidatePath).toHaveBeenCalledWith('/register'); // Check revalidation
       expect(redirect).toHaveBeenCalledWith('/register'); // Check redirect path

       // expect(true).toBe(false); // Placeholder failure - REMOVED
     });
  }); // End describe deleteRegistration

}); // End describe Registration Server Actions