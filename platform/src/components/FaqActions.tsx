'use client';

interface FaqActionsProps {
  faqItemId: string;
}

export function FaqActions({ faqItemId }: FaqActionsProps) {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this FAQ item?')) {
      // Replace with client-side notification until server actions are implemented
      alert('Delete functionality temporarily disabled during deployment');
      // You can implement a client-side alternative or API call here
      console.log('FAQ ID to delete (for future implementation):', faqItemId);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-900"
      >
        Delete
      </button>
    </div>
  );
}