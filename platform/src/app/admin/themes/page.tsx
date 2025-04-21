// platform/src/app/admin/themes/page.tsx
import { cookies } from 'next/headers'; // Import cookies to mark as dynamic
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation'; // Import notFound
import { ThemeActions } from './components/ThemeActions'; // Import ThemeActions
import { fetchThemes, type Theme } from '@/lib/data/themes'; // Import DAL function and type

// Removed Theme interface export, now imported from DAL

export default async function AdminThemesPage() {
  // Fetch themes using the DAL function
  const { themes, error } = await fetchThemes();

  if (error) {
    // Error is already logged within fetchThemes
    // Decide how to handle the error in the UI
    // Using notFound for now, consistent with previous logic
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
        <h1 className="text-2xl font-semibold text-white font-philosopher">Manage Themes</h1>
        <Link
          href="/admin/themes/new"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Add New Theme
        </Link>
      </div>

      {/* TODO: Consider refactoring platform/src/components/DataTable.tsx to be generic */}
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