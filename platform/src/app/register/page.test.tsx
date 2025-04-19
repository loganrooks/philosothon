import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from '@/app/register/page';
import '@testing-library/jest-dom';

// Mock child components
// Mock the NEW RegistrationForm, remove the old FormEmbed mock
vi.mock('@/app/register/components/RegistrationForm', () => ({
  RegistrationForm: () => <div data-testid="mock-registration-form">Mock Registration Form</div>,
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

  // Update test to check for RegistrationForm
  it('should render the RegistrationForm component', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('mock-registration-form')).toBeInTheDocument();
  });

  it('should render the InstructionBlock component', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('mock-instruction-block')).toBeInTheDocument();
  });
});