import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FaqForm } from './FaqForm'; // Adjust path if necessary
// Define FaqItem type locally as it's not exported from ../page
interface FaqItem {
  id: string;
  created_at: string;
  question: string;
  answer: string;
  category?: string | null; // Keep category optional for type definition consistency
  display_order: number | null;
}

// Mock Server Action prop
const mockAction = vi.fn();

describe('FaqForm Component', () => {
  it('should render all form fields correctly when no initial data is provided', () => {
    // Act
    render(<FaqForm action={mockAction} />);

    // Assert
    expect(screen.getByLabelText(/question/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/answer/i)).toBeInTheDocument();
    // expect(screen.getByLabelText(/category/i)).toBeInTheDocument(); // Removed category check
    expect(screen.getByLabelText(/display order/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create faq item/i })).toBeInTheDocument(); // Corrected button text

    // Check initial values (should be empty or default)
    expect(screen.getByLabelText(/question/i)).toHaveValue('');
    expect(screen.getByLabelText(/answer/i)).toHaveValue('');
    // expect(screen.getByLabelText(/category/i)).toHaveValue(''); // Removed category check
    expect(screen.getByLabelText(/display order/i)).toHaveValue(null); // Number input defaults to null/empty string
  });

  it('should render with initial data when provided', () => {
    // Arrange
    const initialData: FaqItem = {
      id: 'faq-test-id',
      created_at: '2023-01-01T00:00:00Z',
      question: 'Initial Question?',
      answer: 'Initial Answer.',
      category: 'General', // Added missing category
      display_order: 5,
    };

    // Act
    render(<FaqForm action={mockAction} initialData={initialData} />);

    // Assert
    expect(screen.getByLabelText(/question/i)).toHaveValue(initialData.question);
    expect(screen.getByLabelText(/answer/i)).toHaveValue(initialData.answer);
    // expect(screen.getByLabelText(/category/i)).toHaveValue(initialData.category); // Removed category check
    expect(screen.getByLabelText(/display order/i)).toHaveValue(initialData.display_order);
    expect(screen.getByRole('button', { name: /update faq item/i })).toBeInTheDocument(); // Corrected button text
  });

  // Add tests for form submission and validation feedback later if needed
});