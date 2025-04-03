import ThemeCard from "@/components/ThemeCard";
import { createClient } from '@/lib/supabase/server'; // Import server client
// import { cookies } from 'next/headers'; // No longer needed here

// Define the type for a theme based on the database schema
// Adjust types as necessary based on actual schema (e.g., TEXT vs VARCHAR, JSONB vs JSON)
interface Theme {
  id: string; // Assuming UUID is treated as string
  created_at: string; // Assuming TIMESTAMPTZ is treated as string
  title: string;
  description: string;
  analytic_tradition: string[] | null; // Changed from string | null for JSONB
  continental_tradition: string[] | null; // Changed from string | null for JSONB
  is_selected: boolean | null; // Assuming BOOLEAN, nullable
}

// Opt out of caching to ensure data is fetched at request time for SSR
// For SSG, remove this line or set to a revalidation time (e.g., export const revalidate = 3600;)
// For pure SSG (build-time generation), this page should work without explicit revalidate
// as long as no dynamic functions (cookies(), headers(), searchParams) are used directly in the page component itself.
// The data fetching happens in the Server Component's scope before rendering.
// export const revalidate = 0; // Explicitly mark as static

export default async function ThemesPage() {
  // const cookieStore = cookies(); // No longer needed here, handled in createClient
  const supabase = await createClient(); // Call without arguments

  // Fetch data from Supabase
  const { data: themes, error } = await supabase
    .from('themes') // Ensure this table name matches your Supabase schema
    .select('*')
    .order('title', { ascending: true }); // Optional: order themes alphabetically

  if (error) {
    console.error('Error fetching themes:', error);
    // Optionally render an error message to the user
  }

  // Use fetched themes (or empty array if error)
  const themeList: Theme[] = themes || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Event Themes</h1>

      {/* Optional Filter Controls */}
      {/* <FilterControls /> */}

      <p className="mb-6 text-gray-700">
        Explore the potential philosophical themes for this year&apos;s Philosothon. The final theme(s) will be selected based on participant votes during registration.
      </p>

      {/* List of Themes */}
      <div className="space-y-6">
        {error && <p className="text-red-500">Could not fetch themes. Please try again later.</p>}
        {!error && themeList.length === 0 && <p>No themes available at the moment.</p>}
        {!error && themeList.length > 0 && themeList.map((theme) => (
          <ThemeCard
            key={theme.id}
            id={theme.id} // Added the missing id prop
            title={theme.title}
            description={theme.description}
            analyticTradition={theme.analytic_tradition ?? undefined} // Pass undefined if null
            continentalTradition={theme.continental_tradition ?? undefined} // Pass undefined if null
          />
        ))}
      </div>

      {/* TODO: Implement filtering if needed */}
    </div>
  );
}