'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateEventDetails } from '@/lib/data/event'; // Use the DAL function
import { Database } from '@/lib/supabase/database.types'; // Use generated types
type EventDetailsUpdate = Database['public']['Tables']['event_details']['Update'];

// Define the schema based on expected form data and potential DB structure
// Adjust types (e.g., z.coerce.date()) as needed based on the actual DB schema
const EventSettingsSchema = z.object({
  event_name: z.string().min(1, 'Event name is required'),
  start_date: z.coerce.date({ invalid_type_error: 'Invalid start date' }),
  end_date: z.coerce.date({ invalid_type_error: 'Invalid end date' }),
  location: z.string().min(1, 'Location is required'),
  registration_deadline: z.coerce.date({ invalid_type_error: 'Invalid registration deadline' }),
  submission_deadline: z.coerce.date({ invalid_type_error: 'Invalid submission deadline' }),
  contact_email: z.string().email('Invalid email address'),
  // Add any other fields from the event_details table that are editable here
});

export type EventSettingsState = {
  errors?: {
    [key: string]: string[] | undefined; // Temporary placeholder type
  } & {
    _form?: string[]; // For general form errors
  };
  message?: string | null;
  success: boolean;
};

export async function updateEventSettings(
  prevState: EventSettingsState | null, // Previous state from useFormState
  formData: FormData | Record<string, any> // Can accept FormData or plain object for testing
): Promise<EventSettingsState> {

  // Convert FormData to plain object if necessary
  const rawFormData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData;

  const validatedFields = EventSettingsSchema.safeParse(rawFormData);

  // If validation fails, return errors early.
  if (!validatedFields.success) {
    console.log('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
      success: false,
    };
  }

  // Prepare data for the DAL function (use validated data)
  const dataToUpdate: EventDetailsUpdate = {
    // Spread non-date fields first
    event_name: validatedFields.data.event_name,
    location: validatedFields.data.location,
    contact_email: validatedFields.data.contact_email,
    // Convert dates to ISO strings for Supabase
    start_date: validatedFields.data.start_date.toISOString(),
    end_date: validatedFields.data.end_date.toISOString(),
    registration_deadline: validatedFields.data.registration_deadline.toISOString(),
    submission_deadline: validatedFields.data.submission_deadline.toISOString(),
    // start_date: validatedFields.data.start_date.toISOString(),
    // end_date: validatedFields.data.end_date.toISOString(),
    // registration_deadline: validatedFields.data.registration_deadline.toISOString(),
    // submission_deadline: validatedFields.data.submission_deadline.toISOString(),
  };

  try {
    const { error } = await updateEventDetails(dataToUpdate);

    if (error) {
      console.error('DB Update Error:', error);
      return {
        message: `Database Error: Failed to update event settings. ${error.message}`,
        success: false,
      };
    }

    // Revalidate paths that display event details
    revalidatePath('/');
    revalidatePath('/schedule'); // Assuming schedule page might show dates
    revalidatePath('/admin/settings'); // Revalidate the admin page itself

    return { message: 'Event settings updated successfully.', success: true };

  } catch (e) {
    console.error('Unexpected Error:', e);
    return {
      message: 'An unexpected error occurred.',
      success: false,
    };
  }
}