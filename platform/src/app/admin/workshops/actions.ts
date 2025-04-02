'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
// import { Database } from '@/lib/supabase/database.types'; // TODO: Generate and/or locate this file for stronger types

// Define a generic type for the workshop data insertion
// TODO: Replace 'any' with a specific type once database.types.ts is available
type WorkshopInsert = Record<string, unknown>;

export async function addWorkshop(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get('title') as string | null;
  const description = formData.get('description') as string | null;
  const relevantThemesString = formData.get('relevant_themes') as string | null;
  const facilitator = formData.get('facilitator') as string | null;
  const maxCapacityString = formData.get('max_capacity') as string | null;

  // Basic validation (you might want more robust validation)
  if (!title || !description) {
    console.error('Error: Title and description are required.');
    // Consider returning an error state to the form instead of just logging
    return; // Or throw an error, or return { error: '...' }
  }

  let relevantThemesJson: unknown | null = null;
  if (relevantThemesString) {
    try {
      relevantThemesJson = JSON.parse(relevantThemesString);
    } catch (error) {
      console.error('Error parsing relevant_themes JSON:', error);
      // Decide how to handle: return error, proceed with null, etc.
      // For now, we'll proceed with null if parsing fails
      relevantThemesJson = null;
    }
  }

  let maxCapacityNumber: number | null = null;
  if (maxCapacityString) {
    const parsed = parseInt(maxCapacityString, 10);
    if (!isNaN(parsed)) {
      maxCapacityNumber = parsed;
    } else {
      console.warn('Invalid max_capacity value provided:', maxCapacityString);
      // Proceeding with null if parsing fails
    }
  }

  const workshopData: WorkshopInsert = {
    title,
    description,
    // Ensure the relevant_themes field in your DB accepts JSONB or similar
    relevant_themes: relevantThemesJson,
    facilitator: facilitator || null, // Ensure facilitator is nullable in DB or handle empty string
    max_capacity: maxCapacityNumber,
    // Add any other required fields with default values or handle them
  };

  try {
    const { error } = await supabase.from('workshops').insert([workshopData]);

    if (error) {
      console.error('Supabase insert error:', error);
      // Handle error appropriately - maybe return an error state to the form
      return; // Or throw error
    }

    // Revalidate the path to update the list on the workshops page
    revalidatePath('/admin/workshops');

  } catch (error) {
    console.error('Error during workshop insertion process:', error);
    // Handle unexpected errors
    return; // Or throw error
  }

  // Redirect back to the workshops list page on success
  redirect('/admin/workshops');
}


export async function updateWorkshop(id: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get('title') as string | null;
  const description = formData.get('description') as string | null;
  const relevantThemesString = formData.get('relevant_themes') as string | null;
  const facilitator = formData.get('facilitator') as string | null;
  const maxCapacityString = formData.get('max_capacity') as string | null;

  // Basic validation
  if (!title || !description) {
    console.error('Error: Title and description are required.');
    // Consider returning an error state to the form
    return; // Or throw an error, or return { error: '...' }
  }
  if (!id) {
    console.error('Error: Workshop ID is missing.');
    return;
  }

  let relevantThemesJson: unknown | null = null;
  if (relevantThemesString) {
    try {
      relevantThemesJson = JSON.parse(relevantThemesString);
    } catch (error) {
      console.error('Error parsing relevant_themes JSON:', error);
      relevantThemesJson = null; // Proceed with null if parsing fails
    }
  }

  let maxCapacityNumber: number | null = null;
  if (maxCapacityString) {
    const parsed = parseInt(maxCapacityString, 10);
    if (!isNaN(parsed)) {
      maxCapacityNumber = parsed;
    } else {
      console.warn('Invalid max_capacity value provided:', maxCapacityString);
      // Proceeding with null if parsing fails
    }
  }

  // TODO: Replace 'any' with a specific type once database.types.ts is available
  const workshopData: Record<string, unknown> = {
    title,
    description,
    relevant_themes: relevantThemesJson,
    facilitator: facilitator || null,
    max_capacity: maxCapacityNumber,
  };

  try {
    const { error } = await supabase
      .from('workshops')
      .update(workshopData)
      .match({ id });

    if (error) {
      console.error('Supabase update error:', error);
      // Handle error appropriately
      return; // Or throw error
    }

    // Revalidate the path to update the list
    revalidatePath('/admin/workshops');
    revalidatePath(`/admin/workshops/${id}/edit`); // Revalidate edit page too

  } catch (error) {
    console.error('Error during workshop update process:', error);
    // Handle unexpected errors
    return; // Or throw error
  }

  // Redirect back to the workshops list page on success
  redirect('/admin/workshops');
}


export async function deleteWorkshop(id: string) {
  // No need for 'use server' here as it's already at the top level

  if (!id) {
    console.error('Error: Workshop ID is required for deletion.');
    // Consider returning an error state or throwing an error
    return; // Or return { error: 'Missing ID' }
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('workshops')
      .delete()
      .match({ id });

    if (error) {
      console.error('Supabase delete error:', error);
      // Handle error appropriately - maybe return an error state
      return; // Or return { error: error.message }
    }

    // Revalidate the path to update the list on the workshops page
    revalidatePath('/admin/workshops');

  } catch (error) {
    console.error('Error during workshop deletion process:', error);
    // Handle unexpected errors
    return; // Or return { error: 'An unexpected error occurred' }
  }

  // No redirect needed here, revalidation handles the UI update.
}
