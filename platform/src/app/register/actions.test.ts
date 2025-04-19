import { createRegistration, RegistrationState } from './actions';
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

// Mock Zod schema for testing purposes (can refine later)
const MockRegistrationSchema = z.object({
  full_name: z.string().min(1),
  university: z.string().min(1),
  program: z.string().min(1),
  year_of_study: z.coerce.number().int().min(1),
  can_attend_may_3_4: z.enum(['yes', 'no', 'maybe']),
  may_3_4_comment: z.string().optional(),
  prior_courses: z.array(z.string()).optional(),
  familiarity_analytic: z.coerce.number().int().min(1).max(5),
  familiarity_continental: z.coerce.number().int().min(1).max(5),
  familiarity_other: z.coerce.number().int().min(1).max(5),
  areas_of_interest: z.string().optional(),
  preferred_working_style: z.enum(['structured', 'exploratory', 'balanced']),
  skill_writing: z.coerce.number().int().min(1).max(5),
  skill_speaking: z.coerce.number().int().min(1).max(5),
  skill_research: z.coerce.number().int().min(1).max(5),
  skill_synthesis: z.coerce.number().int().min(1).max(5),
  skill_critique: z.coerce.number().int().min(1).max(5),
  preferred_teammates: z.string().optional(),
  complementary_perspectives: z.string().optional(),
  familiarity_tech_concepts: z.coerce.number().int().min(1).max(5),
  prior_hackathon_experience: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()),
  prior_hackathon_details: z.string().optional(),
  accessibility_needs: z.string().optional(),
});

// Helper to create FormData
const createTestFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  for (const key in data) {
    if (Array.isArray(data[key])) {
        data[key].forEach((value: string) => formData.append(key, value));
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

  // Define complete valid data based on the schema in actions.ts
  const completeValidData = {
    email: 'test@example.com',
    full_name: 'Test User',
    university: 'UofT',
    program: 'Philosophy',
    year_of_study: 3,
    can_attend_may_3_4: 'yes',
    familiarity_analytic: 3,
    familiarity_continental: 3,
    familiarity_other: 1,
    preferred_working_style: 'balanced',
    skill_writing: 4,
    skill_speaking: 3,
    skill_research: 4,
    skill_synthesis: 3,
    skill_critique: 4,
    familiarity_tech_concepts: 2,
    prior_hackathon_experience: false,
    // Optional fields can be omitted or added as needed
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
    // Use complete data but override email *after* spreading
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
     // Use complete valid data, overriding only the email
     const formData = createTestFormData({ ...completeValidData, email: 'different@example.com' });
     const result = await createRegistration(previousState, formData);
     expect(result.success).toBe(false);
     expect(result.message).toContain('Email does not match logged-in user');
   });


  it('should return error if logged-in user is already registered', async () => {
    // TDD Anchor: Test handling when logged-in user has already registered.
    vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'test@example.com' } } } as any,
      error: null,
    });
    // Mock the DAL function to return an existing registration
    mockFetchReg.mockResolvedValue({ registration: { id: 'reg-456' } as any, error: null });

   // Use complete valid data
   const formData = createTestFormData({ ...completeValidData, email: 'test@example.com' });
   const result = await createRegistration(previousState, formData);
   expect(result.success).toBe(false);
    expect(result.message).toContain('You have already registered');
  });

   it('should return error on database error checking existing registration', async () => {
     // TDD Anchor: Test handling of database error during existing registration check (logged-in).
     vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({
       data: { session: { user: { id: 'user-123', email: 'test@example.com' } } } as any,
       error: null,
     });
    // Mock the DAL function to return an error
    mockFetchReg.mockResolvedValue({ registration: null, error: new Error('DB check failed') });

    // Use complete valid data
    const formData = createTestFormData({ ...completeValidData, email: 'test@example.com' });
    const result = await createRegistration(previousState, formData);
    expect(result.success).toBe(false);
     expect(result.message).toContain('Database error checking registration status');
   });

  it('should return validation errors for missing required fields', async () => {
    // TDD Anchor: Test validation failure returns correct error structure.
    vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null }); // No session
    vi.mocked(mockSupabaseClient.auth.signInWithOtp).mockResolvedValue({ data: {}, error: null }); // Assume OTP sent

    const formData = createTestFormData({ email: 'new@example.com' /* Missing required fields */ });
    const result = await createRegistration(previousState, formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Validation failed');
    expect(result.errors).toBeDefined();
    expect(result.errors?.full_name).toBeDefined(); // Example required field
    expect(result.errors?.university).toBeDefined(); // Example required field
  });

  it('should return error on Supabase sign-up failure', async () => {
    // TDD Anchor: Test handling sign-up errors from Supabase.
    vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ data: { session: null }, error: null }); // No session
    vi.mocked(mockSupabaseClient.auth.signInWithOtp).mockResolvedValue({
      data: {},
      error: new Error('Supabase OTP error'), // Simulate sign-up error
    });
    // Use complete valid data, overriding only the email
    const formData = createTestFormData({ ...completeValidData, email: 'new@example.com' });
    const result = await createRegistration(previousState, formData);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Could not initiate sign-up: Supabase OTP error');
  });


  it('should return error on database insertion failure', async () => {
    // TDD Anchor: Test database insertion error handling.

    // --- Specific Mocks for this Test ---
     vi.mocked(mockSupabaseClient.auth.getSession).mockResolvedValue({ // Mock successful session
       data: { session: { user: { id: 'user-123', email: 'test@example.com' } } } as any,
       error: null,
     });

     // Mock DAL functions for this specific scenario
     mockFetchReg.mockResolvedValue({ registration: null, error: null }); // No existing registration
     mockInsertReg.mockResolvedValue({ registration: null, error: new Error('DB insert failed') }); // Insert fails
     // --- End Specific Mocks ---


    // Use the predefined completeValidData
    const validData = { ...completeValidData };
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
       data: { session: { user: { id: userId, email: 'test@example.com' } } } as any,
       error: null,
     });
     // Mock DAL functions for successful path
     mockFetchReg.mockResolvedValue({ registration: null, error: null }); // No existing registration
     mockInsertReg.mockResolvedValue({ registration: { id: 'new-reg-id' } as any, error: null }); // Successful insert


    // Use the predefined completeValidData
    const validData = { ...completeValidData };
    const formData = createTestFormData(validData);
    await createRegistration(previousState, formData);

    expect(mockInsertReg).toHaveBeenCalledWith(
      expect.objectContaining({ ...validData, user_id: userId }) // Check if user_id is included
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


    // Use the predefined completeValidData, overriding email
    const validData = { ...completeValidData, email: 'new@example.com', full_name: 'New User' };
    const formData = createTestFormData(validData);
    await createRegistration(previousState, formData);

    expect(mockInsertReg).toHaveBeenCalledWith(
      expect.objectContaining({ ...validData, email: 'new@example.com', user_id: undefined }) // Check user_id is NOT included initially
    );
    expect(revalidatePath).toHaveBeenCalledWith('/admin/registrations');
    expect(redirect).toHaveBeenCalledWith('/register/pending');
  });

  // Add more tests based on TDD Anchors:
  // - Test successful validation and data preparation (check data passed to insert)
  // - Test confirmation email trigger call (mock email service or DAL function if used)
});