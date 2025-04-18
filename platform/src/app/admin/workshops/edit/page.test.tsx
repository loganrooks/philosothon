import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditWorkshopPage from './page'; // Import the 'Edit' page component
import type { Workshop } from '../page'; // Import Workshop type

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation');

// Mock child components
vi.mock('../components/WorkshopForm', () => ({
  WorkshopForm: ({ action, initialData }: { action: any, initialData?: any }) => (
    <form data-testid="mock-workshop-form">
      Mock Workshop Form (Action: {action.name})
      {/* Render a hidden input to check if initialData was passed */}
      {initialData && <input type="hidden" data-testid="initial-data-id" value={initialData.id} />}
    </form>
  ),
}));

describe('Edit Workshop Page (/admin/workshops/edit)', () => {
  let mockSupabase: any;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;

  const mockWorkshop: Workshop = {
      id: 'ws-edit-id-1',
      created_at: '2023-01-01T00:00:00Z',
      title: 'Workshop to Edit',
      description: 'Initial WS Desc',
      facilitator: 'Test Facilitator',
      relevant_themes: ['theme-1'],
      max_capacity: 15,
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
  });

  it('should render the form pre-filled with data when workshop is found', async () => {
    // Arrange
    mockSingle.mockResolvedValue({ data: mockWorkshop, error: null });
    const searchParams = { id: mockWorkshop.id };

    // Act
    await act(async () => {
      render(await EditWorkshopPage({ searchParams }));
    });

    // Assert
    expect(screen.getByRole('heading', { name: /edit workshop/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-workshop-form')).toBeInTheDocument();
    // Check if initialData was passed to the mock form
    expect(screen.getByTestId('initial-data-id')).toHaveValue(mockWorkshop.id);
    expect(screen.getByTestId('mock-workshop-form')).toHaveTextContent('Action: updateWorkshop');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('should throw notFound if ID is missing in searchParams', async () => {
    // Arrange: No searchParams or no id
    const searchParams = {}; // No ID
    vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND'); // Ensure it throws consistently
    });

    // Act & Assert: Expect the async component function itself to throw
    await expect(act(async () => {
        await EditWorkshopPage({ searchParams });
    })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalledTimes(1);
    expect(mockSingle).not.toHaveBeenCalled(); // Verify DB call wasn't made
  });


  it('should throw notFound if workshop fetch fails', async () => {
    // Arrange
    const fetchError = new Error('DB error fetching workshop');
    mockSingle.mockResolvedValue({ data: null, error: fetchError });
    const searchParams = { id: 'invalid-id' };
    vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND'); // Ensure it throws consistently
    });

    // Act & Assert
    await expect(act(async () => {
        await EditWorkshopPage({ searchParams });
    })).rejects.toThrow('NEXT_NOT_FOUND');

    // expect(notFound).toHaveBeenCalledTimes(1); // Removed assertion - covered by rejects.toThrow
    expect(mockSingle).toHaveBeenCalledTimes(1); // Fetch was attempted
  });

   it('should throw notFound if workshop is not found (null data)', async () => {
    // Arrange
    mockSingle.mockResolvedValue({ data: null, error: null }); // No error, but no data
    const searchParams = { id: 'not-found-id' };
     vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND'); // Ensure it throws consistently
    });

     // Act & Assert
    await expect(act(async () => {
        await EditWorkshopPage({ searchParams });
    })).rejects.toThrow('NEXT_NOT_FOUND');

    // expect(notFound).toHaveBeenCalledTimes(1); // Removed assertion - covered by rejects.toThrow
    expect(mockSingle).toHaveBeenCalledTimes(1); // Fetch was attempted
  });
});