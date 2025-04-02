// platform/src/app/admin/workshops/actions.test.ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
// Import all actions
import { addWorkshop, updateWorkshop, deleteWorkshop } from './actions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
// Import redirect
import { redirect } from 'next/navigation';

// Mock necessary modules
vi.mock('@/lib/supabase/server');
vi.mock('next/cache');
vi.mock('next/navigation');

// Define mock implementations
const mockInsert = vi.fn();
const mockEqUpdate = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate, match: vi.fn() }); // Add match mock
const mockMatch = vi.fn(); // Mock for .match() used in update/delete
const mockEqDelete = vi.fn();
const mockDelete = vi.fn().mockReturnValue({ eq: mockEqDelete, match: mockMatch }); // Add match mock
const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

// Removed unused initialState definition globally

describe('Admin Workshop Server Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (revalidatePath as Mock).mockClear();
    // (redirect as Mock).mockClear(); // redirect is implicitly cleared by resetAllMocks

    // Default successful mock behavior
    mockInsert.mockResolvedValue({ error: null });
    mockEqUpdate.mockResolvedValue({ error: null });
    mockEqDelete.mockResolvedValue({ error: null });
    mockMatch.mockResolvedValue({ error: null }); // Default success for match
    mockUpdate.mockReturnValue({ eq: mockEqUpdate, match: mockMatch }); // Ensure update returns match
    mockDelete.mockReturnValue({ eq: mockEqDelete, match: mockMatch }); // Ensure delete returns match
    mockFrom.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
    (createClient as Mock).mockReturnValue(mockSupabase);
  });

  describe('addWorkshop', () => {
    // ... existing passing tests for addWorkshop ...
    it('should call Supabase insert with correct data', async () => {
        const formData = new FormData();
        formData.append('title', 'Test Workshop');
        formData.append('description', 'Test Description');
        formData.append('date', '2025-10-26T10:00:00.000Z');
        formData.append('location', 'Test Location');
        formData.append('facilitator', 'Test Facilitator');
        formData.append('relevant_themes', '["theme-1", "theme-2"]');
        const expectedData = {
          title: 'Test Workshop',
          description: 'Test Description',
          date: '2025-10-26T10:00:00.000Z',
          location: 'Test Location',
          facilitator: 'Test Facilitator',
          relevant_themes: ["theme-1", "theme-2"],
          max_capacity: null,
        };
        await addWorkshop(formData);
        expect(createClient).toHaveBeenCalledTimes(1);
        expect(mockSupabase.from).toHaveBeenCalledWith('workshops');
        expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining(expectedData)]);
      });

      it('should call revalidatePath on success', async () => {
        const formData = new FormData();
        formData.append('title', 'Test Workshop Revalidate');
        formData.append('description', 'Test Desc Revalidate');
        formData.append('date', '2025-11-01T14:00:00Z');
        formData.append('location', 'Online');
        await addWorkshop(formData);
        expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
      });

      it('should not call insert or revalidate if title is missing', async () => {
         const formData = new FormData();
         formData.append('description', 'Missing title');
         formData.append('date', '2025-11-01T14:00:00Z');
         formData.append('location', 'Online');
         await addWorkshop(formData);
         expect(mockInsert).not.toHaveBeenCalled();
         expect(revalidatePath).not.toHaveBeenCalled();
      });

       it('should handle Supabase insert error', async () => {
          const formData = new FormData();
          formData.append('title', 'Test Workshop Error');
          formData.append('description', 'Test Desc Error');
          formData.append('date', '2025-11-01T14:00:00Z');
          formData.append('location', 'Error Room');
          const errorMessage = 'Insert failed';
          mockInsert.mockResolvedValueOnce({ error: { message: errorMessage } });
          await addWorkshop(formData);
          expect(mockInsert).toHaveBeenCalledTimes(1);
          expect(revalidatePath).not.toHaveBeenCalled();
       });
  });

  describe('updateWorkshop', () => {
    const workshopId = 'test-workshop-id-789';
    // Removed unused initialState definition from here

    // Re-apply beforeEach for this describe block to ensure isolation
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
      formData.append('title', 'Updated Workshop');
      formData.append('description', 'Updated Description');
      formData.append('date', '2025-12-01T11:00:00Z');
      formData.append('location', 'Updated Location');
      formData.append('facilitator', 'Updated Facilitator');
      formData.append('relevant_themes', '["theme-3"]');
      formData.append('max_capacity', '25');
      const expectedData = {
        title: 'Updated Workshop',
        description: 'Updated Description',
        date: '2025-12-01T11:00:00Z',
        location: 'Updated Location',
        facilitator: 'Updated Facilitator',
        relevant_themes: ["theme-3"],
        max_capacity: 25,
      };
      // Assuming updateWorkshop takes (id, formData)
      await updateWorkshop(workshopId, formData);
      const mockUpdateFn = mockSupabase.from().update;
      expect(mockSupabase.from).toHaveBeenCalledWith('workshops');
      expect(mockUpdateFn).toHaveBeenCalledWith(expectedData);
      expect(mockMatch).toHaveBeenCalledWith({ id: workshopId });
    });

    it('should call revalidatePath and redirect on successful update', async () => {
        const formData = new FormData();
        formData.append('title', 'Updated Workshop Success');
        formData.append('description', 'Updated Desc Success');
        formData.append('date', '2025-12-01T11:00:00Z');
        formData.append('location', 'Updated Location Success');
        // Assuming updateWorkshop takes (id, formData)
        await updateWorkshop(workshopId, formData);
        expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/workshops/${workshopId}/edit`);
        expect(redirect).toHaveBeenCalledWith('/admin/workshops');
    });

     it('should not call update or revalidate if title is missing', async () => {
        const formData = new FormData();
        formData.append('description', 'Missing title');
        formData.append('date', '2025-12-01T11:00:00Z');
        formData.append('location', 'Missing title location');
        // Assuming updateWorkshop takes (id, formData)
        await updateWorkshop(workshopId, formData);
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(redirect).not.toHaveBeenCalled();
     });

     it('should handle Supabase update error', async () => {
        const formData = new FormData();
        formData.append('title', 'Update Error Workshop');
        formData.append('description', 'Update Error Desc');
        formData.append('date', '2025-12-01T11:00:00Z');
        formData.append('location', 'Update Error Location');
        const errorMessage = 'Update failed';
        mockMatch.mockResolvedValueOnce({ error: { message: errorMessage } });
        // Assuming updateWorkshop takes (id, formData)
        await updateWorkshop(workshopId, formData);
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockMatch).toHaveBeenCalledWith({ id: workshopId });
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(redirect).not.toHaveBeenCalled();
     });

  });

  describe('deleteWorkshop', () => {
    const workshopId = 'test-workshop-id-delete-123';

    // Re-apply beforeEach for this describe block to ensure isolation
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
      await deleteWorkshop(workshopId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('workshops');
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockMatch).toHaveBeenCalledWith({ id: workshopId }); // Check match was called
    });

    it('should call revalidatePath on successful delete', async () => {
      // Arrange - beforeEach handles success mock

      // Act
      await deleteWorkshop(workshopId);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/admin/workshops');
      expect(redirect).not.toHaveBeenCalled(); // Delete should not redirect
    });

    it('should not call delete or revalidate if ID is missing', async () => {
      // Arrange
      const mockDeleteFn = mockDelete; // Get mock from beforeEach

      // Act
      // @ts-expect-error - Testing invalid input
      await deleteWorkshop(undefined);

      // Assert
      expect(mockDeleteFn).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should handle Supabase delete error', async () => {
      // Arrange
      const errorMessage = 'Delete failed';
      // Mock the match step to return an error
      mockMatch.mockResolvedValueOnce({ error: { message: errorMessage } });

      // Act
      await deleteWorkshop(workshopId);

      // Assert
      expect(mockDelete).toHaveBeenCalledTimes(1); // Delete is called before match
      expect(mockMatch).toHaveBeenCalledWith({ id: workshopId });
      expect(revalidatePath).not.toHaveBeenCalled(); // Should not revalidate on error
    });
  });
});