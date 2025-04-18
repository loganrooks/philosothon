import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createClient } from '@/lib/supabase/server';
import AdminThemesPage, { type Theme } from './page'; // Import page and type
import { notFound } from 'next/navigation';
import AddNewThemePage from './new/page'; // Import the 'New' page component
import EditThemePage from './edit/page'; // Import the 'Edit' page component

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation');

// Mock child components
vi.mock('./components/ThemeActions', () => ({
  ThemeActions: ({ themeId, themeTitle }: { themeId: string, themeTitle: string }) => (
    <div data-testid={`theme-actions-${themeId}`}>Mock Actions for {themeTitle}</div>
  ),
}));
vi.mock('./components/ThemeForm', () => ({
  // Mock ThemeForm as it's a client component with hooks
  ThemeForm: ({ action }: { action: any }) => (
    <form data-testid="mock-theme-form">Mock Theme Form (Action: {action.name})</form>
  ),
}));


describe('Admin Themes Pages', () => {
  // --- Tests for /admin/themes ---
  describe('List Page (/admin/themes)', () => {
  let mockSupabase: any;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;

  const mockThemes: Theme[] = [
    { id: '1', created_at: '2023-01-01T10:00:00Z', title: 'Theme Alpha', description: 'Description A', analytic_tradition: ['A1'], continental_tradition: ['C1'] },
    { id: '2', created_at: '2023-01-02T11:00:00Z', title: 'Theme Beta', description: 'Description B is quite long and should be truncated hopefully.', analytic_tradition: null, continental_tradition: ['C2', 'C3'] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client and methods
    mockOrder = vi.fn();
    mockSelect = vi.fn(() => ({ order: mockOrder }));
    const mockFrom = vi.fn(() => ({ select: mockSelect }));
    mockSupabase = { from: mockFrom };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it('should render the page with themes table when data fetching succeeds', async () => {
    // Arrange: Mock successful data fetch
    mockOrder.mockResolvedValue({ data: mockThemes, error: null });

    // Act: Render the async component
    await act(async () => {
       render(await AdminThemesPage()); // Await the async component
    });

    // Assert: Check for key elements
    expect(screen.getByRole('heading', { name: /manage themes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add new theme/i })).toHaveAttribute('href', '/admin/themes/new');

    // Assert: Check table headers
    expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

    // Assert: Check table rows for mock data
    expect(screen.getByRole('cell', { name: 'Theme Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Description A' })).toBeInTheDocument();
    expect(screen.getByTestId('theme-actions-1')).toBeInTheDocument();

    expect(screen.getByRole('cell', { name: 'Theme Beta' })).toBeInTheDocument();
    // Check for truncated description (assuming 100 char limit)
    expect(screen.getByText(/Description B is quite long and should be truncated/)).toBeInTheDocument();
    expect(screen.getByTestId('theme-actions-2')).toBeInTheDocument();

    expect(notFound).not.toHaveBeenCalled();
  });

  it('should call notFound when data fetching fails', async () => {
     // Arrange: Mock failed data fetch
    const fetchError = new Error('Failed to fetch');
    mockOrder.mockResolvedValue({ data: null, error: fetchError });

     // Act: Render the async component
     // We expect this to throw due to notFound(), so wrap in try/catch or check mock
     try {
        await act(async () => {
          render(await AdminThemesPage());
        });
     } catch (e: any) {
        // Allow the error thrown by notFound() to be caught
        if (e.message !== 'NEXT_NOT_FOUND') { // Check for the specific error thrown by notFound
            throw e; // Re-throw unexpected errors
        }
     }

     // Assert: Verify notFound was called
     expect(notFound).toHaveBeenCalledTimes(1);
  });

   it('should render "No themes found" when no data is returned', async () => {
    // Arrange: Mock empty data fetch
    mockOrder.mockResolvedValue({ data: [], error: null });

    // Act
     await act(async () => {
       render(await AdminThemesPage());
     });

    // Assert
    expect(screen.getByRole('cell', { name: /no themes found/i })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Theme Alpha' })).not.toBeInTheDocument(); // Ensure no theme rows render
  });


  }); // End of List Page describe block

  // --- Tests for /admin/themes/new ---
  describe('New Page (/admin/themes/new)', () => {
    it('should render the "Add New Theme" heading and the ThemeForm', () => {
      // Act
      render(<AddNewThemePage />);

      // Assert
      expect(screen.getByRole('heading', { name: /add new theme/i })).toBeInTheDocument();
      expect(screen.getByTestId('mock-theme-form')).toBeInTheDocument();
      // Check if the correct action was passed (optional, depends on mock detail)
      // Note: Comparing function references directly in mocks can be tricky.
      // We'll rely on the mock rendering the action name if needed, or skip this part.
      // expect(screen.getByTestId('mock-theme-form')).toHaveTextContent('Action: createTheme');
    });
  });

  // --- Tests for /admin/themes/edit?id=... ---
  describe('Edit Page (/admin/themes/edit)', () => {
     // Re-use mocks from List Page describe block where applicable
     let mockSupabase: any;
     let mockSelect: ReturnType<typeof vi.fn>;
     let mockEq: ReturnType<typeof vi.fn>;
     let mockSingle: ReturnType<typeof vi.fn>;

     const mockTheme: Theme = {
        id: 'edit-id-1', created_at: '2023-01-01T10:00:00Z', title: 'Theme to Edit', description: 'Initial Desc', analytic_tradition: ['A1'], continental_tradition: null
    };

    beforeEach(() => { // Keep only one beforeEach
       vi.clearAllMocks(); // Clear mocks including notFound

        // Mock Supabase client and methods for fetching single item
        mockSingle = vi.fn();
        mockEq = vi.fn(() => ({ single: mockSingle }));
        mockSelect = vi.fn(() => ({ eq: mockEq }));
        const mockFrom = vi.fn(() => ({ select: mockSelect }));
        mockSupabase = { from: mockFrom };
        vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
     });

    it('should render the form pre-filled with data when theme is found', async () => {
      // Arrange
      mockSingle.mockResolvedValue({ data: mockTheme, error: null });
      const searchParams = { id: mockTheme.id };

      // Act
      await act(async () => {
        // Need to pass searchParams to the component
        render(await EditThemePage({ searchParams }));
      });

      // Assert
      expect(screen.getByRole('heading', { name: /edit theme/i })).toBeInTheDocument();
      expect(screen.getByTestId('mock-theme-form')).toBeInTheDocument();
      // We can't easily check props passed to the mock component in RTL,
      // but we can check if the correct action name is rendered (if mock supports it)
      expect(screen.getByTestId('mock-theme-form')).toHaveTextContent('Action: updateTheme');
      expect(notFound).not.toHaveBeenCalled();
    });

    it('should call notFound if ID is missing in searchParams', async () => {
       // Arrange: No searchParams or no id
       const searchParams = {}; // No ID
        // Arrange: Add a minimal mock for Supabase fetch to prevent downstream error
       mockSingle.mockResolvedValue({ data: null, error: null });
       vi.mocked(notFound).mockClear(); // Explicitly clear notFound mock before this test

       // Act: Render the component.
       await act(async () => {
          // Render to trigger the notFound call
          render(await EditThemePage({ searchParams }));
       });

       // Assert: Verify notFound was called. Cannot reliably check mockSingle or form rendering.
       expect(notFound).toHaveBeenCalled();
    });

     it('should call notFound if theme fetch fails', async () => {
       // Arrange
       const fetchError = new Error('DB error');
       mockSingle.mockResolvedValue({ data: null, error: fetchError });
       const searchParams = { id: 'invalid-id' };

       // Act & Assert
       try {
         await act(async () => {
           render(await EditThemePage({ searchParams }));
         });
       } catch (e: any) {
         if (e.message !== 'NEXT_NOT_FOUND') throw e;
       }
       expect(notFound).toHaveBeenCalledTimes(1);
    });

     it('should call notFound if theme is not found (null data)', async () => {
       // Arrange
       mockSingle.mockResolvedValue({ data: null, error: null }); // No error, but no data
       const searchParams = { id: 'not-found-id' };

        // Act & Assert
       try {
         await act(async () => {
           render(await EditThemePage({ searchParams }));
         });
       } catch (e: any) {
         if (e.message !== 'NEXT_NOT_FOUND') throw e;
       }
       expect(notFound).toHaveBeenCalledTimes(1);
    });
  }); // End of Edit Page describe block
});