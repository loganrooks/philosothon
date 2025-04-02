// platform/src/app/admin/faq/actions.test.ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
// Import all actions
import { addFaqItem, updateFaqItem, deleteFaqItem } from './actions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Mock necessary modules
vi.mock('@/lib/supabase/server');
vi.mock('next/cache');
vi.mock('next/navigation');

// Define mock implementations
const mockInsert = vi.fn();
const mockEqUpdate = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate, match: vi.fn() });
const mockMatch = vi.fn();
const mockEqDelete = vi.fn();
const mockDelete = vi.fn().mockReturnValue({ eq: mockEqDelete, match: mockMatch });
const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

// Define initial state for form actions (needed for add/update)
const initialState = { success: true, message: undefined };

describe('Admin FAQ Server Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (revalidatePath as Mock).mockClear();

    // Default successful mock behavior
    mockInsert.mockResolvedValue({ error: null });
    mockEqUpdate.mockResolvedValue({ error: null });
    mockEqDelete.mockResolvedValue({ error: null });
    mockMatch.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEqUpdate, match: mockMatch });
    mockDelete.mockReturnValue({ eq: mockEqDelete, match: mockMatch });
    mockFrom.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
    (createClient as Mock).mockReturnValue(mockSupabase);
  });

  describe('addFaqItem', () => {
    // ... existing passing tests ...
    it('should call Supabase insert with correct data', async () => {
        const formData = new FormData();
        formData.append('question', 'Test Question?');
        formData.append('answer', 'Test Answer.');
        formData.append('category', 'General');
        formData.append('display_order', '10');
        const expectedData = { question: 'Test Question?', answer: 'Test Answer.', category: 'General', display_order: 10 };
        await addFaqItem(initialState, formData);
        expect(createClient).toHaveBeenCalledTimes(1);
        expect(mockSupabase.from).toHaveBeenCalledWith('faq_items');
        expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining(expectedData)]);
      });

      it('should handle optional display_order', async () => {
          const formData = new FormData();
          formData.append('question', 'Test Question Optional?');
          formData.append('answer', 'Test Answer Optional.');
          formData.append('category', 'Specific');
          const expectedData = { question: 'Test Question Optional?', answer: 'Test Answer Optional.', category: 'Specific', display_order: null };
          await addFaqItem(initialState, formData);
          expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining(expectedData)]);
        });

      it('should call revalidatePath and redirect on success', async () => {
        const formData = new FormData();
        formData.append('question', 'Test Q Revalidate');
        formData.append('answer', 'Test A Revalidate');
        formData.append('category', 'General');
        await addFaqItem(initialState, formData);
        expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
        expect(revalidatePath).toHaveBeenCalledWith('/faq');
        expect(redirect).toHaveBeenCalledWith('/admin/faq');
      });

      it('should return error if question is missing', async () => {
          const formData = new FormData();
          formData.append('answer', 'Answer without question.');
          formData.append('category', 'General');
          const result = await addFaqItem(initialState, formData);
          expect(mockInsert).not.toHaveBeenCalled();
          expect(revalidatePath).not.toHaveBeenCalled();
          expect(redirect).not.toHaveBeenCalled();
          expect(result).toEqual({ success: false, message: 'Question and Answer are required.' });
        });

        it('should return error if answer is missing', async () => {
          const formData = new FormData();
          formData.append('question', 'Question without answer?');
          formData.append('category', 'General');
          const result = await addFaqItem(initialState, formData);
          expect(mockInsert).not.toHaveBeenCalled();
          expect(revalidatePath).not.toHaveBeenCalled();
          expect(redirect).not.toHaveBeenCalled();
          expect(result).toEqual({ success: false, message: 'Question and Answer are required.' });
        });

      it('should return error on Supabase insert failure', async () => {
        const formData = new FormData();
        formData.append('question', 'Test Q Error');
        formData.append('answer', 'Test A Error');
        formData.append('category', 'Error');
        const errorMessage = 'Insert failed';
        mockInsert.mockResolvedValueOnce({ error: { message: errorMessage } });
        const result = await addFaqItem(initialState, formData);
        expect(mockInsert).toHaveBeenCalledTimes(1);
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(redirect).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, message: `Database error: ${errorMessage}` });
      });
  });

  describe('updateFaqItem', () => {
    const faqId = 'test-faq-id-123';

    beforeEach(() => {
        vi.resetAllMocks();
        (revalidatePath as Mock).mockClear();
        mockInsert.mockResolvedValue({ error: null });
        mockEqUpdate.mockResolvedValue({ error: null });
        mockEqDelete.mockResolvedValue({ error: null });
        mockMatch.mockResolvedValue({ error: null });
        mockUpdate.mockReturnValue({ eq: mockEqUpdate, match: mockMatch });
        mockDelete.mockReturnValue({ eq: mockEqDelete, match: mockMatch });
        mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate, delete: mockDelete });
        (createClient as Mock).mockReturnValue(mockSupabase);
      });

    it('should call Supabase update with correct data and ID', async () => {
      const formData = new FormData();
      formData.append('question', 'Updated Question?');
      formData.append('answer', 'Updated Answer.');
      formData.append('category', 'Updated Category');
      formData.append('display_order', '5');
      const expectedData = { question: 'Updated Question?', answer: 'Updated Answer.', category: 'Updated Category', display_order: 5 };
      await updateFaqItem(faqId, initialState, formData);
      expect(mockSupabase.from).toHaveBeenCalledWith('faq_items');
      expect(mockUpdate).toHaveBeenCalledWith(expectedData);
      expect(mockMatch).toHaveBeenCalledWith({ id: faqId });
    });

    it('should call revalidatePath and redirect on successful update', async () => {
        const formData = new FormData();
        formData.append('question', 'Update Success Q');
        formData.append('answer', 'Update Success A');
        formData.append('category', 'Success');
        await updateFaqItem(faqId, initialState, formData);
        expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/faq/${faqId}/edit`);
        expect(revalidatePath).toHaveBeenCalledWith('/faq');
        expect(redirect).toHaveBeenCalledWith('/admin/faq');
    });

    it('should return error if question is missing', async () => {
        const formData = new FormData();
        formData.append('answer', 'Missing question');
        formData.append('category', 'Validation');
        const result = await updateFaqItem(faqId, initialState, formData);
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(redirect).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, message: 'Question and Answer are required.' });
    });

    it('should handle Supabase update error', async () => {
        const formData = new FormData();
        formData.append('question', 'Update Error Q');
        formData.append('answer', 'Update Error A');
        formData.append('category', 'Error');
        const errorMessage = 'Update failed';
        mockMatch.mockResolvedValueOnce({ error: { message: errorMessage } });
        const result = await updateFaqItem(faqId, initialState, formData);
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockMatch).toHaveBeenCalledWith({ id: faqId });
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(redirect).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, message: `Database error: ${errorMessage}` });
    });

  });

  describe('deleteFaqItem', () => {
    const faqId = 'test-faq-id-delete-789';

    // Re-apply beforeEach for this describe block
    beforeEach(() => {
        vi.resetAllMocks();
        (revalidatePath as Mock).mockClear();
        mockInsert.mockResolvedValue({ error: null });
        mockEqUpdate.mockResolvedValue({ error: null });
        mockEqDelete.mockResolvedValue({ error: null });
        mockMatch.mockResolvedValue({ error: null });
        mockUpdate.mockReturnValue({ eq: mockEqUpdate, match: mockMatch });
        mockDelete.mockReturnValue({ eq: mockEqDelete, match: mockMatch });
        mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate, delete: mockDelete });
        (createClient as Mock).mockReturnValue(mockSupabase);
      });

    it('should call Supabase delete with correct ID', async () => {
      // Arrange - beforeEach handles success mock

      // Act
      await deleteFaqItem(faqId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('faq_items');
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockMatch).toHaveBeenCalledWith({ id: faqId });
    });

    it('should call revalidatePath on successful delete', async () => {
      // Arrange - beforeEach handles success mock

      // Act
      await deleteFaqItem(faqId);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
      expect(revalidatePath).toHaveBeenCalledWith('/faq'); // Check public page revalidation
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should not call delete or revalidate if ID is missing', async () => {
      // Arrange
      const mockDeleteFn = mockDelete;

      // Act
      // @ts-expect-error - Testing invalid input
      await deleteFaqItem(undefined);

      // Assert
      expect(mockDeleteFn).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should handle Supabase delete error', async () => {
      // Arrange
      const errorMessage = 'Delete failed';
      mockMatch.mockResolvedValueOnce({ error: { message: errorMessage } });

      // Act
      await deleteFaqItem(faqId); // Action returns void on error

      // Assert
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockMatch).toHaveBeenCalledWith({ id: faqId });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});