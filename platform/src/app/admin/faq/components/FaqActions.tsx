// platform/src/app/admin/faq/components/FaqActions.tsx
'use client';

import Link from 'next/link';
import { deleteFaqItem } from '../actions';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

interface FaqActionsProps {
  faqItemId: string;
  faqQuestion: string; // For confirmation message
}

function DeleteButton({ faqQuestion }: { faqQuestion: string }) {
  const { pending } = useFormStatus();
  const [isPending, setIsPending] = useState(false); // Local pending state

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent immediate form submission
    setIsPending(true); // Show pending state

    // Use setTimeout to allow UI update before confirm dialog
    setTimeout(() => {
      if (window.confirm(`Are you sure you want to delete the FAQ item "${faqQuestion}"?`)) {
        // Programmatically submit the form if confirmed
        event.currentTarget.closest('form')?.submit();
      } else {
        // Reset pending state if cancelled
        setIsPending(false);
      }
    }, 0);
  };

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

export function FaqActions({ faqItemId, faqQuestion }: FaqActionsProps) {
  // Bind the faqItemId to the deleteFaqItem server action
  const deleteFaqItemWithId = deleteFaqItem.bind(null, faqItemId);

  return (
    <div className="flex items-center space-x-2">
      <Link
        href={`/admin/faq/edit?id=${faqItemId}`}
        className="text-indigo-400 hover:text-indigo-300"
      >
        Edit
      </Link>
      {/* Form submission is handled by the button's onClick */}
      <form action={deleteFaqItemWithId}>
        <DeleteButton faqQuestion={faqQuestion} />
      </form>
    </div>
  );
}