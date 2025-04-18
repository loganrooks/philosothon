import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createClient } from '@/lib/supabase/server';
import AdminFaqPage, { type FaqItem } from './page'; // Import page and type
import { notFound } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation');

// Mock child components
vi.mock('./components/FaqActions', () => ({
  FaqActions: ({ faqItemId, faqQuestion }: { faqItemId: string, faqQuestion: string }) => ( // Corrected prop name to faqItemId
    <div data-testid={`faq-actions-${faqItemId}`}>Mock Actions for {faqQuestion}</div>
  ),
}));

describe('Admin FAQ Page (/admin/faq)', () => {
  let mockSupabase: any;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;

  const mockFaqs: FaqItem[] = [
    { id: 'faq1', created_at: '2023-01-01T10:00:00Z', question: 'Question 1?', answer: 'Answer 1.', category: 'General', display_order: 1 },
    { id: 'faq2', created_at: '2023-01-02T11:00:00Z', question: 'Question 2?', answer: 'Answer 2.', category: 'Specific', display_order: 0 },
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

  it('should render the page with FAQ table when data fetching succeeds', async () => {
    // Arrange: Mock successful data fetch
    mockOrder.mockResolvedValue({ data: mockFaqs, error: null });

    // Act: Render the async component
    await act(async () => {
       render(await AdminFaqPage());
    });

    // Assert: Check for key elements
    expect(screen.getByRole('heading', { name: /manage faq/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add new faq item/i })).toHaveAttribute('href', '/admin/faq/new');

    // Assert: Check table headers (adjust based on actual columns)
    expect(screen.getByRole('columnheader', { name: /order/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /question/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

    // Assert: Check table rows for mock data
    expect(screen.getByRole('cell', { name: '1' })).toBeInTheDocument(); // Order
    expect(screen.getByRole('cell', { name: 'Question 1?' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByTestId('faq-actions-faq1')).toBeInTheDocument();

    expect(screen.getByRole('cell', { name: '0' })).toBeInTheDocument(); // Order
    expect(screen.getByRole('cell', { name: 'Question 2?' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Specific' })).toBeInTheDocument();
    expect(screen.getByTestId('faq-actions-faq2')).toBeInTheDocument();

    expect(notFound).not.toHaveBeenCalled();
  });

  it('should call notFound when data fetching fails', async () => {
     // Arrange: Mock failed data fetch
    const fetchError = new Error('Failed to fetch FAQs');
    mockOrder.mockResolvedValue({ data: null, error: fetchError });
    vi.mocked(notFound).mockClear();

     // Act & Assert
     try {
        await act(async () => {
          render(await AdminFaqPage());
        });
     } catch (e: any) {
        if (e.message !== 'NEXT_NOT_FOUND') throw e;
     }
     expect(notFound).toHaveBeenCalledTimes(1);
  });

   it('should render "No FAQ items found" when no data is returned', async () => {
    // Arrange: Mock empty data fetch
    mockOrder.mockResolvedValue({ data: [], error: null });

    // Act
     await act(async () => {
       render(await AdminFaqPage());
     });

    // Assert
    expect(screen.getByRole('cell', { name: /no faq items found/i })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Question 1?' })).not.toBeInTheDocument();
  });
});