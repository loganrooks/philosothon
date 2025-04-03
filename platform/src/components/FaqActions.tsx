'use client';

// Removed unused Link import
import { deleteFaqItem } from '@/app/admin/faq/actions'; // Adjust path as needed

interface FaqActionsProps {
  faqItemId: string;
}

export function FaqActions({ faqItemId }: FaqActionsProps) {
  // Bind the ID to the server action
  const deleteActionWithId = deleteFaqItem.bind(null, faqItemId);

  const handleDelete = (event: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm('Are you sure you want to delete this FAQ item?')) {
      event.preventDefault(); // Prevent form submission if user cancels
    }
    // If confirmed, the form submission proceeds and calls the server action
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Edit link removed to resolve build errors */}
      <form action={deleteActionWithId} onSubmit={handleDelete}>
        <button
          type="submit"
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </form>
    </div>
  );
}