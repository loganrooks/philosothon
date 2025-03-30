import WorkshopCard from "@/components/WorkshopCard";
import { createClient } from '@/lib/supabase/server'; // Import server client

// Define the type for a workshop based on the database schema
interface Workshop {
  id: string; // Assuming UUID is treated as string
  created_at: string; // Assuming TIMESTAMPTZ is treated as string
  title: string;
  description: string;
  relevant_themes: unknown | null; // Assuming JSONB, use unknown instead of any
  facilitator: string | null; // Assuming TEXT, nullable
  max_capacity: number | null; // Assuming INTEGER, nullable
}

// Set revalidation time for ISR (6 hours = 21600 seconds)
export const revalidate = 21600;

export default async function WorkshopsPage() {
  const supabase = await createClient(); // Use server client

  // Fetch data from Supabase
  const { data: workshops, error } = await supabase
    .from('workshops') // Ensure this table name matches your Supabase schema
    .select('*')
    .order('title', { ascending: true }); // Optional: order workshops alphabetically

  if (error) {
    console.error('Error fetching workshops:', error);
    // Optionally render an error message to the user
  }

  // Use fetched workshops (or empty array if error)
  const workshopList: Workshop[] = workshops || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Event Workshops</h1>

      {/* Optional Tag Filter */}
      {/* <TagFilter /> */}

      <p className="mb-6 text-gray-700">
        Discover the workshops offered during the Philosothon. The final workshop selection may depend on participant preferences and relevance to the chosen theme(s).
      </p>

      {/* List of Workshops */}
      <div className="space-y-6">
        {error && <p className="text-red-500">Could not fetch workshops. Please try again later.</p>}
        {!error && workshopList.length === 0 && <p>No workshops available at the moment.</p>}
        {!error && workshopList.length > 0 && workshopList.map((workshop) => (
          <WorkshopCard
            key={workshop.id}
            title={workshop.title}
            description={workshop.description}
            facilitator={workshop.facilitator ?? undefined} // Pass undefined if null
          />
        ))}
      </div>

      {/* TODO: Implement filtering if needed */}
    </div>
  );
}