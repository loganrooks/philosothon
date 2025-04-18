// platform/src/app/admin/workshops/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define Zod schema for validation
const WorkshopSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: 'Title is required.' }),
  description: z.string().nullable().optional(),
  relevant_themes: z.string().nullable().optional().refine((val) => { // Added nullable().optional() before refine
    if (!val || val.trim() === '' || val.trim() === '[]') return true; // Allow empty/null string or empty array string
    try {
      const parsed = JSON.parse(val);
      // Ensure it's an array and all elements are strings
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string');
    } catch { return false; }
  }, { message: 'Invalid JSON format for Relevant Themes (must be an array of strings like ["id1", "id2"]).' }).optional(),
  facilitator: z.string().nullable().optional(),
  max_capacity: z.preprocess(
    // Convert empty string, null, or undefined to null before validation
    (val) => (val === '' || val === null || val === undefined ? null : val),
    // Now validate: must be a string that can be coerced to a positive integer, or null
    z.string()
     .refine(val => val === null || /^\d+$/.test(val), { message: "Capacity must be a whole number." })
     .transform(val => val === null ? null : parseInt(val, 10)) // Transform to number or null
     .refine(val => val === null || val > 0, { message: "Capacity must be positive if provided." }) // Ensure positivity if not null
     .nullable() // Allow null
     .optional() // Allow undefined
  ),
});


// Define state structure for useFormState
export interface WorkshopFormState {
  message: string | null;
  errors?: {
    title?: string[];
    description?: string[];
    relevant_themes?: string[];
    facilitator?: string[];
    max_capacity?: string[];
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
    relevant_themes: formData.get('relevant_themes'),
    facilitator: formData.get('facilitator'),
    max_capacity: formData.get('max_capacity'), // Keep as string initially for Zod preprocess
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

  // Use the validated and transformed data
  const { title, description, relevant_themes, facilitator, max_capacity } = validatedFields.data;

  const relevantThemesArray = parseJsonArray(relevant_themes);

  // Check if JSON parsing failed (parseJsonArray returns null on error)
  // This check might be redundant if Zod validation catches it, but good for explicit safety
  if (relevant_themes && relevantThemesArray === null) {
     console.log('Relevant Themes JSON Parse Failed:', relevant_themes);
     return { message: 'Invalid JSON format for Relevant Themes.', errors: { relevant_themes: ['Invalid JSON format. Must be like ["theme_id_1", "theme_id_2"].'] }, success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('workshops').insert({
    title: title,
    description: description,
    relevant_themes: relevantThemesArray,
    facilitator: facilitator,
    max_capacity: max_capacity, // Use the validated & transformed number/null value
  });

  if (error) {
    console.error('Supabase Create Workshop Error:', error);
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
    relevant_themes: formData.get('relevant_themes'),
    facilitator: formData.get('facilitator'),
    max_capacity: formData.get('max_capacity'),
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

   // Use the validated and transformed data
  const { title, description, relevant_themes, facilitator, max_capacity } = validatedFields.data;

  const relevantThemesArray = parseJsonArray(relevant_themes);

   if (relevant_themes && relevantThemesArray === null) {
     console.log('Relevant Themes JSON Parse Failed:', relevant_themes);
     return { message: 'Invalid JSON format for Relevant Themes.', errors: { relevant_themes: ['Invalid JSON format. Must be like ["theme_id_1", "theme_id_2"].'] }, success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('workshops')
    .update({
      title: title,
      description: description,
      relevant_themes: relevantThemesArray,
      facilitator: facilitator,
      max_capacity: max_capacity,
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase Update Workshop Error:', error);
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

  const supabase = await createClient();
  const { error } = await supabase.from('workshops').delete().eq('id', id);

  if (error) {
    console.error('Supabase Delete Workshop Error:', error);
    throw new Error(error.message || 'Database error: Failed to delete workshop.');
  }

  revalidatePath('/admin/workshops');
}