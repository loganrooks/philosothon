import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createClient } from '@/lib/supabase/server';
import AdminWorkshopsPage from './page';
import type { Workshop } from '@/lib/data/workshops'; // Import page and type
import { notFound } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation');

// Mock child components
vi.mock('./components/WorkshopActions', () => ({
  WorkshopActions: ({ workshopId, workshopTitle }: { workshopId: string, workshopTitle: string }) => (
    <div data-testid={`workshop-actions-${workshopId}`}>Mock Actions for {workshopTitle}</div>
  ),
}));

describe('Admin Workshops Page (/admin/workshops)', () => {
  let mockSupabase: any;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;

  // Define mock data (aligned with DAL Workshop type)
  const mockWorkshops: Workshop[] = [
      { id: 'ws1', created_at: '2023-01-01T10:00:00Z', title: 'Workshop Alpha', description: 'Description A', speaker: 'Fac A', related_themes: ['t1'], image_url: null },
      { id: 'ws2', created_at: '2023-01-02T11:00:00Z', title: 'Workshop Beta', description: 'Description B is long', speaker: 'Fac B', related_themes: ['t1', 't2'], image_url: null },
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

  it('should render the page with workshops table when data fetching succeeds', async () => {
    // Arrange: Mock successful data fetch
    mockOrder.mockResolvedValue({ data: mockWorkshops, error: null });

    // Act: Render the async component
    await act(async () => {
       render(await AdminWorkshopsPage());
    });

    // Assert: Check for key elements
    expect(screen.getByRole('heading', { name: /manage workshops/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add new workshop/i })).toHaveAttribute('href', '/admin/workshops/new');

    // Assert: Check table headers (adjust based on actual columns)
    expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /speaker/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

    // Assert: Check table rows for mock data
    expect(screen.getByRole('cell', { name: 'Workshop Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Fac A' })).toBeInTheDocument();
    expect(screen.getByTestId('workshop-actions-ws1')).toBeInTheDocument();

    expect(screen.getByRole('cell', { name: 'Workshop Beta' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Fac B' })).toBeInTheDocument();
    expect(screen.getByTestId('workshop-actions-ws2')).toBeInTheDocument();

    expect(notFound).not.toHaveBeenCalled();
  });

  it('should call notFound when data fetching fails', async () => {
     // Arrange: Mock failed data fetch
    const fetchError = new Error('Failed to fetch workshops');
    mockOrder.mockResolvedValue({ data: null, error: fetchError });

     // Act & Assert
     try {
        await act(async () => {
          render(await AdminWorkshopsPage());
        });
     } catch (e: any) {
        if (e.message !== 'NEXT_NOT_FOUND') throw e;
     }
     expect(notFound).toHaveBeenCalledTimes(1);
  });

   it('should render "No workshops found" when no data is returned', async () => {
    // Arrange: Mock empty data fetch
    mockOrder.mockResolvedValue({ data: [], error: null });

    // Act
     await act(async () => {
       render(await AdminWorkshopsPage());
     });

    // Assert
    expect(screen.getByRole('cell', { name: /no workshops found/i })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Workshop Alpha' })).not.toBeInTheDocument();
  });
});