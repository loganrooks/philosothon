import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types'; // Use generated types

export type ScheduleItem = Database['public']['Tables']['schedule_items']['Row'];
export type ScheduleItemInsert = Database['public']['Tables']['schedule_items']['Insert'];
export type ScheduleItemUpdate = Database['public']['Tables']['schedule_items']['Update'];

export async function fetchSchedule(): Promise<ScheduleItem[]> {
    const supabase = await createClient(); // Added await
    const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .order('start_time', { ascending: true }); // Order by start time

    if (error) {
        console.error('Error fetching schedule:', error);
        return [];
    }
    return data || [];
}

export async function createScheduleItem(item: ScheduleItemInsert): Promise<{ data: ScheduleItem | null; error: any }> {
    const supabase = await createClient(); // Added await
    const { data, error } = await supabase
        .from('schedule_items')
        .insert(item)
        .select()
        .single();

     if (error) {
        console.error('Error creating schedule item:', error);
    }
    return { data, error };
}

export async function updateScheduleItem(id: number, updates: ScheduleItemUpdate): Promise<{ data: ScheduleItem | null; error: any }> {
    const supabase = await createClient(); // Added await
    const { data, error } = await supabase
        .from('schedule_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

     if (error) {
        console.error('Error updating schedule item:', error);
    }
    return { data, error };
}

export async function deleteScheduleItem(id: number): Promise<{ error: any }> {
    const supabase = await createClient(); // Added await
    const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', id);

     if (error) {
        console.error('Error deleting schedule item:', error);
    }
    return { error };
}