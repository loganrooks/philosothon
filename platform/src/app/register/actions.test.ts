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

// Final createTestFormData: Mimic FormData behavior accurately.
const createTestFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  for (const key in data) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      if (key === 'themeRanking' || key === 'workshopRanking') {
        // Ranking arrays are stringified
        formData.append(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
         // Simple arrays: append each element
         value.forEach((item: any) => {
           formData.append(key, String(item)); // All elements become strings
         });
      } else {
        // All other values (boolean, number, string) become strings
        formData.append(key, String(value));
      }
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
    firstName: 'Valid', // Q1a - Changed from fullName
    lastName: 'User V3', // Q1b - Changed from fullName
    email: 'valid-v3@example.com', // Q2
    // password/confirmPassword skipped (handled by auth)
    pronouns: 'they/them', // Q3 (Optional)
    studentId: '1001234567', // Q4
    university: 'University of Testing V3', // Q5
    academicYear: '3rd Year', // Q6
    programOfStudy: 'Philosophy V3', // Q7
    // Section 2
    philosophyCoursework: 'PHI101, PHI202', // Q8 (Optional) - Keep as string for textarea
    philosophyConfidenceDiscussion: '7', // Q6 (Scale 1-10) -> string
    philosophyConfidenceWriting: '8', // Q7 (Scale 1-10) -> string
    philosophyTraditions: ['Analytic philosophy', 'Continental philosophy'], // Q8 (multi-select) -> string[]
    philosophyTraditionsOther: '', // Q8 Other
    philosophyInterests: ['Ethics of Technology', 'AI Alignment'], // Q9 (multi-select) -> string[]
    philosophyInterestsOther: '', // Q9 Other
    philosophyInfluences: 'Feenberg, Heidegger', // Q10 (textarea)
    philosophyExpertise: '3', // Q10 (Scale 1-5) -> string for FormData - NOTE: This ID seems wrong based on outline, Q10 is influences. Keeping for now.
    attendedPhilosothonBefore: false, // Q11 (Boolean) -> Use actual boolean
    // previousPhilosothonDetails: '', // Q12 (Skipped as Q11 is false)
    // Section 3
    // Use placeholder values, assuming action/DAL maps index/value correctly
    themeRanking: [ { optionValue: 'Theme3', rank: 1 }, { optionValue: 'Theme1', rank: 2 }, { optionValue: 'Theme4', rank: 3 } ], // Q13 (ranking) -> Array<object>
    // workshopPreference: ['1', '3'], // REMOVE Legacy field
    workshopRanking: [ { optionValue: 'Workshop1', rank: 1 }, { optionValue: 'Workshop3', rank: 2 }, { optionValue: 'Workshop5', rank: 3 } ], // Q20 (ranking) -> Array<object>
    workshopRankingOther: '', // Q21 Other
    teamFormationPreference: 'Assign me to a team', // Q15 - NOTE: This ID seems wrong based on outline, Q15 is collab experience. Keeping for now.
    preformedTeamMembers: '', // Q16 (Add field, even if empty for this case) - Keep as string
    // availability: 'true', // Q17 (Boolean) -> string for FormData - REMOVE Legacy/Incorrect ID
    // availabilityDetails: '', // Q18 (Skipped as Q17 is true)
    // Section 4 (Working Style & Preferences + Technical Background)
    workingStyle: ['I enjoy debating opposing viewpoints', 'I like collaborative consensus-building'], // Q11 (multi-select) -> string[]
    workingStyleOther: '', // Q11 Other
    communicationStyle: 'I adapt my style depending on the group dynamic', // Q12 (single-select)
    collaborationRole: ['Research sources and gather evidence', 'Develop written arguments'], // Q13 (multi-select) -> string[]
    collaborationRoleOther: '', // Q13 Other
    presentationComfort: '6', // Q14 (Scale 1-10) -> Keep as string
    previousCollaborationExperience: 'Yes, occasionally (e.g., class discussions, informal debates)', // Q15 (single-select)
    previousCollaborationExperienceOther: '', // Q15 Other
    technicalFamiliarity: '4', // Q16 (Scale 1-5) -> Keep as string
    technicalInterests: 'AI Ethics frameworks', // Q17 (textarea)
    codingExperience: true, // Q20 (Boolean) -> Use actual boolean
    codingLanguages: 'Python, JavaScript', // Q21 (Optional, shown as Q20 is true) - Keep as string for textarea
    specificTools: 'Figma, VS Code', // Q22 (Optional) - Keep as string for textarea
    // Section 5
    // dietaryRestrictions: 'None', // Q23 (Optional) - REMOVE Duplicate
    // accessibilityNeeds: 'None', // Q24 (Optional) - REMOVE Duplicate
    // Section 5 (Team Formation Preferences cont. + Communication + Logistics)
    teammateSimilarityPreference: '5', // Q22 (Scale 1-10) -> Keep as string
    mentorshipPreference: 'I prefer to work with students of similar experience level to mine', // Q23 (single-select)
    mentorComfortAreas: '', // Q24 (textarea)
    preferredTeammates: '', // Q25 (textarea)
    discordMember: 'Yes', // Q26 (single-select)
    learningGoals: ['Deeper understanding of specific philosophical concepts', 'Experience with collaborative philosophical inquiry'], // Q27 (multi-select) -> string[]
    learningGoalsOther: '', // Q27 Other
    availabilityConfirmation: 'Yes, I can attend the full event', // Q28 (single-select)
    availabilityDetails: '', // Q29 (textarea)
    contingencyAvailability: 'Yes, I would be fully available that weekend', // Q30 (single-select)
    contingencyAvailabilityDetails: '', // Q31 (textarea)
    dietaryRestrictions: 'None', // Q32 (Optional)
    accessibilityNeeds: 'None', // Q33 (Optional)
    heardAboutSource: ['Email announcement', 'From a professor'], // Q34 (multi-select) -> string[]
    heardAboutSourceOther: '', // Q34 Other
    additionalInfo: 'Looking forward to the event!', // Q35 (textarea)
    themeRankingOther: '', // Q19 Other - Belongs with themeRanking
    // Section 6 (Consent)
    // codeOfConductAgreement, photoConsent, dataPrivacyConsent seem legacy/missing from V3.1 outline
    finalConfirmationAgreement: true, // Q36 (Boolean) -> Use actual boolean
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
          full_name: `${completeValidDataV3.firstName} ${completeValidDataV3.lastName}`, // V3 - Concatenated
          university: completeValidDataV3.university, // V3
          program: completeValidDataV3.programOfStudy, // V3
          year_of_study: 3, // Mapped from V3 academicYear
          // V1.1 fields not in V3 schema - provide defaults or handle nulls
          can_attend_may_3_4: 'maybe', // Default value
          may_3_4_comment: null,
          prior_courses: completeValidDataV3.philosophyCoursework, // Keep as string for TEXT field
          discussion_confidence: parseInt(completeValidDataV3.philosophyConfidenceDiscussion) || 5, // Map V3 scale
          writing_confidence: parseInt(completeValidDataV3.philosophyConfidenceWriting) || 5, // Map V3 scale
          // familiarity_analytic/continental/other not in V3.1 schema
          areas_of_interest: completeValidDataV3.philosophyInterests.join(', '), // Convert array back to string for TEXT field
          philosophical_traditions: completeValidDataV3.philosophyTraditions, // Pass array for TEXT[]
          philosophical_interests: completeValidDataV3.philosophyInterests, // Pass array for TEXT[]
          theme_rankings: completeValidDataV3.themeRanking, // Pass array of objects for JSONB
          theme_suggestion: completeValidDataV3.themeRankingOther, // Correctly map V3 other field
          workshop_rankings: completeValidDataV3.workshopRanking, // Pass array of objects for JSONB
          preferred_working_style: completeValidDataV3.workingStyle, // Pass array for TEXT[]
          teammate_similarity: parseInt(completeValidDataV3.teammateSimilarityPreference) || 5, // Map V3 scale
          // skill_ fields not in V3.1 schema
          preferred_teammates: completeValidDataV3.preformedTeamMembers, // Keep as string for TEXT field
          // complementary_perspectives not in V3.1 schema
          mentorship_preference: completeValidDataV3.mentorshipPreference, // Map V3 single-select
          mentorship_areas: completeValidDataV3.mentorComfortAreas, // Map V3 textarea
          familiarity_tech_concepts: parseInt(completeValidDataV3.technicalFamiliarity) || 3, // Map V3 scale
          prior_hackathon_experience: completeValidDataV3.codingExperience, // Pass boolean directly
          prior_hackathon_details: completeValidDataV3.codingLanguages, // Map V3 textarea
          dietary_restrictions: completeValidDataV3.dietaryRestrictions, // Map V3 textarea
          accessibility_needs: completeValidDataV3.accessibilityNeeds, // Map V3 textarea
          additional_notes: completeValidDataV3.additionalInfo, // Map V3 textarea
          how_heard: completeValidDataV3.heardAboutSource, // Pass array for TEXT[]
          how_heard_other: completeValidDataV3.heardAboutSourceOther, // Map V3 other field
          // V3 fields like studentId, consents are ignored as they are not in the expected DAL input structure
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
           full_name: `${completeValidDataV3.firstName} ${completeValidDataV3.lastName}`, // V3 - Concatenated
           university: completeValidDataV3.university, // V3
           program: completeValidDataV3.programOfStudy, // V3
           year_of_study: 3, // Mapped from V3 academicYear
           prior_courses: completeValidDataV3.philosophyCoursework, // Keep as string
           areas_of_interest: completeValidDataV3.philosophyInterests.join(', '), // Convert array to string
           theme_rankings: completeValidDataV3.themeRanking, // Pass array of objects
           workshop_rankings: completeValidDataV3.workshopRanking, // Pass array of objects
           familiarity_tech_concepts: parseInt(completeValidDataV3.technicalFamiliarity) || undefined, // Map V3 scale
           prior_hackathon_experience: completeValidDataV3.codingExperience, // Pass boolean directly
           prior_hackathon_details: completeValidDataV3.codingLanguages, // Map V3 textarea
           dietary_restrictions: completeValidDataV3.dietaryRestrictions, // Map V3 textarea
           accessibility_needs: completeValidDataV3.accessibilityNeeds, // Map V3 textarea
           // Add other mapped fields from submitRegistration's expected data
           discussion_confidence: parseInt(completeValidDataV3.philosophyConfidenceDiscussion) || undefined,
           writing_confidence: parseInt(completeValidDataV3.philosophyConfidenceWriting) || undefined,
           philosophical_traditions: completeValidDataV3.philosophyTraditions,
           philosophical_interests: completeValidDataV3.philosophyInterests,
           theme_suggestion: completeValidDataV3.themeRankingOther, // Correctly map V3 other field
           preferred_working_style: completeValidDataV3.workingStyle,
           teammate_similarity: parseInt(completeValidDataV3.teammateSimilarityPreference) || undefined,
           preferred_teammates: completeValidDataV3.preformedTeamMembers,
           mentorship_preference: completeValidDataV3.mentorshipPreference,
           mentorship_areas: completeValidDataV3.mentorComfortAreas,
           additional_notes: completeValidDataV3.additionalInfo,
           how_heard: completeValidDataV3.heardAboutSource,
           how_heard_other: completeValidDataV3.heardAboutSourceOther,
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