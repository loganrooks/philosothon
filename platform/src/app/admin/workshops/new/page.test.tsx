import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react'; // Import act
import AddNewWorkshopPage from './page'; // Adjust path if necessary

// Mock child components
vi.mock('../components/WorkshopForm', () => ({
  // Mock WorkshopForm as it's a client component with hooks/actions
  WorkshopForm: ({ action }: { action: any }) => (
    <form data-testid="mock-workshop-form">Mock Workshop Form (Action: {action.name})</form>
  ),
}));

describe('Add New Workshop Page (/admin/workshops/new)', () => {
  it('should render the "Add New Workshop" heading and the WorkshopForm', async () => { // Make test async
    // Act
    await act(async () => {
       render(await AddNewWorkshopPage()); // Await the async component
    });

    // Assert
    expect(screen.getByRole('heading', { name: /add new workshop/i })).toBeInTheDocument();
    expect(screen.getByTestId('mock-workshop-form')).toBeInTheDocument();
    // Optional: Check if the correct action name is rendered if mock supports it
    // expect(screen.getByTestId('mock-workshop-form')).toHaveTextContent('Action: createWorkshop');
  });
});