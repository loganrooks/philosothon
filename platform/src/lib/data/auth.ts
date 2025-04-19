import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers'; // Needed for origin in OTP flow

/**
 * Initiates the Supabase Magic Link (OTP) sign-in process.
 * @param email The user's email address.
 * @returns An object containing data or an error from the Supabase client.
 */
export async function initiateOtpSignIn(email: string): Promise<{ data: any; error: Error | null }> {
  if (!email || !email.includes('@')) {
    return { data: null, error: new Error('Invalid email address provided.') };
  }

  try {
    const supabase = await createClient();
    const headersList = headers();
    const origin = headersList.get('origin');

    // Use a generic callback path, the actual redirect happens after callback processing
    const redirectUrl = `${origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true, // Allow sign-up
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Error initiating OTP sign-in:', error);
      throw new Error(`Supabase OTP sign-in error: ${error.message}`);
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred during OTP sign-in initiation.');
    console.error('initiateOtpSignIn failed:', error);
    return { data: null, error };
  }
}

/**
 * Signs out the current user from Supabase.
 * @returns An object containing an error if sign-out failed.
 */
export async function signOutUser(): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw new Error(`Supabase sign-out error: ${error.message}`);
    }

    return { error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred during sign-out.');
    console.error('signOutUser failed:', error);
    return { error };
  }
}

// Note: exchangeCodeForSession is typically handled in the /auth/callback route handler directly,
// as it needs the request object. It might not fit cleanly into this server-side DAL.