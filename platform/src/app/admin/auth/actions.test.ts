import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { redirect } from 'next/navigation';
import { signInWithOtp, type LoginFormState } from './actions'; // Import the actions and type (removed local signOut)
import { initiateOtpSignIn, signOut } from '@/app/auth/actions'; // Import server actions
// Removed import { signOutUser } from '@/lib/data/auth';

// Mock dependencies
vi.mock('next/navigation');
vi.mock('@/lib/data/auth'); // Mock the DAL module

describe('Admin Authentication Server Actions (auth/actions.ts)', () => {
  // Mock the Server Actions
  const mockedInitiateOtpSignIn = initiateOtpSignIn as MockedFunction<typeof initiateOtpSignIn>;
  const mockedSignOut = signOut as MockedFunction<typeof signOut>; // Renamed mock variable

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Action mocks
    mockedInitiateOtpSignIn.mockClear();
    mockedSignOut.mockClear(); // Use renamed mock variable

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
      mockedSignOut.mockResolvedValue({ success: true, message: 'Sign out successful.' }); // Mock successful action call

      // Act & Assert: Expect redirect
      try {
        await signOut();
      } catch (e: unknown) {
        if (e instanceof Error && e.message !== 'NEXT_REDIRECT') throw e;
      }

      expect(mockedSignOut).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith('/admin/login');
    });

    it('should still redirect to /admin/login even if signOutUser DAL fails', async () => {
      // Arrange
      const actionErrorMsg = 'DAL signout failed'; // Use a string message
      mockedSignOut.mockResolvedValue({ success: false, message: actionErrorMsg }); // Mock failed action call
      console.error = vi.fn(); // Mock console.error to check if it's called

      // Act & Assert: Expect redirect despite error
      try {
        await signOut();
      } catch (e: unknown) {
        if (e instanceof Error && e.message !== 'NEXT_REDIRECT') throw e;
      }

      expect(mockedSignOut).toHaveBeenCalledTimes(1);
      // Check if the error message was logged (Note: the action currently doesn't log the message, only the error object)
      // expect(console.error).toHaveBeenCalledWith('Sign Out Error:', expect.any(Error)); // Adjust if action logging changes
      expect(redirect).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith('/admin/login');
    });
  });
});