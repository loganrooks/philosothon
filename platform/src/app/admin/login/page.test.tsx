import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginPage from './page';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation');

// Mock child components
vi.mock('./components/LoginForm', () => ({
  LoginForm: () => <div data-testid="mock-login-form">Mock Login Form</div>,
}));

describe('Login Page (/admin/login)', () => {
  let mockSupabase: any;
  let mockGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client and methods
    mockGetUser = vi.fn();
    const mockAuth = { getUser: mockGetUser };
    mockSupabase = { auth: mockAuth };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it('should render the main heading and the login form when user is not logged in', async () => {
    // Arrange: Mock getUser to return no user
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    // Act: Render the async component within act
    await act(async () => {
      render(await LoginPage());
    });

    // Assert
    expect(screen.getByRole('heading', { name: /admin sign in/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-login-form')).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled(); // Ensure redirect didn't happen
  });

  it('should redirect to /admin if user is already logged in', async () => {
    // Arrange: Mock getUser to return a logged-in user
    mockGetUser.mockResolvedValue({ data: { user: { id: '123', email: 'test@test.com' } }, error: null });

    // Act: Render the async component within act
    // We expect this to call redirect(), which throws an error in tests
    try {
      await act(async () => {
        render(await LoginPage());
      });
    } catch (e: any) {
       // Allow the error thrown by redirect() to be caught
       // NEXT_REDIRECT is the specific error code thrown by next/navigation redirect
       if (e.message !== 'NEXT_REDIRECT') {
           throw e; // Re-throw unexpected errors
       }
    }

    // Assert
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/admin');
    // Cannot reliably assert that the heading/form is not rendered due to test environment behavior after redirect.
  });
});