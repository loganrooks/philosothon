// platform/src/app/admin/faq/edit/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { FaqForm } from '../components/FaqForm';
import { updateFaqItem } from '../actions';
import type { FaqItem } from '../page'; // Import FaqItem type

interface EditFaqPageProps {
  // Use standard Next.js searchParams type
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function EditFaqPage({ searchParams }: EditFaqPageProps) {
  const id = searchParams?.id;

  if (!id || Array.isArray(id)) { // Ensure id is a single string
    console.error('Invalid or missing ID for FAQ edit:', id);
    notFound();
  }

  const supabase = await createClient();
  const { data: faqItem, error } = await supabase
    .from('faq_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !faqItem) {
    console.error('Error fetching FAQ item for edit:', error);
    notFound();
  }

  // Cast fetched data
  const faqItemData = faqItem as FaqItem;

  // console.log('Simplified EditFaqPage - ID:', id); // Remove placeholder log

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white">Edit FAQ Item</h1>
      {/* <p>ID: {id ?? 'N/A'}</p> */} {/* Remove placeholder ID display */}
      <FaqForm action={updateFaqItem} initialData={faqItemData} />
    </div>
  );
}