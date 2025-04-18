import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkshopForm } from './WorkshopForm'; // Adjust path if necessary
import { type Workshop } from '../page'; // Import Workshop type

// Mock Server Action prop
const mockAction = vi.fn();

describe('WorkshopForm Component', () => {
  it('should render all form fields correctly when no initial data is provided', () => {
    // Act
    render(<WorkshopForm action={mockAction} />); // Removed themes prop

    // Assert
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/relevant themes \(JSON Array of Theme IDs\)/i)).toBeInTheDocument(); // Match label text
    expect(screen.getByLabelText(/facilitator/i)).toBeInTheDocument(); // Added facilitator check
    expect(screen.getByLabelText(/max capacity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create workshop/i })).toBeInTheDocument();

    // Check initial values (should be empty or default)
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/relevant themes \(JSON Array of Theme IDs\)/i)).toHaveValue('[]');
    expect(screen.getByLabelText(/facilitator/i)).toHaveValue(''); // Added facilitator check
    expect(screen.getByLabelText(/max capacity/i)).toHaveValue(null); // Assuming number input defaults to null/empty
  });

  it('should render with initial data when provided', () => {
    // Arrange
    const initialData: Workshop = {
      id: 'ws-test-id',
      created_at: '2023-01-01T00:00:00Z',
      title: 'Initial Workshop',
      description: 'Initial WS Description',
      facilitator: 'Test Facilitator', // Added missing facilitator
      relevant_themes: ['theme-1', 'theme-2'],
      max_capacity: 25,
    };

    // Act
    render(<WorkshopForm action={mockAction} initialData={initialData} />); // Removed themes prop

    // Assert
    expect(screen.getByLabelText(/title/i)).toHaveValue(initialData.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(initialData.description);
    expect(screen.getByLabelText(/relevant themes \(JSON Array of Theme IDs\)/i)).toHaveValue(JSON.stringify(initialData.relevant_themes, null, 2));
    expect(screen.getByLabelText(/facilitator/i)).toHaveValue(initialData.facilitator); // Added facilitator check
    expect(screen.getByLabelText(/max capacity/i)).toHaveValue(initialData.max_capacity);
    expect(screen.getByRole('button', { name: /update workshop/i })).toBeInTheDocument();
  });

  // Add tests for form submission and validation feedback later if needed
});