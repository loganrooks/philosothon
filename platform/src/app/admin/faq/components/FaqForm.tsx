// platform/src/app/admin/faq/components/FaqForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { FaqItem } from '../page'; // Assuming FaqItem type is exported from page.tsx
import type { FaqFormState } from '../actions'; // Assuming state type is defined in actions.ts

// TODO: Move FaqItem interface to a shared types file

const initialState: FaqFormState = {
  message: null,
  errors: {},
  success: false,
};

interface FaqFormProps {
  action: (prevState: FaqFormState, formData: FormData) => Promise<FaqFormState>;
  initialData?: FaqItem | null;
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
      {pending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update FAQ Item' : 'Create FAQ Item')}
    </button>
  );
}

export function FaqForm({ action, initialData }: FaqFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const isEditing = !!initialData;

  return (
    <form action={formAction} className="space-y-4 rounded bg-gray-800 p-6 shadow">
      {/* Hidden input for ID when editing */}
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      <div>
        <label htmlFor="question" className="block text-sm font-medium text-gray-300">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          id="question"
          name="question"
          rows={3}
          required
          defaultValue={initialData?.question ?? ''}
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="question-error"
        ></textarea>
        {state.errors?.question && (
          <p id="question-error" className="mt-1 text-sm text-red-400">
            {Array.isArray(state.errors.question) ? state.errors.question[0] : state.errors.question}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="answer" className="block text-sm font-medium text-gray-300">
          Answer <span className="text-red-500">*</span>
        </label>
        <textarea
          id="answer"
          name="answer"
          rows={6}
           required
          defaultValue={initialData?.answer ?? ''}
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="answer-error"
        ></textarea>
         {state.errors?.answer && (
          <p id="answer-error" className="mt-1 text-sm text-red-400">
             {Array.isArray(state.errors.answer) ? state.errors.answer[0] : state.errors.answer}
          </p>
        )}
      </div>

       <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300">
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          defaultValue={initialData?.category ?? ''}
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="category-error"
        />
        {state.errors?.category && (
          <p id="category-error" className="mt-1 text-sm text-red-400">
            {Array.isArray(state.errors.category) ? state.errors.category[0] : state.errors.category}
          </p>
        )}
      </div>

       <div>
        <label htmlFor="display_order" className="block text-sm font-medium text-gray-300">
          Display Order (Lower numbers appear first)
        </label>
        <input
          id="display_order"
          name="display_order"
          type="number"
           min="0"
          defaultValue={initialData?.display_order ?? ''}
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-describedby="display_order-error"
        />
        {state.errors?.display_order && (
          <p id="display_order-error" className="mt-1 text-sm text-red-400">
            {Array.isArray(state.errors.display_order) ? state.errors.display_order[0] : state.errors.display_order}
          </p>
        )}
      </div>


      <div className="flex items-center justify-end space-x-3">
         {state.message && !state.success && (
           <p aria-live="polite" className="text-sm text-red-500">
             {state.message}
           </p>
         )}
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}