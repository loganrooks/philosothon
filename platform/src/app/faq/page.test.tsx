import { render, screen } from '@testing-library/react'; // Removed unused 'act'
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FaqPage from '@/app/faq/page'; // Adjust path as necessary
import AccordionGroup from '@/components/AccordionGroup'; // Import the actual component for vi.mocked()
import { createClient } from '@/lib/supabase/server'; // Import the function to mock

// Mock the AccordionGroup component
vi.mock('@/components/AccordionGroup', () => ({
  default: vi.fn(() => <div data-testid="mock-accordion-group">Mock Accordion</div>),
}));

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const mockFaqItems = [
  { id: '1', created_at: '2023-01-01T00:00:00Z', question: 'Q1', answer: 'A1', category: null, display_order: 1 },
  { id: '2', created_at: '2023-01-02T00:00:00Z', question: 'Q2', answer: 'A2', category: null, display_order: 2 },
];

describe('FAQ Page Component (Server Component Test)', () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any; // Reverted to 'any' for pragmatic mocking
  let mockOrder1: ReturnType<typeof vi.fn>;
  let mockOrder2: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.mocked(AccordionGroup).mockClear();
    vi.mocked(createClient).mockClear();

    // Setup mock Supabase client chain for .from().select().order().order()
    mockOrder2 = vi.fn(); // This one resolves the promise
    mockOrder1 = vi.fn(() => ({ order: mockOrder2 }));
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn(() => ({ order: mockOrder1 })),
      // 'order' is no longer directly on mockSupabaseClient
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient); // Mock the async createClient
  });

  it('should render the main heading', async () => {
    // Mock successful data fetching on the second order call
    mockOrder2.mockResolvedValueOnce({ data: mockFaqItems, error: null });

    // Render the Server Component by awaiting its result
    const PageComponent = await FaqPage();
    render(PageComponent);

    expect(screen.getByRole('heading', { name: /Frequently Asked Questions/i, level: 1 })).toBeInTheDocument();
  });

  it('should render the AccordionGroup component when data fetch succeeds', async () => {
    // Mock successful data fetching on the second order call
     mockOrder2.mockResolvedValueOnce({ data: mockFaqItems, error: null });

    const PageComponent = await FaqPage();
    render(PageComponent);

    expect(screen.getByTestId('mock-accordion-group')).toBeInTheDocument();
  });

  it('should pass mapped faqItems to AccordionGroup', async () => {
     // Mock successful data fetching on the second order call
     mockOrder2.mockResolvedValueOnce({ data: mockFaqItems, error: null });

    const PageComponent = await FaqPage();
    render(PageComponent);

    const MockedAccordionGroup = vi.mocked(AccordionGroup);
    expect(MockedAccordionGroup).toHaveBeenCalledTimes(1);
    // Check if the props passed match the mapped structure
    expect(MockedAccordionGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { question: 'Q1', answer: 'A1' },
          { question: 'Q2', answer: 'A2' },
        ],
      }),
      {} // Check for empty object as second argument (React 18 behavior)
    );
  });

  it('should render an error message if data fetching fails', async () => {
    // Mock failed data fetching on the second order call
    const mockError = new Error('Failed to fetch');
    mockOrder2.mockResolvedValueOnce({ data: null, error: mockError });

    const PageComponent = await FaqPage();
    render(PageComponent);

    expect(screen.getByText(/Could not fetch FAQ items/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-accordion-group')).not.toBeInTheDocument();
  });

   it('should render a message if no FAQ items are available', async () => {
    // Mock empty data response on the second order call
    mockOrder2.mockResolvedValueOnce({ data: [], error: null });

    const PageComponent = await FaqPage();
    render(PageComponent);

    expect(screen.getByText(/No frequently asked questions available/i)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-accordion-group')).not.toBeInTheDocument();
  });

});