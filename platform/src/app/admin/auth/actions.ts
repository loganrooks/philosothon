// platform/src/app/admin/auth/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Define schema for form validation
const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

// Define state structure for useFormState
export interface LoginFormState {
  message: string | null;
  success: boolean;
}

export async function signInWithOtp(
  prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get('email'),
  });

  // Return early if validation fails
  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.email?.[0] ?? 'Invalid input.',
      success: false,
    };
  }

  const email = validatedFields.data.email;
  const origin = (await headers()).get('origin'); // Get the origin URL for the redirect

  if (!origin) {
    return {
      message: 'Could not determine redirect origin.',
      success: false,
    };
  }

  const supabase = await createClient(); // Added await

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // shouldValidate: false, // Set to true if you want to send the OTP only if the user exists
      emailRedirectTo: `${origin}/auth/callback`, // URL to redirect to after email confirmation
    },
  });

  if (error) {
    console.error('Supabase OTP Error:', error);
    return {
      message: error.message || 'Could not authenticate user. Please try again.',
      success: false,
    };
  }

  // A success message can be shown to the user, prompting them to check their email.
  return {
    message: 'Check your email for the magic link!',
    success: true,
  };
}

export async function signOut() {
    const supabase = await createClient(); // Added await
    await supabase.auth.signOut();
    redirect('/admin/login');
}