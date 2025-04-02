import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import FaqActions from '@/components/FaqActions';

// Define the type for an FAQ item based on the expected schema
interface FaqItem {
  id: string;
  created_at: string;
  question: string;
  answer: string;
  category: string | null;
  is_published: boolean;
}

export default async function ManageFaqPage() {
  const supabase = await createClient();
  let faqItems: FaqItem[] = [];
  let fetchError: string | null = null;

  try {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('created_at', { ascending: false }); // Optional: order by creation date

    if (error) {
      throw error;
    }
    faqItems = data || [];
  } catch (error: unknown) {
    console.error('Error fetching FAQ items:', error);
    fetchError = error instanceof Error ? error.message : 'An unknown error occurred.';
  }

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Manage FAQ</h1>
        {/* Placeholder Button - Link can be added later */}
        <Link href="/admin/faq/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New FAQ Item
        </Link>
      </div>

      {fetchError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> Failed to fetch FAQ items. {fetchError}</span>
        </div>
      )}

      {!fetchError && faqItems.length === 0 && (
        <p className="text-gray-500">No FAQ items found.</p>
      )}

      {!fetchError && faqItems.length > 0 && (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Question
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Answer
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 text-left text-sm font-semibold text-gray-900 sm:pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {faqItems.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-normal py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {item.question}
                  </td>
                  <td className="whitespace-normal px-3 py-4 text-sm text-gray-500">
                    {item.answer}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <FaqActions faqItemId={item.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}