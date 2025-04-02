'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';


export async function addTheme(prevState: { success: boolean, message: string | undefined }, formData: FormData): Promise<{ success: boolean, message: string | undefined }> {
  const supabase = await createClient();

  // Basic validation (consider using a library like Zod for more robust validation)
  const title = formData.get('title') as string; // Reverted to 'title'
  const description = formData.get('description') as string;
  const analyticTradition = formData.get('analytic_tradition') as string | null;
  const continentalTradition = formData.get('continental_tradition') as string | null;

  if (!title || !description) {
    // Handle error - return an error state to the form
    console.error('Title and Description are required.');
    return { success: false, message: 'Title and description are required.' }; // Return error object matching FormState
  }

  const themeData = {
    title, // Reverted to 'title'
    description,
    analytic_tradition: analyticTradition || null, // Ensure null if empty
    continental_tradition: continentalTradition || null, // Ensure null if empty
  };

  try {
    const { data, error } = await supabase
      .from('themes')
      .insert([themeData]); // Removed .select()

    if (error) {
      console.error('Supabase insert error:', error);
      // Handle error - return error state to the form
      return { success: false, message: `Error adding theme: ${error.message}` }; // Return error object matching FormState
    }

    console.log('Theme added successfully:', data);

    // Revalidate the path to show the new theme in the list
    revalidatePath('/admin/themes');
    revalidatePath('/themes'); // Revalidate public path as well

    // Redirect back to the themes list page
    redirect('/admin/themes');

  } catch (error: unknown) { // Add type annotation for catch block variable
    console.error('Error adding theme:', error);
    // Handle unexpected errors
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: `Error adding theme: ${message}` }; // Return error object matching FormState
  }
  // Note: redirect throws an error, so code below it won't execute.
  // For type safety with useFormState, technically it expects a state return.
  // However, in practice, the redirect prevents this return.
  // If redirect didn't throw, we'd need: return { success: true, message: undefined };
}


export async function updateTheme(id: string, prevState: { success: boolean, message: string | undefined }, formData: FormData): Promise<{ success: boolean, message: string | undefined }> {
  const supabase = await createClient();

  // Basic validation
  const title = formData.get('title') as string; // Keep as 'title'
  const description = formData.get('description') as string;
  const analyticTradition = formData.get('analytic_tradition') as string | null;
  const continentalTradition = formData.get('continental_tradition') as string | null;

  if (!id) {
    console.error('Update error: ID is missing.');
    // Return error state
    return { success: false, message: 'Theme ID is missing and required for an update.' }; // Return error object
  }

  if (!title || !description) {
    console.error('Update error: Title and Description are required.');
    // Return error state
    return { success: false, message: 'Title and Description are required.' }; // Return error object
  }

  const themeData = {
    title, // Keep as 'title'
    description,
    analytic_tradition: analyticTradition || null,
    continental_tradition: continentalTradition || null,
  };

  try {
    const { data, error } = await supabase
      .from('themes')
      .update(themeData) // Original order was correct
      .eq('id', id); // Filter after update
      // Removed .select() here previously, ensure it stays removed

    if (error) {
      console.error('Supabase update error:', error);
      // Return error state immediately
      return { success: false, message: `Database error: ${error.message}` };
    }
    // Only proceed if there was no error
    console.log('Theme updated successfully:', data);

    // Revalidate the path to show the updated theme in the list
    revalidatePath('/admin/themes');
    // Also revalidate the specific theme edit page if needed, though redirecting might be enough
    // revalidatePath(`/admin/themes/${id}/edit`);

    // Redirect back to the themes list page
    redirect('/admin/themes');

  } catch (error: unknown) {
    console.error('Error updating theme:', error);
    // Handle unexpected errors
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during the update.';
    return { success: false, message }; // Return error object
  }
  // Note: redirect throws an error, so code below it won't execute.
  // If redirect didn't throw, we'd need: return { success: true, message: undefined };
}


export async function deleteTheme(id: string) {
  const supabase = await createClient();

  if (!id) {
    console.error('Delete error: ID is missing.');
    // In a real app, you might throw an error or return a specific error object
    return; // Return void on error
  }

  try {
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      // Handle error - maybe return an error state or throw
      return; // Return void on error
    }

    console.log('Theme deleted successfully:', id);

    // Revalidate the path to update the list in the UI
    revalidatePath('/admin/themes');

    // No redirect needed usually for delete, the page should just update.
    // If you were on the edit page of the deleted item, you might redirect.
    // redirect('/admin/themes');

  } catch (error) {
    console.error('Error deleting theme:', error);
    // Handle unexpected errors
    return; // Return void on error
  }
}

