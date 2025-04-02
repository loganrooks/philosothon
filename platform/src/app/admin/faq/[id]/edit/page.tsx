import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FaqForm from '@/components/FaqForm';
import { updateFaqItem } from '../../actions'; // Import the update action
// TODO: Define this type in a shared location (e.g., lib/types.ts) if used elsewhere
// Removed duplicate interface definition

interface EditFaqPageProps {
  params: { id: string };
}

// Define FaqItem type locally for now
// TODO: Move to a shared types file (e.g., @/lib/types.ts)
type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number | null;
  created_at: string;
};


export default async function EditFaqPage({ params }: EditFaqPageProps) {
  const supabase = await createClient(); // <-- Added await
  const { id } = params;

  let faqItem: FaqItem | null = null;
  // Removed unused fetchError variable

  try {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('id', id)
      .single(); // Use single() to get one record or null

    if (error) {
      throw error;
    }
    faqItem = data as FaqItem; // Type assertion, ensure data matches FaqItem structure
  } catch (error: unknown) {
    console.error('Error fetching FAQ item:', error);
    // Removed fetchError assignment
    // Error handling primarily relies on checking if faqItem is null below
  }

  // If data is null after fetch or due to error, trigger 404
  if (!faqItem) {
    notFound();
  }

  // Bind the updateFaqItem server action with the faqItem id
  const updateFaqItemWithId = updateFaqItem.bind(null, faqItem.id);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit FAQ Item</h1>
      {/* Pass the bound update action to the form */}
      <FaqForm initialData={faqItem} action={updateFaqItemWithId} />
    </main>
  );
}