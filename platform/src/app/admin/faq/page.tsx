// platform/src/app/admin/faq/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaqActions } from './components/FaqActions'; // Import FaqActions

// TODO: Move this interface to a shared types file (e.g., @/lib/types.ts)
export interface FaqItem {
  id: string;
  created_at: string;
  question: string;
  answer: string | null;
  category: string | null;
  display_order: number | null;
}

export default async function AdminFaqPage() {
  const supabase = await createClient();
  // Order by display_order, then perhaps created_at or question for consistent ordering
  const { data: faqItems, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false }); // Order by display_order (remove secondary for now)
    // .order('created_at', { ascending: true }); // Removed redundant order

  if (error) {
    console.error('Error fetching FAQ items:', error);
    notFound();
  }

   const truncateText = (text: string | null, maxLength: number = 80) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };


  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white font-philosopher">Manage FAQ</h1>
        <Link
          href="/admin/faq/new"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Add New FAQ Item
        </Link>
      </div>

      {/* TODO: Implement reordering controls if needed */}
      <div className="overflow-x-auto rounded shadow">
        <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Order
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Question
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Answer
              </th>
               <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {faqItems && faqItems.length > 0 ? (
              faqItems.map((item: FaqItem) => (
                <tr key={item.id}>
                   <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {item.display_order ?? 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {/* Use truncateText for question */}
                    {truncateText(item.question, 60)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                     <span className="block max-w-xs truncate" title={item.answer ?? ''}>
                         {truncateText(item.answer)}
                    </span>
                  </td>
                   <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {item.category ?? 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {/* Use FaqActions component */}
                    <FaqActions faqItemId={item.id} faqQuestion={item.question} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5} // Adjusted colspan
                  className="px-6 py-4 text-center text-sm text-gray-400"
                >
                  No FAQ items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}