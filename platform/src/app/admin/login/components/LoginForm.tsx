// platform/src/app/admin/login/components/LoginForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signInWithOtp, type LoginFormState } from '@/app/admin/auth/actions';
import { useEffect } from 'react';

const initialState: LoginFormState = {
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
      className="mt-4 w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {pending ? 'Sending...' : 'Send Magic Link'}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(signInWithOtp, initialState);

  useEffect(() => {
    if (state?.message) {
      // Optional: Use a toast library or simply alert for feedback
      // console.log(state.message);
      // alert(state.message); // Simple feedback for now
    }
  }, [state]);


  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          placeholder="you@example.com"
        />
      </div>

      <SubmitButton />

      {state?.message && !state.success && (
         <p aria-live="polite" className="mt-2 text-sm text-red-500">
           {state.message}
         </p>
       )}
       {state?.message && state.success && (
         <p aria-live="polite" className="mt-2 text-sm text-green-500">
           {state.message}
         </p>
       )}
    </form>
  );
}
