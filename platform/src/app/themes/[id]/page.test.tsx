// platform/src/app/themes/[id]/page.test.tsx
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { notFound } from 'next/navigation';
import ThemeDetailPage from './page'; // Adjust the import path as necessary
import { createClient } from '@/lib/supabase/server';
import { type Theme } from '@/lib/data/themes'; // Corrected import path
import fs from 'fs/promises'; // Import fs for mocking
import React from 'react'; // Import React for JSX in mock
import ReactMarkdown from 'react-markdown'; // Import the actual component type for mocking

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  // Mock other navigation functions if needed (useRouter, usePathname, etc.)
}));

// Mock ReactMarkdown to check its props - Define mock function inside factory
vi.mock('react-markdown', () => {
  const MockReactMarkdownComponent = vi.fn(({ children }) => <div data-testid="mock-react-markdown">{children}</div>);
  return { default: MockReactMarkdownComponent };
});


// Mock fs/promises - Corrected to provide a default export
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
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
  image_url: null,
  description_expanded: null, // No longer used directly by component, set to null
};

// Mock file content - REMOVED Title Heading
const mockFileContent = `
This is the main description from the Markdown file.

## Suggested Readings

- Reading 1
- Reading 2
`;

// Mock file content without readings - REMOVED Title Heading
const mockFileContentNoReadings = `
This is the main description only.
`;


describe('ThemeDetailPage', () => {
  // Using any here for simplicity in mocking the complex client structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;
  let MockReactMarkdownComponent: Mock; // Variable to hold the mock function

  beforeEach(async () => { // Make beforeEach async to await import
    // Reset mocks before each test
    vi.clearAllMocks();
    // Access the mocked function correctly via the default export
    (fs.readFile as Mock).mockReset();

    // Dynamically import the mocked component to access the mock function
    const ReactMarkdownMock = await import('react-markdown');
    MockReactMarkdownComponent = (ReactMarkdownMock.default as Mock);
    MockReactMarkdownComponent.mockClear(); // Clear the ReactMarkdown mock calls


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

    // Default success mocks
    mockSingle.mockResolvedValue({ data: mockTheme, error: null });
    (fs.readFile as Mock).mockResolvedValue(mockFileContent);
  });

  it('should render theme title from DB and description/readings from Markdown', async () => {
    const params = { id: 'mock-theme-id' };

    // Render the component
    const PagePromise = ThemeDetailPage({ params });
    const PageComponent = await PagePromise;
    render(PageComponent);

    // Wait for rendering
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mock Theme Title/i })).toBeInTheDocument();
    });

    // Check ReactMarkdown was called twice
    expect(MockReactMarkdownComponent).toHaveBeenCalledTimes(2);

    // Check content passed to ReactMarkdown mocks via props
    const firstCallArgs = MockReactMarkdownComponent.mock.calls[0][0]; // Props of the first call
    const secondCallArgs = MockReactMarkdownComponent.mock.calls[1][0]; // Props of the second call

    // Check main description content passed as children prop
    expect(firstCallArgs.children).toContain('This is the main description from the Markdown file.');
    // Check readings content passed as children prop
    expect(secondCallArgs.children).toContain('- Reading 1');
    expect(secondCallArgs.children).toContain('- Reading 2');


    // Check Suggested Readings heading is present
    expect(screen.getByRole('heading', { name: /Suggested Readings/i })).toBeInTheDocument();

    // Verify mocks
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('themes');
    expect(mockSupabaseClient.from('themes').select('*').eq).toHaveBeenCalledWith('id', 'mock-theme-id');
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('docs/event_info/themes/mock-theme-id.md'), 'utf8');
    expect(notFound).not.toHaveBeenCalled();
    expect(screen.queryByText(/Note: Could not load detailed description/)).not.toBeInTheDocument();
  });

   it('should render only main description from Markdown if no readings section exists', async () => {
    const params = { id: 'mock-theme-id-no-readings' };
    (fs.readFile as Mock).mockResolvedValue(mockFileContentNoReadings); // Mock file without readings

    const PagePromise = ThemeDetailPage({ params });
    const PageComponent = await PagePromise;
    render(PageComponent);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mock Theme Title/i })).toBeInTheDocument();
    });

    // Check ReactMarkdown was called once
    expect(MockReactMarkdownComponent).toHaveBeenCalledTimes(1);
    // Check content passed to ReactMarkdown mock
    const firstCallArgs = MockReactMarkdownComponent.mock.calls[0][0];
    expect(firstCallArgs.children).toContain('This is the main description only.');


    // Check Suggested Readings heading is NOT present
    expect(screen.queryByRole('heading', { name: /Suggested Readings/i })).not.toBeInTheDocument();

    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('docs/event_info/themes/mock-theme-id-no-readings.md'), 'utf8');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('should call notFound when the theme is not found in DB', async () => {
    const params = { id: 'non-existent-id' };
    // Mock Supabase to return null data
    mockSupabaseClient.from('themes').select('*').eq('id', 'non-existent-id').single.mockResolvedValue({ data: null, error: null });

    // Assert that notFound was called
    try {
      await ThemeDetailPage({ params });
    } catch (e) {
      // Expected to throw internally due to notFound()
    }
    expect(notFound).toHaveBeenCalled();

    // Verify DB mock was called
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('themes');
    expect(mockSupabaseClient.from('themes').select('*').eq).toHaveBeenCalledWith('id', 'non-existent-id');
  });

  it('should call notFound when there is an error fetching the theme from DB', async () => {
    const params = { id: 'error-id' };
    const dbError = new Error('Database connection failed');
    // Mock Supabase to return an error
    mockSupabaseClient.from('themes').select('*').eq('id', 'error-id').single.mockResolvedValue({ data: null, error: dbError });

    // Assert that notFound was called
     try {
      await ThemeDetailPage({ params });
    } catch (e) {
      // Expected to throw internally due to notFound()
    }
    expect(notFound).toHaveBeenCalled();

    // Verify DB mock was called
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('themes');
    expect(mockSupabaseClient.from('themes').select('*').eq).toHaveBeenCalledWith('id', 'error-id');
  });

  it('should render fallback description from DB when Markdown read fails', async () => {
    const params = { id: 'file-error-id' };
    const themeWithSimpleDesc = { ...mockTheme, description: 'Fallback DB description.' };
    mockSupabaseClient.from('themes').select('*').eq('id', 'file-error-id').single.mockResolvedValue({ data: themeWithSimpleDesc, error: null });
    const fileError = new Error('ENOENT: File not found');
    (fs.readFile as Mock).mockRejectedValue(fileError); // Mock fs.readFile to throw an error

    const PagePromise = ThemeDetailPage({ params });
    const PageComponent = await PagePromise;
    render(PageComponent);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mock Theme Title/i })).toBeInTheDocument();
    });

    // Check ReactMarkdown was called once with fallback description
    expect(MockReactMarkdownComponent).toHaveBeenCalledTimes(1);
    const firstCallArgs = MockReactMarkdownComponent.mock.calls[0][0];
    expect(firstCallArgs.children).toBe('Fallback DB description.');


    // Check error message is displayed
    expect(screen.getByText(/Note: Could not load detailed description/)).toBeInTheDocument();

    // Verify mocks
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('themes');
    expect(mockSupabaseClient.from('themes').select('*').eq).toHaveBeenCalledWith('id', 'file-error-id');
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('docs/event_info/themes/file-error-id.md'), 'utf8');
    expect(notFound).not.toHaveBeenCalled();
  });

   it('should call notFound when Markdown read fails AND no fallback description exists', async () => {
    const params = { id: 'file-error-no-fallback-id' };
    const themeWithoutSimpleDesc = { ...mockTheme, description: null }; // Ensure no fallback
    mockSupabaseClient.from('themes').select('*').eq('id', 'file-error-no-fallback-id').single.mockResolvedValue({ data: themeWithoutSimpleDesc, error: null });
    const fileError = new Error('ENOENT: File not found');
    (fs.readFile as Mock).mockRejectedValue(fileError); // Mock fs.readFile to throw an error

    // Render and check if notFound was called
    try {
      await ThemeDetailPage({ params });
    } catch (e) {
       // Expected to throw internally due to notFound()
    }
    expect(notFound).toHaveBeenCalled();

    // Verify mocks
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('themes');
    expect(mockSupabaseClient.from('themes').select('*').eq).toHaveBeenCalledWith('id', 'file-error-no-fallback-id');
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('docs/event_info/themes/file-error-no-fallback-id.md'), 'utf8');
  });

  // This test replaces the previous 'should render expanded description...' test
  it('should render markdown content within a prose container', async () => {
    const params = { id: 'mock-theme-id' };
    (fs.readFile as Mock).mockResolvedValue(mockFileContent); // Ensure file read succeeds

    const PagePromise = ThemeDetailPage({ params });
    const PageComponent = await PagePromise;
    const { container } = render(PageComponent);

    // Check if ReactMarkdown mocks were rendered
    expect(MockReactMarkdownComponent).toHaveBeenCalled();
    const markdownComponents = screen.getAllByTestId('mock-react-markdown');
    expect(markdownComponents.length).toBeGreaterThan(0);


    // Check if the container has the prose classes
    const proseContainer = container.querySelector('article.prose'); // Find article with 'prose' class
    expect(proseContainer).toBeInTheDocument();
    expect(proseContainer).toHaveClass('prose-invert');
    expect(proseContainer).toHaveClass('max-w-none');

    // Check if markdown components are inside the prose container
    markdownComponents.forEach(mock => {
        expect(proseContainer).toContainElement(mock);
    });
  });

  // This test replaces the previous 'should not render expanded description...' test
  it('should render only fallback description when markdown is empty', async () => {
    const params = { id: 'empty-file-id' };
    const themeWithSimpleDesc = { ...mockTheme, description: 'Fallback DB description.' };
    mockSupabaseClient.from('themes').select('*').eq('id', 'empty-file-id').single.mockResolvedValue({ data: themeWithSimpleDesc, error: null });
    (fs.readFile as Mock).mockResolvedValue(''); // Mock empty file content

    const PagePromise = ThemeDetailPage({ params });
    const PageComponent = await PagePromise;
    render(PageComponent);

     await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mock Theme Title/i })).toBeInTheDocument();
    });

    // Check that ReactMarkdown was called ONCE with the fallback description
    expect(MockReactMarkdownComponent).toHaveBeenCalledTimes(1);
    const firstCallArgs = MockReactMarkdownComponent.mock.calls[0][0];
    expect(firstCallArgs.children).toBe('Fallback DB description.');


    // Check Suggested Readings heading is NOT present
    expect(screen.queryByRole('heading', { name: /Suggested Readings/i })).not.toBeInTheDocument();

    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('docs/event_info/themes/empty-file-id.md'), 'utf8');
    expect(notFound).not.toHaveBeenCalled();
  });
});