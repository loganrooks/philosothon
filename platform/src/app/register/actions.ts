'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server'; // Use server client
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
// Import the actual DAL functions
import { fetchRegistrationByUserId, insertRegistration, RegistrationInput } from '@/lib/data/registrations';
// import { findUserByEmail } from '@/lib/data/auth'; // Keep commented if not used yet

// Define the state structure returned by the action
export interface RegistrationState {
  success: boolean;
  message: string | null;
  errors?: Record<string, string[]> | null; // Make errors optional
}

// Define the Zod schema based on the test file's MockRegistrationSchema
// Note: In a real scenario, this would likely live in a shared types/schemas file
const RegistrationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }), // Added email validation
  full_name: z.string().min(1, { message: 'Full Name is required.' }),
  university: z.string().min(1, { message: 'University is required.' }),
  program: z.string().min(1, { message: 'Program is required.' }),
  year_of_study: z.coerce.number({ invalid_type_error: 'Year must be a number.'}).int().min(1, { message: 'Year must be at least 1.' }),
  can_attend_may_3_4: z.enum(['yes', 'no', 'maybe'], { required_error: 'Attendance selection is required.'}),
  may_3_4_comment: z.string().optional(),
  prior_courses: z.array(z.string()).optional(), // Assuming checkboxes send multiple values
  familiarity_analytic: z.coerce.number().int().min(1).max(5),
  familiarity_continental: z.coerce.number().int().min(1).max(5),
  familiarity_other: z.coerce.number().int().min(1).max(5),
  areas_of_interest: z.string().optional(),
  preferred_working_style: z.enum(['structured', 'exploratory', 'balanced'], { required_error: 'Working style selection is required.'}),
  skill_writing: z.coerce.number().int().min(1).max(5),
  skill_speaking: z.coerce.number().int().min(1).max(5),
  skill_research: z.coerce.number().int().min(1).max(5),
  skill_synthesis: z.coerce.number().int().min(1).max(5),
  skill_critique: z.coerce.number().int().min(1).max(5),
  preferred_teammates: z.string().optional(),
  complementary_perspectives: z.string().optional(),
  familiarity_tech_concepts: z.coerce.number().int().min(1).max(5),
  // Handle boolean conversion for checkbox/radio
  prior_hackathon_experience: z.preprocess((val) => String(val).toLowerCase() === 'true' || val === 'on', z.boolean()),
  prior_hackathon_details: z.string().optional(),
  accessibility_needs: z.string().optional(),
});


export async function createRegistration(
  prevState: RegistrationState,
  formData: FormData
): Promise<RegistrationState> {
  const supabase = await createClient(); // Use the server client helper

  // 1. Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Session Error:', sessionError);
    return { success: false, message: 'Error fetching user session.', errors: null };
  }
  const user = session?.user;
  const userId = user?.id;
  const userEmail = user?.email;

  // 2. Prepare data object from FormData
  const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
        // Handle array fields (like checkboxes)
        if (rawData.hasOwnProperty(key)) {
            if (!Array.isArray(rawData[key])) {
                rawData[key] = [rawData[key]]; // Convert existing value to array
            }
            rawData[key].push(value);
        } else {
            rawData[key] = value;
        }
    });

  // Add email if not present in form (e.g., if user is logged in)
  if (!rawData.email && userEmail) {
      rawData.email = userEmail;
  }

  // 3. Validate data using Zod schema
  const validatedFields = RegistrationSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    console.error('Validation Errors:', fieldErrors);
    // Prioritize returning the specific email error message if it exists
    const specificMessage = fieldErrors.email?.[0] ?? 'Validation failed. Please check the fields.';
    return {
      success: false,
      message: specificMessage,
      errors: fieldErrors,
    };
  }

  const registrationData = validatedFields.data;

  // 4. Check email consistency if logged in
  if (user && userEmail && registrationData.email !== userEmail) {
    return { success: false, message: 'Email does not match logged-in user.', errors: null };
  }

  // 5. Check if logged-in user is already registered
  if (userId) {
    try {
      // Use DAL function
      const { registration: existingRegistration, error: checkError } = await fetchRegistrationByUserId(userId);

      if (checkError) throw checkError; // Let catch block handle DB errors

      if (existingRegistration) {
        return { success: false, message: 'You have already registered.', errors: null };
      }
    } catch (error: any) {
      console.error('DB Check Error:', error);
      return { success: false, message: 'Database error checking registration status.', errors: null };
    }
  }

  // 6. Handle new user sign-up if not logged in
  let newUserId: string | undefined = userId; // Use existing ID if logged in
  if (!user) {
    const origin = headers().get('origin'); // Needed for OTP redirect
    const { error: signUpError } = await supabase.auth.signInWithOtp({
      email: registrationData.email,
      options: {
        // emailRedirectTo: `${origin}/auth/callback`, // Specify where to redirect after email confirmation
        // shouldCreateUser: true, // Ensure user is created if they don't exist
        data: { // Optional: data to be stored in user_metadata on signup
            full_name: registrationData.full_name,
            // Add other relevant metadata if needed
        }
      },
    });

    if (signUpError) {
      console.error('Sign Up Error:', signUpError);
      return { success: false, message: `Could not initiate sign-up: ${signUpError.message}`, errors: null };
    }
    // For new users, user_id will be null initially until they confirm via OTP.
    // The registration record will be created without user_id for now.
    // A trigger/function could link them later, or the user confirms after logging in.
    newUserId = undefined;
  }


  // 7. Insert registration data
  try {
    const dataToInsert = {
      ...registrationData,
      user_id: newUserId, // Will be undefined for new users until confirmed
      // Ensure JSONB fields are correctly formatted if needed (Zod handles basic types)
      prior_courses: registrationData.prior_courses || null, // Ensure null if undefined
    };

    // Use DAL function
    const { error: insertError } = await insertRegistration(dataToInsert as RegistrationInput); // Cast to Input type

    if (insertError) throw insertError; // Let catch block handle DB errors

  } catch (error: any) {
    console.error('DB Insert Error:', error);
    // Provide specific error message from DB if possible and safe
    // Ensure the error state is explicitly returned
    return { success: false, message: `Database Error: Failed to save registration. ${error.message}`, errors: null };
  }

  // 8. Trigger confirmation email (Placeholder - implement actual call)
  // try {
  //   await sendConfirmationEmail(registrationData.email, registrationData.full_name);
  // } catch (emailError) {
  //   console.error("Failed to send confirmation email:", emailError);
  //   // Decide if this should be a blocking error or just logged
  // }

  // 9. Revalidate relevant paths
  revalidatePath('/admin/registrations'); // Admin view
  // revalidatePath('/some/other/path'); // If needed

  // 10. Redirect based on user status
  if (user) {
    redirect('/register/success'); // Logged-in user confirmation
  } else {
    redirect('/register/pending'); // New user needs to check email
  }

  // 11. Return success (though redirect usually happens first)
  // This return might not be reached due to redirect, but included for completeness
  // return { success: true, message: 'Registration submitted successfully!', errors: null };
}