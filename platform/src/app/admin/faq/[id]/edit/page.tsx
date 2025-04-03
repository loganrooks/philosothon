import React from 'react';

// Minimal placeholder page for editing FAQ items
// TODO: Implement data fetching and form handling later

export default function EditFaqPlaceholderPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit FAQ Item (Placeholder)</h1>
      <p>Editing FAQ Item with ID: {id}</p>
      <p>Form will be implemented here.</p>
      {/* You can add a link back to the list page if needed */}
      {/* <Link href="/admin/faq">Back to FAQ List</Link> */}
    </main>
  );
}