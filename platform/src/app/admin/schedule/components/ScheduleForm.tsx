// platform/src/app/admin/schedule/components/ScheduleForm.tsx
'use client';

import React from 'react';
import { useFormState } from 'react-dom';
import {
  createScheduleItem,
  updateScheduleItem,
  ScheduleItemState,
} from '../actions';
// Assuming ScheduleItem type is available from the DAL file
import { ScheduleItem } from '@/lib/data/schedule';

interface ScheduleFormProps {
  mode: 'new' | 'edit';
  initialData?: ScheduleItem | null; // Make optional for 'new' mode
}

const initialState: ScheduleItemState = { success: false, message: null, errors: {} };

export default function ScheduleForm({ mode, initialData }: ScheduleFormProps) {
  // Choose the correct action based on the mode
  const action = mode === 'new' ? createScheduleItem : updateScheduleItem;
  const [state, formAction] = useFormState(action, initialState);

  const buttonText = mode === 'new' ? 'Add Item' : 'Update Item';

  return (
    // Apply style guide: translucent background
    <form action={formAction} className="space-y-4 bg-black/75 p-6 shadow">
      {/* Hidden ID field for edit mode */}
      {mode === 'edit' && initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      {/* Date */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="item_date" className="block text-sm font-medium text-light-text">Date</label>
        <input
          type="date"
          id="item_date"
          name="item_date"
          defaultValue={initialData?.item_date ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="item_date-error"
          required // Assuming date is required
        />
        <div id="item_date-error" aria-live="polite" aria-atomic="true">
          {state.errors?.item_date && state.errors.item_date.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

      {/* Start Time */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="start_time" className="block text-sm font-medium text-light-text">Start Time</label>
        <input
          type="time" // Use time input
          id="start_time"
          name="start_time"
          defaultValue={initialData?.start_time ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="start_time-error"
          required // Assuming start time is required
        />
        <div id="start_time-error" aria-live="polite" aria-atomic="true">
          {state.errors?.start_time && state.errors.start_time.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

      {/* End Time */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="end_time" className="block text-sm font-medium text-light-text">End Time</label>
        <input
          type="time" // Use time input
          id="end_time"
          name="end_time"
          defaultValue={initialData?.end_time ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="end_time-error"
          required // Assuming end time is required
        />
        <div id="end_time-error" aria-live="polite" aria-atomic="true">
          {state.errors?.end_time && state.errors.end_time.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="title" className="block text-sm font-medium text-light-text">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={initialData?.title ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="title-error"
          required // Assuming title is required
        />
        <div id="title-error" aria-live="polite" aria-atomic="true">
          {state.errors?.title && state.errors.title.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="description" className="block text-sm font-medium text-light-text">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initialData?.description ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="description-error"
        />
        <div id="description-error" aria-live="polite" aria-atomic="true">
          {state.errors?.description && state.errors.description.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="location" className="block text-sm font-medium text-light-text">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          defaultValue={initialData?.location ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="location-error"
        />
        <div id="location-error" aria-live="polite" aria-atomic="true">
          {state.errors?.location && state.errors.location.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

      {/* Speaker */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="speaker" className="block text-sm font-medium text-light-text">Speaker</label>
        <input
          type="text"
          id="speaker"
          name="speaker"
          defaultValue={initialData?.speaker ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="speaker-error"
        />
        <div id="speaker-error" aria-live="polite" aria-atomic="true">
          {state.errors?.speaker && state.errors.speaker.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>


      {/* General Form Messages */}
       <div aria-live="polite" aria-atomic="true">
        {state.message && !state.success && (
          <p className="mt-2 text-sm text-red-500">{state.message}</p>
        )}
        {state.message && state.success && (
           <p className="mt-2 text-sm text-green-500">{state.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        // Apply style guide: primary button
        className="rounded-none bg-hacker-green px-4 py-2 text-black hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-hacker-green focus:ring-offset-2 focus:ring-offset-dark-base disabled:opacity-50"
      >
        {buttonText}
      </button>
    </form>
  );
}