'use client';

import React from 'react';
// Removed unused import: import { addWorkshop } from '@/app/admin/workshops/actions';

// TODO: Define a proper type/interface for Workshop data
interface Workshop {
  id?: string; // Optional for new workshops
  title: string;
  description: string;
  date?: string | null; // Make date optional if it can be null
  location?: string | null; // Make location optional if it can be null
  relevant_themes: unknown; // JSONB - use unknown instead of any
  facilitator?: string | null;
  max_capacity?: number | null;
  created_at?: string; // Add created_at if needed by type
}

interface WorkshopFormProps {
  initialData?: Workshop; // Keep for potential future edit functionality
  action: (formData: FormData) => void | Promise<void>;
}

export default function WorkshopForm({ initialData, action }: WorkshopFormProps) {
  // TODO: Implement state management if needed for client-side validation or interactivity

  // Format date for datetime-local input
  const defaultDateValue = initialData?.date
    ? new Date(initialData.date).toISOString().substring(0, 16)
    : '';

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          defaultValue={initialData?.title ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter workshop title"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          required
          defaultValue={initialData?.description ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter workshop description"
        />
      </div>

      {/* Added Label for Date and Time */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-300">
          Date and Time
        </label>
        <input
          type="datetime-local"
          name="date"
          id="date"
          required // Assuming date is required
          defaultValue={defaultDateValue}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

       {/* Added Label for Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-300">
          Location
        </label>
        <input
          type="text"
          name="location"
          id="location"
          required // Assuming location is required
          defaultValue={initialData?.location ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter workshop location"
        />
      </div>


      <div>
        <label htmlFor="relevant_themes" className="block text-sm font-medium text-gray-300">
          Relevant Themes (JSONB)
        </label>
        <textarea
          name="relevant_themes"
          id="relevant_themes"
          rows={3}
          // Removed required attribute as it might not always be needed
          defaultValue={initialData?.relevant_themes ? JSON.stringify(initialData.relevant_themes, null, 2) : ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
          placeholder='e.g., ["theme-id-1", "theme-id-2"]' // Updated placeholder
        />
        <p className="mt-1 text-xs text-gray-500">Enter as a valid JSON array of theme IDs.</p>
      </div>

      <div>
        <label htmlFor="facilitator" className="block text-sm font-medium text-gray-300">
          Facilitator (Optional)
        </label>
        <input
          type="text"
          name="facilitator"
          id="facilitator"
          defaultValue={initialData?.facilitator ?? ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter facilitator name"
        />
      </div>

      <div>
        <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-300">
          Max Capacity (Optional)
        </label>
        <input
          type="number"
          name="max_capacity"
          id="max_capacity"
          min="1"
          defaultValue={initialData?.max_capacity?.toString() ?? ''} // Convert number to string for defaultValue
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter maximum capacity"
        />
      </div>

      {/* Hidden input for ID if editing */}
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {initialData ? 'Update Workshop' : 'Save Workshop'}
        </button>
      </div>
    </form>
  );
}