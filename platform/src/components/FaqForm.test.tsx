// platform/src/components/FaqForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FaqForm from './FaqForm'; // Adjust path as necessary

// Mock the server action
const mockAction = vi.fn();

describe('FaqForm Component', () => {
  it('should render all form fields correctly', () => {
    // Arrange
    render(<FaqForm action={mockAction} />);

    // Assert
    expect(screen.getByLabelText(/question/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/answer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display order/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save faq item/i })).toBeInTheDocument();
  });

  it('should render with initial data when provided', () => {
    // Arrange
    const initialData = {
      id: 'faq-test-id',
      question: 'Initial Question?',
      answer: 'Initial Answer.',
      category: 'Initial Category',
      display_order: 5,
      created_at: new Date().toISOString(),
    };
    render(<FaqForm action={mockAction} initialData={initialData} />);

    // Assert
    expect(screen.getByLabelText(/question/i)).toHaveValue(initialData.question);
    expect(screen.getByLabelText(/answer/i)).toHaveValue(initialData.answer);
    expect(screen.getByLabelText(/category/i)).toHaveValue(initialData.category);
    expect(screen.getByLabelText(/display order/i)).toHaveValue(initialData.display_order);
    expect(screen.getByDisplayValue(initialData.id)).toBeInTheDocument(); // Hidden ID input
    // Button text changes when initialData is present
    expect(screen.getByRole('button', { name: /update faq item/i })).toBeInTheDocument();
  });

  it('should update input values on change', async () => {
    // Arrange
    render(<FaqForm action={mockAction} />);
    const questionInput = screen.getByLabelText(/question/i);
    const categoryInput = screen.getByLabelText(/category/i);
    const newQuestion = 'New Test Question?';
    const newCategory = 'New Category';

    // Act
    await fireEvent.change(questionInput, { target: { value: newQuestion } });
    await fireEvent.change(categoryInput, { target: { value: newCategory } });

    // Assert
    expect(questionInput).toHaveValue(newQuestion);
    expect(categoryInput).toHaveValue(newCategory);
  });

  // Add tests later for form submission, validation etc.
});