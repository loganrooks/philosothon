// platform/src/app/admin/workshops/components/WorkshopForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { Workshop } from '@/lib/data/workshops'; // Import type from DAL
import type { WorkshopFormState } from '../actions'; // Assuming state type is defined in actions.ts

// TODO: Move Workshop interface to a shared types file

const initialState: WorkshopFormState = {
  message: null,
  errors: {},
  success: false,
};

interface WorkshopFormProps {
  action: (prevState: WorkshopFormState, formData: FormData) => Promise<WorkshopFormState>;
  initialData?: Workshop | null;
  // TODO: Pass available themes for multi-select if implementing that way
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
      {pending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Workshop' : 'Create Workshop')}
    </button>
  );
}

export function WorkshopForm({ action, initialData }: WorkshopFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const isEditing = !!initialData;

  return (
    <form action={formAction} className="space-y-4 bg-gray-800 p-6 shadow">
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
          className="mt-1 block w-full border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="title-error"
        />
        {state.errors?.title && (
          <p id="title-error" className="mt-1 text-sm text-red-400">
            {/* Display first error if array */}
            {Array.isArray(state.errors.title) ? state.errors.title[0] : state.errors.title}
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
          className="mt-1 block w-full border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="description-error"
        ></textarea>
         {state.errors?.description && (
          <p id="description-error" className="mt-1 text-sm text-red-400">
             {Array.isArray(state.errors.description) ? state.errors.description[0] : state.errors.description}
          </p>
        )}
      </div>

       {/* TODO: Implement multi-select based on available themes */}
      <div>
        <label htmlFor="relevant_themes" className="block text-sm font-medium text-gray-300">
          Relevant Themes (JSON Array of Theme IDs)
        </label>
        <textarea
          id="relevant_themes"
          name="relevant_themes"
          rows={3}
          defaultValue={initialData?.related_themes ? JSON.stringify(initialData.related_themes, null, 2) : '[]'}
          className="mt-1 block w-full border-gray-600 bg-gray-700 px-3 py-2 font-mono text-sm text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder='["theme_id_1", "theme_id_2"]'
          aria-describedby="relevant_themes-error"
        ></textarea>
         {state.errors?.related_themes && (
          <p id="relevant_themes-error" className="mt-1 text-sm text-red-400">
             {Array.isArray(state.errors.related_themes) ? state.errors.related_themes[0] : state.errors.related_themes}
          </p>
        )}
      </div>

       <div>
        <label htmlFor="facilitator" className="block text-sm font-medium text-gray-300">
          Facilitator
        </label>
        <input
          id="facilitator"
          name="facilitator"
          type="text"
          defaultValue={initialData?.speaker ?? ''}
          className="mt-1 block w-full border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="facilitator-error"
        />
        {state.errors?.speaker && (
          <p id="facilitator-error" className="mt-1 text-sm text-red-400">
            {Array.isArray(state.errors.speaker) ? state.errors.speaker[0] : state.errors.speaker}
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