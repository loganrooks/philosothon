import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ThemeForm from '@/components/ThemeForm';
import { updateTheme } from '../../actions'; // Corrected import path for the update server action

// Define a basic Theme type (consider moving to a shared types file)
interface Theme {
  id: string;
  created_at: string;
  title: string;
  description: string;
  analytic_tradition: string | null;
  continental_tradition: string | null;
}

export default async function EditThemePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: theme, error } = await supabase
    .from('themes')
    .select('*')
    .eq('id', params.id)
    .single<Theme>(); // Specify the expected type

  if (error) {
    console.error('Error fetching theme:', error);
    // Optionally handle specific errors differently
  }

  if (!theme) {
    notFound(); // Render the 404 page if theme is not found
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Edit Theme: {theme.title}
      </h1>
      {/* Render the ThemeForm component, passing the fetched data */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Bind the theme id to the updateTheme action */}
        <ThemeForm initialData={theme} action={updateTheme.bind(null, theme.id)} />
      </div>
    </div>
  );
}