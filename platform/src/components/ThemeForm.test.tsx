// platform/src/components/ThemeForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeForm from './ThemeForm'; // Adjust path as necessary

// Mock the server action if needed for form submission tests later
const mockAction = vi.fn();

describe('ThemeForm Component', () => {
  it('should render all form fields correctly', () => {
    // Arrange
    render(<ThemeForm action={mockAction} />);

    // Assert
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/analytic tradition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/continental tradition/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save theme/i })).toBeInTheDocument();
  });

  it('should render with initial data when provided', () => {
    // Arrange
    const initialData = {
      id: 'test-id',
      title: 'Initial Title',
      description: 'Initial Description',
      analytic_tradition: 'Analytic Test',
      continental_tradition: 'Continental Test',
      created_at: new Date().toISOString(), // Add created_at if needed by type
    };
    render(<ThemeForm action={mockAction} initialData={initialData} />);

    // Assert
    expect(screen.getByLabelText(/title/i)).toHaveValue(initialData.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(initialData.description);
    expect(screen.getByLabelText(/analytic tradition/i)).toHaveValue(initialData.analytic_tradition);
    expect(screen.getByLabelText(/continental tradition/i)).toHaveValue(initialData.continental_tradition);
    // Check if hidden ID input exists when initialData is present
    expect(screen.getByDisplayValue(initialData.id)).toBeInTheDocument(); // This assumes a hidden input with the ID value
     expect(screen.getByRole('button', { name: /save theme/i })).toBeInTheDocument();
  });

  it('should update input values on change', async () => {
    // Arrange
    render(<ThemeForm action={mockAction} />);
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const newTitle = 'New Test Title';
    const newDescription = 'New Test Description';

    // Act
    await fireEvent.change(titleInput, { target: { value: newTitle } });
    await fireEvent.change(descriptionInput, { target: { value: newDescription } });


    // Assert
    expect(titleInput).toHaveValue(newTitle);
    expect(descriptionInput).toHaveValue(newDescription);
  });

  // Add tests later for form submission (calling the action) and validation states if applicable
});