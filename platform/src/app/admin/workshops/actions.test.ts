import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';
import { createWorkshop, updateWorkshop, deleteWorkshop, type WorkshopFormState } from './actions';
import { insertWorkshop, updateWorkshopById, deleteWorkshopById, type WorkshopInput, type Workshop } from '@/lib/data/workshops'; // Import DAL functions and types

// Mock dependencies
vi.mock('next/cache');
vi.mock('@/lib/data/workshops'); // Mock the DAL module

describe('Workshop Server Actions (actions.ts)', () => {
  const initialState: WorkshopFormState = { message: null, success: false, errors: {} };
  // Mock data matching Workshop type
  const mockWorkshop: Workshop = { id: 'ws-id-123', title: 'Test Workshop', description: 'Desc', speaker: 'Speaker', created_at: '2023-01-01T00:00:00Z', image_url: null, related_themes: ['theme1'] };
  const mockUpdatedWorkshop: Workshop = { ...mockWorkshop, id: 'test-workshop-id-456', title: 'Updated Workshop', speaker: 'New Speaker' };


  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DAL mocks
    vi.mocked(insertWorkshop).mockClear();
    vi.mocked(updateWorkshopById).mockClear();
    vi.mocked(deleteWorkshopById).mockClear();
  });

  describe('createWorkshop', () => {
    it('should return validation error if title is missing', async () => {
      const formData = new FormData();
      // Missing title

      const result = await createWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.title).toContain('Expected string, received null'); // Updated expected message
      expect(insertWorkshop).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid relevant_themes JSON', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Workshop');
      formData.append('related_themes', 'not json'); // Invalid JSON

      // Mock DAL to return an error for this path (though validation should catch it first)
      vi.mocked(insertWorkshop).mockResolvedValue({ workshop: null, error: new Error('Should not be called') });

      const result = await createWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.related_themes).toEqual(['Invalid JSON format for Related Themes (must be an array of strings like ["id1", "id2"]).']); // Updated field name and message check
      expect(insertWorkshop).not.toHaveBeenCalled();
    });

     it('should return validation error for non-array relevant_themes JSON', async () => {
      const formData = new FormData();
      formData.append('title', 'Test Workshop');
      formData.append('related_themes', '{"valid": "json", "but": "not array"}');

      // Mock DAL to return an error for this path (though validation should catch it first)
      vi.mocked(insertWorkshop).mockResolvedValue({ workshop: null, error: new Error('Should not be called') });

      const result = await createWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.related_themes).toEqual(['Invalid JSON format for Related Themes (must be an array of strings like ["id1", "id2"]).']); // Updated field name and message check
      expect(insertWorkshop).not.toHaveBeenCalled();
    });

    // Removed max_capacity tests as the field is removed

    it('should call insertWorkshop DAL function and revalidatePath on successful creation', async () => {
      vi.mocked(insertWorkshop).mockResolvedValue({ workshop: mockWorkshop, error: null }); // Simulate DAL success
      const formData = new FormData();
      const title = mockWorkshop.title;
      const description = mockWorkshop.description ?? '';
      const themes = JSON.stringify(mockWorkshop.related_themes);
      const speaker = mockWorkshop.speaker ?? '';
      formData.append('title', title);
      formData.append('description', description);
      formData.append('related_themes', themes); // Changed field name
      formData.append('speaker', speaker); // Changed field name

      const result = await createWorkshop(initialState, formData);

      expect(insertWorkshop).toHaveBeenCalledTimes(1);
      const expectedInput: WorkshopInput = {
        title: title,
        description: description,
        related_themes: mockWorkshop.related_themes,
        speaker: speaker,
      };
      expect(insertWorkshop).toHaveBeenCalledWith(expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Workshop created successfully!');
      expect(result.errors).toEqual({});
    });

     it('should handle empty/null optional fields correctly during creation', async () => {
      vi.mocked(insertWorkshop).mockResolvedValue({ workshop: { ...mockWorkshop, title: 'Minimal Workshop' }, error: null }); // Simulate DAL success
      const formData = new FormData();
      formData.append('title', 'Minimal Workshop');
      // description, related_themes, speaker omitted

      const result = await createWorkshop(initialState, formData);

      expect(insertWorkshop).toHaveBeenCalledTimes(1);
      const expectedInput: WorkshopInput = {
        title: 'Minimal Workshop',
        description: null,
        related_themes: null,
        speaker: null,
      };
      expect(insertWorkshop).toHaveBeenCalledWith(expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should return error state on insertWorkshop DAL failure', async () => {
      const dalError = new Error('DAL insert failed');
      vi.mocked(insertWorkshop).mockResolvedValue({ workshop: null, error: dalError }); // Simulate DAL failure
      const formData = new FormData();
      formData.append('title', 'Fail Workshop');

      const result = await createWorkshop(initialState, formData);

      expect(insertWorkshop).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dalError.message);
      expect(result.errors?.general).toBe(dalError.message);
    });
  });

  describe('updateWorkshop', () => {
    const workshopId = 'test-workshop-id-456';

    it('should return error if ID is missing', async () => {
      const formData = new FormData(); // No ID
      formData.append('title', 'Updated Title');

      const result = await updateWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Workshop ID is missing.'); // Match exact message
      expect(result.errors?.general).toContain('Workshop ID missing.'); // Match exact message
      expect(updateWorkshopById).not.toHaveBeenCalled();
    });

    it('should return validation error if title is missing', async () => {
      const formData = new FormData();
      formData.append('id', workshopId);
      // Missing title

      const result = await updateWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.title).toContain('Expected string, received null'); // Updated expected message
      expect(updateWorkshopById).not.toHaveBeenCalled();
    });

     it('should return validation error for invalid relevant_themes JSON', async () => {
      const formData = new FormData();
      formData.append('id', workshopId);
      formData.append('title', 'Updated Title');
      formData.append('related_themes', 'invalid');

      // Mock DAL to return an error for this path (though validation should catch it first)
      vi.mocked(updateWorkshopById).mockResolvedValue({ workshop: null, error: new Error('Should not be called') });

      const result = await updateWorkshop(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.related_themes).toEqual(['Invalid JSON format for Related Themes (must be an array of strings like ["id1", "id2"]).']); // Updated field name
      expect(updateWorkshopById).not.toHaveBeenCalled();
    });

    // Removed max_capacity validation test

    it('should call updateWorkshopById DAL function and revalidate paths on successful update', async () => {
      vi.mocked(updateWorkshopById).mockResolvedValue({ workshop: mockUpdatedWorkshop, error: null }); // Simulate DAL success

      const formData = new FormData();
      const title = mockUpdatedWorkshop.title;
      const themes = JSON.stringify(mockUpdatedWorkshop.related_themes);
      const speaker = mockUpdatedWorkshop.speaker ?? '';
      formData.append('id', mockUpdatedWorkshop.id);
      formData.append('title', title);
      formData.append('related_themes', themes); // Changed field name
      formData.append('speaker', speaker); // Changed field name
      // description omitted

      const result = await updateWorkshop(initialState, formData);

      expect(updateWorkshopById).toHaveBeenCalledTimes(1);
      const expectedInput: Partial<WorkshopInput> = {
        title: title,
        description: null, // Omitted fields should be null
        related_themes: mockUpdatedWorkshop.related_themes,
        speaker: speaker,
      };
      expect(updateWorkshopById).toHaveBeenCalledWith(mockUpdatedWorkshop.id, expectedInput);
      expect(revalidatePath).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/workshops/edit?id=${workshopId}`);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Workshop updated successfully!');
      expect(result.errors).toEqual({});
    });

     it('should return error state on updateWorkshopById DAL failure', async () => {
      const dalError = new Error('DAL update failed');
      vi.mocked(updateWorkshopById).mockResolvedValue({ workshop: null, error: dalError }); // Simulate DAL failure

      const formData = new FormData();
      formData.append('id', workshopId);
      formData.append('title', 'Fail Update');

      const result = await updateWorkshop(initialState, formData);

      expect(updateWorkshopById).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain(dalError.message);
      expect(result.errors?.general).toBe(dalError.message);
    });
  });

  describe('deleteWorkshop', () => {
    const workshopId = 'workshop-to-delete-789';

    it('should throw error if ID is missing', async () => {
      await expect(deleteWorkshop('')).rejects.toThrow('Workshop ID is required.');
      expect(deleteWorkshopById).not.toHaveBeenCalled();
    });

    it('should call deleteWorkshopById DAL function and revalidatePath on successful deletion', async () => {
      vi.mocked(deleteWorkshopById).mockResolvedValue({ error: null }); // Simulate DAL success

      await deleteWorkshop(workshopId);

      expect(deleteWorkshopById).toHaveBeenCalledTimes(1);
      expect(deleteWorkshopById).toHaveBeenCalledWith(workshopId);
      expect(revalidatePath).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
    });

     it('should throw error on deleteWorkshopById DAL failure', async () => {
      const dalError = new Error('DAL delete failed');
      vi.mocked(deleteWorkshopById).mockResolvedValue({ error: dalError }); // Simulate DAL failure

      await expect(deleteWorkshop(workshopId)).rejects.toThrow(dalError.message);

      expect(deleteWorkshopById).toHaveBeenCalledTimes(1);
      expect(deleteWorkshopById).toHaveBeenCalledWith(workshopId);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});