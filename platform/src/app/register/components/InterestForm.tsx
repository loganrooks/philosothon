'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { logInterest, LogInterestState } from '../actions'; // Assuming action exists here
import { useEffect, useRef } from 'react';

const initialState: LogInterestState = {
  message: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="px-4 py-2 bg-hacker-green text-black font-mono hover:bg-opacity-80 disabled:opacity-50"
    >
      {pending ? 'Submitting...' : 'Notify Me'}
    </button>
  );
}

export function InterestForm() {
  const [state, formAction] = useFormState(logInterest, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Reset form on successful submission
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="font-mono text-hacker-green p-4 border border-gray-700 rounded flex flex-col items-center space-y-4">
       <p className="text-center">Registration is currently under construction.<br/>Enter your email below to be notified when it's ready.</p>
       <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-md space-y-2 sm:space-y-0 sm:space-x-2">
        <label htmlFor="email" className="sr-only">Email:</label>
        <input
          id="email"
          type="email"
          name="email"
          required
          placeholder="your.email@example.com"
          className="flex-grow px-3 py-2 bg-black border border-gray-700 text-hacker-green outline-none focus:ring-1 focus:ring-hacker-green placeholder-gray-600 w-full sm:w-auto"
          aria-describedby="form-message"
        />
        <SubmitButton />
      </div>
       {state?.message && (
         <p id="form-message" aria-live="polite" className={`mt-2 text-sm ${state.success ? 'text-green-500' : 'text-orange-500'}`}>
           {state.message}
         </p>
       )}
    </form>
  );
}