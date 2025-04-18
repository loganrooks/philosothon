// platform/src/app/admin/workshops/components/WorkshopActions.tsx
'use client';

import Link from 'next/link';
import { deleteWorkshop } from '../actions';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

interface WorkshopActionsProps {
  workshopId: string;
  workshopTitle: string; // For confirmation message
}

function DeleteButton({ workshopTitle }: { workshopTitle: string }) {
  const { pending } = useFormStatus();
  const [isPending, setIsPending] = useState(false); // Local pending state for immediate feedback

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent the form from submitting immediately
    event.preventDefault();
    setIsPending(true); // Show pending state immediately

    // Use setTimeout to allow UI update before confirm dialog blocks
    setTimeout(() => {
      if (window.confirm(`Are you sure you want to delete the workshop "${workshopTitle}"?`)) {
        // If confirmed, programmatically submit the form
        event.currentTarget.closest('form')?.submit();
      } else {
        // If cancelled, reset the pending state
        setIsPending(false);
      }
    }, 0);
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

export function WorkshopActions({ workshopId, workshopTitle }: WorkshopActionsProps) {
  // Bind the workshopId to the deleteWorkshop server action
  const deleteWorkshopWithId = deleteWorkshop.bind(null, workshopId);

  return (
    <div className="flex items-center space-x-2">
      <Link
        href={`/admin/workshops/edit?id=${workshopId}`}
        className="text-indigo-400 hover:text-indigo-300"
      >
        Edit
      </Link>
      {/* Form submission is handled by the button's onClick logic */}
      <form action={deleteWorkshopWithId}>
        <DeleteButton workshopTitle={workshopTitle} />
      </form>
    </div>
  );
}