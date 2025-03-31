import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboardPage from '@/app/admin/page';
import type { SupabaseClient } from '@supabase/supabase-js'; // Import type
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));
vi.mock('@/components/LogoutButton', () => ({
  default: () => <button data-testid="mock-logout-button">Mock Logout</button>,
}));

describe('Admin Dashboard Page Component', () => {
  let mockGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock for supabase.auth.getUser
    mockGetUser = vi.fn();
    const mockSupabaseClient = {
      auth: {
        getUser: mockGetUser,
      },
    };

    // Configure the mocked createClient to return the mock Supabase client
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as unknown as SupabaseClient); // Cast via unknown
  });

  it('should redirect to login if user is not authenticated', async () => {
    // Arrange: Mock getUser to return no user
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    // Act: Render the component (it's async, so we await the promise it returns)
    // Rendering server components directly in tests can be tricky.
    // We await the component function itself. In a test environment,
    // the redirect might not halt execution like in Next.js,
    // but we can still check if the redirect function was called.
    await AdminDashboardPage();


    // Assert
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/admin/login');
    // Note: We don't assert about the lack of rendered content here,
    // as the component execution might continue past the redirect in the test.
    // The crucial check is that redirect itself was called.
  });

  it('should render dashboard content if user is authenticated', async () => {
    // Arrange: Mock getUser to return a user
    const mockUser = { id: 'user-123', email: 'admin@test.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Act: Render the component. Since it returns JSX when logged in, we can render it.
    // We need to resolve the promise returned by the async component before rendering.
    const PageComponent = await AdminDashboardPage();
    render(PageComponent);


    // Assert
    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /Admin Dashboard/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to the admin area./i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Manage Content/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /View Registrations/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Admin Actions/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(`Logged in as: ${mockUser.email}`)).toBeInTheDocument();
    expect(screen.getByTestId('mock-logout-button')).toBeInTheDocument();
  });
});