/// <reference types="vitest/globals" />
import {
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from './actions'; // This import will fail initially
import { createClient } from '@/lib/supabase/server';
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
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn().mockReturnValue({ update: mockUpdate });
const mockMatch = vi.fn().mockReturnValue({ delete: mockDelete }); // For delete
const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  eq: mockEq,
  match: mockMatch, // For delete
});

const supabase = { from: mockFrom };

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

const existingItemId = 'uuid-existing-123';

describe('Schedule Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as vi.Mock).mockReturnValue(supabase);
  });

  // --- createScheduleItem Tests ---
  describe('createScheduleItem', () => {
    it('should call Supabase insert with correct data on valid input', async () => {
      // TDD Anchor: Test Supabase calls (insert) (Spec Line 154)
      mockInsert.mockResolvedValueOnce({ error: null });
      await createScheduleItem(prevState, validScheduleData); // Will fail

      expect(createClient).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('schedule_items');
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining(validScheduleData)]);
    });

    it('should return validation errors for missing required fields', async () => {
      // TDD Anchor: Test validation (Spec Line 154)
      const invalidData = { ...validScheduleData, title: '' };
      const result = await createScheduleItem(prevState, invalidData); // Will fail

      expect(result.success).toBe(false);
      expect(result.errors?.title).toBeDefined();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should return error state on Supabase insert failure', async () => {
      // TDD Anchor: Test error handling (Spec Line 154)
      const dbError = { message: 'Insert failed' };
      mockInsert.mockResolvedValueOnce({ error: dbError });
      const result = await createScheduleItem(prevState, validScheduleData); // Will fail

      expect(result.success).toBe(false);
      expect(result.message).toContain('Insert failed');
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should call revalidatePath and redirect on successful insert', async () => {
      // TDD Anchor: Test revalidation/redirects (Spec Line 154)
      mockInsert.mockResolvedValueOnce({ error: null });
      await createScheduleItem(prevState, validScheduleData); // Will fail

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
      mockUpdate.mockResolvedValueOnce({ error: null });
      await updateScheduleItem(prevState, updateData); // Will fail

      expect(createClient).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('schedule_items');
      expect(mockEq).toHaveBeenCalledWith('id', existingItemId);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ title: validScheduleData.title }));
    });

     it('should return validation errors for invalid data', async () => {
      // TDD Anchor: Test validation (Spec Line 154)
      const invalidData = { ...updateData, start_time: 'invalid-time' };
      const result = await updateScheduleItem(prevState, invalidData); // Will fail

      expect(result.success).toBe(false);
      expect(result.errors?.start_time).toBeDefined();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

     it('should return error state on Supabase update failure', async () => {
      // TDD Anchor: Test error handling (Spec Line 154)
      const dbError = { message: 'Update failed' };
      mockUpdate.mockResolvedValueOnce({ error: dbError });
      const result = await updateScheduleItem(prevState, updateData); // Will fail

      expect(result.success).toBe(false);
      expect(result.message).toContain('Update failed');
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

     it('should call revalidatePath and redirect on successful update', async () => {
      // TDD Anchor: Test revalidation/redirects (Spec Line 154)
      mockUpdate.mockResolvedValueOnce({ error: null });
      await updateScheduleItem(prevState, updateData); // Will fail

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
      mockDelete.mockResolvedValueOnce({ error: null });
      await deleteScheduleItem(existingItemId); // Will fail

      expect(createClient).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('schedule_items');
      expect(mockMatch).toHaveBeenCalledWith({ id: existingItemId });
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return error state on Supabase delete failure', async () => {
        // TDD Anchor: Test error handling (Spec Line 154)
        const dbError = { message: 'Delete failed' };
        mockDelete.mockResolvedValueOnce({ error: dbError });
        const result = await deleteScheduleItem(existingItemId); // Will fail

        // Assuming delete action returns an object like { success: boolean, message?: string }
        expect(result?.success).toBe(false);
        expect(result?.message).toContain('Delete failed');
        expect(revalidatePath).not.toHaveBeenCalled();
    });

     it('should call revalidatePath on successful delete', async () => {
        // TDD Anchor: Test revalidation/redirects (Spec Line 154)
        mockDelete.mockResolvedValueOnce({ error: null });
        await deleteScheduleItem(existingItemId); // Will fail

        expect(revalidatePath).toHaveBeenCalledWith('/admin/schedule');
        expect(revalidatePath).toHaveBeenCalledWith('/schedule'); // Assuming public schedule page
    });

     it('should handle missing id gracefully', async () => {
        // TDD Anchor: Test error handling (Spec Line 154) - Edge case
        const result = await deleteScheduleItem(''); // Will fail (or pass if action handles it)

        expect(mockDelete).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        // Check for specific error message or return value if the action implements it
        // expect(result?.success).toBe(false);
        // expect(result?.message).toContain('Invalid ID');
    });
  });
});