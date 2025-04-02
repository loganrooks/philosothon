'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function addTheme(formData: FormData) {
  const supabase = await createClient();

  // Basic validation (consider using a library like Zod for more robust validation)
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const analyticTradition = formData.get('analytic_tradition') as string | null;
  const continentalTradition = formData.get('continental_tradition') as string | null;

  if (!title || !description) {
    // Handle error - perhaps return an error state to the form
    console.error('Title and Description are required.');
    // In a real app, you'd likely return an object indicating the error
    // e.g., return { error: 'Title and Description are required.' };
    // For now, we'll just log and potentially let the DB handle constraints
    return;
  }

  const themeData = {
    title,
    description,
    analytic_tradition: analyticTradition || null, // Ensure null if empty
    continental_tradition: continentalTradition || null, // Ensure null if empty
  };

  try {
    const { data, error } = await supabase
      .from('themes')
      .insert([themeData])
      .select(); // Select to potentially get the inserted data back if needed

    if (error) {
      console.error('Supabase insert error:', error);
      // Handle error - return error state to the form
      // e.g., return { error: `Database error: ${error.message}` }; // Removed return
      return; // Still return void on error, but don't return an object
    }

    console.log('Theme added successfully:', data);

    // Revalidate the path to show the new theme in the list
    revalidatePath('/admin/themes');

    // Redirect back to the themes list page
    redirect('/admin/themes');

  } catch (error) {
    console.error('Error adding theme:', error);
    // Handle unexpected errors - Removed return
    // e.g., return { error: 'An unexpected error occurred.' };
  }
}


export async function updateTheme(id: string, formData: FormData) {
  const supabase = await createClient();

  // Basic validation
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const analyticTradition = formData.get('analytic_tradition') as string | null;
  const continentalTradition = formData.get('continental_tradition') as string | null;

  if (!id) {
    console.error('Update error: ID is missing.');
    // Return error state
    // return { error: 'Theme ID is missing and required for an update.' }; // Removed return
    return; // Return void on error
  }

  if (!title || !description) {
    console.error('Update error: Title and Description are required.');
    // Return error state
    // return { error: 'Title and Description are required.' }; // Removed return
    return; // Return void on error
  }

  const themeData = {
    title,
    description,
    analytic_tradition: analyticTradition || null,
    continental_tradition: continentalTradition || null,
  };

  try {
    const { data, error } = await supabase
      .from('themes')
      .update(themeData)
      .eq('id', id)
      .select(); // Select to potentially get the updated data back if needed

    if (error) {
      console.error('Supabase update error:', error);
      // Return error state
      // return { error: `Database error: ${error.message}` }; // Removed return
      return; // Return void on error
    }

    console.log('Theme updated successfully:', data);

    // Revalidate the path to show the updated theme in the list
    revalidatePath('/admin/themes');
    // Also revalidate the specific theme edit page if needed, though redirecting might be enough
    // revalidatePath(`/admin/themes/${id}/edit`);

    // Redirect back to the themes list page
    redirect('/admin/themes');

  } catch (error) {
    console.error('Error updating theme:', error);
    // Handle unexpected errors
    // return { error: 'An unexpected error occurred during the update.' }; // Removed return
    return; // Return void on error
  }
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

