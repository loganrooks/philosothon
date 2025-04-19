import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditFaqPage from './page'; // Import the 'Edit' page component
import type { FaqItem } from '@/lib/data/faq'; // Import FaqItem type

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation');

// Mock child components
vi.mock('../components/FaqForm', () => ({
  FaqForm: ({ action, initialData }: { action: any, initialData?: any }) => (
    <form data-testid="mock-faq-form">
      Mock FAQ Form (Action: {action.name})
      {/* Render a hidden input to check if initialData was passed */}
      {initialData && <input type="hidden" data-testid="initial-data-id" value={initialData.id} />}
    </form>
  ),
}));

describe('Edit FAQ Page (/admin/faq/edit)', () => {
  let mockSupabase: any;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;

  const mockFaqItem: FaqItem = {
      id: 'faq-edit-id-9',
      created_at: '2023-01-01T00:00:00Z',
      question: 'FAQ Item to Edit?',
      answer: 'Initial FAQ Answer for Edit.',

      display_order: 101,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client and methods for fetching single item
    mockSingle = vi.fn();
    mockEq = vi.fn(() => ({ single: mockSingle }));
    mockSelect = vi.fn(() => ({ eq: mockEq }));
    const mockFrom = vi.fn(() => ({ select: mockSelect }));
    mockSupabase = { from: mockFrom };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND'); // Ensure it throws consistently for tests expecting it
    });
  });

  it('should render the form pre-filled with data when FAQ item is found', async () => {
    // Arrange
    mockSingle.mockResolvedValue({ data: mockFaqItem, error: null });
    const searchParams = { id: mockFaqItem.id };

    // Act
    await act(async () => {
      render(await EditFaqPage({ searchParams }));
    });

    // Assert
    expect(screen.getByRole('heading', { name: /edit faq item/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-faq-form')).toBeInTheDocument();
    // Check if initialData was passed to the mock form
    expect(screen.getByTestId('initial-data-id')).toHaveValue(mockFaqItem.id);
    expect(screen.getByTestId('mock-faq-form')).toHaveTextContent('Action: updateFaqItem');
    // Ensure notFound wasn't called unexpectedly
    expect(notFound).not.toHaveBeenCalled();
  });

  it('should throw notFound if ID is missing in searchParams', async () => {
    // Arrange: No searchParams or no id
    const searchParams = {}; // No ID

    // Act & Assert: Expect the async component function itself to throw
    await expect(act(async () => {
        await EditFaqPage({ searchParams });
    })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalledTimes(1);
    expect(mockSingle).not.toHaveBeenCalled(); // Verify DB call wasn't made
  });


  it('should throw notFound if FAQ item fetch fails', async () => {
    // Arrange
    const fetchError = new Error('DB error fetching FAQ item');
    mockSingle.mockResolvedValue({ data: null, error: fetchError });
    const searchParams = { id: 'invalid-id' };

    // Act & Assert
    await expect(act(async () => {
        await EditFaqPage({ searchParams });
    })).rejects.toThrow('NEXT_NOT_FOUND');

    // expect(notFound).toHaveBeenCalledTimes(1); // Covered by rejects.toThrow
    expect(mockSingle).toHaveBeenCalledTimes(1); // Fetch was attempted
  });

   it('should throw notFound if FAQ item is not found (null data)', async () => {
    // Arrange
    mockSingle.mockResolvedValue({ data: null, error: null }); // No error, but no data
    const searchParams = { id: 'not-found-id' };

     // Act & Assert
    await expect(act(async () => {
        await EditFaqPage({ searchParams });
    })).rejects.toThrow('NEXT_NOT_FOUND');

    // expect(notFound).toHaveBeenCalledTimes(1); // Covered by rejects.toThrow
    expect(mockSingle).toHaveBeenCalledTimes(1); // Fetch was attempted
  });
});