import ThemeCard from "@/components/ThemeCard";
// Import the DAL function and Theme type
import { fetchThemes, type Theme } from '@/lib/data/themes';

// Remove local Theme interface definition, use imported one

// Opt out of caching to ensure data is fetched at request time for SSR
// For SSG, remove this line or set to a revalidation time (e.g., export const revalidate = 3600;)
// For pure SSG (build-time generation), this page should work without explicit revalidate
// as long as no dynamic functions (cookies(), headers(), searchParams) are used directly in the page component itself.
// The data fetching happens in the Server Component's scope before rendering.
// export const revalidate = 0; // Explicitly mark as static

export default async function ThemesPage() {
  // Fetch data using the DAL function
  const { themes, error } = await fetchThemes();

  // Use fetched themes (or empty array if error or null)
  const themeList: Theme[] = themes || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-hacker-green border-b border-medium-gray pb-2 font-philosopher">Event Themes</h1> {/* Added subtle border color */}

      {/* Optional Filter Controls */}
      {/* <FilterControls /> */}

      <p className="mb-6">
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
            description={theme.description ?? ''} // Provide fallback for null description
            analyticTradition={theme.analytic_tradition ?? undefined} // Pass undefined if null
            continentalTradition={theme.continental_tradition ?? undefined} // Pass undefined if null
          />
        ))}
      </div>

      {/* TODO: Implement filtering if needed */}
    </div>
  );
}