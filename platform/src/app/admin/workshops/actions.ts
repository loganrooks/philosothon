// platform/src/app/admin/workshops/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  insertWorkshop,
  updateWorkshopById,
  deleteWorkshopById,
  type WorkshopInput,
} from '@/lib/data/workshops'; // Import DAL functions and type

// Define Zod schema for validation (aligned with WorkshopInput)
const WorkshopSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: 'Title is required.' }),
  description: z.string().nullable().optional(),
  related_themes: z.string().nullable().optional().refine((val) => { // Changed from relevant_themes
    if (!val || val.trim() === '' || val.trim() === '[]') return true;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string');
    } catch { return false; }
  }, { message: 'Invalid JSON format for Related Themes (must be an array of strings like ["id1", "id2"]).' }).optional(),
  speaker: z.string().nullable().optional(), // Changed from facilitator
  // Removed max_capacity as it's not in the DAL Workshop type
});


// Define state structure for useFormState (aligned with schema)
export interface WorkshopFormState {
  message: string | null;
  errors?: {
    title?: string[];
    description?: string[];
    related_themes?: string[]; // Changed
    speaker?: string[]; // Changed
    // Removed max_capacity
    general?: string;
  };
  success: boolean;
}

// Helper function to parse JSON array fields (same as in themes/actions)
function parseJsonArray(jsonString: string | undefined | null): string[] | null {
   if (!jsonString || jsonString.trim() === '' || jsonString.trim() === '[]') return null;
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      // Ensure only non-empty strings are kept
      return parsed.filter(item => typeof item === 'string' && item.trim() !== '');
    }
    console.warn('Parsed JSON is not an array:', parsed);
    return null;
  } catch (e) {
    console.error('Failed to parse JSON array:', e);
    return null;
  }
}

// --- Server Action: createWorkshop ---
export async function createWorkshop(
  prevState: WorkshopFormState,
  formData: FormData,
): Promise<WorkshopFormState> {

  // Manually prepare data for parsing, especially for potentially null/empty number fields
   const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    related_themes: formData.get('related_themes'), // Changed
    speaker: formData.get('speaker'), // Changed
    // Removed max_capacity
  };


  const validatedFields = WorkshopSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.log('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // Use the validated data
  const { title, description, related_themes, speaker } = validatedFields.data;

  const relatedThemesArray = parseJsonArray(related_themes);

  // Check if JSON parsing failed
  if (related_themes && relatedThemesArray === null) {
     console.log('Related Themes JSON Parse Failed:', related_themes);
     return { message: 'Invalid JSON format for Related Themes.', errors: { related_themes: ['Invalid JSON format. Must be like ["theme_id_1", "theme_id_2"].'] }, success: false };
  }

  // Prepare data for DAL
  const workshopData: WorkshopInput = {
    title: title,
    description: description,
    related_themes: relatedThemesArray,
    speaker: speaker,
    // image_url is not handled by this form currently
  };

  // Call DAL function
  const { workshop, error } = await insertWorkshop(workshopData);

  if (error) {
    // Error logged in DAL
    return {
      message: error.message || 'Database error: Failed to create workshop.',
      errors: { general: error.message },
      success: false,
    };
  }

  revalidatePath('/admin/workshops');
  return { message: 'Workshop created successfully!', success: true, errors: {} };
}

// --- Server Action: updateWorkshop ---
export async function updateWorkshop(
  prevState: WorkshopFormState,
  formData: FormData,
): Promise<WorkshopFormState> {
   const id = formData.get('id') as string | null;

   if (!id) {
       return { message: 'Workshop ID is missing.', success: false, errors: { general: 'Workshop ID missing.'} };
   }

   // Manually prepare data for parsing
   const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    related_themes: formData.get('related_themes'), // Changed
    speaker: formData.get('speaker'), // Changed
    // Removed max_capacity
  };

  const validatedFields = WorkshopSchema.safeParse(rawData);

  if (!validatedFields.success) {
     console.log('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

   // Use the validated data
  const { title, description, related_themes, speaker } = validatedFields.data;

  const relatedThemesArray = parseJsonArray(related_themes);

   if (related_themes && relatedThemesArray === null) {
     console.log('Related Themes JSON Parse Failed:', related_themes);
     return { message: 'Invalid JSON format for Related Themes.', errors: { related_themes: ['Invalid JSON format. Must be like ["theme_id_1", "theme_id_2"].'] }, success: false };
  }

  // Prepare data for DAL
  const workshopData: Partial<WorkshopInput> = {
    title: title,
    description: description,
    related_themes: relatedThemesArray,
    speaker: speaker,
  };

  // Call DAL function
  const { workshop, error } = await updateWorkshopById(id, workshopData);

  if (error) {
    // Error logged in DAL
    return {
      message: error.message || 'Database error: Failed to update workshop.',
      errors: { general: error.message },
      success: false,
    };
  }

  revalidatePath('/admin/workshops');
  revalidatePath(`/admin/workshops/edit?id=${id}`);
  return { message: 'Workshop updated successfully!', success: true, errors: {} };
}

// --- Server Action: deleteWorkshop ---
export async function deleteWorkshop(id: string): Promise<void> {
   if (!id) {
       throw new Error('Workshop ID is required.');
   }

  // Call DAL function
  const { error } = await deleteWorkshopById(id);

  if (error) {
    // Error logged in DAL
    throw new Error(error.message || 'Database error: Failed to delete workshop.');
  }

  revalidatePath('/admin/workshops');
}