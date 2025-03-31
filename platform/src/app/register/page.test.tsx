import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from '@/app/register/page'; // Adjust path as necessary

// Mock child components
vi.mock('@/components/FormEmbed', () => ({
  default: () => <div data-testid="mock-form-embed">Mock Form Embed</div>,
}));
vi.mock('@/components/InstructionBlock', () => ({
  default: () => <div data-testid="mock-instruction-block">Mock Instruction Block</div>,
}));

describe('Register Page Component', () => {
  it('should render the main heading', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: /Register for Philosothon/i, level: 1 })).toBeInTheDocument();
  });

  it('should render the introductory paragraph', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/Sign up below to participate/i)).toBeInTheDocument();
  });

  it('should render the FormEmbed component', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('mock-form-embed')).toBeInTheDocument();
  });

  it('should render the InstructionBlock component', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('mock-instruction-block')).toBeInTheDocument();
  });
});