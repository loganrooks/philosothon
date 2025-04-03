'use client'; // Required for useFormState in the wrapper

import React from 'react';
import { useFormState } from 'react-dom';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FaqForm from '@/components/FaqForm';
import { updateFaqItem } from '../../actions'; // Import the update action
import { FormState } from '@/lib/definitions'; // Import shared type
// TODO: Define FaqItem type in a shared location (e.g., lib/types.ts) if used elsewhere
// Removed duplicate interface definition

// Removed EditFaqPageProps interface

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


// Wrapper component to use the hook
function EditFaqClientForm({
  initialData,
  updateAction,
}: {
  initialData: FaqItem;
  updateAction: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const initialState: FormState = { message: null, success: false, errors: {} };
  const [state, dispatch] = useFormState(updateAction, initialState);

  return <FaqForm initialData={initialData} action={dispatch} state={state} />;
}


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