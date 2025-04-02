'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Define the expected state structure for form actions
type FormState = { success: boolean; message: string | undefined };

export async function addFaqItem(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const question = formData.get('question') as string;
  const answer = formData.get('answer') as string;
  const category = (formData.get('category') as string) || null; // Treat empty string as null
  const displayOrderStr = formData.get('display_order') as string;

  let displayOrder: number | null = null;
  if (displayOrderStr && displayOrderStr.trim() !== '') {
    const parsed = parseInt(displayOrderStr, 10);
    if (!isNaN(parsed)) {
      displayOrder = parsed;
    }
    // If parsing fails (isNaN), displayOrder remains null, which is intended
  }

  // Basic validation (can be expanded)
  if (!question || !answer) {
    console.error('Validation Error: Question and Answer are required.');
    return { success: false, message: 'Question and Answer are required.' }; // Return error state
  }

  try {
    const { error } = await supabase.from('faq_items').insert([
      {
        question,
        answer,
        category,
        display_order: displayOrder,
      },
    ]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      return { success: false, message: `Database error: ${error.message}` }; // Return error state
    }

    // Revalidate the path to show the new item in the list
    revalidatePath('/admin/faq');
    revalidatePath('/faq'); // Also revalidate public page

  } catch (err) {
    console.error('Error adding FAQ item:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, message: `Error adding FAQ item: ${message}` }; // Return error state
  }

  // Redirect back to the FAQ list page on success
  redirect('/admin/faq');
  // Note: redirect throws an error, so technically no return is needed here,
  // but for type safety with useFormState, we might add:
  // return { success: true, message: undefined };
}


export async function updateFaqItem(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const question = formData.get('question') as string;
  const answer = formData.get('answer') as string;
  const category = (formData.get('category') as string) || null; // Treat empty string as null
  const displayOrderStr = formData.get('display_order') as string;

  let displayOrder: number | null = null;
  if (displayOrderStr && displayOrderStr.trim() !== '') {
    const parsed = parseInt(displayOrderStr, 10);
    if (!isNaN(parsed)) {
      displayOrder = parsed;
    }
    // If parsing fails (isNaN), displayOrder remains null
  }

  // Basic validation
  if (!question || !answer) {
    console.error('Validation Error: Question and Answer are required.');
    return { success: false, message: 'Question and Answer are required.' }; // Return error state
  }

  if (!id) {
    console.error('Validation Error: ID is missing for update.');
    return { success: false, message: 'FAQ Item ID is missing.' }; // Return error state
  }

  try {
    const { error } = await supabase
      .from('faq_items')
      .update({
        question,
        answer,
        category,
        display_order: displayOrder,
      })
      .match({ id });

    if (error) {
      console.error('Supabase Update Error:', error);
      return { success: false, message: `Database error: ${error.message}` }; // Return error state
    }

    // Revalidate paths to show the updated item
    revalidatePath('/admin/faq');
    revalidatePath(`/admin/faq/${id}/edit`); // Revalidate the edit page too
    revalidatePath('/faq'); // Also revalidate public page

  } catch (err) {
    console.error('Error updating FAQ item:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, message: `Error updating FAQ item: ${message}` }; // Return error state
  }

  // Redirect back to the FAQ list page on success
  redirect('/admin/faq');
  // Note: redirect throws an error, so technically no return is needed here.
}


export async function deleteFaqItem(id: string) {
  const supabase = await createClient();

  if (!id) {
    console.error('Validation Error: ID is missing for delete.');
    // In a real app, you might want to return an error object
    return; // Return void to satisfy form action type for now
  }

  try {
    const { error } = await supabase.from('faq_items').delete().match({ id });

    if (error) {
      console.error('Supabase Delete Error:', error);
      // Handle error appropriately
      return; // Return void for now
    }

    // Revalidate the path to update the list on the client
    revalidatePath('/admin/faq');
    revalidatePath('/faq'); // Also revalidate public page
    // Success: revalidation happens, no explicit return needed

  } catch (err) {
    console.error('Error deleting FAQ item:', err);
    // Handle unexpected errors
    return; // Return void for now
  }
  // Note: No redirect here, as the action is called from the list page itself.
}