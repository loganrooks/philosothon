import WorkshopCard from "@/components/WorkshopCard";
// Import the new data fetching function and type
import { fetchWorkshops, type Workshop } from '@/lib/data/workshops';

// Set revalidation time for ISR (6 hours = 21600 seconds)
// This remains relevant for the page itself
export const revalidate = 21600;

export default async function WorkshopsPage() {
  // Call the DAL function and destructure the result
  const { workshops: workshopList, error: fetchErrorData } = await fetchWorkshops();

  // Handle potential error from the DAL function
  const fetchError = fetchErrorData ? 'Could not load workshop information at this time. Please try again later.' : null;
  // Note: fetchWorkshops already logs the specific error

  // Use an empty array if workshops is null (e.g., due to error)
  const workshops = workshopList ?? [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-hacker-green border-b border-medium-gray pb-2 font-philosopher">Event Workshops</h1>

      {/* Optional Tag Filter */}
      {/* <TagFilter /> */}

      <p className="mb-6">
        Discover the workshops offered during the Philosothon. The final workshop selection may depend on participant preferences and relevance to the chosen theme(s).
      </p>

      {/* List of Workshops */}
      <div className="space-y-6">
        {/* Display error message if fetching failed */}
        {fetchError && <p className="text-red-500">{fetchError}</p>}

        {/* Display message if no error but list is empty */}
        {!fetchError && workshops.length === 0 && <p>No workshops available at the moment.</p>}

        {/* Display workshop cards if no error and list is not empty */}
        {!fetchError && workshops.length > 0 && workshops.map((workshop) => (
          <WorkshopCard
            key={workshop.id}
            title={workshop.title}
            description={workshop.description ?? ''} // Pass empty string if null
            speaker={workshop.speaker ?? undefined} // Changed from facilitator
            relatedThemes={workshop.related_themes ?? undefined} // Changed from relevant_themes
          />
        ))}
      </div>

      {/* TODO: Implement filtering if needed */}
    </div>
  );
}