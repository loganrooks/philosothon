import { createClient } from '@/lib/supabase/server';
// import { cookies } from 'next/headers'; // Removed unused import
import Link from 'next/link';
import ThemeActions from '@/components/ThemeActions'; // Import the new component
// Define the Theme type based on the schema
interface Theme {
  id: string;
  created_at: string;
  title: string;
  description: string;
  analytic_tradition: string | null;
  continental_tradition: string | null;
  is_selected: boolean | null;
}

export default async function ManageThemesPage() {
  // const cookieStore = cookies(); // Removed, handled by createClient
  const supabase = await createClient(); // Await the async function
  let themes: Theme[] = [];
  let error: string | null = null;

  try {
    const { data, error: fetchError } = await supabase
      .from('themes')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }
    themes = data || [];
  } catch (e: unknown) { // Use unknown or Error instead of any
    // Type guard for error message
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    console.error('Error fetching themes:', errorMessage);
    error = 'Failed to load themes. Please try again later.';
    // Optionally, you could redirect or show a more prominent error message
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Themes</h1>
        <Link href="/admin/themes/new"> {/* Placeholder link */}
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
            Add New Theme
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6">Title</th>
              <th className="py-3 px-6">Description</th>
              <th className="py-3 px-6">Actions</th> {/* Placeholder for future actions */}
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {themes.length > 0 ? (
              themes.map((theme) => (
                <tr key={theme.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-medium">{theme.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <p className="line-clamp-2">{theme.description}</p> {/* Limit description length visually */}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {/* Replace the div with the ThemeActions component */}
                    <ThemeActions themeId={theme.id} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-6 px-6 text-center text-gray-500">
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