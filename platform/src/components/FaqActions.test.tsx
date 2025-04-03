// platform/src/components/FaqActions.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaqActions } from './FaqActions';

describe('FaqActions Component', () => {
  const testFaqItemId = 'faq-xyz-456';
  
  // Mock window confirmation and alert
  window.confirm = vi.fn();
  window.alert = vi.fn();
  
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should render Delete button', () => {
    // Arrange
    render(<FaqActions faqItemId={testFaqItemId} />);
    
    // Assert
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
  
  it('should show alert when Delete button is clicked and confirmed', () => {
    // Arrange
    (window.confirm as jest.Mock).mockReturnValue(true);
    render(<FaqActions faqItemId={testFaqItemId} />);
    
    // Act
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Assert
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this FAQ item?');
    expect(window.alert).toHaveBeenCalledWith('Delete functionality temporarily disabled during deployment');
  });
  
  it('should NOT show alert when Delete button is clicked but canceled', () => {
    // Arrange
    (window.confirm as jest.Mock).mockReturnValue(false);
    render(<FaqActions faqItemId={testFaqItemId} />);
    
    // Act
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Assert
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this FAQ item?');
    expect(window.alert).not.toHaveBeenCalled();
  });
});