import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EventHighlights from '@/components/EventHighlights';

describe('EventHighlights Component', () => {
  // Replicate the internal data structure for testing purposes
  const highlights = [
    { id: 1, title: "Keynote Speaker", description: "Hear from a leading philosopher in technology ethics." },
    { id: 2, title: "Interactive Workshops", description: "Engage in hands-on sessions exploring AI and philosophy." },
    { id: 3, title: "Collaborative Challenge", description: "Work in teams to develop unique philosophical perspectives." },
  ];

  it('should render the main heading', () => {
    render(<EventHighlights />);
    expect(screen.getByRole('heading', { name: /Event Highlights/i, level: 2 })).toBeInTheDocument();
  });

  it('should render the correct number of highlight items', () => {
    render(<EventHighlights />);
    // Find all h3 headings (highlight titles) and check the count
    const highlightTitles = screen.getAllByRole('heading', { level: 3 });
    expect(highlightTitles).toHaveLength(highlights.length);
  });

  it('should render each highlight with its title and description', () => {
    render(<EventHighlights />);
    highlights.forEach(highlight => {
      // Find the heading for the current highlight
      const titleElement = screen.getByRole('heading', { name: highlight.title, level: 3 });
      expect(titleElement).toBeInTheDocument();

      // Find the parent container of the title
      const highlightContainer = titleElement.closest('div');
      expect(highlightContainer).toBeInTheDocument();

      // Check if the description exists within that container
      expect(within(highlightContainer!).getByText(highlight.description)).toBeInTheDocument();
    });
  });
});