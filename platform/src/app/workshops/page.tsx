import WorkshopCard from "@/components/WorkshopCard";

// Mock data - replace with actual data fetching later
const workshops = [
  { id: '1', title: 'Language Models as Philosophical Objects', description: 'Exploring LLMs beyond practical applications...', facilitator: 'Dr. AI' },
  { id: '2', title: 'Generative AI Art', description: 'Creativity, authorship, and aesthetics...', facilitator: 'Prof. Bot' },
  { id: '3', title: 'Technology as Tool vs Master', description: 'Beyond instrumentalism...', facilitator: 'Dr. Cog' },
  // Add more mock workshops or fetch from API/DB
];

export default function WorkshopsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Event Workshops</h1>

      {/* Optional Tag Filter */}
      {/* <TagFilter /> */}

      <p className="mb-6 text-gray-700">
        Discover the workshops offered during the Philosothon. The final workshop selection may depend on participant preferences and relevance to the chosen theme(s).
      </p>

      {/* List of Workshops */}
      <div>
        {workshops.map((workshop) => (
          <WorkshopCard
            key={workshop.id}
            title={workshop.title}
            description={workshop.description}
            facilitator={workshop.facilitator}
          />
        ))}
      </div>

      {/* TODO: Implement actual data fetching (ISR from Supabase) and filtering */}
    </div>
  );
}