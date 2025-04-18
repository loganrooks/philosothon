// platform/src/app/admin/themes/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation'; // Import notFound
import { ThemeActions } from './components/ThemeActions'; // Import ThemeActions

// Exporting Theme interface for use in ThemeForm
export interface Theme { // Added export
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  analytic_tradition: string[] | null; // Assuming JSONB mapped to string[]
  continental_tradition: string[] | null; // Assuming JSONB mapped to string[]
}

export default async function AdminThemesPage() {
  const supabase = await createClient();
  const { data: themes, error } = await supabase
    .from('themes')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching themes:', error);
    // Consider showing an error message to the user
    // For now, we can treat it like no themes found or throw an error
    // Depending on how critical this page is.
    // Let's use notFound for simplicity here, but a proper error boundary might be better.
     notFound(); // Or throw new Error('Failed to fetch themes');
  }

  // Function to truncate description
  const truncateDescription = (text: string | null, maxLength: number = 100) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Manage Themes</h1>
        <Link
          href="/admin/themes/new"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Add New Theme
        </Link>
      </div>

      {/* TODO: Consider refactoring platform/src/components/DataTable.tsx to be generic */}
      <div className="overflow-x-auto rounded shadow">
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {themes && themes.length > 0 ? (
              themes.map((theme: Theme) => (
                <tr key={theme.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {theme.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {truncateDescription(theme.description)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {/* Use ThemeActions component */}
                    <ThemeActions themeId={theme.id} themeTitle={theme.title} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-center text-sm text-gray-400"
                >
                  No themes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}