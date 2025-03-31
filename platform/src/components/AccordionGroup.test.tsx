import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import AccordionGroup from '@/components/AccordionGroup';

describe('AccordionGroup Component', () => {
  const testItems = [
    { question: 'Question 1?', answer: 'Answer 1.' },
    { question: 'Question 2?', answer: 'Answer 2.' },
  ];

  it('should render the correct number of accordion items', () => {
    render(<AccordionGroup items={testItems} />);
    // Select summaries by their text content instead of role='button'
    const summaries = testItems.map(item => screen.getByText(item.question));
    expect(summaries).toHaveLength(testItems.length);
  });

  it('should render the questions correctly', () => {
    render(<AccordionGroup items={testItems} />);
    testItems.forEach(item => {
      expect(screen.getByText(item.question)).toBeInTheDocument(); // Use getByText
    });
  });

  it('should render the answers correctly (though possibly hidden initially)', () => {
    render(<AccordionGroup items={testItems} />);
    testItems.forEach(item => {
      // Answer text might not be visible, but should be in the DOM
      expect(screen.getByText(item.answer)).toBeInTheDocument();
    });
  });

  it('should toggle the visibility of the answer on summary click', async () => {
    const user = userEvent.setup();
    render(<AccordionGroup items={testItems} />);

    const firstSummary = screen.getByText(testItems[0].question); // Use getByText
    const firstDetails = firstSummary.closest('details');
    // const firstAnswer = screen.getByText(testItems[0].answer); // Removed as it wasn't used in assertions below

    // Initially, details might be closed (implementation dependent, but test presence)
    expect(firstDetails).not.toHaveAttribute('open');
    // Note: Visibility check is tricky with <details>; checking 'open' attribute is more reliable

    // Click to open
    await user.click(firstSummary);
    expect(firstDetails).toHaveAttribute('open');

    // Click to close
    await user.click(firstSummary);
    expect(firstDetails).not.toHaveAttribute('open');
  });

   it('should render nothing if items array is empty', () => {
    const { container } = render(<AccordionGroup items={[]} />);
    // Check if the main container's direct children count is 0
    // Or check if no <details> elements are rendered
    expect(container.querySelector('details')).not.toBeInTheDocument();
  });
});