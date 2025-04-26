// platform/src/app/admin/auth/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
// Removed signOutUser import from DAL
import { initiateOtpSignIn, signOut} from '@/app/auth/actions'; // Import server actions

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

  // Call the DAL function to initiate OTP sign-in
  // Note: The DAL function now handles getting headers/origin internally
  const { data, error } = await initiateOtpSignIn(email);

  if (error) {
    // Error is already logged in DAL function
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

export async function signOutAdmin() {
    // Call the DAL function to sign out
    const { success, message} = await signOut();

    if (!success) {
        // Error is logged in DAL, but we might want to handle it differently here
        // For now, we still redirect, but maybe show an error message first?
        console.error("Sign out failed in action:", message);
        // Optionally: return an error state if this action used useFormState
    }
    redirect('/admin/login');
}