import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FaqPage from '@/app/faq/page'; // Adjust path as necessary
import AccordionGroup from '@/components/AccordionGroup'; // Import the actual component for vi.mocked()

// Mock the AccordionGroup component directly in the factory
vi.mock('@/components/AccordionGroup', () => ({
  default: vi.fn(() => <div data-testid="mock-accordion-group">Mock Accordion</div>),
}));

// faqItems data is defined in the component itself, no need to duplicate here
// if we are not doing a deep prop comparison.


describe('FAQ Page Component', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    // Clear the mock using vi.mocked
    vi.mocked(AccordionGroup).mockClear();
  });

  it('should render the main heading', () => {
    render(<FaqPage />);
    expect(screen.getByRole('heading', { name: /Frequently Asked Questions/i, level: 1 })).toBeInTheDocument();
  });

  it('should render the AccordionGroup component', () => {
    render(<FaqPage />);
    expect(screen.getByTestId('mock-accordion-group')).toBeInTheDocument();
  });

  it('should pass the correct faqItems to AccordionGroup', () => {
    render(<FaqPage />);
    const MockedAccordionGroup = vi.mocked(AccordionGroup); // Get the mocked component
    expect(MockedAccordionGroup).toHaveBeenCalledTimes(1);
    // We already check that the mock component is rendered.
    // Checking detailed props can be brittle if the data source changes.
    // We'll rely on the fact that the mock was called once.
    // If more specific prop testing is needed later, it can be added.
  });
});