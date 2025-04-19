import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchThemeById, type Theme } from '@/lib/data/themes'; // Import DAL function and type
import ReactMarkdown from 'react-markdown'; // Import for rendering expanded description

interface ThemeDetailPageProps {
  params: {
    id: string;
  };
}

// Removed local Theme interface, now imported from DAL


export default async function ThemeDetailPage({ params }: ThemeDetailPageProps) {
  const { id } = params;

  // Fetch theme using the DAL function
  const { theme, error } = await fetchThemeById(id);

  // Handle errors or theme not found
  if (error || !theme) {
    // Error is already logged within fetchThemeById
    notFound();
  }

  // No need for try-catch or type assertion

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/themes" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Themes
      </Link>
      <article className="prose prose-invert max-w-none">
        <h1>{theme.title}</h1>
        {/* Render simple description if expanded is not available */}
        {!theme.description_expanded && theme.description && <p>{theme.description}</p>}

        {/* Render expanded description using ReactMarkdown, wrapped in a div for styling */}
        {theme.description_expanded && (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>
              {theme.description_expanded}
            </ReactMarkdown>
          </div>
        )}

        {/* TODO: Render analytic/continental traditions if needed */}
      </article>
    </div>
  );
}