import WorkshopCard from "@/components/WorkshopCard";
// Import the new data fetching function and type
import { fetchWorkshops, type Workshop } from '@/lib/data/workshops';

// Set revalidation time for ISR (6 hours = 21600 seconds)
// This remains relevant for the page itself
export const revalidate = 21600;

export default async function WorkshopsPage() {
  let workshopList: Workshop[] = [];
  let fetchError: string | null = null;

  try {
    // Call the extracted data fetching function
    workshopList = await fetchWorkshops();
  } catch (error) {
    // Log the error on the server
    console.error('UI error loading workshops:', error);
    // Set a user-friendly error message
    fetchError = 'Could not load workshop information at this time. Please try again later.';
    // More specific messages could be set based on error type if needed
    // fetchError = error instanceof Error ? error.message : 'An unknown error occurred.';
  }

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
        {/* Display error message if fetching failed */}
        {fetchError && <p className="text-red-500">{fetchError}</p>}

        {/* Display message if no error but list is empty */}
        {!fetchError && workshopList.length === 0 && <p>No workshops available at the moment.</p>}

        {/* Display workshop cards if no error and list is not empty */}
        {!fetchError && workshopList.length > 0 && workshopList.map((workshop) => (
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