import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // Assuming this is the correct path

interface ThemeDetailPageProps {
  params: {
    id: string;
  };
}

// Define a basic Theme type locally for now
// TODO: Move to a shared types file if not already present
interface Theme {
  id: string;
  title: string;
  description: string;
  analytic_tradition: string[] | null;
  continental_tradition: string[] | null;
  created_at: string;
}


export default async function ThemeDetailPage({ params }: ThemeDetailPageProps) {
  const supabase = createClient();
  const { id } = params;

  let theme: Theme | null = null;
  // Removed unused 'error' variable

  try {
    // Await the client creation
    const supabaseClient = await supabase;
    const { data, error: fetchError } = await supabaseClient
      .from('themes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!data) {
      notFound();
    }

    theme = data as Theme; // Add type assertion

  } catch (e: unknown) { // Use unknown instead of any
    console.error('Error fetching theme:', e);
    // Removed assignment to unused 'error' variable
    // Optionally, you could render an error state instead of 404
    // For now, if fetch fails for reasons other than not found, it might still lead to notFound() if theme remains null
    notFound();
  }

  // If theme is still null after try-catch (e.g., unexpected error before notFound was called), trigger notFound
  if (!theme) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/themes" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Themes
      </Link>
      <article className="prose prose-invert max-w-none">
        <h1>{theme.title}</h1>
        <p>{theme.description}</p>
        {/* TODO: Render analytic/continental traditions if needed */}
        {/* Consider adding more detailed fields later */}
      </article>
    </div>
  );
}