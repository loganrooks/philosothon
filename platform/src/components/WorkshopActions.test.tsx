// platform/src/components/WorkshopActions.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkshopActions from './WorkshopActions'; // Adjust path as necessary

// Mock the deleteWorkshop server action from its actual module path
import { deleteWorkshop } from '@/app/admin/workshops/actions';
vi.mock('@/app/admin/workshops/actions');

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}));


describe('WorkshopActions Component', () => {
  const testWorkshopId = 'workshop-xyz-456';

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render Edit link and Delete button', () => {
    // Arrange
    render(<WorkshopActions workshopId={testWorkshopId} />);

    // Assert
    const editLink = screen.getByRole('link', { name: /edit/i });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute('href', `/admin/workshops/${testWorkshopId}/edit`);

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call deleteWorkshop action when Delete button is clicked and confirmed', async () => {
    // Arrange
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    render(<WorkshopActions workshopId={testWorkshopId} />);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    const form = deleteButton.closest('form');

    // Act
    if (form) {
        await fireEvent.submit(form);
    } else {
        throw new Error("Could not find form for delete button");
    }

    // Assert
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    // Check if the mocked deleteWorkshop (imported one) was called
    expect(deleteWorkshop).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it('should NOT call deleteWorkshop action when Delete button is clicked and cancelled', async () => {
     // Arrange
     const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);
     render(<WorkshopActions workshopId={testWorkshopId} />);
     const deleteButton = screen.getByRole('button', { name: /delete/i });
     const form = deleteButton.closest('form');

     // Act
     if (form) {
         await fireEvent.submit(form); // Simulate form submission which triggers onSubmit
     } else {
         throw new Error("Could not find form for delete button");
     }

     // Assert
     expect(confirmSpy).toHaveBeenCalledTimes(1);
     expect(deleteWorkshop).not.toHaveBeenCalled(); // Action should not be called

     confirmSpy.mockRestore();
   });

});