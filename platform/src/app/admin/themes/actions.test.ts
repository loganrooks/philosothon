import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';
import { createTheme, updateTheme, deleteTheme, type ThemeFormState } from './actions';
import { insertTheme, updateThemeById, deleteThemeById, type ThemeInput, type Theme } from '@/lib/data/themes'; // Import DAL functions and types

// Mock dependencies
vi.mock('next/cache');
vi.mock('@/lib/data/themes'); // Mock the DAL module

describe('Theme Server Actions (actions.ts)', () => {
  const initialState: ThemeFormState = { message: null, success: false, errors: {} };
  const mockInsertedTheme: Theme = { id: 'new-theme-id', title: 'New Theme Title', description: 'New Description', description_expanded: null, image_url: null, created_at: '2023-01-01T00:00:00Z', analytic_tradition: ["Analytic 1", "Analytic 2"], continental_tradition: ["Cont 1"], relevant_themes: null };
  const mockUpdatedTheme: Theme = { ...mockInsertedTheme, id: 'test-theme-id-123', title: 'Updated Title', description: 'Updated Desc', analytic_tradition: ["Updated Analytic"], continental_tradition: null };


  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DAL mocks
    vi.mocked(insertTheme).mockClear();
    vi.mocked(updateThemeById).mockClear();
    vi.mocked(deleteThemeById).mockClear();
  });

  describe('createTheme', () => {
    it('should return validation error if title is missing', async () => {
      const formData = new FormData();
      formData.append('description', 'Test Desc');

      const result = await createTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.title).toContain('Expected string, received null'); // Updated expected message
      expect(insertTheme).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid analytic_tradition JSON', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('analytic_tradition', 'not json'); // Invalid JSON

      const result = await createTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.analytic_tradition).toContain('Invalid JSON format for Analytic Tradition.');
      expect(insertTheme).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid continental_tradition JSON', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('continental_tradition', '{"key": "value"}'); // Valid JSON, but not an array

      const result = await createTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.continental_tradition).toEqual(['Invalid JSON format. Must be like ["item1", "item2"].']);
      expect(insertTheme).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should call insertTheme DAL function and revalidatePath on successful creation', async () => {
      vi.mocked(insertTheme).mockResolvedValue({ theme: mockInsertedTheme, error: null }); // Simulate DAL success
      const formData = new FormData();
      const title = mockInsertedTheme.title;
      const description = mockInsertedTheme.description;
      const analytic = JSON.stringify(mockInsertedTheme.analytic_tradition);
      const continental = JSON.stringify(mockInsertedTheme.continental_tradition);
      formData.append('title', title);
      formData.append('description', description ?? ''); // Use ?? '' for null description
      formData.append('analytic_tradition', analytic);
      formData.append('continental_tradition', continental);

      formData.append('description_expanded', ''); // Add expanded desc

      const result = await createTheme(initialState, formData);

      expect(insertTheme).toHaveBeenCalledTimes(1);
      // Check the data passed to the DAL function
      const expectedInput: ThemeInput = {
        title: title,
        description: description,
        description_expanded: '', // Added
        analytic_tradition: mockInsertedTheme.analytic_tradition,
        continental_tradition: mockInsertedTheme.continental_tradition,
      };
      expect(insertTheme).toHaveBeenCalledWith(expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Theme created successfully!');
      expect(result.errors).toEqual({}); // No errors on success
    });

     it('should handle empty/null fields correctly during creation', async () => {
      // Mock DAL success (theme object doesn't matter much here, just the call args)
      vi.mocked(insertTheme).mockResolvedValue({ theme: { ...mockInsertedTheme, title: 'Another Theme' }, error: null });
      const formData = new FormData();
      const title = 'Another Theme';
      formData.append('title', title);
      formData.append('description', ''); // Empty description
      formData.append('analytic_tradition', ''); // Empty analytic
      // Missing continental

      formData.append('description_expanded', ''); // Add expanded desc

      const result = await createTheme(initialState, formData);

      expect(insertTheme).toHaveBeenCalledTimes(1);
      const expectedInput: ThemeInput = {
        title: title,
        description: '',
        description_expanded: '', // Added
        analytic_tradition: null,
        continental_tradition: null,
      };
      expect(insertTheme).toHaveBeenCalledWith(expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Theme created successfully!');
    });

    it('should return error state on insertTheme DAL failure', async () => {
      const dalError = new Error('DAL insert failed');
      vi.mocked(insertTheme).mockResolvedValue({ theme: null, error: dalError }); // Simulate DAL failure
      const formData = new FormData();
      formData.append('title', 'Fail Theme');
      formData.append('description_expanded', ''); // Add expanded desc

      const result = await createTheme(initialState, formData);

      expect(insertTheme).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dalError.message);
      expect(result.errors?.general).toBe(dalError.message);
    });
  });

  describe('updateTheme', () => {
    const themeId = 'test-theme-id-123';

    it('should return error if ID is missing', async () => {
      const formData = new FormData(); // No ID included
      formData.append('title', 'Updated Title');

      const result = await updateTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Theme ID is missing.'); // Match exact message
      expect(result.errors?.general).toContain('Theme ID missing.'); // Match exact message
      expect(updateThemeById).not.toHaveBeenCalled();
    });

    it('should return validation error if title is missing', async () => {
      const formData = new FormData();
      formData.append('id', themeId);
      // formData.append('title', ''); // Missing title

      const result = await updateTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.title).toContain('Expected string, received null'); // Updated expected message
      expect(updateThemeById).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid analytic_tradition JSON', async () => {
      const formData = new FormData();
      formData.append('id', themeId);
      formData.append('title', 'Updated Title');
      formData.append('analytic_tradition', 'invalid-json');

      const result = await updateTheme(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.analytic_tradition).toContain('Invalid JSON format for Analytic Tradition.');
      expect(updateThemeById).not.toHaveBeenCalled();
    });

    it('should call updateThemeById DAL function and revalidate paths on successful update', async () => {
      vi.mocked(updateThemeById).mockResolvedValue({ theme: mockUpdatedTheme, error: null }); // Simulate DAL success

      const formData = new FormData();
      const title = mockUpdatedTheme.title;
      const description = mockUpdatedTheme.description;
      const analytic = JSON.stringify(mockUpdatedTheme.analytic_tradition);
      formData.append('id', mockUpdatedTheme.id);
      formData.append('title', title);
      formData.append('description', description ?? ''); // Use ?? '' for null description
      formData.append('analytic_tradition', analytic);
      formData.append('description_expanded', ''); // Add expanded desc
      // continental_tradition is omitted

      const result = await updateTheme(initialState, formData);

      expect(updateThemeById).toHaveBeenCalledTimes(1);
      // Check args passed to DAL function
      const expectedInput: Partial<ThemeInput> = {
        title: title,
        description: description,
        description_expanded: '', // Added
        analytic_tradition: mockUpdatedTheme.analytic_tradition,
        continental_tradition: null, // Parsed as null because omitted
      };
      expect(updateThemeById).toHaveBeenCalledWith(mockUpdatedTheme.id, expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/themes/edit?id=${mockUpdatedTheme.id}`);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Theme updated successfully!');
      expect(result.errors).toEqual({});
    });

     it('should return error state on updateThemeById DAL failure', async () => {
      const dalError = new Error('DAL update failed');
      vi.mocked(updateThemeById).mockResolvedValue({ theme: null, error: dalError }); // Simulate DAL failure

      const formData = new FormData();
      formData.append('id', themeId);
      formData.append('title', 'Fail Update');
      formData.append('description_expanded', ''); // Add expanded desc

      const result = await updateTheme(initialState, formData);

      expect(updateThemeById).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dalError.message);
      expect(result.errors?.general).toBe(dalError.message);
    });
  });

  describe('deleteTheme', () => {
    const themeId = 'theme-to-delete-456';

    it('should throw error if ID is missing', async () => {
      await expect(deleteTheme('')).rejects.toThrow('Theme ID is required.');
      expect(deleteThemeById).not.toHaveBeenCalled();
    });

    it('should call deleteThemeById DAL function and revalidatePath on successful deletion', async () => {
      vi.mocked(deleteThemeById).mockResolvedValue({ error: null }); // Simulate DAL success

      await deleteTheme(themeId);

      expect(deleteThemeById).toHaveBeenCalledTimes(1);
      expect(deleteThemeById).toHaveBeenCalledWith(themeId);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
    });

     it('should throw error on deleteThemeById DAL failure', async () => {
      const dalError = new Error('DAL delete failed');
      vi.mocked(deleteThemeById).mockResolvedValue({ error: dalError }); // Simulate DAL failure

      await expect(deleteTheme(themeId)).rejects.toThrow(dalError.message);

      expect(deleteThemeById).toHaveBeenCalledTimes(1);
      expect(deleteThemeById).toHaveBeenCalledWith(themeId);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});