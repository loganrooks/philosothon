import { createRegistration, RegistrationState } from '@/app/register/actions';
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

// Import mocked DAL functions at the top level
const { fetchRegistrationByUserId: mockFetchReg, insertRegistration: mockInsertReg } =
  vi.mocked(await import('@/lib/data/registrations'));


describe('createRegistration Server Action', () => {
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
  });

  // --- TDD Anchors ---

  it('should return error for invalid email submission', async () => {
    // TDD Anchor: Test invalid email submission.
    // Explicitly mock getSession for this case as no session is expected
    vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
    // Use complete data but override email
    const formData = createTestFormData({ ...completeValidData, email: 'invalid-email' });
    const result = await createRegistration(previousState, formData);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid email address');
  });

  it('should return error if logged-in user submits with different email', async () => {
     // TDD Anchor: Test logged-in user submitting with different email.
     vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
       data: { session: { user: { id: 'user-123', email: 'logged-in@example.com' } } } as any,
       error: null,
     });
     // Use complete valid data, overriding email
     const formData = createTestFormData({ ...completeValidData, email: 'different@example.com' });
     const result = await createRegistration(previousState, formData);
     expect(result.success).toBe(false);
     expect(result.message).toContain('Email does not match logged-in user');
   });


  it('should return error if logged-in user is already registered', async () => {
    // TDD Anchor: Test handling when logged-in user has already registered.
    vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'valid@example.com' } } } as any, // Use valid email
      error: null,
    });
    // Mock the DAL function to return an existing registration
    mockFetchReg.mockResolvedValue({ registration: { id: 'reg-456' } as any, error: null });

   // Use complete valid data
   const formData = createTestFormData({ ...completeValidData }); // Email matches session
   const result = await createRegistration(previousState, formData);
   expect(result.success).toBe(false);
    expect(result.message).toContain('You have already registered');
  });

   it('should return error on database error checking existing registration', async () => {
     // TDD Anchor: Test handling of database error during existing registration check (logged-in).
     vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
       data: { session: { user: { id: 'user-123', email: 'valid@example.com' } } } as any, // Use valid email
       error: null,
     });
    // Mock the DAL function to return an error
    mockFetchReg.mockResolvedValue({ registration: null, error: new Error('DB check failed') });

    // Use complete valid data
    const formData = createTestFormData({ ...completeValidData }); // Email matches session
    const result = await createRegistration(previousState, formData);
    expect(result.success).toBe(false);
     expect(result.message).toContain('Database error checking registration status');
   });

  it('should return validation errors for missing required fields', async () => {
    // TDD Anchor: Test validation failure returns correct error structure.
    vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null }); // No session
    vi.mocked(mockSupabaseClient.auth.signInWithOtp).mockResolvedValue({ data: {}, error: null }); // Assume OTP sent

    // Create data missing a required field (e.g., university) by omitting it
    const { university, ...incompleteData } = completeValidData;
    const formData = createTestFormData(incompleteData);
    const result = await createRegistration(previousState, formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Validation failed');
    expect(result.errors).toBeDefined();
    // Expect the *first* validation error based on the schema order
    expect(result.errors?.university).toBeDefined();
    // Optionally check that other errors are NOT present if university is the first failure
    // expect(result.errors?.full_name).toBeUndefined();
  });

  it('should return error on Supabase sign-up failure', async () => {
    // TDD Anchor: Test handling sign-up errors from Supabase.
    vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null }); // No session
    vi.mocked(mockSupabaseClient.auth.signInWithOtp).mockResolvedValue({
      data: {},
      error: new Error('Supabase OTP error'), // Simulate sign-up error
    });
    // Use complete valid data, overriding email
    const formData = createTestFormData({ ...completeValidData, email: 'new@example.com' });
    const result = await createRegistration(previousState, formData);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Could not initiate sign-up: Supabase OTP error');
  });


  it('should return error on database insertion failure', async () => {
    // TDD Anchor: Test database insertion error handling.

    // --- Specific Mocks for this Test ---
     vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ // Mock successful session
       data: { session: { user: { id: 'user-123', email: 'valid@example.com' } } } as any, // Use valid email
       error: null,
     });

     // Mock DAL functions for this specific scenario
     mockFetchReg.mockResolvedValue({ registration: null, error: null }); // No existing registration
     mockInsertReg.mockResolvedValue({ registration: null, error: new Error('DB insert failed') }); // Insert fails
     // --- End Specific Mocks ---


    // Use the updated completeValidData
    const validData = { ...completeValidData }; // Email matches session
    const formData = createTestFormData(validData);
    const result = await createRegistration(previousState, formData);

    // Add a check to ensure result is defined before accessing properties
    expect(result).toBeDefined();
    if (!result) return; // Guard clause for type safety

    expect(result.success).toBe(false);
    expect(result.message).toContain('Database Error: Failed to save registration. DB insert failed');
  });

  it('should call insert and redirect to /register/success for logged-in user', async () => {
    // TDD Anchor: Test successful insertion into the `registrations` table (with user_id).
    // TDD Anchor: Test correct redirect path based on logged-in user.
     const userId = 'user-123';
     vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
       data: { session: { user: { id: userId, email: 'valid@example.com' } } } as any, // Use valid email
       error: null,
     });
     // Mock DAL functions for successful path
     mockFetchReg.mockResolvedValue({ registration: null, error: null }); // No existing registration
     mockInsertReg.mockResolvedValue({ registration: { id: 'new-reg-id' } as any, error: null }); // Successful insert


    // Use the updated completeValidData
    const validData = { ...completeValidData }; // Email matches session
    const formData = createTestFormData(validData);
    await createRegistration(previousState, formData);

    // Check against the expected parsed data structure
    expect(mockInsertReg).toHaveBeenCalledWith(
      expect.objectContaining({ ...expectedParsedData, user_id: userId })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/admin/registrations');
    expect(redirect).toHaveBeenCalledWith('/register/success');
  });

  it('should call insert and redirect to /register/pending for new user sign-up', async () => {
    // TDD Anchor: Test successful insertion into the `registrations` table (without user_id initially).
    // TDD Anchor: Test correct redirect path based on new user.
    vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null }); // No session
    vi.mocked(mockSupabaseClient.auth.signInWithOtp).mockResolvedValue({ data: {}, error: null }); // Assume OTP sent
    // Mock DAL function for successful insert
    mockInsertReg.mockResolvedValue({ registration: { id: 'new-reg-id-2' } as any, error: null });


    // Use the updated completeValidData, overriding email
    const validData = { ...completeValidData, email: 'new@example.com' };
    const formData = createTestFormData(validData);
    await createRegistration(previousState, formData);

    // Check against the expected parsed data structure, ensuring user_id is null/undefined
    expect(mockInsertReg).toHaveBeenCalledWith(
      expect.objectContaining({ ...expectedParsedData, email: 'new@example.com', user_id: null })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/admin/registrations');
    expect(redirect).toHaveBeenCalledWith('/register/pending');
  });

  // Add more tests based on TDD Anchors:
  // - Test successful validation and data preparation (check data passed to insert)
  // - Test confirmation email trigger call (mock email service or DAL function if used)
});