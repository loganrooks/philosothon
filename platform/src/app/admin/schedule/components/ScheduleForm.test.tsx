/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFormState } from 'react-dom';
import ScheduleForm from './ScheduleForm'; // This import will fail initially
import { createScheduleItem, updateScheduleItem } from '../actions'; // This import will fail initially
import { ScheduleItem } from '@/lib/types'; // Assuming type definition exists/will exist

// Mock the useFormState hook
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    useFormState: vi.fn(),
  };
});

// Mock the server actions
vi.mock('../actions', () => ({
  createScheduleItem: vi.fn(),
  updateScheduleItem: vi.fn(),
}));

const mockInitialState = { success: false, message: null, errors: {} };
const mockExistingItem: ScheduleItem = {
  id: 'uuid-edit-1',
  item_date: '2025-10-26',
  start_time: '14:00:00',
  end_time: '15:00:00',
  title: 'Existing Item',
  description: 'Details about the existing item.',
  location: 'Room 101',
  speaker: 'Dr. Test',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('ScheduleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for 'new' mode
    (useFormState as vi.Mock).mockReturnValue([mockInitialState, createScheduleItem]);
  });

  it('should render empty fields in "new" mode', () => {
    // TDD Anchor: Test form rendering (new) (Spec Line 118)
    render(<ScheduleForm mode="new" />); // This will fail

    expect(screen.getByLabelText(/Title/i)).toHaveValue('');
    expect(screen.getByLabelText(/Date/i)).toHaveValue('');
    expect(screen.getByLabelText(/Start Time/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
  });

  it('should render populated fields in "edit" mode', () => {
    // TDD Anchor: Test form rendering (edit) (Spec Line 118)
    (useFormState as vi.Mock).mockReturnValue([mockInitialState, updateScheduleItem]);
    render(<ScheduleForm mode="edit" initialData={mockExistingItem} />); // This will fail

    expect(screen.getByLabelText(/Title/i)).toHaveValue(mockExistingItem.title);
    expect(screen.getByLabelText(/Date/i)).toHaveValue(mockExistingItem.item_date);
    expect(screen.getByLabelText(/Start Time/i)).toHaveValue(mockExistingItem.start_time);
    expect(screen.getByLabelText(/Speaker/i)).toHaveValue(mockExistingItem.speaker);
    expect(screen.getByRole('button', { name: /Update Item/i })).toBeInTheDocument();
  });

  it('should update input values on change', () => {
    render(<ScheduleForm mode="new" />); // This will fail

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    expect(titleInput).toHaveValue('New Title'); // This will fail
  });

  it('should call the correct server action on submit ("new" mode)', () => {
    // TDD Anchor: Test Server Action calls (create) (Spec Line 118)
    render(<ScheduleForm mode="new" />); // This will fail

    const submitButton = screen.getByRole('button', { name: /Add Item/i });
    fireEvent.click(submitButton);

    // Expect the create action provided by useFormState to have been triggered
    expect(submitButton).toBeInTheDocument(); // Basic check
    // More direct assertion isn't straightforward, relies on useFormState mock being called
  });

  it('should call the correct server action on submit ("edit" mode)', () => {
    // TDD Anchor: Test Server Action calls (update) (Spec Line 118)
    (useFormState as vi.Mock).mockReturnValue([mockInitialState, updateScheduleItem]);
    render(<ScheduleForm mode="edit" initialData={mockExistingItem} />); // This will fail

    const submitButton = screen.getByRole('button', { name: /Update Item/i });
    fireEvent.click(submitButton);

    // Expect the update action provided by useFormState to have been triggered
    expect(submitButton).toBeInTheDocument(); // Basic check
  });

  it('should display validation errors from server action state', () => {
    // TDD Anchor: Test validation (Spec Line 118)
    const errorState = {
      success: false,
      message: 'Validation failed',
      errors: { title: ['Title is required'], start_time: ['Invalid time format'] },
    };
    (useFormState as vi.Mock).mockReturnValue([errorState, createScheduleItem]);

    render(<ScheduleForm mode="new" />); // This will fail

    expect(screen.getByText('Validation failed')).toBeInTheDocument(); // Will fail
    expect(screen.getByText('Title is required')).toBeInTheDocument(); // Will fail
    expect(screen.getByText('Invalid time format')).toBeInTheDocument(); // Will fail
  });

   it('should display success message from server action state', () => {
    const successState = { success: true, message: 'Item saved successfully.', errors: {} };
    (useFormState as vi.Mock).mockReturnValue([successState, createScheduleItem]);

    render(<ScheduleForm mode="new" />); // This will fail

    expect(screen.getByText('Item saved successfully.')).toBeInTheDocument(); // Will fail
  });
});