// platform/src/app/admin/themes/components/ThemeForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeForm } from './ThemeForm'; // Adjust path if necessary
import { type Theme } from '@/lib/data/themes'; // Corrected import path

// Mock Server Action prop
const mockAction = vi.fn();

describe('ThemeForm Component', () => {
  it('should render all form fields correctly when no initial data is provided', () => {
    // Act
    render(<ThemeForm action={mockAction} />);

    // Assert
    expect(screen.getByLabelText(/^Title/i)).toBeInTheDocument(); // Use exact match start
    expect(screen.getByLabelText(/^Description$/i)).toBeInTheDocument(); // Use exact match
    expect(screen.getByLabelText(/Expanded Description \(Markdown\)/i)).toBeInTheDocument(); // Check new field
    expect(screen.getByLabelText(/Analytic Tradition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Continental Tradition/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create theme/i })).toBeInTheDocument();

    // Check initial values (should be empty)
    expect(screen.getByLabelText(/^Title/i)).toHaveValue('');
    expect(screen.getByLabelText(/^Description$/i)).toHaveValue('');
    expect(screen.getByLabelText(/Expanded Description \(Markdown\)/i)).toHaveValue(''); // Check new field initial value
    // Use JSON.stringify with indentation to match component output
    expect(screen.getByLabelText(/analytic tradition/i)).toHaveValue('[]'); // Simpler check for empty array
    expect(screen.getByLabelText(/continental tradition/i)).toHaveValue('[]'); // Simpler check for empty array
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
      image_url: null, // Added missing property
      relevant_themes: null, // Added missing property
    };

    // Act
    render(<ThemeForm action={mockAction} initialData={initialData} />);

    // Assert
    expect(screen.getByLabelText(/^Title/i)).toHaveValue(initialData.title);
    expect(screen.getByLabelText(/^Description$/i)).toHaveValue(initialData.description);
    // Check new field value
    expect(screen.getByLabelText(/Expanded Description \(Markdown\)/i)).toHaveValue(initialData.description_expanded);
    // Use JSON.stringify with indentation to match component output
    expect(screen.getByLabelText(/Analytic Tradition/i)).toHaveValue(JSON.stringify(initialData.analytic_tradition, null, 2));
    expect(screen.getByLabelText(/Continental Tradition/i)).toHaveValue(JSON.stringify(initialData.continental_tradition, null, 2));
    expect(screen.getByRole('button', { name: /update theme/i })).toBeInTheDocument(); // Corrected button text
  });

  // Add tests for form submission and validation feedback later if needed
});