import AccordionGroup from "@/components/AccordionGroup";

// Mock data - replace with actual data fetching later
const faqItems = [
  { question: 'What exactly is a Philosothon?', answer: 'A Philosothon adapts the hackathon format for philosophical inquiry...' },
  { question: 'Do I need to be a philosophy specialist?', answer: 'Not at all! We welcome students from any program...' },
  { question: 'How are teams formed?', answer: 'Teams are created based on the preferences you indicate...' },
  // Add more mock FAQs or fetch from API/DB
];

export default function FaqPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Frequently Asked Questions</h1>

      {/* Optional Search Bar */}
      {/* <SearchBar /> */}

      <AccordionGroup items={faqItems} />

      {/* TODO: Implement actual data fetching (SSG from Supabase) and search functionality */}
    </div>
  );
}