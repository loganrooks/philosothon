// platform/src/app/admin/themes/edit/page.tsx
import { notFound } from 'next/navigation';
import { ThemeForm } from '../components/ThemeForm';
import { updateTheme } from '../actions';
import { fetchThemeById, type Theme } from '@/lib/data/themes'; // Import DAL function and type

interface EditThemePageProps {
  searchParams?: {
    id?: string;
  };
}

export default async function EditThemePage({ searchParams }: EditThemePageProps) {
  const id = searchParams?.id;

  if (!id) {
    notFound(); // Redirect to 404 if no ID is provided
  }

  // Fetch theme using the DAL function
  const { theme: themeData, error } = await fetchThemeById(id);

  if (error || !themeData) {
    // Error is already logged within fetchThemeById
    notFound(); // Redirect to 404 if theme not found or error occurs
  }

  // No need for casting, fetchThemeById should return the correct type

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white font-philosopher">Edit Theme</h1>
      {/* Pass initialData and the updateTheme action */}
      <ThemeForm action={updateTheme} initialData={themeData} />
    </div>
  );
}