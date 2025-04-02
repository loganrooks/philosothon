// platform/src/components/ThemeActions.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeActions from './ThemeActions'; // Adjust path as necessary
// Removed unused Link import

// Mock the deleteTheme server action from its actual module path
import { deleteTheme } from '@/app/admin/themes/actions';
vi.mock('@/app/admin/themes/actions');

// Mock next/link (still needed for the Edit link)
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}));


describe('ThemeActions Component', () => {
  const testThemeId = 'theme-abc-123';

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render Edit link and Delete button', () => {
    // Arrange
    // Pass themeId instead of id, remove deleteAction prop
    render(<ThemeActions themeId={testThemeId} />);

    // Assert
    const editLink = screen.getByRole('link', { name: /edit/i });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute('href', `/admin/themes/${testThemeId}/edit`);

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call deleteTheme action when Delete button is clicked and confirmed', async () => {
    // Arrange
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    // Pass themeId instead of id, remove deleteAction prop
    render(<ThemeActions themeId={testThemeId} />);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    const form = deleteButton.closest('form'); // Get the form associated with the button

    // Act
    // Simulate form submission instead of just button click
    if (form) {
        await fireEvent.submit(form);
    } else {
        throw new Error("Could not find form for delete button");
    }


    // Assert
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    // Check if the mocked deleteTheme (imported one) was called
    // The component binds the ID internally, so we don't check args here directly
    // We rely on the fact that the form's action calls the bound function.
    // A more direct way would be to spy on the bound function if possible,
    // but checking the base mock is usually sufficient for unit tests.
    expect(deleteTheme).toHaveBeenCalledTimes(1); // Check the base mocked action

    confirmSpy.mockRestore();
  });

  it('should NOT call deleteTheme action when Delete button is clicked and cancelled', async () => {
     // Arrange
     const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);
     // Pass themeId instead of id, remove deleteAction prop
     render(<ThemeActions themeId={testThemeId} />);
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
     expect(deleteTheme).not.toHaveBeenCalled(); // Action should not be called

     confirmSpy.mockRestore();
   });

});