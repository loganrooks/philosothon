import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchThemeById, type Theme } from '@/lib/data/themes'; // Import DAL function and type
import ReactMarkdown from 'react-markdown'; // Import for rendering expanded description
import fs from 'fs/promises'; // Import fs for file reading
import path from 'path'; // Import path for joining paths

interface ThemeDetailPageProps {
  params: {
    id: string;
  };
}

// Removed local Theme interface, now imported from DAL


export default async function ThemeDetailPage({ params }: ThemeDetailPageProps) {
  const { id } = params;

  // Fetch basic theme info (title, simple description) using the DAL function
  const { theme, error: themeError } = await fetchThemeById(id);

  // Handle errors or theme not found from initial fetch
  if (themeError || !theme) {
    // Error is already logged within fetchThemeById
    notFound();
  }

  let mainDescription = '';
  let suggestedReadings = '';
  let fileReadError = false;

  try {
    // Construct file path relative to project root
    // process.cwd() should be /home/rookslog/philosothon
    const filePath = path.join(process.cwd(), 'docs', 'event_info', 'themes', `${id}.md`);
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Split content at the "Suggested Readings" heading
    const parts = fileContent.split('\n## Suggested Readings\n');
    mainDescription = parts[0]?.trim() || ''; // Get content before the split

    if (parts.length > 1) {
      suggestedReadings = parts[1]?.trim() || ''; // Get content after the split
    }

  } catch (error: any) {
    console.error(`Error reading theme markdown file docs/event_info/themes/${id}.md:`, error.message);
    fileReadError = true;
    // Fallback: Use simple description from DB if markdown read fails
    mainDescription = theme.description || '';
  }

  // If file read failed AND there's no fallback simple description, then 404
  if (fileReadError && !theme.description) {
      console.error(`Markdown file not found/readable for ${id} and no fallback description exists.`);
      notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/themes" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Themes
      </Link>
      <article className="prose prose-invert max-w-none">
        {/* Render title from Supabase data */}
        <h1>{theme.title}</h1>

        {/* Render main description: Use markdown content if available, otherwise fallback to DB description */}
        {(mainDescription || theme.description) && (
          <ReactMarkdown>
            {mainDescription || theme.description || ''}
          </ReactMarkdown>
        )}

        {/* Render Suggested Readings section from Markdown */}
        {suggestedReadings && (
          <>
            <h2 className="mt-8">Suggested Readings</h2> {/* Add heading */}
            <ReactMarkdown>
              {suggestedReadings}
            </ReactMarkdown>
          </>
        )}

        {/* Display error message if file read failed but fallback description was used */}
        {fileReadError && theme.description && (
             <p className="text-red-500 mt-4">Note: Could not load detailed description from file; showing basic description.</p>
        )}

        {/* TODO: Render analytic/continental traditions if needed */}
      </article>
    </div>
  );
}