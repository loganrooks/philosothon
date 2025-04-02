// platform/src/components/FaqActions.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaqActions } from './FaqActions'; // Adjust path as necessary

// Mock the deleteFaqItem server action from its actual module path
import { deleteFaqItem } from '@/app/admin/faq/actions';
vi.mock('@/app/admin/faq/actions');

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}));


describe('FaqActions Component', () => {
  const testFaqItemId = 'faq-abc-123'; // Use correct prop name convention

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render Edit link and Delete button', () => {
    // Arrange
    // Pass faqItemId instead of faqId
    render(<FaqActions faqItemId={testFaqItemId} />);

    // Assert
    const editLink = screen.getByRole('link', { name: /edit/i });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute('href', `/admin/faq/${testFaqItemId}/edit`);

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call deleteFaqItem action when Delete button is clicked and confirmed', async () => {
    // Arrange
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    // Pass faqItemId instead of faqId
    render(<FaqActions faqItemId={testFaqItemId} />);
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
    // Check if the mocked deleteFaqItem (imported one) was called
    expect(deleteFaqItem).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it('should NOT call deleteFaqItem action when Delete button is clicked and cancelled', async () => {
     // Arrange
     const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);
     // Pass faqItemId instead of faqId
     render(<FaqActions faqItemId={testFaqItemId} />);
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
     expect(deleteFaqItem).not.toHaveBeenCalled(); // Action should not be called

     confirmSpy.mockRestore();
   });

});