import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createTheme, updateTheme, deleteTheme, type ThemeFormState } from './actions'; // Added deleteTheme

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/cache');

describe('Theme Server Actions (actions.ts)', () => {
  let mockSupabase: any;
  let mockInsert: ReturnType<typeof vi.fn>;
  const initialState: ThemeFormState = { message: null, success: false, errors: {} };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client and methods
    mockInsert = vi.fn();
    const mockFrom = vi.fn(() => ({ insert: mockInsert }));
    mockSupabase = { from: mockFrom };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe('createTheme', () => {
    it('should return validation error if title is missing', async () => {
      const formData = new FormData();
      formData.append('description', 'Test Desc');

      const result = await createTheme(initialState, formData);

      expect(result.success).toBe(false);
      // Zod returns 'Expected string, received null' when required string gets null
      expect(result.errors?.title).toContain('Expected string, received null');
      expect(mockInsert).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid analytic_tradition JSON', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('analytic_tradition', 'not json'); // Invalid JSON

      const result = await createTheme(initialState, formData);

      expect(result.success).toBe(false);
      // Zod refine catches this first
      expect(result.errors?.analytic_tradition).toContain('Invalid JSON format for Analytic Tradition.');
      expect(mockInsert).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid continental_tradition JSON', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('continental_tradition', '{"key": "value"}'); // Valid JSON, but not an array

      const result = await createTheme(initialState, formData);

      expect(result.success).toBe(false);
       // This specific case (valid JSON but not array) is caught after Zod validation by parseJsonArray check
      expect(result.errors?.continental_tradition).toEqual(['Invalid JSON format. Must be like ["item1", "item2"].']);
      expect(mockInsert).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should call Supabase insert and revalidatePath on successful creation', async () => {
      mockInsert.mockResolvedValue({ error: null }); // Simulate success
      const formData = new FormData();
      const title = 'New Theme Title';
      const description = 'New Description';
      const analytic = '["Analytic 1", "Analytic 2"]';
      const continental = '["Cont 1"]';
      formData.append('title', title);
      formData.append('description', description);
      formData.append('analytic_tradition', analytic);
      formData.append('continental_tradition', continental);

      const result = await createTheme(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith({
        title: title,
        description: description,
        analytic_tradition: ["Analytic 1", "Analytic 2"],
        continental_tradition: ["Cont 1"],
      });
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Theme created successfully!');
      expect(result.errors).toEqual({}); // No errors on success
    });

     it('should handle empty/null tradition fields correctly', async () => {
      mockInsert.mockResolvedValue({ error: null }); // Simulate success
      const formData = new FormData();
      const title = 'Another Theme';
      formData.append('title', title);
      formData.append('description', ''); // Empty description
      formData.append('analytic_tradition', ''); // Empty analytic
      // Missing continental

      const result = await createTheme(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith({
        title: title,
        description: '', // Should pass empty string
        analytic_tradition: null, // Should be parsed as null
        continental_tradition: null, // Should be parsed as null
      });
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Theme created successfully!');
    });

    it('should return error state on Supabase insert failure', async () => {
      const dbError = { message: 'DB insert failed' };
      mockInsert.mockResolvedValue({ error: dbError }); // Simulate failure
      const formData = new FormData();
      formData.append('title', 'Fail Theme');

      const result = await createTheme(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dbError.message);
      expect(result.errors?.general).toBe(dbError.message);
    });
  });

  describe('updateTheme', () => {
    const themeId = 'test-theme-id-123';

    it('should return error if ID is missing', async () => {
      const formData = new FormData(); // No ID included
      formData.append('title', 'Updated Title');

      const result = await updateTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Theme ID is missing');
      expect(result.errors?.general).toContain('Theme ID missing');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return validation error if title is missing', async () => {
      const formData = new FormData();
      formData.append('id', themeId);
      // formData.append('title', ''); // Missing title

      const result = await updateTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.title).toContain('Expected string, received null');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid analytic_tradition JSON', async () => {
      const formData = new FormData();
      formData.append('id', themeId);
      formData.append('title', 'Updated Title');
      formData.append('analytic_tradition', 'invalid-json');

      const result = await updateTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.analytic_tradition).toContain('Invalid JSON format for Analytic Tradition.');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should call Supabase update and revalidate paths on successful update', async () => {
      const mockUpdate = vi.fn().mockReturnThis(); // Mock update()
      const mockEq = vi.fn().mockResolvedValue({ error: null }); // Mock eq() success
      mockSupabase.from.mockReturnValue({ update: mockUpdate, eq: mockEq }); // Chain mocks

      const formData = new FormData();
      const title = 'Updated Title';
      const description = 'Updated Desc';
      const analytic = '["Updated Analytic"]';
      formData.append('id', themeId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('analytic_tradition', analytic);
      // continental_tradition is omitted

      const result = await updateTheme(initialState, formData);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        title: title,
        description: description,
        analytic_tradition: ["Updated Analytic"],
        continental_tradition: null, // Expect null as it was omitted
      });
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith('id', themeId);
      expect(revalidatePath).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/themes/edit?id=${themeId}`);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Theme updated successfully!');
      expect(result.errors).toEqual({});
    });

     it('should return error state on Supabase update failure', async () => {
      const dbError = { message: 'DB update failed' };
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: dbError }); // Simulate eq() failure
      mockSupabase.from.mockReturnValue({ update: mockUpdate, eq: mockEq });

      const formData = new FormData();
      formData.append('id', themeId);
      formData.append('title', 'Fail Update');

      const result = await updateTheme(initialState, formData);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dbError.message);
      expect(result.errors?.general).toBe(dbError.message);
    });
  });

  describe('deleteTheme', () => {
    const themeId = 'theme-to-delete-456';

    it('should throw error if ID is missing', async () => {
      // Expect deleteTheme('') to throw
      await expect(deleteTheme('')).rejects.toThrow('Theme ID is required.');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should call Supabase delete and revalidatePath on successful deletion', async () => {
      const mockDelete = vi.fn().mockReturnThis(); // Mock delete()
      const mockEq = vi.fn().mockResolvedValue({ error: null }); // Mock eq() success
      mockSupabase.from.mockReturnValue({ delete: mockDelete, eq: mockEq }); // Chain mocks

      await deleteTheme(themeId);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith('id', themeId);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
    });

     it('should throw error on Supabase delete failure', async () => {
      const dbError = { message: 'DB delete failed' };
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: dbError }); // Simulate eq() failure
      mockSupabase.from.mockReturnValue({ delete: mockDelete, eq: mockEq });

      // Expect deleteTheme(themeId) to throw
      await expect(deleteTheme(themeId)).rejects.toThrow(dbError.message);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});