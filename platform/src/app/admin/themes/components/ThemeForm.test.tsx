import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeForm } from './ThemeForm'; // Adjust path if necessary
import { type Theme } from '@/lib/types'; // Use central type definition

// Mock Server Action prop
const mockAction = vi.fn();

describe('ThemeForm Component', () => {
  it('should render all form fields correctly when no initial data is provided', () => {
    // Act
    render(<ThemeForm action={mockAction} />);

    // Assert
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/analytic tradition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/continental tradition/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create theme/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Expanded Description/i)).toBeInTheDocument(); // Added test

    // Check initial values (should be empty)
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    // Use JSON.stringify with indentation to match component output
    expect(screen.getByLabelText(/analytic tradition/i)).toHaveValue(JSON.stringify([], null, 2));
    expect(screen.getByLabelText(/continental tradition/i)).toHaveValue(JSON.stringify([], null, 2));
    expect(screen.getByLabelText(/Expanded Description/i)).toHaveValue(''); // Added test
  });

  it('should render with initial data when provided', () => {
    // Arrange
    const initialData: Theme = {
      id: 'test-id',
      created_at: '2023-01-01T00:00:00Z',
      title: 'Initial Title',
      description: 'Initial Description',
      analytic_tradition: ['Analytic 1', 'Analytic 2'],
      continental_tradition: ['Continental 1'],
      description_expanded: '## Detailed Markdown\n\n*   Point 1\n*   Point 2', // Added field
    };

    // Act
    render(<ThemeForm action={mockAction} initialData={initialData} />);

    // Assert
    expect(screen.getByLabelText(/title/i)).toHaveValue(initialData.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(initialData.description);
    // Use JSON.stringify with indentation to match component output
    expect(screen.getByLabelText(/analytic tradition/i)).toHaveValue(JSON.stringify(initialData.analytic_tradition, null, 2));
    expect(screen.getByLabelText(/continental tradition/i)).toHaveValue(JSON.stringify(initialData.continental_tradition, null, 2));
    expect(screen.getByLabelText(/Expanded Description/i)).toHaveValue(initialData.description_expanded); // Added test
    expect(screen.getByRole('button', { name: /update theme/i })).toBeInTheDocument(); // Corrected button text
  });

  // Add tests for form submission and validation feedback later if needed
});