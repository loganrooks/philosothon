import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import WorkshopActions from '@/components/WorkshopActions'; // Added import

// Define the Workshop type based on the schema
interface Workshop {
  id: string;
  created_at: string;
  title: string;
  description: string;
  relevant_themes?: unknown; // JSONB can be complex, using unknown for better type safety
  facilitator?: string;
  max_capacity?: number;
}

export default async function ManageWorkshopsPage() {
  // createClient is async, so we need to await it
  const supabase = await createClient();
  let workshops: Workshop[] = [];
  let error: string | null = null;

  try {
    const { data, error: fetchError } = await supabase
      .from('workshops')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }
    workshops = data || [];
  } catch (err: unknown) {
    console.error('Error fetching workshops:', err);
    error = 'Failed to load workshops. Please try again later.';
    // Optionally, you could log this error to a monitoring service
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Workshops</h1>
        <Link href="/admin/workshops/new">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
            Add New Workshop
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workshops.length > 0 ? (
              workshops.map((workshop) => (
                <tr key={workshop.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{workshop.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{workshop.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <WorkshopActions workshopId={workshop.id} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
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