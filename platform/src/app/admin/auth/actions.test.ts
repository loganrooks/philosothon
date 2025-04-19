import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { redirect } from 'next/navigation';
import { signInWithOtp, signOut, type LoginFormState } from './actions'; // Import the actions and type
import { initiateOtpSignIn, signOutUser } from '@/lib/data/auth'; // Import DAL functions to mock

// Mock dependencies
vi.mock('next/navigation');
vi.mock('@/lib/data/auth'); // Mock the DAL module

describe('Admin Authentication Server Actions (auth/actions.ts)', () => {
  // Mock the DAL functions
  const mockedInitiateOtpSignIn = initiateOtpSignIn as MockedFunction<typeof initiateOtpSignIn>;
  const mockedSignOutUser = signOutUser as MockedFunction<typeof signOutUser>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DAL mocks
    mockedInitiateOtpSignIn.mockClear();
    mockedSignOutUser.mockClear();

    // Mock next/navigation redirect
    vi.mocked(redirect).mockImplementation((path: string) => {
      const error = new Error('NEXT_REDIRECT');
      (error as Error & { digest?: string }).digest = `NEXT_REDIRECT;${path}`;
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
      expect(mockedInitiateOtpSignIn).not.toHaveBeenCalled();
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
      expect(mockedInitiateOtpSignIn).not.toHaveBeenCalled();
    });

     // Note: The DAL function handles origin internally, so we don't test missing origin here.
     // Instead, we test if the DAL function itself returns an error.

    it('should call initiateOtpSignIn DAL function and return success on valid email', async () => {
      const testEmail = 'test@example.com';
      // Mock successful DAL call
      mockedInitiateOtpSignIn.mockResolvedValue({ data: {}, error: null });

      const formData = new FormData();
      formData.append('email', testEmail);
      const initialState: LoginFormState = { message: null, success: false };

      const result = await signInWithOtp(initialState, formData);

      expect(mockedInitiateOtpSignIn).toHaveBeenCalledTimes(1);
      expect(mockedInitiateOtpSignIn).toHaveBeenCalledWith(testEmail);
      expect(result).toEqual({
        success: true,
        message: 'Check your email for the magic link!',
      });
    });

    it('should return error message on initiateOtpSignIn DAL failure', async () => {
      const testEmail = 'test@example.com';
      const dalError = new Error('DAL OTP error');
      // Mock failed DAL call
      mockedInitiateOtpSignIn.mockResolvedValue({ data: null, error: dalError });

      const formData = new FormData();
      formData.append('email', testEmail);
      const initialState: LoginFormState = { message: null, success: false };

      const result = await signInWithOtp(initialState, formData);

      expect(mockedInitiateOtpSignIn).toHaveBeenCalledTimes(1);
      expect(mockedInitiateOtpSignIn).toHaveBeenCalledWith(testEmail);
      expect(result).toEqual({
        success: false,
        message: dalError.message, // Expect the DAL error message
      });
    });
  });

  describe('signOut', () => {
    it('should call signOutUser DAL function and redirect to /admin/login on success', async () => {
      // Arrange
      mockedSignOutUser.mockResolvedValue({ error: null }); // Mock successful DAL call

      // Act & Assert: Expect redirect
      try {
        await signOut();
      } catch (e: unknown) {
        if (e instanceof Error && e.message !== 'NEXT_REDIRECT') throw e;
      }

      expect(mockedSignOutUser).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith('/admin/login');
    });

    it('should still redirect to /admin/login even if signOutUser DAL fails', async () => {
      // Arrange
      const dalError = new Error('DAL signout failed');
      mockedSignOutUser.mockResolvedValue({ error: dalError }); // Mock failed DAL call
      console.error = vi.fn(); // Mock console.error to check if it's called

      // Act & Assert: Expect redirect despite error
      try {
        await signOut();
      } catch (e: unknown) {
        if (e instanceof Error && e.message !== 'NEXT_REDIRECT') throw e;
      }

      expect(mockedSignOutUser).toHaveBeenCalledTimes(1);
      // Check if the error was logged by the action
      expect(console.error).toHaveBeenCalledWith('Sign out failed in action:', dalError);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith('/admin/login');
    });
  });
});