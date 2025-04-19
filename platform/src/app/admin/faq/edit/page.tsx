// platform/src/app/admin/faq/edit/page.tsx
import { notFound } from 'next/navigation';
import { FaqForm } from '../components/FaqForm';
import { updateFaqItem } from '../actions';
import { fetchFaqItemById, type FaqItem } from '@/lib/data/faq'; // Import DAL function and type

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

  // Fetch FAQ item using the DAL function
  const { faqItem: faqItemData, error } = await fetchFaqItemById(id);

  if (error || !faqItemData) {
    // Error is already logged in fetchFaqItemById
    notFound();
  }

  // No need for casting

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white font-philosopher">Edit FAQ Item</h1>
      {/* <p>ID: {id ?? 'N/A'}</p> */} {/* Remove placeholder ID display */}
      <FaqForm action={updateFaqItem} initialData={faqItemData} />
    </div>
  );
}