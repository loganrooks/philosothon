import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createFaqItem, updateFaqItem, deleteFaqItem, type FaqFormState } from './actions'; // Added deleteFaqItem

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/cache');

describe('FAQ Server Actions (actions.ts)', () => {
  let mockSupabase: any;
  let mockInsert: ReturnType<typeof vi.fn>;
  const initialState: FaqFormState = { message: null, success: false, errors: {} };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client and methods
    mockInsert = vi.fn();
    const mockFrom = vi.fn(() => ({ insert: mockInsert }));
    mockSupabase = { from: mockFrom };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe('createFaqItem', () => {
    it('should return validation error if question is missing', async () => {
      const formData = new FormData();
      formData.append('answer', 'Test Answer');

      const result = await createFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.question).toContain('Expected string, received null'); // Zod message
      expect(mockInsert).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return validation error if answer is missing', async () => {
      const formData = new FormData();
      formData.append('question', 'Test Question');

      const result = await createFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.answer).toContain('Expected string, received null'); // Zod message
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid display_order (non-numeric)', async () => {
      const formData = new FormData();
      formData.append('question', 'Test Q');
      formData.append('answer', 'Test A');
      formData.append('display_order', 'abc');

      const result = await createFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.display_order).toContain('Display Order must be a whole number.');
      expect(mockInsert).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid display_order (negative)', async () => {
      const formData = new FormData();
      formData.append('question', 'Test Q');
      formData.append('answer', 'Test A');
      formData.append('display_order', '-1');

      const result = await createFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.display_order).toContain('Display Order must be 0 or positive.');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should call Supabase insert and revalidatePath on successful creation', async () => {
      mockInsert.mockResolvedValue({ error: null }); // Simulate success
      const formData = new FormData();
      const question = 'New Question?';
      const answer = 'New Answer.';
      const category = 'General';
      const order = '10';
      formData.append('question', question);
      formData.append('answer', answer);
      formData.append('category', category);
      formData.append('display_order', order);

      const result = await createFaqItem(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith({
        question: question,
        answer: answer,
        category: category,
        display_order: 10,
      });
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
      expect(result.success).toBe(true);
      expect(result.message).toContain('FAQ item created successfully!');
      expect(result.errors).toEqual({});
    });

     it('should handle empty/null optional fields correctly', async () => {
      mockInsert.mockResolvedValue({ error: null }); // Simulate success
      const formData = new FormData();
      formData.append('question', 'Another Q?');
      formData.append('answer', 'Another A.');
      // category and display_order omitted

      const result = await createFaqItem(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith({
        question: 'Another Q?',
        answer: 'Another A.',
        category: null,
        display_order: null,
      });
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should return error state on Supabase insert failure', async () => {
      const dbError = { message: 'DB insert failed' };
      mockInsert.mockResolvedValue({ error: dbError }); // Simulate failure
      const formData = new FormData();
      formData.append('question', 'Fail Q');
      formData.append('answer', 'Fail A');

      const result = await createFaqItem(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dbError.message);
      expect(result.errors?.general).toBe(dbError.message);
    });
  });

  describe('updateFaqItem', () => {
    const faqItemId = 'test-faq-id-789';

    it('should return error if ID is missing', async () => {
      const formData = new FormData(); // No ID
      formData.append('question', 'Updated Q');
      formData.append('answer', 'Updated A');

      const result = await updateFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('FAQ Item ID is missing');
      expect(result.errors?.general).toContain('FAQ Item ID missing');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return validation error if question is missing', async () => {
      const formData = new FormData();
      formData.append('id', faqItemId);
      formData.append('answer', 'Updated A');
      // Missing question

      const result = await updateFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.question).toContain('Expected string, received null');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid display_order', async () => {
      const formData = new FormData();
      formData.append('id', faqItemId);
      formData.append('question', 'Updated Q');
      formData.append('answer', 'Updated A');
      formData.append('display_order', '-2'); // Invalid order

      const result = await updateFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.display_order).toContain('Display Order must be 0 or positive.');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should call Supabase update and revalidate paths on successful update', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({ update: mockUpdate, eq: mockEq });

      const formData = new FormData();
      const question = 'Updated Question?';
      const answer = 'Updated Answer.';
      const category = 'Updated Cat';
      const order = '5';
      formData.append('id', faqItemId);
      formData.append('question', question);
      formData.append('answer', answer);
      formData.append('category', category);
      formData.append('display_order', order);

      const result = await updateFaqItem(initialState, formData);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        question: question,
        answer: answer,
        category: category,
        display_order: 5,
      });
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith('id', faqItemId);
      expect(revalidatePath).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/faq/edit?id=${faqItemId}`);
      expect(result.success).toBe(true);
      expect(result.message).toContain('FAQ item updated successfully!');
      expect(result.errors).toEqual({});
    });

     it('should return error state on Supabase update failure', async () => {
      const dbError = { message: 'DB update failed' };
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: dbError });
      mockSupabase.from.mockReturnValue({ update: mockUpdate, eq: mockEq });

      const formData = new FormData();
      formData.append('id', faqItemId);
      formData.append('question', 'Fail Q');
      formData.append('answer', 'Fail A');

      const result = await updateFaqItem(initialState, formData);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dbError.message);
      expect(result.errors?.general).toBe(dbError.message);
    });
  });

  describe('deleteFaqItem', () => {
    const faqItemId = 'faq-to-delete-111';

    it('should throw error if ID is missing', async () => {
      await expect(deleteFaqItem('')).rejects.toThrow('FAQ Item ID is required.');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should call Supabase delete and revalidatePath on successful deletion', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({ delete: mockDelete, eq: mockEq });

      await deleteFaqItem(faqItemId);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith('id', faqItemId);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
    });

     it('should throw error on Supabase delete failure', async () => {
      const dbError = { message: 'DB delete failed' };
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: dbError });
      mockSupabase.from.mockReturnValue({ delete: mockDelete, eq: mockEq });

      await expect(deleteFaqItem(faqItemId)).rejects.toThrow(dbError.message);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});