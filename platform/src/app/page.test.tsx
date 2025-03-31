import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '@/app/page'; // Adjust path as necessary

// Mock child components
vi.mock('@/components/Hero', () => ({
  default: () => <div data-testid="mock-hero">Mock Hero</div>,
}));
vi.mock('@/components/Countdown', () => ({
  default: () => <div data-testid="mock-countdown">Mock Countdown</div>,
}));
vi.mock('@/components/EventHighlights', () => ({
  default: () => <div data-testid="mock-event-highlights">Mock Event Highlights</div>,
}));

describe('Home Page Component', () => {
  it('should render the Hero component', () => {
    render(<Home />);
    expect(screen.getByTestId('mock-hero')).toBeInTheDocument();
  });

  it('should render the Countdown component', () => {
    render(<Home />);
    expect(screen.getByTestId('mock-countdown')).toBeInTheDocument();
  });

  it('should render the EventHighlights component', () => {
    render(<Home />);
    expect(screen.getByTestId('mock-event-highlights')).toBeInTheDocument();
  });
});