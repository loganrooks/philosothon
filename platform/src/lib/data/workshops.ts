import { createClient } from '@/lib/supabase/server';

// Define the type for a workshop (consider moving to a central types file if used elsewhere)
export interface Workshop {
  id: string;
  created_at: string;
  title: string;
  description: string;
  relevant_themes: string[] | null; // Updated for JSONB array
  facilitator: string | null;
  max_capacity: number | null;
}

export async function fetchWorkshops(): Promise<Workshop[]> {
  // console.log('Attempting to create Supabase client in fetchWorkshops...'); // Temporary log for debugging
  const supabase = await createClient();
  // console.log('Supabase client created in fetchWorkshops.'); // Temporary log for debugging

  // console.log('Fetching workshops from Supabase...'); // Temporary log for debugging
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Database error fetching workshops:', error);
    // Re-throw the error to be handled by the calling component or a higher-level error boundary
    // Consider more specific error handling or logging here
    throw new Error(`Failed to fetch workshops: ${error.message}`);
  }

  // console.log(`Fetched ${data?.length ?? 0} workshops.`); // Temporary log for debugging
  // Return the fetched workshops or an empty array if data is null/undefined
  return data || [];
}