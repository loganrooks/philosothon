import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { within } from '@testing-library/react';
import AdminFaqPage from './page';
import { fetchFaqItems, type FaqItem } from '@/lib/data/faq'; // Import DAL function and type
import { notFound } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/data/faq'); // Mock the DAL module
vi.mock('next/navigation');

// Mock child components
vi.mock('./components/FaqActions', () => ({
  FaqActions: ({ faqItemId, faqQuestion }: { faqItemId: string, faqQuestion: string }) => ( // Corrected prop name to faqItemId
    <div data-testid={`faq-actions-${faqItemId}`}>Mock Actions for {faqQuestion}</div>
  ),
}));

describe('Admin FAQ Page (/admin/faq)', () => {
  const mockedFetchFaqItems = fetchFaqItems as MockedFunction<typeof fetchFaqItems>;

  // Mock data matching FaqItem type (no category)
  const mockFaqs: FaqItem[] = [
    { id: 'faq1', created_at: '2023-01-01T10:00:00Z', question: 'Question 1?', answer: 'Answer 1.', display_order: 1 },
    { id: 'faq2', created_at: '2023-01-02T11:00:00Z', question: 'Question 2?', answer: 'Answer 2.', display_order: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchFaqItems.mockClear();
    vi.mocked(notFound).mockClear(); // Clear notFound mock too
  });

  it('should render the page with FAQ table when data fetching succeeds', async () => {
    // Arrange: Mock successful DAL fetch
    mockedFetchFaqItems.mockResolvedValue({ faqItems: mockFaqs, error: null });

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
    expect(screen.getByRole('columnheader', { name: /answer/i })).toBeInTheDocument(); // Check for Answer header
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

    // Assert: Check table rows for mock data
    const rows = screen.getAllByRole('row'); // Get all rows (includes header row)
    // Row 1 (index 1)
    const row1Cells = within(rows[1]).getAllByRole('cell');
    expect(row1Cells[0]).toHaveTextContent('1'); // Order
    expect(row1Cells[1]).toHaveTextContent('Question 1?'); // Question
    expect(within(row1Cells[2]).getByTitle('Answer 1.')).toBeInTheDocument(); // Answer (check via title due to truncation)
    expect(within(row1Cells[3]).getByTestId('faq-actions-faq1')).toBeInTheDocument(); // Actions

    // Row 2 (index 2)
    const row2Cells = within(rows[2]).getAllByRole('cell');
    expect(row2Cells[0]).toHaveTextContent('0'); // Order
    expect(row2Cells[1]).toHaveTextContent('Question 2?'); // Question
    expect(within(row2Cells[2]).getByTitle('Answer 2.')).toBeInTheDocument(); // Answer
    expect(within(row2Cells[3]).getByTestId('faq-actions-faq2')).toBeInTheDocument(); // Actions

    expect(notFound).not.toHaveBeenCalled();
    expect(mockedFetchFaqItems).toHaveBeenCalledTimes(1);
  });

  it('should call notFound when data fetching fails', async () => {
     // Arrange: Mock failed DAL fetch
    const fetchError = new Error('Failed to fetch FAQs');
    mockedFetchFaqItems.mockResolvedValue({ faqItems: null, error: fetchError });
    vi.mocked(notFound).mockImplementation(() => { throw new Error('NEXT_NOT_FOUND'); }); // Make notFound throw

     // Act & Assert
     try {
        await act(async () => {
          render(await AdminFaqPage());
        });
     } catch (e: any) {
        if (e.message !== 'NEXT_NOT_FOUND') throw e;
     }
     expect(notFound).toHaveBeenCalledTimes(1);
     expect(mockedFetchFaqItems).toHaveBeenCalledTimes(1);
  });

   it('should render "No FAQ items found" when no data is returned', async () => {
    // Arrange: Mock empty DAL fetch
    mockedFetchFaqItems.mockResolvedValue({ faqItems: [], error: null });

    // Act
     await act(async () => {
       render(await AdminFaqPage());
     });

    // Assert
    expect(screen.getByRole('cell', { name: /no faq items found/i })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Question 1?' })).not.toBeInTheDocument();
  });
});