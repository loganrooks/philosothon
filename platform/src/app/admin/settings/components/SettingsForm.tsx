// platform/src/app/admin/settings/components/SettingsForm.tsx
'use client';

import React from 'react';
import { useFormState } from 'react-dom';
import { updateEventSettings, EventSettingsState } from '../actions';
// Assuming EventDetails type is available from the DAL file
import { EventDetails } from '@/lib/data/event';

// Helper to format Date objects or ISO strings for datetime-local input
const formatDateTimeLocal = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Check if date is valid
    if (isNaN(d.getTime())) return '';
    // Format to YYYY-MM-DDTHH:mm (ISO 8601 without seconds/milliseconds/Z)
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return '';
  }
};


interface SettingsFormProps {
  initialData: EventDetails | null; // Allow null if data might not exist
}

const initialState: EventSettingsState = { success: false, message: null, errors: {} };

export default function SettingsForm({ initialData }: SettingsFormProps) {
  // Pass the action to useFormState
  const [state, formAction] = useFormState(updateEventSettings, initialState);

  return (
    // Apply style guide: translucent background
    <form action={formAction} className="space-y-4 bg-black/75 p-6 shadow">
      {/* Event Name */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="event_name" className="block text-sm font-medium text-light-text">Event Name</label>
        <input
          type="text"
          id="event_name"
          name="event_name"
          defaultValue={initialData?.event_name ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="event_name-error"
        />
        <div id="event_name-error" aria-live="polite" aria-atomic="true">
          {state.errors?.event_name && state.errors.event_name.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

      {/* Start Date */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="start_date" className="block text-sm font-medium text-light-text">Start Date</label>
        <input
          type="datetime-local"
          id="start_date"
          name="start_date"
          defaultValue={formatDateTimeLocal(initialData?.start_date)}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="start_date-error"
        />
         <div id="start_date-error" aria-live="polite" aria-atomic="true">
          {state.errors?.start_date && state.errors.start_date.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

       {/* End Date */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="end_date" className="block text-sm font-medium text-light-text">End Date</label>
        <input
          type="datetime-local"
          id="end_date"
          name="end_date"
          defaultValue={formatDateTimeLocal(initialData?.end_date)}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="end_date-error"
        />
         <div id="end_date-error" aria-live="polite" aria-atomic="true">
          {state.errors?.end_date && state.errors.end_date.map((error: string) => (
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

       {/* Registration Deadline */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="registration_deadline" className="block text-sm font-medium text-light-text">Registration Deadline</label>
        <input
          type="datetime-local"
          id="registration_deadline"
          name="registration_deadline"
          defaultValue={formatDateTimeLocal(initialData?.registration_deadline)}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="registration_deadline-error"
        />
         <div id="registration_deadline-error" aria-live="polite" aria-atomic="true">
          {state.errors?.registration_deadline && state.errors.registration_deadline.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

       {/* Submission Deadline */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="submission_deadline" className="block text-sm font-medium text-light-text">Submission Deadline</label>
        <input
          type="datetime-local"
          id="submission_deadline"
          name="submission_deadline"
          defaultValue={formatDateTimeLocal(initialData?.submission_deadline)}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="submission_deadline-error"
        />
         <div id="submission_deadline-error" aria-live="polite" aria-atomic="true">
          {state.errors?.submission_deadline && state.errors.submission_deadline.map((error: string) => (
            <p className="mt-1 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>

      {/* Contact Email */}
      <div>
        {/* Apply style guide: text-light-text */}
        <label htmlFor="contact_email" className="block text-sm font-medium text-light-text">Contact Email</label>
        <input
          type="email"
          id="contact_email"
          name="contact_email"
          defaultValue={initialData?.contact_email ?? ''}
          // Apply style guide: bg-dark-base, border-medium-gray, hacker-green focus, no rounded
          className="mt-1 block w-full rounded-none border border-medium-gray bg-dark-base px-3 py-2 text-light-text shadow-sm focus:border-hacker-green focus:ring-1 focus:ring-hacker-green sm:text-sm"
          aria-describedby="contact_email-error"
        />
         <div id="contact_email-error" aria-live="polite" aria-atomic="true">
          {state.errors?.contact_email && state.errors.contact_email.map((error: string) => (
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
        Update Settings
      </button>
    </form>
  );
}