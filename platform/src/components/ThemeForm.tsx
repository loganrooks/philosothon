'use client';

import React from 'react';
// Import useFormState from react-dom
import { useFormState } from 'react-dom';
// Server actions (addTheme, updateTheme) will be passed as props

// Define Theme type (consider moving to a shared types file)
interface Theme {
  id: string; // Assuming ID is always present when editing
  created_at: string; // Keep other fields as needed
  title: string; // Reverted back to title
  description: string;
  analytic_tradition: string | null;
  continental_tradition: string | null;
}

// Define initial state for useActionState
// Define initial state for useFormState - adjust if action returns different state
const initialState: { success: boolean, message: string | null, errors?: Record<string, string[]> } = {
  success: false, // Default to false until action succeeds
  message: null,
  errors: {},
};

// Define props for the form
interface ThemeFormProps {
  initialData?: Theme;
  // Action now expects the original server action signature, compatible with useActionState and corrected state type
  action: (prevState: typeof initialState, formData: FormData) => Promise<typeof initialState>; // Action should return the same state shape
}

export default function ThemeForm({ initialData, action }: ThemeFormProps) {
  // Use useFormState to manage form state and action return values
  const [state, formAction] = useFormState(action, initialState);
  // TODO: Implement form state management (e.g., useState or react-hook-form)
  // TODO: Implement form submission logic (calling onSubmit prop)

  return (
    <form action={formAction} className="space-y-6"> {/* Use the formAction function from useFormState */}
      {/* Hidden input for ID when editing */}
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          defaultValue={initialData?.title ?? ''}
          // TODO: Add onChange handler if controlled component is needed
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          required
          className="block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          defaultValue={initialData?.description ?? ''}
          // TODO: Add onChange handler if controlled component is needed
        />
      </div>

      <div>
        <label htmlFor="analytic_tradition" className="block text-sm font-medium text-gray-300 mb-1">
          Analytic Tradition (Optional)
        </label>
        <textarea
          name="analytic_tradition"
          id="analytic_tradition"
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          defaultValue={initialData?.analytic_tradition ?? ''}
          // TODO: Add onChange handler if controlled component is needed
        />
      </div>

       <div>
        <label htmlFor="continental_tradition" className="block text-sm font-medium text-gray-300 mb-1">
          Continental Tradition (Optional)
        </label>
        <textarea
          name="continental_tradition"
          id="continental_tradition"
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          defaultValue={initialData?.continental_tradition ?? ''}
          // TODO: Add onChange handler if controlled component is needed
        />
      </div>

      <div>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          // TODO: Add disabled state based on form validity/submission status
        >
          Save Theme
        </button>
      </div>

      {/* Display error message if submission failed */}
      {!state.success && state.message && (
        <p className="text-sm text-red-600 mt-2">{state.message}</p>
      )}
    </form>
  );
}