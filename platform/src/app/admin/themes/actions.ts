// platform/src/app/admin/themes/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation'; // Removed unused import
import { z } from 'zod';
import {
  insertTheme,
  updateThemeById,
  deleteThemeById,
  type ThemeInput,
} from '@/lib/data/themes'; // Import DAL functions and type

// Define Zod schema for validation (including description_expanded)
const ThemeSchema = z.object({
  id: z.string().optional(), // Optional for creation, required for update (extracted separately)
  title: z.string().min(1, { message: 'Title is required.' }),
  description: z.string().nullable().optional(),
  description_expanded: z.string().nullable().optional(), // Added
  // Basic validation for JSON strings, allow null/empty
  analytic_tradition: z.string().nullable().optional().refine((val) => {
    if (!val) return true; // Allow null or empty string
    try { JSON.parse(val); return true; } catch { return false; }
  }, { message: 'Invalid JSON format for Analytic Tradition.' }),
  continental_tradition: z.string().nullable().optional().refine((val) => {
     if (!val) return true; // Allow null or empty string
    try { JSON.parse(val); return true; } catch { return false; }
  }, { message: 'Invalid JSON format for Continental Tradition.' }),
});

// Define state structure for useFormState
export interface ThemeFormState {
  message: string | null;
  errors?: {
    // Allow string arrays from Zod's flatten()
    title?: string[] | undefined;
    description?: string[] | undefined;
    analytic_tradition?: string[] | undefined;
    continental_tradition?: string[] | undefined;
    description_expanded?: string[] | undefined; // Added
    general?: string | undefined; // Keep general error as single string
  };
  success: boolean;
}

// Helper function to parse JSON array fields
function parseJsonArray(jsonString: string | undefined | null): string[] | null {
  if (!jsonString || jsonString.trim() === '' || jsonString.trim() === '[]') return null; // Treat empty string or '[]' as null
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      // Optionally validate array contents here (e.g., ensure all elements are strings)
      return parsed.filter(item => typeof item === 'string'); // Ensure only strings are kept
    }
    console.warn('Parsed JSON is not an array:', parsed);
    return null; // Or throw error if strict array format is required
  } catch (e) {
    console.error('Failed to parse JSON array:', e);
    return null; // Or throw error
  }
}


// --- Server Action: createTheme ---
export async function createTheme(
  prevState: ThemeFormState,
  formData: FormData,
): Promise<ThemeFormState> {
  const validatedFields = ThemeSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    description_expanded: formData.get('description_expanded'), // Added
    analytic_tradition: formData.get('analytic_tradition'),
    continental_tradition: formData.get('continental_tradition'),
  });

  if (!validatedFields.success) {
    console.log('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const analyticTraditionArray = parseJsonArray(validatedFields.data.analytic_tradition);
  const continentalTraditionArray = parseJsonArray(validatedFields.data.continental_tradition);

  // Check if JSON parsing failed (could add specific errors to state)
  if (validatedFields.data.analytic_tradition && analyticTraditionArray === null) {
     console.log('Analytic Tradition JSON Parse Failed:', validatedFields.data.analytic_tradition);
     // Wrap error message in an array
     return { message: 'Invalid JSON format for Analytic Tradition.', errors: { analytic_tradition: ['Invalid JSON format. Must be like ["item1", "item2"].'] }, success: false };
  }
   if (validatedFields.data.continental_tradition && continentalTraditionArray === null) {
     console.log('Continental Tradition JSON Parse Failed:', validatedFields.data.continental_tradition);
     // Wrap error message in an array
     return { message: 'Invalid JSON format for Continental Tradition.', errors: { continental_tradition: ['Invalid JSON format. Must be like ["item1", "item2"].'] }, success: false };
  }


  // Prepare data for DAL function
  const themeData: ThemeInput = {
    title: validatedFields.data.title,
    description: validatedFields.data.description,
    description_expanded: validatedFields.data.description_expanded, // Added
    analytic_tradition: analyticTraditionArray,
    continental_tradition: continentalTraditionArray,
  };

  // Call DAL function
  const { theme, error } = await insertTheme(themeData);

  if (error) {
    // Error is already logged in DAL function
    return {
      message: error.message || 'Database error: Failed to create theme.',
      errors: { general: error.message }, // Keep general error message
      success: false,
    };
  }

  revalidatePath('/admin/themes');
  // Redirect happens on the client via form state or effect, or use redirect()
  // For simplicity with useFormState, we'll return success and let the form handle it.
  // redirect('/admin/themes'); // Alternatively, redirect directly
   return { message: 'Theme created successfully!', success: true, errors: {} }; // Clear errors on success
}


// --- Server Action: updateTheme ---
export async function updateTheme(
  prevState: ThemeFormState,
  formData: FormData,
): Promise<ThemeFormState> {
   const id = formData.get('id') as string | null;

   if (!id) {
       return { message: 'Theme ID is missing.', success: false, errors: { general: 'Theme ID missing.'} };
   }

  const validatedFields = ThemeSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    description_expanded: formData.get('description_expanded'), // Added
    analytic_tradition: formData.get('analytic_tradition'),
    continental_tradition: formData.get('continental_tradition'),
  });

  if (!validatedFields.success) {
     console.log('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const analyticTraditionArray = parseJsonArray(validatedFields.data.analytic_tradition);
  const continentalTraditionArray = parseJsonArray(validatedFields.data.continental_tradition);

   if (validatedFields.data.analytic_tradition && analyticTraditionArray === null) {
     console.log('Analytic Tradition JSON Parse Failed:', validatedFields.data.analytic_tradition);
      // Wrap error message in an array
     return { message: 'Invalid JSON format for Analytic Tradition.', errors: { analytic_tradition: ['Invalid JSON format. Must be like ["item1", "item2"].'] }, success: false };
  }
   if (validatedFields.data.continental_tradition && continentalTraditionArray === null) {
     console.log('Continental Tradition JSON Parse Failed:', validatedFields.data.continental_tradition);
      // Wrap error message in an array
     return { message: 'Invalid JSON format for Continental Tradition.', errors: { continental_tradition: ['Invalid JSON format. Must be like ["item1", "item2"].'] }, success: false };
  }

  // Prepare data for DAL function
  const themeData: Partial<ThemeInput> = {
    title: validatedFields.data.title,
    description: validatedFields.data.description,
    description_expanded: validatedFields.data.description_expanded, // Added
    analytic_tradition: analyticTraditionArray,
    continental_tradition: continentalTraditionArray,
  };

  // Call DAL function
  const { theme, error } = await updateThemeById(id, themeData);

  if (error) {
    // Error is already logged in DAL function
    return {
      message: error.message || 'Database error: Failed to update theme.',
      errors: { general: error.message }, // Keep general error message
      success: false,
    };
  }

  revalidatePath('/admin/themes');
  revalidatePath(`/admin/themes/edit?id=${id}`); // Revalidate edit page too
  // redirect('/admin/themes'); // Redirect after successful update
   return { message: 'Theme updated successfully!', success: true, errors: {} }; // Clear errors on success
}


// --- Server Action: deleteTheme ---
// This action is intended to be used with a form action, returning void or throwing error
export async function deleteTheme(id: string): Promise<void> {
   if (!id) {
       // Throw an error instead of returning an object
       throw new Error('Theme ID is required.');
   }

  // Call DAL function
  const { error } = await deleteThemeById(id);

  if (error) {
    // Error is already logged in DAL function
    // Throw an error instead of returning an object
    throw new Error(error.message || 'Database error: Failed to delete theme.');
  }

  revalidatePath('/admin/themes');
  // No return needed for success (implicitly void)
}