import { createClient } from '@/lib/supabase/server';

// Define the FaqItem type based on usage in actions/pages
// Need to confirm exact fields from schema or existing types if available
export interface FaqItem {
  id: string; // Assuming UUID
  question: string;
  answer: string;
  display_order: number | null;
  created_at: string; // Assuming timestamp string
}

/**
 * Fetches all FAQ items from the database.
 * Handles potential errors during the fetch operation.
 * @returns An object containing the fetched FAQ items or an error.
 */
export async function fetchFaqItems(): Promise<{ faqItems: FaqItem[] | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false }) // Example ordering
      .order('created_at', { ascending: true }); // Secondary sort

    if (error) {
      console.error('Error fetching FAQ items:', error);
      throw new Error(`Database error fetching FAQ items: ${error.message}`);
    }

    const faqItems = data as FaqItem[];

    return { faqItems, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred fetching FAQ items.');
    console.error('fetchFaqItems failed:', error);
    return { faqItems: null, error };
  }
}

// Define input type for insert/update
export interface FaqItemInput {
  question: string;
  answer: string;
  display_order?: number | null;
  // Removed category as it's not in the FaqItem type
}

/**
 * Fetches a single FAQ item by its ID.
 * @param id The UUID of the FAQ item to fetch.
 * @returns An object containing the fetched FAQ item or an error.
 */
export async function fetchFaqItemById(id: string): Promise<{ faqItem: FaqItem | null; error: Error | null }> {
  if (!id) {
    return { faqItem: null, error: new Error('FAQ Item ID is required.') };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching FAQ item with ID ${id}:`, error);
      if (error.code === 'PGRST116') {
        return { faqItem: null, error: new Error(`FAQ item with ID ${id} not found.`) };
      }
      throw new Error(`Database error fetching FAQ item ${id}: ${error.message}`);
    }

    return { faqItem: data as FaqItem, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred fetching FAQ item ${id}.`);
    console.error(`fetchFaqItemById(${id}) failed:`, error);
    return { faqItem: null, error };
  }
}

/**
 * Inserts a new FAQ item into the database.
 * @param faqData The data for the new FAQ item.
 * @returns An object containing the inserted FAQ item or an error.
 */
export async function insertFaqItem(faqData: FaqItemInput): Promise<{ faqItem: FaqItem | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('faq_items')
      .insert(faqData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting FAQ item:', error);
      throw new Error(`Database error inserting FAQ item: ${error.message}`);
    }

    return { faqItem: data as FaqItem, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred inserting FAQ item.');
    console.error('insertFaqItem failed:', error);
    return { faqItem: null, error };
  }
}

/**
 * Updates an existing FAQ item by its ID.
 * @param id The UUID of the FAQ item to update.
 * @param faqData The data to update.
 * @returns An object containing the updated FAQ item or an error.
 */
export async function updateFaqItemById(id: string, faqData: Partial<FaqItemInput>): Promise<{ faqItem: FaqItem | null; error: Error | null }> {
  if (!id) {
    return { faqItem: null, error: new Error('FAQ Item ID is required for update.') };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('faq_items')
      .update(faqData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating FAQ item ${id}:`, error);
      throw new Error(`Database error updating FAQ item ${id}: ${error.message}`);
    }

    return { faqItem: data as FaqItem, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred updating FAQ item ${id}.`);
    console.error(`updateFaqItemById(${id}) failed:`, error);
    return { faqItem: null, error };
  }
}

/**
 * Deletes an FAQ item by its ID.
 * @param id The UUID of the FAQ item to delete.
 * @returns An object containing an error if the deletion failed.
 */
export async function deleteFaqItemById(id: string): Promise<{ error: Error | null }> {
  if (!id) {
    return { error: new Error('FAQ Item ID is required for deletion.') };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('faq_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting FAQ item ${id}:`, error);
      throw new Error(`Database error deleting FAQ item ${id}: ${error.message}`);
    }

    return { error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred deleting FAQ item ${id}.`);
    console.error(`deleteFaqItemById(${id}) failed:`, error);
    return { error };
  }
}