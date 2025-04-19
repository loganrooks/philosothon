/// <reference types="vitest/globals" />
import { updateEventSettings } from './actions'; // This import will fail initially
import { createClient } from '@/lib/supabase/server'; // Assuming DAL or direct client usage
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock Supabase client methods
const mockUpdate = vi.fn();
const mockEq = vi.fn().mockReturnValue({ update: mockUpdate });
const mockFrom = vi.fn().mockReturnValue({ eq: mockEq });

const supabase = { from: mockFrom };

describe('updateEventSettings Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the createClient to return our mock Supabase instance
    (createClient as vi.Mock).mockReturnValue(supabase);
  });

  const validFormData = {
    event_name: 'Philosothon Updated',
    start_date: '2025-10-26T09:00:00.000Z',
    end_date: '2025-10-27T17:00:00.000Z',
    location: 'Updated Location',
    registration_deadline: '2025-09-30T23:59:59.000Z',
    submission_deadline: '2025-10-15T23:59:59.000Z',
    contact_email: 'updated@example.com',
  };

  // Mock previous state for useFormState (usually null for the first call)
  const prevState = null;

  it('should call Supabase update with correct data on valid input', async () => {
    // TDD Anchor: Test Supabase update call (Spec Line 147)
    mockUpdate.mockResolvedValueOnce({ error: null }); // Simulate successful update

    // This test will fail because updateEventSettings doesn't exist yet
    await updateEventSettings(prevState, validFormData);

    expect(createClient).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('event_details');
    expect(mockEq).toHaveBeenCalledWith('id', 1); // Assuming singleton table with id=1
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      event_name: validFormData.event_name,
      location: validFormData.location,
      contact_email: validFormData.contact_email,
      // Add other fields, potentially converting dates if needed by schema/validation
    }));
  });

  it('should return validation errors for invalid data', async () => {
    // TDD Anchor: Test validation (Spec Line 147)
    const invalidData = { ...validFormData, contact_email: 'invalid-email' };

    // This test will fail because updateEventSettings doesn't exist yet
    const result = await updateEventSettings(prevState, invalidData);

    expect(result.success).toBe(false);
    expect(result.errors?.contact_email).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

   it('should return error state on Supabase update failure', async () => {
    // TDD Anchor: Test error handling (Spec Line 147)
    const dbError = { message: 'Database update failed' };
    mockUpdate.mockResolvedValueOnce({ error: dbError }); // Simulate DB error

    // This test will fail because updateEventSettings doesn't exist yet
    const result = await updateEventSettings(prevState, validFormData);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Database update failed');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('should call revalidatePath on successful update', async () => {
    // TDD Anchor: Test revalidation (Spec Line 147)
    mockUpdate.mockResolvedValueOnce({ error: null }); // Simulate successful update

    // This test will fail because updateEventSettings doesn't exist yet
    await updateEventSettings(prevState, validFormData);

    // Expect revalidation for relevant paths (e.g., homepage, schedule, admin settings)
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/schedule'); // Example path
    expect(revalidatePath).toHaveBeenCalledWith('/admin/settings');
  });

  // Note: Redirect is usually handled by the component after success, not the action itself
  // unless the action explicitly calls redirect. We'll test revalidatePath here.
});