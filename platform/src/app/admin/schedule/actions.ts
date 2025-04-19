'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createScheduleItem as createItemDAL,
  updateScheduleItem as updateItemDAL,
  deleteScheduleItem as deleteItemDAL,
} from '@/lib/data/schedule'; // Use the DAL functions

import { Database } from '@/lib/supabase/database.types'; // Use generated types
type ScheduleItemInsert = Database['public']['Tables']['schedule_items']['Insert'];
type ScheduleItemUpdate = Database['public']['Tables']['schedule_items']['Update'];

// Base schema for common fields
const ScheduleItemBaseSchema = z.object({
  item_date: z.coerce.date({ invalid_type_error: 'Invalid date' }),
  // Basic time validation (HH:MM or HH:MM:SS) - refine if needed
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid start time format (HH:MM or HH:MM:SS)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid end time format (HH:MM or HH:MM:SS)'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  speaker: z.string().optional(),
});

// Schema for creating (no ID needed from form)
const CreateScheduleItemSchema = ScheduleItemBaseSchema;

// Schema for updating (requires ID as string from FormData)
const UpdateScheduleItemSchema = ScheduleItemBaseSchema.extend({
  id: z.string().min(1, 'ID is required'), // Expect ID as string from form
});

// State type for form actions
export type ScheduleItemState = {
  errors?: {
    [key in keyof ScheduleItemInsert | 'id']?: string[];
  } & {
    _form?: string[]; // For general form errors
  };
  message?: string | null;
  success: boolean;
};

// --- CREATE ACTION ---
export async function createScheduleItem(
  prevState: ScheduleItemState | null,
  formData: FormData | Record<string, any>
): Promise<ScheduleItemState> {
  const rawFormData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData;

  const validatedFields = CreateScheduleItemSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log('Validation Errors (Create):', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
      success: false,
    };
  }

  // Prepare data for DAL (ensure dates/times are formatted if needed by DB)
  const dataToInsert: ScheduleItemInsert = {
    ...validatedFields.data,
    item_date: validatedFields.data.item_date.toISOString().split('T')[0], // Format date to YYYY-MM-DD
  };

  try {
    const { error } = await createItemDAL(dataToInsert);
    if (error) throw error;

    revalidatePath('/admin/schedule');
    revalidatePath('/schedule'); // Public schedule page

  } catch (e: any) {
    console.error('DB Create Error:', e);
    return {
      message: `Database Error: Failed to create schedule item. ${e.message}`,
      success: false,
    };
  }

  // Redirect must happen outside try/catch
  redirect('/admin/schedule');
  // Note: redirect() throws an error, so code below it won't execute.
  // We might return success state before redirect if needed, but redirect is typical.
}


// --- UPDATE ACTION ---
export async function updateScheduleItem(
  prevState: ScheduleItemState | null,
  formData: FormData | Record<string, any>
): Promise<ScheduleItemState> {
  const rawFormData = formData instanceof FormData
    ? Object.fromEntries(formData.entries())
    : formData;

  const validatedFields = UpdateScheduleItemSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log('Validation Errors (Update):', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
      success: false,
    };
  }

  // Parse ID after validation
  const idAsNumber = parseInt(validatedFields.data.id, 10);
  if (isNaN(idAsNumber) || idAsNumber <= 0) {
      return { success: false, message: 'Invalid ID provided.', errors: { id: ['Invalid ID format'] } };
  }

  const { id, ...dataToUpdate } = validatedFields.data; // Destructure validated data

  // Prepare data for DAL (ensure dates/times are formatted if needed by DB)
  const updates: ScheduleItemUpdate = {
    ...dataToUpdate, // Spread remaining validated fields
     item_date: dataToUpdate.item_date.toISOString().split('T')[0], // Format date
  };


  try {
    const { error } = await updateItemDAL(idAsNumber, updates); // Use parsed ID
    if (error) throw error;

    revalidatePath('/admin/schedule');
    revalidatePath(`/admin/schedule/edit?id=${id}`); // Revalidate specific edit page
    revalidatePath('/schedule'); // Public schedule page

  } catch (e: any) {
    console.error('DB Update Error:', e);
    return {
      message: `Database Error: Failed to update schedule item. ${e.message}`,
      success: false,
    };
  }

  // Redirect must happen outside try/catch
  redirect('/admin/schedule');
}


// --- DELETE ACTION ---
// This action doesn't use useFormState, it's called directly (e.g., from a button)
// It might return a simple status object or throw errors.
export async function deleteScheduleItem(id: string | number): Promise<{ success: boolean; message?: string }> {
   // Validate ID more robustly
   const idAsNumber = typeof id === 'string' ? parseInt(id, 10) : (typeof id === 'number' ? id : NaN);
   if (isNaN(idAsNumber) || !Number.isInteger(idAsNumber) || idAsNumber <= 0) {
     console.error('Invalid or non-positive integer ID for delete:', id);
     return { success: false, message: 'Invalid ID provided.' };
   }

  try {
    const { error } = await deleteItemDAL(idAsNumber);
    if (error) throw error;

    revalidatePath('/admin/schedule');
    revalidatePath('/schedule'); // Public schedule page
    return { success: true };

  } catch (e: any) {
    console.error('DB Delete Error:', e);
    return {
      message: `Database Error: Failed to delete schedule item. ${e.message}`,
      success: false,
    };
  }
}