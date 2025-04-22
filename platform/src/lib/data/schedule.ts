import { createClient, createStaticSupabaseClient } from '@/lib/supabase/server';
import { debug } from 'console';

// Define the ScheduleItem interface to match the database schema
export interface ScheduleItem {
  id: number;
  title: string;
  description: string | null;
  start_time: string; // ISO timestamp
  end_time: string | null; // ISO timestamp
  location: string | null;
  speaker: string | null;
  item_date: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Define input type for insert operations
export interface ScheduleItemInput {
  title: string;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  speaker?: string | null;
  item_date: string;
}

/**
 * Fetches all schedule items from the database.
 * Handles potential errors during the fetch operation.
 * @returns An object containing the fetched schedule items or an error.
 */
export async function fetchSchedule(): Promise<{ scheduleItems: ScheduleItem[] | null; error: Error | null }> {
    try {
        // Use the static client for SSG/ISR pages like public schedule
        const supabase = createStaticSupabaseClient();
        const { data, error } = await supabase
            .from('schedule_items')
            .select('*')
            .order('start_time', { ascending: true }); // Order by start time
   

        if (error) {
            console.error('Error fetching schedule:', error);
            throw new Error(`Database error fetching schedule: ${error.message}`);
        }
        const scheduleItems = data as ScheduleItem[];

        console.log('Fetched schedule items:', scheduleItems); // Debug log
        return { scheduleItems: scheduleItems || [], error: null };
    } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred fetching schedule items.');
        console.error('fetchSchedule failed:', error);
        return { scheduleItems: null, error };
    }
}

/**
 * Creates a new schedule item in the database.
 * @param item The data for the new schedule item.
 * @returns An object containing the created schedule item or an error.
 */
export async function createScheduleItem(item: ScheduleItemInput): Promise<{ scheduleItem: ScheduleItem | null; error: Error | null }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('schedule_items')
            .insert(item)
            .select()
            .single();

        if (error) {
            console.error('Error creating schedule item:', error);
            throw new Error(`Database error creating schedule item: ${error.message}`);
        }

        return { scheduleItem: data as ScheduleItem, error: null };
    } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred creating schedule item.');
        console.error('createScheduleItem failed:', error);
        return { scheduleItem: null, error };
    }
}

/**
 * Updates an existing schedule item by its ID.
 * @param id The ID of the schedule item to update.
 * @param updates The data to update.
 * @returns An object containing the updated schedule item or an error.
 */
export async function updateScheduleItem(id: number, updates: Partial<ScheduleItemInput>): Promise<{ scheduleItem: ScheduleItem | null; error: Error | null }> {
    if (!id) {
        return { scheduleItem: null, error: new Error('Schedule Item ID is required for update.') };
    }
    
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('schedule_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`Error updating schedule item ${id}:`, error);
            throw new Error(`Database error updating schedule item ${id}: ${error.message}`);
        }

        return { scheduleItem: data as ScheduleItem, error: null };
    } catch (err) {
        const error = err instanceof Error ? err : new Error(`An unknown error occurred updating schedule item ${id}.`);
        console.error(`updateScheduleItem(${id}) failed:`, error);
        return { scheduleItem: null, error };
    }
}

/**
 * Deletes a schedule item by its ID.
 * @param id The ID of the schedule item to delete.
 * @returns An object containing an error if the deletion failed.
 */
export async function deleteScheduleItem(id: number): Promise<{ error: Error | null }> {
    if (!id) {
        return { error: new Error('Schedule Item ID is required for deletion.') };
    }
    
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('schedule_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Error deleting schedule item ${id}:`, error);
            throw new Error(`Database error deleting schedule item ${id}: ${error.message}`);
        }

        return { error: null };
    } catch (err) {
        const error = err instanceof Error ? err : new Error(`An unknown error occurred deleting schedule item ${id}.`);
        console.error(`deleteScheduleItem(${id}) failed:`, error);
        return { error };
    }
}