'use client';

import Link from 'next/link';
import { deleteFaqItem } from '@/app/admin/faq/actions'; // Adjust path as needed
import { FormEvent } from 'react';

interface FaqActionsProps {
  faqItemId: string;
}

export default function FaqActions({ faqItemId }: FaqActionsProps) {
  // Bind the faqItemId to the server action
  const deleteActionWithId = deleteFaqItem.bind(null, faqItemId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm('Are you sure you want to delete this FAQ item?')) {
      event.preventDefault(); // Prevent form submission if user cancels
    }
    // If confirmed, the form submission proceeds and calls the server action
  };

  return (
    <div className="flex space-x-2">
      <Link
        href={`/admin/faq/${faqItemId}/edit`}
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        Edit
      </Link>
      <form action={deleteActionWithId} onSubmit={handleSubmit}>
        <button
          type="submit"
          className="text-red-600 hover:text-red-800 hover:underline"
        >
          Delete
        </button>
      </form>
    </div>
  );
}