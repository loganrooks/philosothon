import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AddNewFaqPage from './page'; // Adjust path if necessary

// Mock child components
vi.mock('../components/FaqForm', () => ({
  // Mock FaqForm as it's a client component with hooks/actions
  FaqForm: ({ action }: { action: any }) => (
    <form data-testid="mock-faq-form">Mock FAQ Form (Action: {action.name})</form>
  ),
}));

describe('Add New FAQ Page (/admin/faq/new)', () => {
  it('should render the "Add New FAQ Item" heading and the FaqForm', async () => {
    // Act
    // Render the async component within act
    await act(async () => {
       render(await AddNewFaqPage());
    });

    // Assert
    expect(screen.getByRole('heading', { name: /add new faq item/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-faq-form')).toBeInTheDocument();
    // Optional: Check if the correct action name is rendered if mock supports it
    // expect(screen.getByTestId('mock-faq-form')).toHaveTextContent('Action: createFaqItem');
  });
});