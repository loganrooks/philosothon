'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod'; // For validation
import { fetchRegistrationByUserId, insertRegistration, RegistrationInput } from '@/lib/data/registrations';
import { Database, Json } from '@/lib/supabase/database.types'; // Import generated types including Json

// Define Zod schema matching FR-REG-005 and data model (spec v1.1)
const RegistrationSchema = z.object({
  // Basic Info
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email({ message: 'Invalid email address.' }), // Email is now part of the form data
  university: z.string().min(1, 'University is required'),
  program: z.string().min(1, 'Program/Major is required'),
  year_of_study: z.coerce.number().int().min(1, 'Year of study is required'),

  // Date Flexibility
  can_attend_may_3_4: z.enum(['yes', 'no', 'maybe']),
  may_3_4_comment: z.string().optional(),

  // Philosophical Background
  prior_courses: z.array(z.string()).optional(),
  discussion_confidence: z.coerce.number().int().min(1).max(10),
  writing_confidence: z.coerce.number().int().min(1).max(10),
  familiarity_analytic: z.coerce.number().int().min(1).max(5),
  familiarity_continental: z.coerce.number().int().min(1).max(5),
  familiarity_other: z.coerce.number().int().min(1).max(5),
  philosophical_traditions: z.array(z.string()).min(1, 'Select at least one tradition'),
  philosophical_interests: z.array(z.string()).min(1, 'Select at least one area of interest'),
  areas_of_interest: z.string().optional(),

  // Theme and Workshop Preferences (Assuming JSON string from hidden input)
  theme_rankings: z.string().transform((str: string, ctx: z.RefinementCtx) => {
    try {
      const parsed = JSON.parse(str);
      const schema = z.array(z.object({
        rank: z.number().int().min(1).max(8),
        theme_id: z.string()
      })).min(8, 'Please rank all themes');
      return schema.parse(parsed);
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid theme ranking format' });
      return z.NEVER;
    }
  }),
  theme_suggestion: z.string().optional(),
  workshop_rankings: z.string().transform((str: string, ctx: z.RefinementCtx) => {
     try {
       const parsed = JSON.parse(str);
       const schema = z.array(z.object({
         rank: z.number().int().min(1).max(8),
         workshop_id: z.string()
       })).refine(
         (workshops: Array<{ rank: number; workshop_id: string }>) => workshops.length >= 3, // Add type here
         { message: 'Please rank at least 3 workshops' }
       );
       return schema.parse(parsed);
     } catch (e) {
       ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid workshop ranking format' });
       return z.NEVER;
     }
   }),

  // Team Formation Preferences
  preferred_working_style: z.enum(['structured', 'exploratory', 'balanced']),
  teammate_similarity: z.coerce.number().int().min(1).max(10),
  skill_writing: z.coerce.number().int().min(1).max(5),
  skill_speaking: z.coerce.number().int().min(1).max(5),
  skill_research: z.coerce.number().int().min(1).max(5),
  skill_synthesis: z.coerce.number().int().min(1).max(5),
  skill_critique: z.coerce.number().int().min(1).max(5),
  mentorship_preference: z.enum(['mentor', 'mentee', 'no_preference']).optional(),
  mentorship_areas: z.string().optional(),
  preferred_teammates: z.string().optional(),
  complementary_perspectives: z.string().optional(),

  // Technical Experience & Accessibility
  familiarity_tech_concepts: z.coerce.number().int().min(1).max(5),
  prior_hackathon_experience: z.preprocess((val: unknown) => String(val).toLowerCase() === 'true', z.boolean()), // Add type here
  prior_hackathon_details: z.string().optional(),
  dietary_restrictions: z.string().optional(),
  accessibility_needs: z.string().optional(),
  additional_notes: z.string().optional(),
  how_heard: z.enum(['email', 'professor', 'friend', 'department', 'social_media', 'other']),
  how_heard_other: z.string().optional(),
}).refine((data: any) => data.how_heard !== 'other' || (data.how_heard === 'other' && data.how_heard_other && data.how_heard_other.length > 0), { // Add type here
  message: 'Please specify how you heard about the event if selecting "Other"',
  path: ['how_heard_other'], // Attach error to the 'other' field
});


// Type for state used by useFormState
export type RegistrationState = {
  errors?: {
    // Use Zod's error map type for better compatibility
    [key: string]: string[] | undefined;
    _form?: string[]; // For general form errors not specific to a field
  };
  message?: string | null;
  success: boolean;
};

export async function createRegistration(
  previousState: RegistrationState, // Corrected type name
  formData: FormData
): Promise<RegistrationState> {
  const supabase = await createClient();
  const headersList = headers();
  const origin = headersList.get('origin');

  // --- Data Processing ---
  // Process form data, handling arrays and special types
  const processedData: Record<string, any> = {};

  // Handle basic fields and potentially duplicated array fields
  formData.forEach((value, key) => {
    // Check if the key indicates an array (e.g., 'prior_courses')
    if (key.endsWith('[]')) { // Or use a more robust check based on known array fields
        const actualKey = key.replace('[]', '');
        if (!processedData[actualKey]) {
            processedData[actualKey] = [];
        }
        processedData[actualKey].push(value);
    } else if (formData.getAll(key).length > 1) {
        // Handle cases where multiple simple inputs have the same name (shouldn't happen with unique IDs)
        // Or handle actual array fields submitted without '[]' convention
        if (!processedData[key]) {
            processedData[key] = formData.getAll(key);
        }
    } else if (!processedData[key]) {
        // Handle single value fields
        processedData[key] = value;
    }
  });

  // Ensure known array fields are arrays even if only one value was submitted
  const arrayFields = ['prior_courses', 'philosophical_traditions', 'philosophical_interests'];
  for (const field of arrayFields) {
      if (processedData[field] && !Array.isArray(processedData[field])) {
          processedData[field] = [processedData[field]];
      } else if (!processedData[field]) {
          processedData[field] = []; // Ensure empty array if nothing selected
      }
  }


  // Extract email early for user check/sign-up
  const email = processedData.email;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { success: false, message: 'Invalid email address provided.' };
  }

  // Validate with Zod
  const validatedFields = RegistrationSchema.safeParse(processedData);

  if (!validatedFields.success) {
    console.log("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const registrationData = validatedFields.data;

  // --- User Handling ---
  let userId: string | null = null;
  let userJustSignedUp = false;

  // Check if user is already logged in
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (session) {
    userId = session.user.id;
    if (session.user.email !== email) {
      return { success: false, message: 'Email does not match logged-in user.' };
    }
  } else {
    // No active session, attempt sign-up with OTP (Magic Link)
    const { data: signUpData, error: signUpError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true, // Create user if they don't exist
        emailRedirectTo: `${origin}/api/auth/callback?next=/register/pending`, // Redirect after email link click
        data: { // Optional: data to be stored in user_metadata on signup
            full_name: registrationData.full_name,
        }
      },
    });

    if (signUpError) {
      console.error("Sign Up Error:", signUpError);
      // Check for specific errors, e.g., user already exists but needs login
      if (signUpError.message.includes('User already registered')) {
         // Optionally try a login OTP instead, or just inform the user
         return { success: false, message: `User already exists. Please log in or use password reset.` };
      }
      return { success: false, message: `Could not initiate sign-up: ${signUpError.message}` };
    }

    userJustSignedUp = true;
    // For new users, user_id will be null initially.
    // We'll insert the registration without it for now.
    // A trigger or subsequent login will link them.
    userId = null;
  }

  // If logged in, check for existing registration
  if (userId) {
    try {
      const { registration: existingRegistration, error: checkError } = await fetchRegistrationByUserId(userId);
      if (checkError) throw checkError;
      if (existingRegistration) {
        return { success: false, message: 'You have already registered.' };
      }
    } catch (error: any) {
      console.error("DB Check Error:", error);
      return { success: false, message: 'Database error checking registration status.' };
    }
  }

  // Prepare data for Supabase insertion (use validated data)
  // Cast needed because Zod output type might differ slightly from DB Insert type (e.g., Date vs string)
  const dataToInsert: RegistrationInput = {
    ...registrationData,
    user_id: userId, // Will be null for new users until confirmed
    // Ensure JSONB fields are correctly typed (Zod transform handles parsing)
    theme_rankings: registrationData.theme_rankings as unknown as Json,
    workshop_rankings: registrationData.workshop_rankings as unknown as Json,
    // Ensure array fields are null if empty, or keep as empty array based on DB column definition
    prior_courses: registrationData.prior_courses?.length ? registrationData.prior_courses : null,
    philosophical_traditions: registrationData.philosophical_traditions, // Required, so should have values
    philosophical_interests: registrationData.philosophical_interests, // Required, so should have values
  };


  // Insert data into Supabase
  try {
    const { error: insertError } = await insertRegistration(dataToInsert);
    if (insertError) throw insertError;

  } catch (error: any) {
    console.error('Registration Insert Error:', error);
    return { success: false, message: `Database Error: Failed to save registration. ${error.message}` };
  }

  // Revalidate relevant paths
  revalidatePath('/admin/registrations'); // Admin view

  // Redirect based on user status
  if (userJustSignedUp) {
    redirect('/register/pending'); // New user needs to check email
  } else {
    redirect('/register/success'); // Logged-in user confirmation
  }

  // Note: Redirect throws an error, so code below is unreachable but good practice
  // return { success: true, message: 'Registration submitted successfully!' };
}

// Placeholder for email sending logic (to be implemented or called via trigger)
// async function sendConfirmationEmail(email: string, name: string) {
//   console.log(`Sending confirmation email to ${email} for ${name}...`);
//   // Add actual email sending logic here using Resend, SendGrid, etc.
// }