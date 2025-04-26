'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation'; // May not be needed for basic tests, but good practice
import { headers } from 'next/headers'; // Needed for origin in resetPassword

// Define a common return type for actions
export type AuthActionResult = {
  success: boolean;
  message: string;
  userId?: string; // Include userId on successful signup
};

export async function signInWithPassword(credentials: { email: string; password: string }): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    console.error('Sign In Error:', error);
    return { success: false, message: error.message };
  }

  // In a real app, you might revalidate paths or redirect here
  // revalidatePath('/', 'layout'); // Revalidate root layout
  // redirect('/dashboard'); // Or wherever the user should go

  return { success: true, message: 'Sign in successful.' };
}

export async function signUpUser(credentials: { email: string; password: string; firstName?: string; lastName?: string }): Promise<AuthActionResult> {
  const supabase = await createClient();
  const headersList = headers();
  const origin = headersList.get('origin'); // Get origin for email redirect

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      // Email confirmation redirection link
      // It's important to verify this path exists in your app routes
      emailRedirectTo: `${origin}/auth/callback`, // Or a specific confirmation page
      // Pass first_name and last_name in metadata
      data: {
        first_name: credentials.firstName,
        last_name: credentials.lastName
      }
    },
  });

  if (error) {
    console.error('Sign Up Error:', error);
    return { success: false, message: error.message };
  }

  // Important: Supabase sends a confirmation email by default.
  // The user needs to click the link in the email to confirm their account.
  // You might want to redirect to a page telling them to check their email.

  // Return user ID if available (might be null until confirmed depending on settings)
  const userId = data.user?.id;
  return { success: true, message: 'User created successfully. Please check your email to confirm.', userId };
}

export async function signOut(): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign Out Error:', error);
    return { success: false, message: error.message };
  }

  // In a real app, you would typically redirect after sign out
  // redirect('/login');

  return { success: true, message: 'Sign out successful.' };
}

export async function requestPasswordReset(credentials: { email: string }): Promise<AuthActionResult> {
    const supabase = await createClient();
    const headersList = headers();
    const origin = headersList.get('origin'); // Get origin for email redirect

    // Ensure the redirect path exists in your application
    const redirectUrl = `${origin}/reset-password`; // A page where the user can set a new password

    const { data, error } = await supabase.auth.resetPasswordForEmail(credentials.email, {
        redirectTo: redirectUrl,
    });

    if (error) {
        console.error('Password Reset Error:', error);
        return { success: false, message: error.message };
    }

    return { success: true, message: 'Password reset email sent.' };
}

/**
 * Initiates the Supabase Magic Link (OTP) sign-in process.
 * @param email The user's email address.
 * @returns An object containing data or an error from the Supabase client.
 */
export async function initiateOtpSignIn(email: string): Promise<{ data: any; error: Error | null }> {
  if (!email || !email.includes('@')) {
    // Return a structure consistent with AuthActionResult if possible, or keep original for now
    // Let's keep original for minimal change, but ideally align return types later.
    return { data: null, error: new Error('Invalid email address provided.') };
  }

  try {
    const supabase = await createClient();
    const headersList = headers(); // headers() is allowed here ('use server')
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
      // Consider returning AuthActionResult structure
      // return { success: false, message: `Supabase OTP sign-in error: ${error.message}` };
      throw new Error(`Supabase OTP sign-in error: ${error.message}`); // Keep original throw for now
    }

    // Consider returning AuthActionResult structure
    // return { success: true, message: 'OTP sign-in initiated successfully.' };
    return { data, error: null }; // Keep original return for now
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred during OTP sign-in initiation.');
    console.error('initiateOtpSignIn failed:', error);
    // Consider returning AuthActionResult structure
    // return { success: false, message: error.message };
    return { data: null, error }; // Keep original return for now
  }
}

// Placeholder function to check user verification status
// TODO: Implement actual Supabase check for user.email_confirmed_at
export async function checkUserVerificationStatus(): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  // In a real scenario, check user.email_confirmed_at or similar
  // For now, assume verified if user exists after potential confirmation click
  const isVerified = !!user.email_confirmed_at; // Or simply check if user exists if auto-confirmation is on

  if (isVerified) {
      return { success: true, message: 'User is verified.' };
  } else {
      return { success: false, message: 'User email not confirmed yet.' };
  }
}

// Function to resend the confirmation email
export async function resendConfirmationEmail(credentials: { email: string }): Promise<AuthActionResult> {
  const supabase = await createClient();

  // Use the resend method for the signup type
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: credentials.email,
  });

  if (error) {
    console.error('Resend Confirmation Error:', error);
    // Provide a more specific error message if possible
    return { success: false, message: `Failed to resend confirmation email: ${error.message}` };
  }

  // Check if data indicates success (Supabase v2 might return data object on success)
  // console.log('Resend Confirmation Data:', data);

  return { success: true, message: 'Confirmation email resent successfully. Please check your inbox.' };
}
