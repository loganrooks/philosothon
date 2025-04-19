/// <reference types="vitest/globals" />
import { vi, describe, it, expect, beforeEach } from 'vitest'; // Explicit import
import { updateEventSettings } from './actions'; // This import will fail initially
import { updateEventDetails } from '@/lib/data/event'; // Import the DAL function to mock
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Mock dependencies
// Remove direct Supabase client mock
vi.mock('@/lib/data/event', () => ({
  updateEventDetails: vi.fn(), // Mock the DAL function
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Remove Supabase client method mocks

describe('updateEventSettings Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No need to mock createClient anymore
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
    // Simulate successful DAL update
    vi.mocked(updateEventDetails).mockResolvedValueOnce({ data: {}, error: null });

    await updateEventSettings(prevState, validFormData);

    // Assert DAL function was called
    expect(updateEventDetails).toHaveBeenCalledWith(expect.objectContaining({
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
    expect(updateEventDetails).not.toHaveBeenCalled();
  });

   it('should return error state on Supabase update failure', async () => {
    // TDD Anchor: Test error handling (Spec Line 147)
    const dbError = { message: 'Database update failed' };
    // Simulate DAL error
    vi.mocked(updateEventDetails).mockResolvedValueOnce({ data: null, error: dbError });

    const result = await updateEventSettings(prevState, validFormData);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Database update failed');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('should call revalidatePath on successful update', async () => {
    // TDD Anchor: Test revalidation (Spec Line 147)
    // Simulate successful DAL update
    vi.mocked(updateEventDetails).mockResolvedValueOnce({ data: {}, error: null });

    await updateEventSettings(prevState, validFormData);

    // Expect revalidation for relevant paths (e.g., homepage, schedule, admin settings)
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/schedule'); // Example path
    expect(revalidatePath).toHaveBeenCalledWith('/admin/settings');
  });

  // Note: Redirect is usually handled by the component after success, not the action itself
  // unless the action explicitly calls redirect. We'll test revalidatePath here.
});