'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function addFaqItem(formData: FormData) {
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
    // In a real app, return an error state to the form
    return;
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
      // Handle error appropriately, maybe return error state to form
      return;
    }

    // Revalidate the path to show the new item in the list
    revalidatePath('/admin/faq');

  } catch (err) {
    console.error('Error adding FAQ item:', err);
    // Handle unexpected errors
    return;
  }

  // Redirect back to the FAQ list page on success
  redirect('/admin/faq');
}


export async function updateFaqItem(id: string, formData: FormData) {
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
    // TODO: Return error state to the form
    return; // Return void to satisfy form action type
  }

  if (!id) {
    console.error('Validation Error: ID is missing for update.');
    return; // Return void
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
      // TODO: Handle error appropriately, maybe return error state to form
      return; // Return void
    }

    // Revalidate paths to show the updated item
    revalidatePath('/admin/faq');
    revalidatePath(`/admin/faq/${id}/edit`); // Revalidate the edit page too

  } catch (err) {
    console.error('Error updating FAQ item:', err);
    // TODO: Handle unexpected errors
    return; // Return void
  }

  // Redirect back to the FAQ list page on success
  redirect('/admin/faq');
}


export async function deleteFaqItem(id: string) {
  const supabase = await createClient();

  if (!id) {
    console.error('Validation Error: ID is missing for delete.');
    // In a real app, you might want to return an error object
    return; // Return void to satisfy form action type
  }

  try {
    const { error } = await supabase.from('faq_items').delete().match({ id });

    if (error) {
      console.error('Supabase Delete Error:', error);
      // Handle error appropriately
      return; // Return void
    }

    // Revalidate the path to update the list on the client
    revalidatePath('/admin/faq');
    // Success: revalidation happens, no explicit return needed

  } catch (err) {
    console.error('Error deleting FAQ item:', err);
    // Handle unexpected errors
    // const message = err instanceof Error ? err.message : 'An unknown error occurred.'; // Removed unused variable
    return; // Return void
  }
  // Note: No redirect here, as the action is called from the list page itself.
}