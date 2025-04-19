import { createClient } from '@/lib/supabase/server'; // Assuming server client needed for updates
import { Database } from '@/lib/supabase/database.types';

export type EventDetails = Database['public']['Tables']['event_details']['Row'];
export type EventDetailsUpdate = Database['public']['Tables']['event_details']['Update'];

// Assuming there's only one row for event details, or we target a specific ID (e.g., 1)
const EVENT_DETAILS_ID = 1;

export async function fetchEventDetails(): Promise<EventDetails | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('event_details')
        .select('*')
        .eq('id', EVENT_DETAILS_ID)
        .single();

    if (error) {
        console.error('Error fetching event details:', error);
        return null;
    }
    return data;
}

export async function updateEventDetails(updates: EventDetailsUpdate): Promise<{ data: EventDetails | null; error: any }> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('event_details')
        .update(updates)
        .eq('id', EVENT_DETAILS_ID)
        .select()
        .single();

    if (error) {
        console.error('Error updating event details:', error);
    }

    return { data, error };
}