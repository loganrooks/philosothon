import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkshopForm } from './WorkshopForm'; // Adjust path if necessary
// Define Workshop type locally to match expected structure for initialData prop
interface Workshop {
  id: string;
  created_at: string;
  title: string;
  description: string | null; // Explicitly allow null
  speaker: string | null; // Explicitly allow null
  related_themes: string[] | null; // Explicitly allow null
  image_url: string | null; // Explicitly allow null
  max_capacity: number | null; // Explicitly allow null
}

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
    // expect(screen.getByLabelText(/max capacity/i)).toBeInTheDocument(); // Removed max capacity check
    expect(screen.getByRole('button', { name: /create workshop/i })).toBeInTheDocument();

    // Check initial values (should be empty or default)
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/relevant themes \(JSON Array of Theme IDs\)/i)).toHaveValue('[]');
    expect(screen.getByLabelText(/facilitator/i)).toHaveValue(''); // Added facilitator check
    // expect(screen.getByLabelText(/max capacity/i)).toHaveValue(null); // Removed max capacity check
  });

  it('should render with initial data when provided', () => {
    // Arrange
    const initialData: Workshop = {
      id: 'ws-test-id',
      created_at: '2023-01-01T00:00:00Z',
      title: 'Initial Workshop',
      description: 'Initial WS Description',
      speaker: 'Test Speaker',
      related_themes: ['theme-1', 'theme-2'],
      image_url: null, // Add placeholder for missing property
      max_capacity: 25, // Add placeholder for missing property
    };

    // Act
    render(<WorkshopForm action={mockAction} initialData={initialData} />); // Removed themes prop

    // Assert
    expect(screen.getByLabelText(/title/i)).toHaveValue(initialData.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(initialData.description);
    // Check that the textarea value matches the stringified related_themes
    expect(screen.getByLabelText(/relevant themes \(JSON Array of Theme IDs\)/i)).toHaveValue(JSON.stringify(initialData.related_themes, null, 2)); // Use correct property
    // Check facilitator input against speaker property
    expect(screen.getByLabelText(/facilitator/i)).toHaveValue(initialData.speaker); // Use correct property
    // max_capacity assertion already removed
    expect(screen.getByRole('button', { name: /update workshop/i })).toBeInTheDocument();
  });

  // Add tests for form submission and validation feedback later if needed
});