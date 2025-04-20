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
vi.mock('@/lib/supabase/server', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    createClient: vi.fn(),
  };
});

// Mock the DAL module for registrations
vi.mock('@/lib/data/registrations', () => ({
  fetchRegistrationByUserId: vi.fn(),
  insertRegistration: vi.fn(),
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

// Get the mocked function itself from the mocked module
const mockedCreateClient = vi.mocked(createClient);

// Define the structure of the mock client object returned by the mocked function
const mockSupabaseClient = {
    auth: {
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
    },
    // Remove 'from' property as it's no longer mocked
};

// Import mocked DAL functions at the top level (add update/delete)
const {
  fetchRegistrationByUserId: mockFetchReg,
  insertRegistration: mockInsertReg,
  updateRegistration: mockUpdateReg, // Add mock for update
  deleteRegistration: mockDeleteReg, // Add mock for delete
} = vi.mocked(await import('@/lib/data/registrations'));


// Placeholder for actual action functions - tests will fail
const submitRegistration = vi.fn();
const updateRegistration = vi.fn();
const deleteRegistration = vi.fn();


describe('Registration Server Actions', () => {
  let previousState: RegistrationState;

  // Define complete valid data based on the schema in actions.ts (v1.1)
  const completeValidData = {
    full_name: 'Valid Test User',
    email: 'valid@example.com',
    university: 'University of Testing',
    program: 'Test Philosophy',
    year_of_study: 2,
    can_attend_may_3_4: 'yes' as const, // Use const for enum type safety
    may_3_4_comment: '',
    prior_courses: ['PHI101', 'PHI202'],
    discussion_confidence: 7,
    writing_confidence: 8,
    familiarity_analytic: 4,
    familiarity_continental: 3,
    familiarity_other: 2,
    philosophical_traditions: ['Analytic', 'Continental'],
    philosophical_interests: ['Ethics', 'Metaphysics'],
    areas_of_interest: 'AI Ethics',
    theme_rankings: JSON.stringify([
      { rank: 1, theme_id: 't1' }, { rank: 2, theme_id: 't2' },
      { rank: 3, theme_id: 't3' }, { rank: 4, theme_id: 't4' },
      { rank: 5, theme_id: 't5' }, { rank: 6, theme_id: 't6' },
      { rank: 7, theme_id: 't7' }, { rank: 8, theme_id: 't8' },
    ]),
    theme_suggestion: '',
    workshop_rankings: JSON.stringify([
      { rank: 1, workshop_id: 'w1' }, { rank: 2, workshop_id: 'w2' },
      { rank: 3, workshop_id: 'w3' }, { rank: 4, workshop_id: 'w4' },
      { rank: 5, workshop_id: 'w5' }, { rank: 6, workshop_id: 'w6' },
      { rank: 7, workshop_id: 'w7' }, { rank: 8, workshop_id: 'w8' },
    ]), // Rank all 8 for simplicity, meets min 3 requirement
    preferred_working_style: 'balanced' as const,
    teammate_similarity: 5,
    skill_writing: 4,
    skill_speaking: 3,
    skill_research: 4,
    skill_synthesis: 3,
    skill_critique: 4,
    mentorship_preference: 'no_preference' as const,
    mentorship_areas: '',
    preferred_teammates: '',
    complementary_perspectives: '',
    familiarity_tech_concepts: 2,
    prior_hackathon_experience: 'false', // Use string for FormData
    prior_hackathon_details: '',
    dietary_restrictions: 'None',
    accessibility_needs: 'None',
    additional_notes: '',
    how_heard: 'professor' as const,
    how_heard_other: '',
  };

  // Expected data structure after Zod parsing and before DB insertion
  // (used for checking mockInsertReg calls)
  const expectedParsedData = {
    ...completeValidData,
    // Zod coerces these to numbers
    year_of_study: 2,
    discussion_confidence: 7,
    writing_confidence: 8,
    familiarity_analytic: 4,
    familiarity_continental: 3,
    familiarity_other: 2,
    teammate_similarity: 5,
    skill_writing: 4,
    skill_speaking: 3,
    skill_research: 4,
    skill_synthesis: 3,
    skill_critique: 4,
    familiarity_tech_concepts: 2,
    // Zod transforms these JSON strings into objects/arrays
    theme_rankings: JSON.parse(completeValidData.theme_rankings),
    workshop_rankings: JSON.parse(completeValidData.workshop_rankings),
    // Zod preprocesses this to boolean
    prior_hackathon_experience: false,
    // Ensure arrays are present
    prior_courses: ['PHI101', 'PHI202'],
    philosophical_traditions: ['Analytic', 'Continental'],
    philosophical_interests: ['Ethics', 'Metaphysics'],
    // Optional fields provided as empty strings in completeValidData remain empty strings
    may_3_4_comment: '',
    theme_suggestion: '',
    mentorship_areas: '',
    preferred_teammates: '',
    complementary_perspectives: '',
    prior_hackathon_details: '',
    dietary_restrictions: 'None', // Provided
    accessibility_needs: 'None', // Provided
    additional_notes: '',
    how_heard_other: '',
    // Optional enum defaults if not provided
    mentorship_preference: 'no_preference',
  };


  beforeEach(() => {
    vi.clearAllMocks();
    // Configure the mock createClient function to return a Promise resolving to the mock client object
    mockedCreateClient.mockResolvedValue(mockSupabaseClient as unknown as SupabaseClient); // Use mockResolvedValue

    // Reset individual mocks on the client object
    vi.mocked(mockSupabaseClient.auth.getSession).mockReset();
    vi.mocked(mockSupabaseClient.auth.signInWithOtp).mockReset();

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

    it('should return error if user session cannot be retrieved', async () => {
      vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: new Error('Session fetch failed') });
      const formData = createTestFormData(completeValidData);
      const result = await submitRegistration(previousState, formData);
      // expect(result.success).toBe(false);
      // expect(result.message).toContain('Could not retrieve user session');
      expect(true).toBe(false); // Placeholder failure
    });

    it('should return error if user is not authenticated', async () => {
      vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
      const formData = createTestFormData(completeValidData);
      const result = await submitRegistration(previousState, formData);
      // expect(result.success).toBe(false);
      // expect(result.message).toContain('User not authenticated');
      expect(true).toBe(false); // Placeholder failure
    });


    it('should return validation errors for missing required fields', async () => {
      // TDD Anchor: Test validation failure returns correct error structure.
      vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123', email: 'valid@example.com' } } } as any,
        error: null,
      });

      // Create data missing a required field (e.g., university)
      const { university, ...incompleteData } = completeValidData;
      const formData = createTestFormData(incompleteData);
      const result = await submitRegistration(previousState, formData);

      // expect(result.success).toBe(false);
      // expect(result.message).toContain('Validation failed');
      // expect(result.errors).toBeDefined();
      // expect(result.errors?.university).toBeDefined();
      expect(true).toBe(false); // Placeholder failure
    });

    it('should return error on database insertion failure', async () => {
      // TDD Anchor: Test database insertion error handling.
      const userId = 'user-123';
      vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any,
        error: null,
      });
      mockInsertReg.mockResolvedValue({ registration: null, error: new Error('DB insert failed') }); // Insert fails

      const formData = createTestFormData(completeValidData);
      const result = await submitRegistration(previousState, formData);

      // expect(result.success).toBe(false);
      // expect(result.message).toContain('Database Error: Failed to save registration. DB insert failed');
      expect(true).toBe(false); // Placeholder failure
    });

    it('should call insert with user_id and redirect on success', async () => {
      // TDD Anchor: Test successful insertion linking to user_id.
      const userId = 'user-123';
      vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any,
        error: null,
      });
      mockInsertReg.mockResolvedValue({ registration: { id: 'new-reg-id' } as any, error: null }); // Successful insert

      const formData = createTestFormData(completeValidData);
      await submitRegistration(previousState, formData);

      // Check against the expected parsed data structure, ensuring user_id is present
      // expect(mockInsertReg).toHaveBeenCalledWith(
      //   expect.objectContaining({ ...expectedParsedData, user_id: userId })
      // );
      // expect(revalidatePath).toHaveBeenCalledWith('/admin/registrations'); // Or other relevant paths
      // expect(redirect).toHaveBeenCalledWith('/register/success'); // Or appropriate success path

      expect(true).toBe(false); // Placeholder failure
    });
  }); // End describe submitRegistration

  describe('updateRegistration', () => {
    // --- TDD Anchors for updateRegistration ---
    it('should return error if user is not authenticated', async () => {
       vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
       const formData = createTestFormData(completeValidData);
       const result = await updateRegistration(previousState, formData);
       // expect(result.success).toBe(false);
       // expect(result.message).toContain('User not authenticated');
       expect(true).toBe(false); // Placeholder failure
    });

    it('should return validation errors for missing required fields', async () => {
       vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
         data: { session: { user: { id: 'user-123', email: 'valid@example.com' } } } as any,
         error: null,
       });
       const { university, ...incompleteData } = completeValidData;
       const formData = createTestFormData(incompleteData);
       const result = await updateRegistration(previousState, formData);
       // expect(result.success).toBe(false);
       // expect(result.message).toContain('Validation failed');
       // expect(result.errors?.university).toBeDefined();
       expect(true).toBe(false); // Placeholder failure
    });

    it('should return error on database update failure', async () => {
       const userId = 'user-123';
       vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
         data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any,
         error: null,
       });
       mockUpdateReg.mockResolvedValue({ registration: null, error: new Error('DB update failed') }); // Update fails

       const formData = createTestFormData(completeValidData);
       const result = await updateRegistration(previousState, formData);
       // expect(result.success).toBe(false);
       // expect(result.message).toContain('Database Error: Failed to update registration. DB update failed');
       expect(true).toBe(false); // Placeholder failure
    });

    it('should call update with user_id and redirect on success', async () => {
       const userId = 'user-123';
       vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
         data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any,
         error: null,
       });
       mockUpdateReg.mockResolvedValue({ registration: { id: 'reg-id-to-update' } as any, error: null }); // Successful update

       const formData = createTestFormData(completeValidData);
       await updateRegistration(previousState, formData);

       // expect(mockUpdateReg).toHaveBeenCalledWith(
       //   userId, // Assuming action gets userId from session
       //   expect.objectContaining(expectedParsedData) // Check data passed
       // );
       // expect(revalidatePath).toHaveBeenCalledWith('/admin/registrations'); // Or other relevant paths
       // expect(redirect).toHaveBeenCalledWith('/register/success'); // Or appropriate success path

       expect(true).toBe(false); // Placeholder failure
    });
  }); // End describe updateRegistration

  describe('deleteRegistration', () => {
    // --- TDD Anchors for deleteRegistration ---
     it('should return error if user is not authenticated', async () => {
       vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
       // Assuming delete action takes confirmation or similar, not FormData
       const result = await deleteRegistration({ confirmed: true }); // Example input
       // expect(result.success).toBe(false);
       // expect(result.message).toContain('User not authenticated');
       expect(true).toBe(false); // Placeholder failure
    });

     it('should return error if confirmation is not provided (if required by action)', async () => {
       const userId = 'user-123';
       vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
         data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any,
         error: null,
       });
       // Assuming delete action requires a specific confirmation flag/value
       const result = await deleteRegistration({ confirmed: false }); // Example input
       // expect(result.success).toBe(false);
       // expect(result.message).toContain('Deletion not confirmed');
       expect(true).toBe(false); // Placeholder failure
     });

     it('should return error on database delete failure', async () => {
       const userId = 'user-123';
       vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
         data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any,
         error: null,
       });
       mockDeleteReg.mockResolvedValue({ error: new Error('DB delete failed') }); // Delete fails

       const result = await deleteRegistration({ confirmed: true }); // Example input
       // expect(result.success).toBe(false);
       // expect(result.message).toContain('Database Error: Failed to delete registration. DB delete failed');
       expect(true).toBe(false); // Placeholder failure
     });

     it('should call delete with user_id and redirect on success', async () => {
       const userId = 'user-123';
       vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
         data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any,
         error: null,
       });
       mockDeleteReg.mockResolvedValue({ error: null }); // Successful delete

       await deleteRegistration({ confirmed: true }); // Example input

       // expect(mockDeleteReg).toHaveBeenCalledWith(userId); // Assuming action gets userId from session
       // expect(revalidatePath).toHaveBeenCalledWith('/admin/registrations'); // Or other relevant paths
       // expect(redirect).toHaveBeenCalledWith('/register/deleted'); // Or appropriate path

       expect(true).toBe(false); // Placeholder failure
     });
  }); // End describe deleteRegistration

}); // End describe Registration Server Actions