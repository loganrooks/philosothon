// platform/src/app/admin/themes/components/ThemeForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Theme } from '@/lib/data/themes'; // Corrected import path
import type { ThemeFormState } from '../actions'; // Assuming state type is defined in actions.ts

// TODO: Move Theme interface to a shared types file

const initialState: ThemeFormState = {
  message: null,
  errors: {},
  success: false,
};

interface ThemeFormProps {
  action: (prevState: ThemeFormState, formData: FormData) => Promise<ThemeFormState>;
  initialData?: Theme | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      // Apply style guide: bg-hacker-green, text-black, no rounded, hacker-green focus
      className="bg-hacker-green px-4 py-2 text-black hover:bg-dark-green focus:outline-none focus:ring-2 focus:ring-hacker-green focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
    >
      {pending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Theme' : 'Create Theme')}
    </button>
  );
}

export function ThemeForm({ action, initialData }: ThemeFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const isEditing = !!initialData;

  return (
    // Apply style guide: translucent background
    <form action={formAction} className="space-y-4 bg-black/75 p-6 shadow">
      {/* Hidden input for ID when editing - Ensure initialData exists */}
      {isEditing && initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      {/* Title */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="title" className="block text-sm font-medium text-light-text">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialData?.title ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-hacker-green sm:text-sm"
          aria-describedby="title-error"
        />
        {state.errors?.title && (
          <p id="title-error" className="mt-1 text-sm text-red-400">
            {state.errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="description" className="block text-sm font-medium text-light-text">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-hacker-green sm:text-sm"
          aria-describedby="description-error"
        ></textarea>
         {state.errors?.description && (
          <p id="description-error" className="mt-1 text-sm text-red-400">
            {state.errors.description}
          </p>
        )}
      </div>

      {/* ADDED: Expanded Description Field */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="description_expanded" className="block text-sm font-medium text-light-text">
          Expanded Description (Markdown)
        </label>
        <textarea
          id="description_expanded"
          name="description_expanded"
          rows={10} // Make it taller for Markdown
          defaultValue={initialData?.description_expanded ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded, font-mono
          className="mt-1 block w-full border border-medium-gray bg-dark-base px-3 py-2 font-mono text-sm text-light-text shadow-sm focus:border-hacker-green focus:ring-hacker-green"
          aria-describedby="description_expanded-error"
        ></textarea>
         {state.errors?.description_expanded && (
          <p id="description_expanded-error" className="mt-1 text-sm text-red-400">
            {/* Assuming error key matches */}
            {state.errors.description_expanded}
          </p>
        )}
      </div>
      {/* END ADDED */}


       {/* TODO: Consider a better input for JSONB arrays (e.g., tag input) */}
      {/* Analytic Tradition */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="analytic_tradition" className="block text-sm font-medium text-light-text">
          Analytic Tradition (JSON Array)
        </label>
        <textarea
          id="analytic_tradition"
          name="analytic_tradition"
          rows={3}
          // Ensure initialData and the property exist before stringifying
          defaultValue={initialData?.analytic_tradition ? JSON.stringify(initialData.analytic_tradition, null, 2) : '[]'}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded, font-mono
          className="mt-1 block w-full border border-medium-gray bg-dark-base px-3 py-2 font-mono text-sm text-light-text shadow-sm focus:border-hacker-green focus:ring-hacker-green"
          placeholder='["Keyword1", "Keyword2"]'
          aria-describedby="analytic_tradition-error"
        ></textarea>
         {state.errors?.analytic_tradition && (
          <p id="analytic_tradition-error" className="mt-1 text-sm text-red-400">
            {state.errors.analytic_tradition}
          </p>
        )}
      </div>

      {/* Continental Tradition */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="continental_tradition" className="block text-sm font-medium text-light-text">
          Continental Tradition (JSON Array)
        </label>
        <textarea
          id="continental_tradition"
          name="continental_tradition"
          rows={3}
          // Ensure initialData and the property exist before stringifying
          defaultValue={initialData?.continental_tradition ? JSON.stringify(initialData.continental_tradition, null, 2) : '[]'}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded, font-mono
          className="mt-1 block w-full border border-medium-gray bg-dark-base px-3 py-2 font-mono text-sm text-light-text shadow-sm focus:border-hacker-green focus:ring-hacker-green"
          placeholder='["KeywordA", "KeywordB"]'
          aria-describedby="continental_tradition-error"
        ></textarea>
         {state.errors?.continental_tradition && (
          <p id="continental_tradition-error" className="mt-1 text-sm text-red-400">
            {state.errors.continental_tradition}
          </p>
        )}
      </div>


      {/* Form Actions & Messages */}
      <div className="flex items-center justify-end space-x-3">
         {state.message && !state.success && (
           <p aria-live="polite" className="text-sm text-red-500">
             {state.message}
           </p>
         )}
         {/* Success message could be handled via redirect or toast */}
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}