// platform/src/app/admin/workshops/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WorkshopActions } from './components/WorkshopActions'; // Import WorkshopActions
import { fetchWorkshops, type Workshop } from '@/lib/data/workshops'; // Import DAL function and type

// Removed local Workshop interface

export default async function AdminWorkshopsPage() {
  // Fetch workshops using the DAL function
  const { workshops, error } = await fetchWorkshops();

  if (error) {
    // Error is already logged in fetchWorkshops
    notFound();
  }

  // Use an empty array if workshops is null (e.g., due to error)
  const workshopList = workshops ?? [];

  const truncateDescription = (text: string | null, maxLength: number = 80) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white font-philosopher">Manage Workshops</h1>
        <Link
          href="/admin/workshops/new"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Add New Workshop
        </Link>
      </div>

      <div className="overflow-x-auto shadow">
        <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Description
              </th>
               <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Speaker
              </th>
              {/* Removed Capacity column header */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {workshopList && workshopList.length > 0 ? (
              workshopList.map((workshop: Workshop) => (
                <tr key={workshop.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {workshop.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {/* Apply max width or other styling if needed for longer descriptions */}
                    <span className="block max-w-xs truncate" title={workshop.description ?? ''}>
                         {truncateDescription(workshop.description)}
                    </span>
                  </td>
                   <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {workshop.speaker ?? 'N/A'} {/* Changed from facilitator */}
                   </td>
                   {/* Removed Capacity column data */}
                   <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {/* Use WorkshopActions component */}
                    <WorkshopActions workshopId={workshop.id} workshopTitle={workshop.title} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4} // Adjusted colspan after removing Capacity
                  className="px-6 py-4 text-center text-sm text-gray-400"
                >
                  No workshops found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}