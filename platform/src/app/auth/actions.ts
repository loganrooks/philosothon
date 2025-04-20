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

export async function signUpUser(credentials: { email: string; password: string }): Promise<AuthActionResult> {
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
      // You can add additional user metadata here if needed
      // data: { full_name: 'Initial Name', ... }
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