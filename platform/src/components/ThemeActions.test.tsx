// platform/src/components/ThemeActions.test.tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ThemeActions from './ThemeActions';

describe('ThemeActions', () => {
  const testThemeId = 'test-theme-123';
  
  // Mock window.alert
  window.alert = vi.fn();
  
  it('renders the delete button', () => {
    render(<ThemeActions themeId={testThemeId} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('shows confirmation alert when delete button is clicked', () => {
    render(<ThemeActions themeId={testThemeId} />);
    
    // Click the delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Check if alert was called
    expect(window.alert).toHaveBeenCalledWith('Delete functionality temporarily disabled during deployment');
  });
});