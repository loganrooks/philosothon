import { createClient } from '@/lib/supabase/server';

// Define the Profile type based on usage in middleware and specs
// Need to confirm exact fields from schema or existing types if available
export interface Profile {
  id: string; // UUID, matches auth.users.id
  role: 'admin' | 'participant' | 'judge' | 'team_member'; // Assuming user_role ENUM
  // Add other profile fields if they exist (e.g., name, team_id)
  full_name: string | null;
  team_id: string | null; // Assuming UUID
  created_at: string; // Assuming timestamp string
  updated_at: string; // Assuming timestamp string
}

/**
 * Fetches a user's profile by their user ID (usually from auth session).
 * Handles potential errors during the fetch operation.
 * @param userId The UUID of the user (from auth.users.id).
 * @returns An object containing the fetched profile or an error.
 */
export async function fetchUserProfile(userId: string): Promise<{ profile: Profile | null; error: Error | null }> {
  if (!userId) {
    return { profile: null, error: new Error('User ID is required to fetch profile.') };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      // Handle not found specifically if needed (error.code === 'PGRST116')
      if (error.code === 'PGRST116') {
        // This might indicate a missing profile row for a valid auth user
        return { profile: null, error: new Error(`Profile not found for user ${userId}.`) };
      }
      throw new Error(`Database error fetching profile ${userId}: ${error.message}`);
    }

    return { profile: data as Profile, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`An unknown error occurred fetching profile ${userId}.`);
    console.error(`fetchUserProfile(${userId}) failed:`, error);
    return { profile: null, error };
  }
}

// TODO: Implement insertProfile (likely handled by trigger on auth.users insert)
// TODO: Implement updateProfileById