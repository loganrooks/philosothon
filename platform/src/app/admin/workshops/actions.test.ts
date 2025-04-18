import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createWorkshop, updateWorkshop, deleteWorkshop, type WorkshopFormState } from './actions'; // Added deleteWorkshop

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/cache');

describe('Workshop Server Actions (actions.ts)', () => {
  let mockSupabase: any;
  let mockInsert: ReturnType<typeof vi.fn>;
  const initialState: WorkshopFormState = { message: null, success: false, errors: {} };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client and methods
    mockInsert = vi.fn();
    const mockFrom = vi.fn(() => ({ insert: mockInsert }));
    mockSupabase = { from: mockFrom };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe('createWorkshop', () => {
    it('should return validation error if title is missing', async () => {
      const formData = new FormData();
      // Missing title

      const result = await createWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.title).toContain('Expected string, received null'); // Zod message
      expect(mockInsert).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid relevant_themes JSON', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Workshop');
      formData.append('relevant_themes', 'not json'); // Invalid JSON

      const result = await createWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.relevant_themes).toEqual(['Invalid JSON format for Relevant Themes (must be an array of strings like ["id1", "id2"]).']); // Expect Zod message in array
      expect(mockInsert).not.toHaveBeenCalled();
    });

     it('should return validation error for non-array relevant_themes JSON', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Workshop');
      formData.append('relevant_themes', '{"valid": "json", "but": "not array"}');

      const result = await createWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      // Zod refine catches this case (valid JSON but not array of strings)
      expect(result.errors?.relevant_themes).toEqual(['Invalid JSON format for Relevant Themes (must be an array of strings like ["id1", "id2"]).']); // Expect Zod message in array
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid max_capacity (non-numeric)', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Workshop');
      formData.append('max_capacity', 'abc');

      const result = await createWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.max_capacity).toContain('Capacity must be a whole number.');
      expect(mockInsert).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid max_capacity (zero)', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Workshop');
      formData.append('max_capacity', '0');

      const result = await createWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.max_capacity).toContain('Capacity must be positive if provided.');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should call Supabase insert and revalidatePath on successful creation', async () => {
      mockInsert.mockResolvedValue({ error: null }); // Simulate success
      const formData = new FormData();
      const title = 'New Workshop';
      const description = 'Desc';
      const themes = '["theme1", "theme2"]';
      const facilitator = 'Facilitator Name';
      const capacity = '25';
      formData.append('title', title);
      formData.append('description', description);
      formData.append('relevant_themes', themes);
      formData.append('facilitator', facilitator);
      formData.append('max_capacity', capacity);

      const result = await createWorkshop(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith({
        title: title,
        description: description,
        relevant_themes: ["theme1", "theme2"],
        facilitator: facilitator,
        max_capacity: 25,
      });
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Workshop created successfully!');
      expect(result.errors).toEqual({});
    });

     it('should handle empty/null optional fields correctly', async () => {
      mockInsert.mockResolvedValue({ error: null }); // Simulate success
      const formData = new FormData();
      formData.append('title', 'Minimal Workshop');
      // description, relevant_themes, facilitator, max_capacity are omitted

      const result = await createWorkshop(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith({
        title: 'Minimal Workshop',
        description: null,
        relevant_themes: null,
        facilitator: null,
        max_capacity: null,
      });
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should return error state on Supabase insert failure', async () => {
      const dbError = { message: 'DB insert failed' };
      mockInsert.mockResolvedValue({ error: dbError }); // Simulate failure
      const formData = new FormData();
      formData.append('title', 'Fail Workshop');

      const result = await createWorkshop(initialState, formData);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dbError.message);
      expect(result.errors?.general).toBe(dbError.message);
    });
  });

  describe('updateWorkshop', () => {
    const workshopId = 'test-workshop-id-456';

    it('should return error if ID is missing', async () => {
      const formData = new FormData(); // No ID
      formData.append('title', 'Updated Title');

      const result = await updateWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Workshop ID is missing');
      expect(result.errors?.general).toContain('Workshop ID missing');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return validation error if title is missing', async () => {
      const formData = new FormData();
      formData.append('id', workshopId);
      // Missing title

      const result = await updateWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.title).toContain('Expected string, received null');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid relevant_themes JSON', async () => {
      const formData = new FormData();
      formData.append('id', workshopId);
      formData.append('title', 'Updated Title');
      formData.append('relevant_themes', 'invalid');

      const result = await updateWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.relevant_themes).toEqual(['Invalid JSON format for Relevant Themes (must be an array of strings like ["id1", "id2"]).']);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid max_capacity', async () => {
      const formData = new FormData();
      formData.append('id', workshopId);
      formData.append('title', 'Updated Title');
      formData.append('max_capacity', '-5'); // Invalid capacity

      const result = await updateWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.max_capacity).toContain('Capacity must be positive if provided.');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });


    it('should call Supabase update and revalidate paths on successful update', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({ update: mockUpdate, eq: mockEq });

      const formData = new FormData();
      const title = 'Updated Workshop';
      const themes = '["theme3"]';
      const capacity = '30';
      formData.append('id', workshopId);
      formData.append('title', title);
      formData.append('relevant_themes', themes);
      formData.append('max_capacity', capacity);
      // description and facilitator omitted

      const result = await updateWorkshop(initialState, formData);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        title: title,
        description: null, // Omitted fields should be null
        relevant_themes: ["theme3"],
        facilitator: null,
        max_capacity: 30,
      });
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith('id', workshopId);
      expect(revalidatePath).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/workshops/edit?id=${workshopId}`);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Workshop updated successfully!');
      expect(result.errors).toEqual({});
    });

     it('should return error state on Supabase update failure', async () => {
      const dbError = { message: 'DB update failed' };
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: dbError });
      mockSupabase.from.mockReturnValue({ update: mockUpdate, eq: mockEq });

      const formData = new FormData();
      formData.append('id', workshopId);
      formData.append('title', 'Fail Update');

      const result = await updateWorkshop(initialState, formData);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dbError.message);
      expect(result.errors?.general).toBe(dbError.message);
    });
  });

  describe('deleteWorkshop', () => {
    const workshopId = 'workshop-to-delete-789';

    it('should throw error if ID is missing', async () => {
      await expect(deleteWorkshop('')).rejects.toThrow('Workshop ID is required.');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should call Supabase delete and revalidatePath on successful deletion', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({ delete: mockDelete, eq: mockEq });

      await deleteWorkshop(workshopId);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith('id', workshopId);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
    });

     it('should throw error on Supabase delete failure', async () => {
      const dbError = { message: 'DB delete failed' };
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: dbError });
      mockSupabase.from.mockReturnValue({ delete: mockDelete, eq: mockEq });

      await expect(deleteWorkshop(workshopId)).rejects.toThrow(dbError.message);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});