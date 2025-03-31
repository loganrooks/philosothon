import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WorkshopCard from '@/components/WorkshopCard';

describe('WorkshopCard Component', () => {
  const defaultProps = {
    title: 'Test Workshop Title',
    description: 'This is a test description for the workshop.',
  };

  it('should render the title', () => {
    render(<WorkshopCard {...defaultProps} />);
    expect(screen.getByRole('heading', { name: defaultProps.title, level: 3 })).toBeInTheDocument();
  });

  it('should render the description', () => {
    render(<WorkshopCard {...defaultProps} />);
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
  });

  it('should render the facilitator when provided', () => {
    const facilitatorName = 'Dr. Test Facilitator';
    render(<WorkshopCard {...defaultProps} facilitator={facilitatorName} />);
    expect(screen.getByText(`Facilitator: ${facilitatorName}`)).toBeInTheDocument();
  });

  it('should not render the facilitator when not provided', () => {
    render(<WorkshopCard {...defaultProps} />);
    expect(screen.queryByText(/Facilitator:/i)).not.toBeInTheDocument();
  });
});