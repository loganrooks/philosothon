import { createClient, createStaticSupabaseClient } from '@/lib/supabase/server';

// Define the Workshop type based on usage in actions/pages and specs
// Need to confirm exact fields from schema or existing types if available
export interface Workshop {
  id: string; // Assuming UUID
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string; // Assuming timestamp string
  // Add other fields if they exist (e.g., related themes, speaker)
  speaker: string | null;
  related_themes: string[] | null; // Assuming JSONB mapped to string[]
}

/**
 * Fetches all workshops from the database.
 * Handles potential errors during the fetch operation.
 * @returns An object containing the fetched workshops or an error.
 */
export async function fetchWorkshops(): Promise<{ workshops: Workshop[] | null; error: Error | null }> {
  try {
    // Use the static client for SSG/ISR pages like public workshops
    const supabase = createStaticSupabaseClient();
    const { data, error } = await supabase
      .from('workshops')
      .select('*') // Select all columns for now
      .order('title', { ascending: true }); // Example ordering

    if (error) {
      console.error('Error fetching workshops:', error);
      throw new Error(`Database error fetching workshops: ${error.message}`);
    }

    const workshops = data as Workshop[];

    return { workshops, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred fetching workshops.');
    console.error('fetchWorkshops failed:', error);
    return { workshops: null, error };
  }
}


// Define input type for insert/update
export interface WorkshopInput {
  title: string;
  description?: string | null;
  image_url?: string | null;
  speaker?: string | null;
  related_themes?: string[] | null;
}

/**
 * Fetches a single workshop by its ID.
 * @param id The UUID of the workshop to fetch.
 * @returns An object containing the fetched workshop or an error.
 */
export async function fetchWorkshopById(id: string): Promise<{ workshop: Workshop | null; error: Error | null }> {
  if (!id) {
    return { workshop: null, error: new Error('Workshop ID is required.') };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching workshop with ID ${id}:`, error);
      if (error.code === 'PGRST116') {
        return { workshop: null, error: new Error(`Workshop with ID ${id} not found.`) };
      }
      throw new Error(`Database error fetching workshop ${id}: ${error.message}`);
    }

    return { workshop: data as Workshop, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred fetching workshop ${id}.`);
    console.error(`fetchWorkshopById(${id}) failed:`, error);
    return { workshop: null, error };
  }
}

/**
 * Inserts a new workshop into the database.
 * @param workshopData The data for the new workshop.
 * @returns An object containing the inserted workshop or an error.
 */
export async function insertWorkshop(workshopData: WorkshopInput): Promise<{ workshop: Workshop | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workshops')
      .insert(workshopData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting workshop:', error);
      throw new Error(`Database error inserting workshop: ${error.message}`);
    }

    return { workshop: data as Workshop, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred inserting workshop.');
    console.error('insertWorkshop failed:', error);
    return { workshop: null, error };
  }
}

/**
 * Updates an existing workshop by its ID.
 * @param id The UUID of the workshop to update.
 * @param workshopData The data to update.
 * @returns An object containing the updated workshop or an error.
 */
export async function updateWorkshopById(id: string, workshopData: Partial<WorkshopInput>): Promise<{ workshop: Workshop | null; error: Error | null }> {
  if (!id) {
    return { workshop: null, error: new Error('Workshop ID is required for update.') };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workshops')
      .update(workshopData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating workshop ${id}:`, error);
      throw new Error(`Database error updating workshop ${id}: ${error.message}`);
    }

    return { workshop: data as Workshop, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred updating workshop ${id}.`);
    console.error(`updateWorkshopById(${id}) failed:`, error);
    return { workshop: null, error };
  }
}

/**
 * Deletes a workshop by its ID.
 * @param id The UUID of the workshop to delete.
 * @returns An object containing an error if the deletion failed.
 */
export async function deleteWorkshopById(id: string): Promise<{ error: Error | null }> {
  if (!id) {
    return { error: new Error('Workshop ID is required for deletion.') };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('workshops')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting workshop ${id}:`, error);
      throw new Error(`Database error deleting workshop ${id}: ${error.message}`);
    }

    return { error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred deleting workshop ${id}.`);
    console.error(`deleteWorkshopById(${id}) failed:`, error);
    return { error };
  }
}

// TODO: Implement fetchWorkshopById(id)
// TODO: Implement insertWorkshop(workshopData)
// TODO: Implement updateWorkshopById(id, workshopData)
// TODO: Implement deleteWorkshopById(id)