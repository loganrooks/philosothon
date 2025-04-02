'use client';

import React from 'react';

// Define FaqItem type locally for now
// TODO: Move to a shared types file (e.g., @/lib/types.ts)
type FaqItem = {
  id: string; // Required when editing
  question: string;
  answer: string;
  category: string | null;
  display_order: number | null;
  created_at: string;
};

// Define props for the form, including the server action
interface FaqFormProps {
  initialData?: FaqItem; // Optional prop for pre-populating the form
  action: (formData: FormData) => Promise<void>; // Server action prop
}

// Using React.FC without props for now, adjust as needed
const FaqForm: React.FC<FaqFormProps> = ({ initialData, action }) => {
  // TODO: Add state management if needed for client-side validation or interactivity

  return (
    <form
      action={action}
      className="space-y-6"
    >
      <div>
        <label
          htmlFor="question"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Question
        </label>
        <textarea
          id="question"
          name="question"
          rows={3}
          required
          defaultValue={initialData?.question ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="answer"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Answer
        </label>
        <textarea
          id="answer"
          name="answer"
          rows={5}
          required
          defaultValue={initialData?.answer ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Category (Optional)
        </label>
        <input
          type="text"
          id="category"
          name="category"
          defaultValue={initialData?.category ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="display_order"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Display Order (Optional)
        </label>
        <input
          type="number"
          id="display_order"
          name="display_order"
          defaultValue={initialData?.display_order ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>

      {/* TODO: Add hidden input for ID if editing */}
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-offset-gray-800"
        >
          Save FAQ Item
        </button>
      </div>
    </form>
  );
};

export default FaqForm;