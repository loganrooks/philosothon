import ThemeCard from "@/components/ThemeCard";

// Mock data - replace with actual data fetching later
const themes = [
  { id: '1', title: 'Minds and Machines', description: 'Exploring consciousness in AI...' },
  { id: '2', title: 'Digital Commons', description: 'Rethinking property online...' },
  { id: '3', title: 'Algorithmic Governance', description: 'Authority and autonomy...' },
  // Add more mock themes or fetch from API/DB
];

export default function ThemesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Event Themes</h1>

      {/* Optional Filter Controls */}
      {/* <FilterControls /> */}

      <p className="mb-6 text-gray-700">
        Explore the potential philosophical themes for this year&apos;s Philosothon. The final theme(s) will be selected based on participant votes during registration.
      </p>

      {/* List of Themes */}
      <div>
        {themes.map((theme) => (
          <ThemeCard key={theme.id} title={theme.title} description={theme.description} />
        ))}
      </div>

      {/* TODO: Implement actual data fetching (SSG/ISR from Supabase) and filtering */}
    </div>
  );
}