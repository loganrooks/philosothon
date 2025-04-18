import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { notFound } from 'next/navigation';
import ThemeDetailPage from './page'; // Adjust the import path as necessary
import { createClient } from '@/lib/supabase/server'; // Adjust if your path differs

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  // Mock other navigation functions if needed (useRouter, usePathname, etc.)
}));

const mockTheme = {
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

    expect(screen.getByText(/Mock theme description./i)).toBeInTheDocument();
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


});