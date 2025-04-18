// platform/src/app/admin/themes/edit/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ThemeForm } from '../components/ThemeForm';
import { updateTheme } from '../actions';
import type { Theme } from '../page'; // Import Theme type

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

  const supabase = await createClient();
  const { data: theme, error } = await supabase
    .from('themes')
    .select('*')
    .eq('id', id)
    .single(); // Fetch a single record

  if (error || !theme) {
    console.error('Error fetching theme for edit:', error);
    notFound(); // Redirect to 404 if theme not found or error occurs
  }

  // We need to cast the fetched data to the Theme type
  // Supabase client might return a more generic type
  const themeData = theme as Theme;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white font-philosopher">Edit Theme</h1>
      {/* Pass initialData and the updateTheme action */}
      <ThemeForm action={updateTheme} initialData={themeData} />
    </div>
  );
}