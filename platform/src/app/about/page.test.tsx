import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AboutPage from '@/app/about/page'; // Adjust path as necessary

// Mock child components
vi.mock('@/components/ContentBlock', () => ({
  // Mock ContentBlock to render its title and children for easier testing
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid={`mock-content-block-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));
vi.mock('@/components/Timeline', () => ({
  default: () => <div data-testid="mock-timeline">Mock Timeline</div>,
}));

describe('About Page Component', () => {
  it('should render the main heading', () => {
    render(<AboutPage />);
    expect(screen.getByRole('heading', { name: /About Philosothon/i, level: 1 })).toBeInTheDocument();
  });

  it('should render the "What is a Philosothon?" ContentBlock', () => {
    render(<AboutPage />);
    const contentBlock = screen.getByTestId('mock-content-block-what-is-a-philosothon?');
    expect(contentBlock).toBeInTheDocument();
    // Check for some text within this block
    expect(screen.getByText(/While traditional hackathons gather programmers/i)).toBeInTheDocument();
    expect(screen.getByText(/Philosophy has traditionally been practiced/i)).toBeInTheDocument();
    expect(screen.getByText(/Philosophy students rarely get structured opportunities/i)).toBeInTheDocument(); // Check blockquote text
  });

  it('should render the "History & Origins" ContentBlock', () => {
    render(<AboutPage />);
    const contentBlock = screen.getByTestId('mock-content-block-history-&-origins');
    expect(contentBlock).toBeInTheDocument();
     // Check for some text within this block
    expect(screen.getByText(/The groundwork for the Philosothon was laid in 2007/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported by organizations like the Templeton Religion Trust/i)).toBeInTheDocument();
  });

  it('should render the Timeline component within the History block', () => {
     render(<AboutPage />);
     const historyBlock = screen.getByTestId('mock-content-block-history-&-origins');
     // Check that the timeline mock is a child of the history block mock
     expect(historyBlock).toContainElement(screen.getByTestId('mock-timeline'));
  });
});