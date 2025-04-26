// platform/src/app/admin/components/LogoutButton.tsx
'use client';

import { signOut } from '@/app/auth/actions';
import { useFormStatus } from 'react-dom';

function LogoutButtonInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? 'Logging out...' : 'Logout'}
    </button>
  );
}


export function LogoutButton() {
  // Define a wrapper action that calls signOut but returns void implicitly
  const handleSignOut = async () => {
    await signOut();
    // No return value here, so it implicitly returns Promise<void>
  };

  // We wrap the button in a form to call the server action
  return (
    // Use the wrapper function for the action prop
    <form action={handleSignOut}>
      <LogoutButtonInner />
    </form>
  );
}