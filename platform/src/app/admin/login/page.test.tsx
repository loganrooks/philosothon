import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminLoginPage from '@/app/admin/login/page';
import type { SupabaseClient } from '@supabase/supabase-js'; // Import type
import { useSupabase } from '@/components/SupabaseProvider';

// Mock the useSupabase hook
vi.mock('@/components/SupabaseProvider');

describe('Admin Login Page Component', () => {
  let mockSignInWithOtp: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock for supabase.auth.signInWithOtp
    mockSignInWithOtp = vi.fn();
    const mockSupabaseClient = {
      auth: {
        signInWithOtp: mockSignInWithOtp,
      },
    };

    // Configure the mocked useSupabase hook
    vi.mocked(useSupabase).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient); // Cast via unknown

    // Mock window.location.origin for emailRedirectTo option
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000', // Example origin
      },
      writable: true,
    });
  });

  it('should render initial state correctly', () => {
    render(<AdminLoginPage />);
    expect(screen.getByRole('heading', { name: /Admin Login/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Magic Link/i })).toBeEnabled();
    expect(screen.queryByText(/Check your email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
  });

  it('should allow typing in the email field', async () => {
    const user = userEvent.setup();
    render(<AdminLoginPage />);
    const emailInput = screen.getByLabelText(/Email address/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should handle successful magic link request', async () => {
    // Arrange
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null }); // Simulate success
    const user = userEvent.setup();
    render(<AdminLoginPage />);
    const emailInput = screen.getByLabelText(/Email address/i);
    const submitButton = screen.getByRole('button', { name: /Send Magic Link/i });
    const testEmail = 'success@example.com';

    // Act
    await user.type(emailInput, testEmail);
    await user.click(submitButton);

    // Skip explicit check for intermediate "Sending..." state

    // Assert Supabase call
    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledTimes(1);
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: testEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: 'http://localhost:3000/admin',
        },
      });
    });

    // Assert final state (message shown, input cleared, button reset)
    await waitFor(() => {
      expect(screen.getByText(/Check your email for the magic login link!/i)).toBeInTheDocument();
      expect(emailInput).toHaveValue('');
      expect(screen.getByRole('button', { name: /Send Magic Link/i })).toBeEnabled();
      expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
    });
  });

  it('should handle failed magic link request', async () => {
    // Arrange
    const errorMessage = 'Invalid email provided';
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: { message: errorMessage, name: 'AuthApiError' } }); // Simulate failure
    const user = userEvent.setup();
    render(<AdminLoginPage />);
    const emailInput = screen.getByLabelText(/Email address/i);
    const submitButton = screen.getByRole('button', { name: /Send Magic Link/i });
    const testEmail = 'fail@example.com';

    // Act
    await user.type(emailInput, testEmail);
    await user.click(submitButton);

    // Skip explicit check for intermediate "Sending..." state

    // Assert Supabase call
    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledTimes(1);
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: testEmail,
        options: expect.any(Object), // Options checked in success test
      });
    });

    // Assert final state (error shown, input NOT cleared, button reset)
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      expect(emailInput).toHaveValue(testEmail); // Input should retain value on error
      expect(screen.getByRole('button', { name: /Send Magic Link/i })).toBeEnabled();
      expect(screen.queryByText(/Check your email/i)).not.toBeInTheDocument();
    });
  });
});