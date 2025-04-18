import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InstructionBlock from '@/components/InstructionBlock';

describe('InstructionBlock Component', () => {
  it('should render the heading', () => {
    render(<InstructionBlock />);
    expect(screen.getByRole('heading', { name: /Registration Instructions/i, level: 2 })).toBeInTheDocument();
  });

  it('should render the instructional paragraphs', () => {
    render(<InstructionBlock />);
    expect(screen.getByText(/Please fill out the form below completely/i)).toBeInTheDocument();
    expect(screen.getByText(/Team assignments and final theme selection/i)).toBeInTheDocument();
  });
});