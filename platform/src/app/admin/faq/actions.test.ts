import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';
import { createFaqItem, updateFaqItem, deleteFaqItem, type FaqFormState } from './actions';
import { insertFaqItem, updateFaqItemById, deleteFaqItemById, type FaqItemInput, type FaqItem } from '@/lib/data/faq'; // Import DAL functions and types

// Mock dependencies
vi.mock('next/cache');
vi.mock('@/lib/data/faq'); // Mock the DAL module

describe('FAQ Server Actions (actions.ts)', () => {
  const initialState: FaqFormState = { message: null, success: false, errors: {} };
  // Mock data matching FaqItem type (no category)
  const mockFaqItem: FaqItem = { id: 'faq-id-123', question: 'New Question?', answer: 'New Answer.', display_order: 10, created_at: '2023-01-01T00:00:00Z' };
  const mockUpdatedFaqItem: FaqItem = { ...mockFaqItem, id: 'test-faq-id-789', question: 'Updated Question?', answer: 'Updated Answer.', display_order: 5 };


  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DAL mocks
    vi.mocked(insertFaqItem).mockClear();
    vi.mocked(updateFaqItemById).mockClear();
    vi.mocked(deleteFaqItemById).mockClear();
  });

  describe('createFaqItem', () => {
    it('should return validation error if question is missing', async () => {
      const formData = new FormData();
      formData.append('answer', 'Test Answer');

      const result = await createFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.question).toContain('Expected string, received null'); // Updated expected message
      expect(insertFaqItem).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return validation error if answer is missing', async () => {
      const formData = new FormData();
      formData.append('question', 'Test Question');

      const result = await createFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.answer).toContain('Expected string, received null'); // Updated expected message
      expect(insertFaqItem).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid display_order (non-numeric)', async () => {
      const formData = new FormData();
      formData.append('question', 'Test Q');
      formData.append('answer', 'Test A');
      formData.append('display_order', 'abc');

      const result = await createFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.display_order).toContain('Display Order must be a whole number.');
      expect(insertFaqItem).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid display_order (negative)', async () => {
      const formData = new FormData();
      formData.append('question', 'Test Q');
      formData.append('answer', 'Test A');
      formData.append('display_order', '-1');

      const result = await createFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.display_order).toContain('Display Order must be 0 or positive.');
      expect(insertFaqItem).not.toHaveBeenCalled();
    });

    it('should call insertFaqItem DAL function and revalidatePath on successful creation', async () => {
      vi.mocked(insertFaqItem).mockResolvedValue({ faqItem: mockFaqItem, error: null }); // Simulate DAL success
      const formData = new FormData();
      const question = mockFaqItem.question;
      const answer = mockFaqItem.answer;
      const order = String(mockFaqItem.display_order); // Convert number to string for FormData
      formData.append('question', question);
      formData.append('answer', answer);
      // No category
      formData.append('display_order', order);

      const result = await createFaqItem(initialState, formData);

      expect(insertFaqItem).toHaveBeenCalledTimes(1);
      const expectedInput: FaqItemInput = {
        question: question,
        answer: answer,
        display_order: mockFaqItem.display_order,
      };
      expect(insertFaqItem).toHaveBeenCalledWith(expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
      expect(result.success).toBe(true);
      expect(result.message).toContain('FAQ item created successfully!');
      expect(result.errors).toEqual({});
    });

     it('should handle empty/null optional fields correctly during creation', async () => {
      vi.mocked(insertFaqItem).mockResolvedValue({ faqItem: { ...mockFaqItem, question: 'Another Q?', answer: 'Another A.' }, error: null }); // Simulate DAL success
      const formData = new FormData();
      formData.append('question', 'Another Q?');
      formData.append('answer', 'Another A.');
      // display_order omitted

      const result = await createFaqItem(initialState, formData);

      expect(insertFaqItem).toHaveBeenCalledTimes(1);
      const expectedInput: FaqItemInput = {
        question: 'Another Q?',
        answer: 'Another A.',
        display_order: null,
      };
      expect(insertFaqItem).toHaveBeenCalledWith(expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should return error state on insertFaqItem DAL failure', async () => {
      const dalError = new Error('DAL insert failed');
      vi.mocked(insertFaqItem).mockResolvedValue({ faqItem: null, error: dalError }); // Simulate DAL failure
      const formData = new FormData();
      formData.append('question', 'Fail Q');
      formData.append('answer', 'Fail A');

      const result = await createFaqItem(initialState, formData);

      expect(insertFaqItem).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dalError.message);
      expect(result.errors?.general).toBe(dalError.message);
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
      expect(result.message).toContain('FAQ Item ID is missing.'); // Match exact message
      expect(result.errors?.general).toContain('FAQ Item ID missing.'); // Match exact message
      expect(updateFaqItemById).not.toHaveBeenCalled();
    });

    it('should return validation error if question is missing', async () => {
      const formData = new FormData();
      formData.append('id', faqItemId);
      formData.append('answer', 'Updated A');
      // Missing question

      const result = await updateFaqItem(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.question).toContain('Expected string, received null'); // Updated expected message
      expect(updateFaqItemById).not.toHaveBeenCalled();
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
      expect(updateFaqItemById).not.toHaveBeenCalled();
    });

    it('should call updateFaqItemById DAL function and revalidate paths on successful update', async () => {
      vi.mocked(updateFaqItemById).mockResolvedValue({ faqItem: mockUpdatedFaqItem, error: null }); // Simulate DAL success

      const formData = new FormData();
      const question = mockUpdatedFaqItem.question;
      const answer = mockUpdatedFaqItem.answer;
      const order = String(mockUpdatedFaqItem.display_order);
      formData.append('id', mockUpdatedFaqItem.id);
      formData.append('question', question);
      formData.append('answer', answer);
      // No category
      formData.append('display_order', order);

      const result = await updateFaqItem(initialState, formData);

      expect(updateFaqItemById).toHaveBeenCalledTimes(1);
      const expectedInput: Partial<FaqItemInput> = {
        question: question,
        answer: answer,
        display_order: mockUpdatedFaqItem.display_order,
      };
      expect(updateFaqItemById).toHaveBeenCalledWith(mockUpdatedFaqItem.id, expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/faq/edit?id=${faqItemId}`);
      expect(result.success).toBe(true);
      expect(result.message).toContain('FAQ item updated successfully!');
      expect(result.errors).toEqual({});
    });

     it('should return error state on updateFaqItemById DAL failure', async () => {
      const dalError = new Error('DAL update failed');
      vi.mocked(updateFaqItemById).mockResolvedValue({ faqItem: null, error: dalError }); // Simulate DAL failure

      const formData = new FormData();
      formData.append('id', faqItemId);
      formData.append('question', 'Fail Q');
      formData.append('answer', 'Fail A');

      const result = await updateFaqItem(initialState, formData);

      expect(updateFaqItemById).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dalError.message);
      expect(result.errors?.general).toBe(dalError.message);
    });
  });

  describe('deleteFaqItem', () => {
    const faqItemId = 'faq-to-delete-111';

    it('should throw error if ID is missing', async () => {
      await expect(deleteFaqItem('')).rejects.toThrow('FAQ Item ID is required.');
      expect(deleteFaqItemById).not.toHaveBeenCalled();
    });

    it('should call deleteFaqItemById DAL function and revalidatePath on successful deletion', async () => {
      vi.mocked(deleteFaqItemById).mockResolvedValue({ error: null }); // Simulate DAL success

      await deleteFaqItem(faqItemId);

      expect(deleteFaqItemById).toHaveBeenCalledTimes(1);
      expect(deleteFaqItemById).toHaveBeenCalledWith(faqItemId);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/faq');
    });

     it('should throw error on deleteFaqItemById DAL failure', async () => {
      const dalError = new Error('DAL delete failed');
      vi.mocked(deleteFaqItemById).mockResolvedValue({ error: dalError }); // Simulate DAL failure

      await expect(deleteFaqItem(faqItemId)).rejects.toThrow(dalError.message);

      expect(deleteFaqItemById).toHaveBeenCalledTimes(1);
      expect(deleteFaqItemById).toHaveBeenCalledWith(faqItemId);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});