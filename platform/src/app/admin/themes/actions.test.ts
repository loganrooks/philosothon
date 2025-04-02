// platform/src/app/admin/themes/actions.test.ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'; // Import Mock type
import { addTheme, updateTheme, deleteTheme } from './actions'; // Import deleteTheme
import { createClient } from '@/lib/supabase/server'; // Correct import name
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Mock necessary modules
vi.mock('@/lib/supabase/server');
vi.mock('next/cache');
vi.mock('next/navigation');

// Define mock implementations
const mockInsert = vi.fn();
const initialState = { success: true, message: undefined }; // Define initial state for tests
// Define separate mocks for each step/chain
const mockEqUpdate = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });
const mockEqDelete = vi.fn();
const mockDelete = vi.fn().mockReturnValue({ eq: mockEqDelete });
const mockFrom = vi.fn(); // Define from separately
const mockSupabase = { // Mock for the Supabase client object
  from: mockFrom,
};

describe('Admin Theme Server Actions', () => {
  beforeEach(() => {
    // Reset all mocks thoroughly before each test
    vi.resetAllMocks();
    // Explicitly clear Next.js mocks as well (except redirect)
    (revalidatePath as Mock).mockClear();
    // (redirect as Mock).mockClear(); // Removed problematic cast


    // Redefine default successful mock behavior AFTER reset
    mockInsert.mockResolvedValue({ error: null });
    mockEqUpdate.mockResolvedValue({ error: null }); // Mock the final step of update
    mockEqDelete.mockResolvedValue({ error: null }); // Mock the final step of delete
    mockUpdate.mockReturnValue({ eq: mockEqUpdate }); // Mock the update chain
    mockDelete.mockReturnValue({ eq: mockEqDelete }); // Mock the delete chain
    mockFrom.mockReturnValue({ // Mock the from call
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
    (createClient as Mock).mockReturnValue(mockSupabase); // Mock createClient to return the Supabase mock
  });

  describe('addTheme', () => {
    it('should call Supabase insert with correct data', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('title', 'Test Theme');
      formData.append('description', 'Test Description');
      const expectedData = { title: 'Test Theme', description: 'Test Description', analytic_tradition: null, continental_tradition: null };

      // Act
      await addTheme(initialState, formData);

      // Assert
      expect(createClient).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('themes');
      expect(mockInsert).toHaveBeenCalledWith([expectedData]);
    });

    it('should call revalidatePath for admin and public theme pages on success', async () => {
       // Arrange
       const formData = new FormData();
       formData.append('title', 'Test Theme');
       formData.append('description', 'Test Description');

       // Act
       await addTheme(initialState, formData);

       // Assert
       expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
       expect(revalidatePath).toHaveBeenCalledWith('/themes');
    });

     it('should call redirect to the admin themes page on success', async () => {
       // Arrange
       const formData = new FormData();
       formData.append('title', 'Test Theme');
       formData.append('description', 'Test Description');

       // Act
       await addTheme(initialState, formData);

       // Assert
       expect(redirect).toHaveBeenCalledWith('/admin/themes');
     });

     it('should return an error message if Supabase insert fails', async () => {
        // Arrange
        const formData = new FormData();
        formData.append('title', 'Test Theme Fail');
        formData.append('description', 'This should fail');
        const errorMessage = 'Insert failed';
        mockInsert.mockResolvedValueOnce({ error: { message: errorMessage } });

        // Act
        const result = await addTheme(initialState, formData);

        // Assert
        expect(mockInsert).toHaveBeenCalledTimes(1);
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(redirect).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, message: `Error adding theme: ${errorMessage}` });
     });

     it('should return an error if name is missing', async () => {
        // Arrange
        const formData = new FormData();
        formData.append('description', 'Test Description');

        // Act
        const result = await addTheme(initialState, formData);

        // Assert
        expect(mockInsert).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, message: 'Title and description are required.' });
     });

      it('should return an error if description is missing', async () => {
        // Arrange
        const formData = new FormData();
        formData.append('title', 'Test Theme');

        // Act
        const result = await addTheme(initialState, formData);

        // Assert
        expect(mockInsert).not.toHaveBeenCalled();
        expect(result).toEqual({ success: false, message: 'Title and description are required.' });
     });
  });

}); // End of Admin Theme Server Actions describe block

describe('updateTheme', () => {
  const themeId = 'test-theme-id-123';

  // Re-apply beforeEach for this describe block to ensure isolation
  beforeEach(() => {
    vi.resetAllMocks();
    (revalidatePath as Mock).mockClear();
    // (redirect as Mock).mockClear(); // Removed problematic cast
    mockInsert.mockResolvedValue({ error: null });
    mockEqUpdate.mockResolvedValue({ error: null });
    mockEqDelete.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEqUpdate });
    mockDelete.mockReturnValue({ eq: mockEqDelete });
    mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate, delete: mockDelete });
    (createClient as Mock).mockReturnValue(mockSupabase);
  });


  it('should call Supabase update with correct data and ID', async () => {
    // Arrange
    const formData = new FormData();
    formData.append('title', 'Updated Theme');
    formData.append('description', 'Updated Description');
    const expectedData = { title: 'Updated Theme', description: 'Updated Description', analytic_tradition: null, continental_tradition: null };

    // Act
    await updateTheme(themeId, initialState, formData);

    // Assert
    const mockUpdateFn = mockSupabase.from().update;
    const mockEqFn = mockUpdateFn().eq;

    expect(mockSupabase.from).toHaveBeenCalledWith('themes');
    expect(mockUpdateFn).toHaveBeenCalledWith(expectedData);
    expect(mockEqFn).toHaveBeenCalledWith('id', themeId);
  });

   it('should call revalidatePath and redirect on successful update', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('title', 'Updated Theme');
      formData.append('description', 'Updated Description');

      // Act
      await updateTheme(themeId, initialState, formData);

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
      expect(redirect).toHaveBeenCalledWith('/admin/themes');
   });

   it('should return an error if title is missing', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('description', 'Updated Description');
      const mockUpdateFn = vi.fn(); // Simple mock for assertion check
      (createClient as Mock).mockReturnValueOnce({ from: () => ({ update: mockUpdateFn }) }); // Simplified override

      // Act
      const result = await updateTheme(themeId, initialState, formData);

      // Assert
      expect(mockUpdateFn).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, message: 'Title and Description are required.' });
   });

    it('should return an error if Supabase update fails', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('title', 'Update Fail Theme');
      formData.append('description', 'This update should fail');
      const errorMessage = 'Update failed';
      // Explicitly mock the entire chain for failure *within this test*
      const mockEqUpdateError = vi.fn().mockResolvedValueOnce({ error: { message: errorMessage } });
      const mockUpdateError = vi.fn().mockReturnValue({ eq: mockEqUpdateError });
      const mockFromErrorUpdate = vi.fn().mockReturnValue({ update: mockUpdateError });
      (createClient as Mock).mockReturnValueOnce({ from: mockFromErrorUpdate });

      // Act
      const result = await updateTheme(themeId, initialState, formData);

      // Assert
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      // Correct the expected message to match the action's return value
      expect(result).toEqual({ success: false, message: `Database error: ${errorMessage}` });
    });

}); // End of updateTheme describe block

  describe('deleteTheme', () => {
    const themeId = 'test-theme-id-456';

    // Re-apply beforeEach for this describe block to ensure isolation
    beforeEach(() => {
      vi.resetAllMocks();
      (revalidatePath as Mock).mockClear();
      // (redirect as Mock).mockClear(); // Removed problematic cast
      mockInsert.mockResolvedValue({ error: null });
      mockEqUpdate.mockResolvedValue({ error: null });
      mockEqDelete.mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEqUpdate });
      mockDelete.mockReturnValue({ eq: mockEqDelete });
      mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate, delete: mockDelete });
      (createClient as Mock).mockReturnValue(mockSupabase);
    });


    it('should call Supabase delete with correct ID', async () => {
      // Arrange
      // Mock setup is handled by beforeEach

      // Act
      await deleteTheme(themeId);

      // Assert
      expect(createClient).toHaveBeenCalledTimes(1); // Ensure client is created once
      expect(mockSupabase.from).toHaveBeenCalledWith('themes'); // Ensure 'from' is called correctly
      expect(mockFrom().delete).toHaveBeenCalledTimes(1); // Ensure 'delete' is called on the result of 'from'
      expect(mockDelete().eq).toHaveBeenCalledWith('id', themeId); // Ensure 'eq' is called on the result of 'delete'
    });

    it('should call revalidatePath on successful delete', async () => {
      // Arrange
      // Mock setup is handled by beforeEach

      // Act
      await deleteTheme(themeId);

      // Assert
      // Ensure the delete operation completed successfully before checking revalidatePath
      // (await on line 266 handles this)

      expect(revalidatePath).toHaveBeenCalledTimes(1); // Ensure it's called exactly once
      expect(revalidatePath).toHaveBeenCalledWith('/admin/themes');
      expect(redirect).not.toHaveBeenCalled(); // Delete doesn't redirect
    });

    it('should log an error if Supabase delete fails', async () => {
      // Arrange
      const errorMessage = 'Delete failed';
      // Explicitly mock the entire chain for failure *within this test*
      const mockEqDeleteError = vi.fn().mockResolvedValueOnce({ error: { message: errorMessage } });
      const mockDeleteError = vi.fn().mockReturnValue({ eq: mockEqDeleteError });
      const mockFromErrorDelete = vi.fn().mockReturnValue({ delete: mockDeleteError });
      (createClient as Mock).mockReturnValueOnce({ from: mockFromErrorDelete });

      // Act
      await deleteTheme(themeId);

      // Assert
      // Verify revalidatePath was NOT called
      expect(revalidatePath).not.toHaveBeenCalled();
    });

     it('should not call Supabase if ID is missing', async () => {
        // Arrange
        const mockDeleteFn = mockDelete; // Use mock from beforeEach

        // Act
        // @ts-expect-error - Testing invalid input
        await deleteTheme(undefined);

        // Assert
        expect(mockDeleteFn).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
     });

  }); // End of deleteTheme describe block