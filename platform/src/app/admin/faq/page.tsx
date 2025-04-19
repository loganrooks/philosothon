// platform/src/app/admin/faq/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaqActions } from './components/FaqActions'; // Import FaqActions
import { fetchFaqItems, type FaqItem } from '@/lib/data/faq'; // Import DAL function and type

// Removed local FaqItem interface

export default async function AdminFaqPage() {
  // Fetch FAQ items using the DAL function
  const { faqItems, error } = await fetchFaqItems();

  if (error) {
    // Error is already logged in fetchFaqItems
    notFound();
  }

  // Use an empty array if faqItems is null (e.g., due to error)
  const faqList = faqItems ?? [];

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
      <div className="overflow-x-auto shadow">
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
              {/* Removed Category column header */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {faqList && faqList.length > 0 ? (
              faqList.map((item: FaqItem) => (
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
                 {/* Removed Category column data */}
                 <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {/* Use FaqActions component */}
                    <FaqActions faqItemId={item.id} faqQuestion={item.question} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4} // Adjusted colspan after removing Category
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