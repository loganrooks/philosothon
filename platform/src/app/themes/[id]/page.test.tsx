import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { notFound } from 'next/navigation';
import ThemeDetailPage from './page'; // Adjust the import path as necessary
import { createClient } from '@/lib/supabase/server';
import { type Theme } from '@/lib/types'; // Import Theme type

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  // Mock other navigation functions if needed (useRouter, usePathname, etc.)
}));

// Mock ReactMarkdown to check its props
vi.mock('react-markdown', () => ({
  default: vi.fn(({ children }) => <div data-testid="mock-react-markdown">{children}</div>),
}));


const mockTheme: Theme = {
  id: 'mock-theme-id',
  title: 'Mock Theme Title',
  description: 'Mock theme description.',
  created_at: new Date().toISOString(),
  // Add other necessary theme properties if your component uses them
  analytic_tradition: null,
  continental_tradition: null,
  relevant_themes: null,
  relevant_thinkers: null,
  relevant_works: null,
  image_url: null,
  description_expanded: '## Expanded Content\n\nThis is the *detailed* description.\n\n- Point 1\n- Point 2', // Added field
};

describe('ThemeDetailPage', () => {
  // Using any here for simplicity in mocking the complex client structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup mock Supabase client chain
    const mockSingle = vi.fn();
    const mockEq = vi.fn(() => ({ single: mockSingle }));
    const mockSelect = vi.fn(() => ({ eq: mockEq }));
    mockSupabaseClient = {
      from: vi.fn(() => ({ select: mockSelect })),
    };
    (createClient as Mock).mockReturnValue(mockSupabaseClient);

    // Assign mock implementations for chaining
    mockSupabaseClient.from.mockImplementation(() => ({
        select: mockSelect.mockImplementation(() => ({
            eq: mockEq.mockImplementation(() => ({
                single: mockSingle
            }))
        }))
    }));

    // Default success mock
     mockSingle.mockResolvedValue({ data: mockTheme, error: null });
  });

  it('should render theme details when data is fetched successfully', async () => {
    const params = { id: 'mock-theme-id' };

    // Render the component - Need to await because it's an async Server Component
    const PagePromise = ThemeDetailPage({ params });
    const PageComponent = await PagePromise; // Resolve the promise returned by the async component
    render(PageComponent);


    // Wait for async operations like data fetching if necessary
    // (Though mocks resolve immediately, this pattern is good for real async)
    await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Mock Theme Title/i })).toBeInTheDocument();
    });

    // Check if the basic description text exists somewhere in the rendered output
    expect(screen.getByText((content, element) => {
      // Allow matching even if text is split across nodes, ignore extra whitespace
      const hasText = (node: Element | null) => node?.textContent === 'Mock theme description.';
      const nodeHasText = hasText(element);
      const childrenDontHaveText = Array.from(element?.children || []).every(child => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    })).toBeInTheDocument();
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('themes');
    expect(mockSupabaseClient.from('themes').select).toHaveBeenCalledWith('*');
    expect(mockSupabaseClient.from('themes').select('*').eq).toHaveBeenCalledWith('id', 'mock-theme-id');
    expect(mockSupabaseClient.from('themes').select('*').eq('id', 'mock-theme-id').single).toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('should call notFound when the theme is not found (null data)', async () => {
    const params = { id: 'non-existent-id' };
    // Mock Supabase to return null data
     mockSupabaseClient.from('themes').select('*').eq('id', 'non-existent-id').single.mockResolvedValue({ data: null, error: null });


    // Assert that the async component promise rejects because notFound() is called
    await expect(ThemeDetailPage({ params })).rejects.toThrow();

    // Verify the mocks were called as expected
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('themes');
    expect(mockSupabaseClient.from('themes').select).toHaveBeenCalledWith('*');
    expect(mockSupabaseClient.from('themes').select('*').eq).toHaveBeenCalledWith('id', 'non-existent-id');
    expect(mockSupabaseClient.from('themes').select('*').eq('id', 'non-existent-id').single).toHaveBeenCalled();
  });


  it('should call notFound when there is an error fetching the theme', async () => {
    const params = { id: 'error-id' };
    const dbError = new Error('Database connection failed');
     // Mock Supabase to return an error
     mockSupabaseClient.from('themes').select('*').eq('id', 'error-id').single.mockResolvedValue({ data: null, error: dbError });


    // Assert that the async component promise rejects because notFound() is called
    await expect(ThemeDetailPage({ params })).rejects.toThrow();

     // Verify the mocks were called as expected
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('themes');
    expect(mockSupabaseClient.from('themes').select).toHaveBeenCalledWith('*');
    expect(mockSupabaseClient.from('themes').select('*').eq).toHaveBeenCalledWith('id', 'error-id');
    expect(mockSupabaseClient.from('themes').select('*').eq('id', 'error-id').single).toHaveBeenCalled();
  });




  it('should render expanded description using ReactMarkdown within a prose container', async () => {
    // TDD Anchor: Test that ReactMarkdown is rendered when description_expanded exists (Spec Line 175)
    // TDD Anchor: Test that the container div has 'prose' classes (Spec Line 176)
    const params = { id: 'mock-theme-id' };
    // Ensure mockTheme has expanded description for this test
    const themeWithExpandedDesc = { ...mockTheme, description_expanded: '## Test Heading\n\nSome content.' };
    mockSupabaseClient.from('themes').select('*').eq('id', 'mock-theme-id').single.mockResolvedValue({ data: themeWithExpandedDesc, error: null });

    const PagePromise = ThemeDetailPage({ params });
    const PageComponent = await PagePromise;
    const { container } = render(PageComponent);

    // Check if ReactMarkdown mock was rendered with the correct content
    const mockMarkdown = screen.getByTestId('mock-react-markdown');
    expect(mockMarkdown).toBeInTheDocument();
    expect(mockMarkdown).toHaveTextContent('## Test Heading Some content.'); // Check children prop passed correctly

    // Check if the container has the prose classes
    // Note: Finding the specific div might require a more specific selector or test ID if structure is complex
    const proseContainer = container.querySelector('.prose'); // Find element with 'prose' class
    expect(proseContainer).toBeInTheDocument();
    expect(proseContainer).toContainElement(mockMarkdown); // Check if markdown is inside prose div
    expect(proseContainer).toHaveClass('prose-invert'); // Check for other expected classes
    expect(proseContainer).toHaveClass('max-w-none');
  });

  it('should not render the expanded description section if description_expanded is null or empty', async () => {
    // TDD Anchor: Test that nothing is rendered for this section if description_expanded is null/empty (Spec Line 184)
    const params = { id: 'mock-theme-id-no-expanded' };
    const themeWithoutExpandedDesc = { ...mockTheme, description_expanded: null }; // Explicitly null
    mockSupabaseClient.from('themes').select('*').eq('id', 'mock-theme-id-no-expanded').single.mockResolvedValue({ data: themeWithoutExpandedDesc, error: null });

    const PagePromise = ThemeDetailPage({ params });
    const PageComponent = await PagePromise;
    const { container } = render(PageComponent);

    // Check that the mock-react-markdown component was NOT rendered
    expect(screen.queryByTestId('mock-react-markdown')).not.toBeInTheDocument();
    // Check that the prose container div was NOT rendered (or is empty if it always exists)
    // This depends on component structure; querySelector might be better if the div might exist but be empty
    expect(container.querySelector('.prose')).toBeNull(); // Assuming the container is only added if needed
  });
});