/// <reference types="vitest/globals" />
import { vi, describe, it, expect, beforeEach } from 'vitest'; // Explicit import
import {
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from './actions'; // This import will fail initially
// import { createClient } from '@/lib/supabase/server'; // No longer needed
import {
  createScheduleItem as createItemDAL,
  updateScheduleItem as updateItemDAL,
  deleteScheduleItem as deleteItemDAL,
} from '@/lib/data/schedule'; // Import DAL functions to mock
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Mock dependencies
// Remove direct Supabase client mock
vi.mock('@/lib/data/schedule', () => ({
  createScheduleItem: vi.fn(),
  updateScheduleItem: vi.fn(),
  deleteScheduleItem: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Remove Supabase client method mocks

// Mock previous state for useFormState (usually null for the first call)
const prevState = null;

const validScheduleData = {
  item_date: '2025-10-26',
  start_time: '10:30:00',
  end_time: '12:00:00',
  title: 'Test Schedule Item',
  description: 'A description',
  location: 'Test Room',
  speaker: 'Test Speaker',
};

const existingItemId = '123'; // Use a numeric string ID for testing

describe('Schedule Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No need to mock createClient anymore
  });

  // --- createScheduleItem Tests ---
  describe('createScheduleItem', () => {
    it('should call Supabase insert with correct data on valid input', async () => {
      // TDD Anchor: Test Supabase calls (insert) (Spec Line 154)
      vi.mocked(createItemDAL).mockResolvedValueOnce({ data: {}, error: null });
      await createScheduleItem(prevState, validScheduleData);

      // Expect date to be formatted as YYYY-MM-DD string
      expect(createItemDAL).toHaveBeenCalledWith(expect.objectContaining({
        ...validScheduleData,
        item_date: '2025-10-26' // Expect formatted date string
      }));
    });

    it('should return validation errors for missing required fields', async () => {
      // TDD Anchor: Test validation (Spec Line 154)
      const invalidData = { ...validScheduleData, title: '' };
      const result = await createScheduleItem(prevState, invalidData); // Will fail

      expect(result.success).toBe(false);
      expect(result.errors?.title).toBeDefined();
      expect(createItemDAL).not.toHaveBeenCalled();
    });

    it('should return error state on Supabase insert failure', async () => {
      // TDD Anchor: Test error handling (Spec Line 154)
      const dbError = { message: 'Insert failed' };
      vi.mocked(createItemDAL).mockResolvedValueOnce({ data: null, error: dbError });
      const result = await createScheduleItem(prevState, validScheduleData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Insert failed');
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should call revalidatePath and redirect on successful insert', async () => {
      // TDD Anchor: Test revalidation/redirects (Spec Line 154)
      vi.mocked(createItemDAL).mockResolvedValueOnce({ data: {}, error: null });
      await createScheduleItem(prevState, validScheduleData);

      expect(revalidatePath).toHaveBeenCalledWith('/admin/schedule');
      expect(revalidatePath).toHaveBeenCalledWith('/schedule'); // Assuming public schedule page
      expect(redirect).toHaveBeenCalledWith('/admin/schedule');
    });
  });

  // --- updateScheduleItem Tests ---
  describe('updateScheduleItem', () => {
     const updateData = { ...validScheduleData, id: existingItemId };

    it('should call Supabase update with correct data on valid input', async () => {
      // TDD Anchor: Test Supabase calls (update) (Spec Line 154)
      vi.mocked(updateItemDAL).mockResolvedValueOnce({ data: {}, error: null });
      const numericId = parseInt(existingItemId, 10); // Parse the numeric string ID
      await updateScheduleItem(prevState, updateData);

      // ID is parsed within the action, test expects numeric ID. Expect formatted date.
      expect(updateItemDAL).toHaveBeenCalledWith(numericId, expect.objectContaining({
        title: validScheduleData.title,
        item_date: '2025-10-26' // Expect formatted date string
      }));
    });

     it('should return validation errors for invalid data', async () => {
      // TDD Anchor: Test validation (Spec Line 154)
      const invalidData = { ...updateData, start_time: 'invalid-time' };
      const result = await updateScheduleItem(prevState, invalidData); // Will fail

      expect(result.success).toBe(false);
      expect(result.errors?.start_time).toBeDefined();
      expect(updateItemDAL).not.toHaveBeenCalled();
    });

     it('should return error state on Supabase update failure', async () => {
      // TDD Anchor: Test error handling (Spec Line 154)
      const dbError = { message: 'Update failed' };
      vi.mocked(updateItemDAL).mockResolvedValueOnce({ data: null, error: dbError });
      const result = await updateScheduleItem(prevState, updateData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Update failed');
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

     it('should call revalidatePath and redirect on successful update', async () => {
      // TDD Anchor: Test revalidation/redirects (Spec Line 154)
      vi.mocked(updateItemDAL).mockResolvedValueOnce({ data: {}, error: null });
      await updateScheduleItem(prevState, updateData);

      expect(revalidatePath).toHaveBeenCalledWith('/admin/schedule');
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/schedule/edit?id=${existingItemId}`);
      expect(revalidatePath).toHaveBeenCalledWith('/schedule'); // Assuming public schedule page
      expect(redirect).toHaveBeenCalledWith('/admin/schedule');
    });
  });

  // --- deleteScheduleItem Tests ---
  describe('deleteScheduleItem', () => {
    it('should call Supabase delete with correct id', async () => {
      // TDD Anchor: Test Supabase calls (delete) (Spec Line 154)
      vi.mocked(deleteItemDAL).mockResolvedValueOnce({ error: null });
      const numericId = parseInt(existingItemId, 10); // Parse the numeric string ID
      await deleteScheduleItem(existingItemId); // Pass string ID as action handles parsing

      // ID is parsed within the action, test expects numeric ID.
      expect(deleteItemDAL).toHaveBeenCalledWith(numericId); // Assertion was already correct here, just confirming.
    });

    it('should return error state on Supabase delete failure', async () => {
        // TDD Anchor: Test error handling (Spec Line 154)
        const dbError = { message: 'Delete failed' };
        vi.mocked(deleteItemDAL).mockResolvedValueOnce({ error: dbError });
        const result = await deleteScheduleItem(existingItemId);

        // Assuming delete action returns an object like { success: boolean, message?: string }
        expect(result?.success).toBe(false);
        expect(result?.message).toContain('Delete failed');
        expect(revalidatePath).not.toHaveBeenCalled();
    });

     it('should call revalidatePath on successful delete', async () => {
        // TDD Anchor: Test revalidation/redirects (Spec Line 154)
        vi.mocked(deleteItemDAL).mockResolvedValueOnce({ error: null });
        await deleteScheduleItem(existingItemId);

        expect(revalidatePath).toHaveBeenCalledWith('/admin/schedule');
        expect(revalidatePath).toHaveBeenCalledWith('/schedule'); // Assuming public schedule page
    });

     it('should handle missing id gracefully', async () => {
        // TDD Anchor: Test error handling (Spec Line 154) - Edge case
        const result = await deleteScheduleItem(''); // Will fail (or pass if action handles it)

        expect(deleteItemDAL).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        // Check for specific error message or return value if the action implements it
        // expect(result?.success).toBe(false);
        // expect(result?.message).toContain('Invalid ID');
    });
  });
});