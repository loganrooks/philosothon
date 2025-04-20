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

  // Define complete valid data based on the V2 schema
  const completeValidData = {
    email: 'valid@example.com',
    full_name: 'Valid Test User V2',
    pronouns: 'they/them',
    student_id: '100987654', // Corrected ID
    university: 'University of Testing V2',
    academic_year: '3rd Year' as const, // Corrected ID
    program: 'Test Philosophy V2',
    philosophy_coursework: 'PHI303, PHI404', // Renamed, optional
    philosophy_interests: 'AI Ethics, Phenomenology', // Renamed, optional
    event_expectations: 'Learn new things and meet people V2', // Renamed
    attendance_preference: 'In-Person' as const, // Renamed
    workshop_preference: 'Workshop A, Workshop B', // Renamed, optional
    dietary_restrictions: 'Vegan', // Renamed, optional
    accessibility_needs: 'None', // Renamed, optional
    code_of_conduct_agreement: 'true', // Use string for FormData boolean
    photo_consent: 'true', // Use string for FormData boolean
    data_privacy_consent: 'true', // Use string for FormData boolean
  };

  // Expected data structure after Zod parsing (V2)
  const expectedParsedData = {
    email: 'valid@example.com',
    full_name: 'Valid Test User V2',
    pronouns: 'they/them',
    student_id: '100987654',
    university: 'University of Testing V2',
    academic_year: '3rd Year',
    program: 'Test Philosophy V2',
    philosophy_coursework: 'PHI303, PHI404',
    philosophy_interests: 'AI Ethics, Phenomenology',
    event_expectations: 'Learn new things and meet people V2',
    attendance_preference: 'In-Person',
    workshop_preference: 'Workshop A, Workshop B',
    dietary_restrictions: 'Vegan',
    accessibility_needs: 'None',
    code_of_conduct_agreement: true, // Zod parses boolean
    photo_consent: true, // Zod parses boolean
    data_privacy_consent: true, // Zod parses boolean
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
      const formData = createTestFormData(completeValidData);
      const result = await submitRegistration(previousState, formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication error: Could not retrieve user.'); // Updated expected message
      // expect(true).toBe(false); // Placeholder failure - REMOVED
    });

    it('should return error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null }); // Mock getUser returning null user
      const formData = createTestFormData(completeValidData);
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

      // Create data missing a required field (e.g., university)
      const { university, ...incompleteData } = completeValidData;
      const formData = createTestFormData(incompleteData);
      const result = await submitRegistration(previousState, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation failed');
      expect(result.errors).toBeDefined();
      // Check for a specific missing field based on V2 schema
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

      const formData = createTestFormData(completeValidData);
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

      const formData = createTestFormData(completeValidData);
      // Mock getUser to return the authenticated user
      mockGetUser.mockResolvedValue({ // Use direct mock
          data: { user: { id: userId, email: 'valid@example.com' } },
          error: null,
      });
      // Mock fetchReg to indicate no existing registration
      mockFetchReg.mockResolvedValue({ registration: null, error: null });

      await submitRegistration(previousState, formData);

      // Check against the V1.1 structure expected by the DAL mock
      const expectedInsertData = {
          user_id: userId,
          email: completeValidData.email,
          full_name: completeValidData.full_name,
          university: completeValidData.university,
          program: completeValidData.program,
          year_of_study: 3, // Mapped from academic_year
          // Default values for V1.1 fields not in V2 form data
          can_attend_may_3_4: 'maybe',
          may_3_4_comment: null,
          prior_courses: [completeValidData.philosophy_coursework], // Mapped
          discussion_confidence: 5,
          writing_confidence: 5,
          familiarity_analytic: 3,
          familiarity_continental: 3,
          familiarity_other: 3,
          areas_of_interest: completeValidData.philosophy_interests, // Mapped
          philosophical_traditions: [],
          philosophical_interests: [],
          theme_rankings: {},
          theme_suggestion: null,
          workshop_rankings: {},
          preferred_working_style: 'balanced',
          teammate_similarity: 5,
          skill_writing: 3,
          skill_speaking: 3,
          skill_research: 3,
          skill_synthesis: 3,
          skill_critique: 3,
          preferred_teammates: null,
          complementary_perspectives: null,
          mentorship_preference: 'no_preference',
          mentorship_areas: null,
          familiarity_tech_concepts: 3,
          prior_hackathon_experience: false,
          prior_hackathon_details: null,
          dietary_restrictions: completeValidData.dietary_restrictions, // V2 field matches V1.1
          accessibility_needs: completeValidData.accessibility_needs, // V2 field matches V1.1
          additional_notes: null,
          how_heard: 'other',
          how_heard_other: null,
      };
      expect(mockInsertReg).toHaveBeenCalledWith(
        expect.objectContaining(expectedInsertData)
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
        const formData = createTestFormData(completeValidData);
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
       const { university, ...incompleteData } = completeValidData;
       const formData = createTestFormData(incompleteData);
       const result = await updateRegistration(previousState, formData);
       expect(result.success).toBe(false);
       expect(result.message).toContain('Validation failed');
       expect(result.errors?.university).toBeDefined();
       // expect(true).toBe(false); // Placeholder failure - REMOVED
   });

   it('should return error on database update failure', async () => {
      const userId = 'user-123';
      mockGetUser.mockResolvedValue({ // Mock getUser succeeding
        data: { user: { id: userId, email: 'valid@example.com' } },
        error: null,
      });
       mockUpdateReg.mockResolvedValue({ registration: null, error: new Error('DB update failed') }); // Update fails

       const formData = createTestFormData(completeValidData);
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

       const formData = createTestFormData(completeValidData);
       // Mock getUser to return the authenticated user
       mockGetUser.mockResolvedValue({ // Use direct mock variable
           data: { user: { id: userId, email: 'valid@example.com' } },
           error: null,
       });

       await updateRegistration(previousState, formData);

       // Adjust expected data for update (V1.1 structure)
       const expectedUpdateData = {
           email: completeValidData.email,
           full_name: completeValidData.full_name,
           university: completeValidData.university,
           program: completeValidData.program,
           year_of_study: 3, // Mapped from academic_year
           prior_courses: [completeValidData.philosophy_coursework], // Mapped
           areas_of_interest: completeValidData.philosophy_interests, // Mapped
           dietary_restrictions: completeValidData.dietary_restrictions, // V2 field matches V1.1
           accessibility_needs: completeValidData.accessibility_needs, // V2 field matches V1.1
           // Other V1.1 fields are not included in the V2 form/schema, so they won't be in the update payload
       };

       expect(mockUpdateReg).toHaveBeenCalledWith(
         userId, // Assuming action gets userId from session
         expect.objectContaining(expectedUpdateData) // Check data passed
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