import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers'; // Removed incorrect Headers import
import { redirect } from 'next/navigation';
import { signInWithOtp, signOut, type LoginFormState } from './actions'; // Import the actions and type

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/headers');
vi.mock('next/navigation');

describe('Admin Authentication Server Actions (auth/actions.ts)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any; // Disabled ESLint for mock variable type
  let mockSignInWithOtp: ReturnType<typeof vi.fn>;
  let mockSignOut: ReturnType<typeof vi.fn>;
  let mockHeadersGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client and auth methods
    mockSignInWithOtp = vi.fn();
    mockSignOut = vi.fn();
    const mockAuth = { signInWithOtp: mockSignInWithOtp, signOut: mockSignOut };
    mockSupabase = { auth: mockAuth };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any); // Disabled ESLint for mock cast

    // Mock next/headers
    mockHeadersGet = vi.fn();
    vi.mocked(headers).mockReturnValue({
      get: mockHeadersGet,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any); // Disabled ESLint for mock cast

    // Mock next/navigation redirect
    vi.mocked(redirect).mockImplementation((path: string) => {
      // In tests, throw specific error to catch redirects
      const error = new Error('NEXT_REDIRECT');
      (error as Error & { digest?: string }).digest = `NEXT_REDIRECT;${path}`; // Use specific type assertion
      throw error;
    });
  });

  describe('signInWithOtp', () => {
    it('should return validation error if email is missing', async () => {
      const formData = new FormData();
      formData.append('email', ''); // Empty email
      const initialState: LoginFormState = { message: null, success: false };

      const result = await signInWithOtp(initialState, formData);

      expect(result).toEqual({
        success: false,
        message: 'Invalid email address.',
      });
      expect(mockSignInWithOtp).not.toHaveBeenCalled();
    });

    it('should return validation error if email is invalid', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      const initialState: LoginFormState = { message: null, success: false };

      const result = await signInWithOtp(initialState, formData);

      expect(result).toEqual({
        success: false,
        message: 'Invalid email address.',
      });
      expect(mockSignInWithOtp).not.toHaveBeenCalled();
    });

     it('should return error if origin header is missing', async () => {
      mockHeadersGet.mockReturnValue(null); // Simulate missing origin
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      const initialState: LoginFormState = { message: null, success: false };

      const result = await signInWithOtp(initialState, formData);

      expect(result).toEqual({
        success: false,
        message: 'Could not determine redirect origin.', // Corrected message
      });
      expect(mockSignInWithOtp).not.toHaveBeenCalled();
    });

    it('should call Supabase signInWithOtp and return success on valid email', async () => {
      const testEmail = 'test@example.com';
      const testOrigin = 'http://localhost:3000';
      mockHeadersGet.mockReturnValue(testOrigin); // Set origin
      mockSignInWithOtp.mockResolvedValue({ data: {}, error: null }); // Mock successful Supabase call

      const formData = new FormData();
      formData.append('email', testEmail);
      const initialState: LoginFormState = { message: null, success: false };

      const result = await signInWithOtp(initialState, formData);

      expect(createClient).toHaveBeenCalledTimes(1);
      expect(headers).toHaveBeenCalledTimes(1);
      expect(mockHeadersGet).toHaveBeenCalledWith('origin');
      expect(mockSignInWithOtp).toHaveBeenCalledTimes(1);
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: testEmail,
        options: {
          emailRedirectTo: `${testOrigin}/auth/callback`,
        },
      });
      expect(result).toEqual({
        success: true,
        message: 'Check your email for the magic link!', // Added exclamation mark
      });
    });

    it('should return error message on Supabase signInWithOtp failure', async () => {
      const testEmail = 'test@example.com';
      const testOrigin = 'http://localhost:3000';
      const supabaseError = { message: 'Supabase OTP error' };
      mockHeadersGet.mockReturnValue(testOrigin);
      mockSignInWithOtp.mockResolvedValue({ data: null, error: supabaseError }); // Mock failed Supabase call

      const formData = new FormData();
      formData.append('email', testEmail);
      const initialState: LoginFormState = { message: null, success: false };

      const result = await signInWithOtp(initialState, formData);

      expect(mockSignInWithOtp).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: false,
        message: 'Supabase OTP error', // Use the actual error message from the mock
      });


  describe('signOut', () => {
    it('should call Supabase signOut and redirect to /admin/login on success', async () => {
      // Arrange
      mockSignOut.mockResolvedValue({ error: null }); // Mock successful sign out

      // Act & Assert: Expect redirect
      try {
        await signOut();
      } catch (e: unknown) { // Changed any to unknown
        // Check if it's an error and rethrow if not the expected redirect error
        if (e instanceof Error && e.message !== 'NEXT_REDIRECT') throw e;
      }

      expect(createClient).toHaveBeenCalledTimes(1);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith('/admin/login');
    });

    it('should still redirect to /admin/login even if Supabase signOut fails', async () => {
      // Arrange
      const signOutError = new Error('Supabase signout failed');
      mockSignOut.mockResolvedValue({ error: signOutError }); // Mock failed sign out
      console.error = vi.fn(); // Mock console.error to check if it's called

      // Act & Assert: Expect redirect despite error
      try {
        await signOut();
      } catch (e: unknown) { // Changed any to unknown
        // Check if it's an error and rethrow if not the expected redirect error
        if (e instanceof Error && e.message !== 'NEXT_REDIRECT') throw e;
      }

      expect(createClient).toHaveBeenCalledTimes(1);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      // Optional: Check if the error was logged
      // expect(console.error).toHaveBeenCalledWith('Error signing out:', signOutError);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith('/admin/login');
    });
  });
      // Optional: Check console.error was called
      // console.error = vi.fn(); // Mock console.error if needed
      // expect(console.error).toHaveBeenCalledWith('Supabase OTP Error:', supabaseError);
    });
  });

  // Add signOut tests later
});