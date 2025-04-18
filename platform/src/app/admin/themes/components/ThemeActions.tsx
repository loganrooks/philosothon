// platform/src/app/admin/themes/components/ThemeActions.tsx
'use client';

import Link from 'next/link';
import { deleteTheme } from '../actions';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

interface ThemeActionsProps {
  themeId: string;
  themeTitle: string; // For confirmation message
}

function DeleteButton({ themeTitle }: { themeTitle: string }) {
  const { pending } = useFormStatus();
  const [isPending, setIsPending] = useState(false); // Local pending state for confirmation

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Use setTimeout to allow state update before confirmation dialog blocks thread
    setTimeout(() => {
        if (!window.confirm(`Are you sure you want to delete the theme "${themeTitle}"?`)) {
            setIsPending(false); // Reset pending state if cancelled
        }
        // If confirmed, the form submits naturally, pending state remains true until action completes
    }, 0);

    // Set pending state immediately for visual feedback
    setIsPending(true);
    // Prevent default form submission until confirmation is handled in setTimeout
    event.preventDefault();
  };

  // Combine local pending state with form status pending
  const actualPending = pending || isPending;

  return (
    <button
      type="submit"
      onClick={handleClick}
      aria-disabled={actualPending}
      disabled={actualPending}
      className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {actualPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}

export function ThemeActions({ themeId, themeTitle }: ThemeActionsProps) {
  // Bind the themeId to the deleteTheme server action
  const deleteThemeWithId = deleteTheme.bind(null, themeId);

  // Note: Server action result/error handling could be added here using useFormState
  // if more complex feedback than just revalidation is needed. For delete, revalidation is often enough.

  // Removed unused handleFormSubmit function

  return (
    <div className="flex items-center space-x-2">
      <Link
        href={`/admin/themes/edit?id=${themeId}`}
        className="text-indigo-400 hover:text-indigo-300"
      >
        Edit
      </Link>
      {/* Removed onSubmit={handleFormSubmit} */}
      <form action={deleteThemeWithId}>
        <DeleteButton themeTitle={themeTitle} />
      </form>
    </div>
  );
}