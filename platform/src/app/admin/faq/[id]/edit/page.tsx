// This is now purely a Server Component for data fetching

import React from 'react';
// Removed useFormState import
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
// Removed unused FaqForm import
import { updateFaqItem } from '../../actions'; // Import the update action
import { FaqItem } from '@/lib/definitions'; // Import shared types (FormState removed)
import EditFaqClientForm from '@/components/EditFaqClientForm'; // Import the new client component
// TODO: Define FaqItem type in a shared location (e.g., lib/types.ts) if used elsewhere
// Removed duplicate interface definition

// Removed EditFaqPageProps interface

// Removed local FaqItem definition, now imported from @/lib/definitions


// Removed EditFaqClientForm definition (moved to its own file)


// Server component for data fetching
export default async function EditFaqPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = params;

  let faqItem: FaqItem | null = null;

  try {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }
    faqItem = data as FaqItem;
  } catch (error: unknown) {
    console.error('Error fetching FAQ item:', error);
  }

  if (!faqItem) {
    notFound();
  }

  // Bind the updateFaqItem server action with the faqItem id
  const updateFaqItemWithId = updateFaqItem.bind(null, faqItem.id);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit FAQ Item</h1>
      <EditFaqClientForm initialData={faqItem} updateAction={updateFaqItemWithId} />
    </main>
  );
}