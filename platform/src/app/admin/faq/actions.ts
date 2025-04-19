// platform/src/app/admin/faq/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  insertFaqItem,
  updateFaqItemById,
  deleteFaqItemById,
  type FaqItemInput,
} from '@/lib/data/faq'; // Import DAL functions and type

// Define Zod schema for validation (aligned with FaqItemInput)
const FaqItemSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, { message: 'Question is required.' }),
  answer: z.string().min(1, { message: 'Answer is required.' }),
  // Removed category
  display_order: z.preprocess(
    // Convert empty string, null, or undefined to null before validation
    (val) => (val === '' || val === null || val === undefined ? null : val),
     // Now validate: must be a string that can be coerced to a non-negative integer, or null
    z.string()
     .refine(val => val === null || /^\d+$/.test(val), { message: "Display Order must be a whole number." })
     .transform(val => val === null ? null : parseInt(val, 10)) // Transform to number or null
     .refine(val => val === null || val >= 0, { message: "Display Order must be 0 or positive." }) // Ensure non-negativity
     .nullable() // Allow null
     .optional() // Allow undefined
  ),
});

// Define state structure for useFormState
export interface FaqFormState {
  message: string | null;
  errors?: {
    question?: string[];
    answer?: string[];
    // Removed category
    display_order?: string[];
    general?: string;
  };
  success: boolean;
}

// --- Server Action: createFaqItem ---
export async function createFaqItem(
  prevState: FaqFormState,
  formData: FormData,
): Promise<FaqFormState> {
   const rawData = {
    question: formData.get('question'),
    answer: formData.get('answer'),
    // Removed category
    display_order: formData.get('display_order'), // Keep as string for Zod preprocess
  };

  const validatedFields = FaqItemSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.log('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // Use validated and transformed data
  const { question, answer, display_order } = validatedFields.data;

  // Prepare data for DAL
  const faqData: FaqItemInput = {
    question,
    answer,
    display_order, // Use validated & transformed number/null
  };

  // Call DAL function
  const { faqItem, error } = await insertFaqItem(faqData);

  if (error) {
    // Error logged in DAL
    return {
      message: error.message || 'Database error: Failed to create FAQ item.',
      errors: { general: error.message },
      success: false,
    };
  }

  revalidatePath('/admin/faq');
  return { message: 'FAQ item created successfully!', success: true, errors: {} };
}

// --- Server Action: updateFaqItem ---
export async function updateFaqItem(
  prevState: FaqFormState,
  formData: FormData,
): Promise<FaqFormState> {
   const id = formData.get('id') as string | null;

   if (!id) {
       return { message: 'FAQ Item ID is missing.', success: false, errors: { general: 'FAQ Item ID missing.'} };
   }

   const rawData = {
    question: formData.get('question'),
    answer: formData.get('answer'),
    // Removed category
    display_order: formData.get('display_order'),
  };

  const validatedFields = FaqItemSchema.safeParse(rawData);

  if (!validatedFields.success) {
     console.log('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

   // Use validated and transformed data
   const { question, answer, display_order } = validatedFields.data;

  // Prepare data for DAL
  const faqData: Partial<FaqItemInput> = {
    question,
    answer,
    display_order,
  };

  // Call DAL function
  const { faqItem, error } = await updateFaqItemById(id, faqData);

  if (error) {
    // Error logged in DAL
    return {
      message: error.message || 'Database error: Failed to update FAQ item.',
      errors: { general: error.message },
      success: false,
    };
  }

  revalidatePath('/admin/faq');
  revalidatePath(`/admin/faq/edit?id=${id}`);
  return { message: 'FAQ item updated successfully!', success: true, errors: {} };
}

// --- Server Action: deleteFaqItem ---
export async function deleteFaqItem(id: string): Promise<void> {
   if (!id) {
       throw new Error('FAQ Item ID is required.');
   }

  // Call DAL function
  const { error } = await deleteFaqItemById(id);

  if (error) {
    // Error logged in DAL
    throw new Error(error.message || 'Database error: Failed to delete FAQ item.');
  }

  revalidatePath('/admin/faq');
}

// TODO: Implement reorderFaqItem action if needed