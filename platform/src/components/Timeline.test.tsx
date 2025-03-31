import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Timeline from '@/components/Timeline';

describe('Timeline Component', () => {
  // Replicate the internal data structure for testing
  const timelineEvents = [
    { year: 2007, event: "First Philosothon held at Hale School, Perth, Western Australia, by Matthew Wills and Leanne Rucks." },
    { year: 2011, event: "First national Australasian Philosothon hosted by FAPSA at Cranbrook School, Sydney." },
    { year: 2012, event: "First UK Philosothon held at King's College, Taunton, led by Mark Smith and Julie Arliss." },
    { year: 2017, event: "Templeton Religion Trust awards funding to the Australasian Philosothon project." },
    { year: 2019, event: "Templeton funding awarded to Ian Ramsey Centre, Oxford, to support new Philosothons." },
    { year: 2020, event: "Australasian Association of Philosophy runs the first online Philosothon." },
  ];

  it('should render the heading', () => {
    render(<Timeline />);
    expect(screen.getByRole('heading', { name: /A Brief History/i, level: 3 })).toBeInTheDocument();
  });

  it('should render the correct number of timeline items', () => {
    render(<Timeline />);
    // Find all elements containing a year (assuming year is unique identifier for an item visually)
    const yearElements = screen.getAllByText(/\d{4}/); // Match 4 digits
    expect(yearElements).toHaveLength(timelineEvents.length);
  });

  it('should render each timeline item with its year and event description', () => {
    render(<Timeline />);
    timelineEvents.forEach(item => {
      // Find the element containing the year
      const yearElement = screen.getByText(item.year.toString());
      expect(yearElement).toBeInTheDocument();

      // Find the parent container of the year element
      const itemContainer = yearElement.closest('div');
      expect(itemContainer).toBeInTheDocument();

      // Check if the event description exists within that container
      expect(within(itemContainer!).getByText(item.event)).toBeInTheDocument();
    });
  });
});