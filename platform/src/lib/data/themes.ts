import { createClient, createStaticSupabaseClient } from '@/lib/supabase/server'; // Assuming server-side usage

// Define the Theme type based on usage in actions/pages and specs
// Need to confirm exact fields from schema or existing types if available
export interface Theme {
  id: string; // Assuming UUID
  title: string;
  description: string | null;
  description_expanded: string | null; // Added in content mgmt spec
  image_url: string | null;
  created_at: string; // Assuming timestamp string
  // Add other fields if they exist (e.g., analytic_tradition, continental_tradition from globalContext)
  analytic_tradition: string[] | null;
  continental_tradition: string[] | null;
  relevant_themes: string[] | null; // Assuming this was also part of the schema
}

/**
 * Fetches all themes from the database.
 * Handles potential errors during the fetch operation.
 * @returns An object containing the fetched themes or an error.
 */
export async function fetchThemes(): Promise<{ themes: Theme[] | null; error: Error | null }> {
  try {
    // Use the static client for SSG/ISR pages like public themes list
    const supabase = createStaticSupabaseClient();
    const { data, error } = await supabase
      .from('themes')
      .select('*') // Select all columns for now
      .order('title', { ascending: true }); // Example ordering

    if (error) {
      console.error('Error fetching themes:', error);
      // Throw a more specific error or handle based on error code if needed
      throw new Error(`Database error fetching themes: ${error.message}`);
    }

    // Ensure data matches the Theme interface (basic check)
    // Add more robust validation/transformation if necessary
    const themes = data as Theme[];

    return { themes, error: null };
  } catch (err) {
    // Catch potential errors from createClient or other issues
    const error = err instanceof Error ? err : new Error('An unknown error occurred fetching themes.');
    console.error('fetchThemes failed:', error);
    return { themes: null, error };
  }
}

/**
 * Fetches a single theme by its ID.
 * @param id The UUID of the theme to fetch.
 * @returns An object containing the fetched theme or an error.
 */
export async function fetchThemeById(id: string): Promise<{ theme: Theme | null; error: Error | null }> {
  if (!id) {
    return { theme: null, error: new Error('Theme ID is required.') };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('themes')
      .select('*') // Select all columns
      .eq('id', id)
      .single(); // Expect only one result

    if (error) {
      console.error(`Error fetching theme with ID ${id}:`, error);
      // Handle not found specifically if needed (error.code === 'PGRST116')
      if (error.code === 'PGRST116') {
        return { theme: null, error: new Error(`Theme with ID ${id} not found.`) };
      }
      throw new Error(`Database error fetching theme ${id}: ${error.message}`);
    }

    // Ensure data matches the Theme interface
    const theme = data as Theme;

    return { theme, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred fetching theme ${id}.`);
    console.error(`fetchThemeById(${id}) failed:`, error);
    return { theme: null, error };
  }
}

// Define input type for insert/update, excluding generated fields
// Based on ThemeForm and actions.ts Zod schema
export interface ThemeInput {
  title: string;
  description?: string | null;
  description_expanded?: string | null;
  image_url?: string | null;
  analytic_tradition?: string[] | null;
  continental_tradition?: string[] | null;
  // Add other mutable fields if necessary
}

/**
 * Inserts a new theme into the database.
 * @param themeData The data for the new theme.
 * @returns An object containing the inserted theme or an error.
 */
export async function insertTheme(themeData: ThemeInput): Promise<{ theme: Theme | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    // Add validation here if needed, or assume validated by caller (Server Action)
    const { data, error } = await supabase
      .from('themes')
      .insert(themeData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting theme:', error);
      throw new Error(`Database error inserting theme: ${error.message}`);
    }

    return { theme: data as Theme, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred inserting theme.');
    console.error('insertTheme failed:', error);
    return { theme: null, error };
  }
}

/**
 * Updates an existing theme by its ID.
 * @param id The UUID of the theme to update.
 * @param themeData The data to update.
 * @returns An object containing the updated theme or an error.
 */
export async function updateThemeById(id: string, themeData: Partial<ThemeInput>): Promise<{ theme: Theme | null; error: Error | null }> {
   if (!id) {
    return { theme: null, error: new Error('Theme ID is required for update.') };
  }
  try {
    const supabase = await createClient();
    // Add validation here if needed
    const { data, error } = await supabase
      .from('themes')
      .update(themeData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating theme ${id}:`, error);
      throw new Error(`Database error updating theme ${id}: ${error.message}`);
    }

    return { theme: data as Theme, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred updating theme ${id}.`);
    console.error(`updateThemeById(${id}) failed:`, error);
    return { theme: null, error };
  }
}

/**
 * Deletes a theme by its ID.
 * @param id The UUID of the theme to delete.
 * @returns An object containing an error if the deletion failed.
 */
export async function deleteThemeById(id: string): Promise<{ error: Error | null }> {
   if (!id) {
    return { error: new Error('Theme ID is required for deletion.') };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting theme ${id}:`, error);
      throw new Error(`Database error deleting theme ${id}: ${error.message}`);
    }

    return { error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred deleting theme ${id}.`);
    console.error(`deleteThemeById(${id}) failed:`, error);
    return { error };
  }
}