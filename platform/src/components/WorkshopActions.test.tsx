// platform/src/components/WorkshopActions.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkshopActions from './WorkshopActions';

describe('WorkshopActions Component', () => {
  const testWorkshopId = 'workshop-xyz-456';
  
  // Mock window.alert
  window.alert = vi.fn();
  
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should render Delete button', () => {
    // Arrange
    render(<WorkshopActions workshopId={testWorkshopId} />);
    
    // Assert
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
  
  it('should display alert when Delete button is clicked', () => {
    // Arrange
    render(<WorkshopActions workshopId={testWorkshopId} />);
    
    // Act
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Assert
    expect(window.alert).toHaveBeenCalledWith('Delete functionality temporarily disabled during deployment');
  });
});