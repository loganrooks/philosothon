// platform/src/app/admin/themes/components/ThemeForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Theme } from '../page'; // Assuming Theme type is defined in page.tsx for now
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
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {pending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Theme' : 'Create Theme')}
    </button>
  );
}

export function ThemeForm({ action, initialData }: ThemeFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const isEditing = !!initialData;

  return (
    <form action={formAction} className="space-y-4 rounded bg-gray-800 p-6 shadow">
      {/* Hidden input for ID when editing */}
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialData?.title ?? ''}
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="title-error"
        />
        {state.errors?.title && (
          <p id="title-error" className="mt-1 text-sm text-red-400">
            {state.errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ''}
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="description-error"
        ></textarea>
         {state.errors?.description && (
          <p id="description-error" className="mt-1 text-sm text-red-400">
            {state.errors.description}
          </p>
        )}
      </div>

       {/* TODO: Consider a better input for JSONB arrays (e.g., tag input) */}
      <div>
        <label htmlFor="analytic_tradition" className="block text-sm font-medium text-gray-300">
          Analytic Tradition (JSON Array)
        </label>
        <textarea
          id="analytic_tradition"
          name="analytic_tradition"
          rows={3}
          defaultValue={initialData?.analytic_tradition ? JSON.stringify(initialData.analytic_tradition, null, 2) : '[]'}
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 font-mono text-sm text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder='["Keyword1", "Keyword2"]'
          aria-describedby="analytic_tradition-error"
        ></textarea>
         {state.errors?.analytic_tradition && (
          <p id="analytic_tradition-error" className="mt-1 text-sm text-red-400">
            {state.errors.analytic_tradition}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="continental_tradition" className="block text-sm font-medium text-gray-300">
          Continental Tradition (JSON Array)
        </label>
        <textarea
          id="continental_tradition"
          name="continental_tradition"
          rows={3}
          defaultValue={initialData?.continental_tradition ? JSON.stringify(initialData.continental_tradition, null, 2) : '[]'}
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 font-mono text-sm text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder='["KeywordA", "KeywordB"]'
          aria-describedby="continental_tradition-error"
        ></textarea>
         {state.errors?.continental_tradition && (
          <p id="continental_tradition-error" className="mt-1 text-sm text-red-400">
            {state.errors.continental_tradition}
          </p>
        )}
      </div>


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