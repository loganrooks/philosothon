import AccordionGroup from "@/components/AccordionGroup";
import { fetchFaqItems, type FaqItem } from '@/lib/data/faq'; // Import DAL function and type

// Removed local FaqItem interface

// This page will be statically generated at build time (SSG)
// because it's an async Server Component without dynamic functions or revalidate.

export default async function FaqPage() {
  // Fetch FAQ items using the DAL function
  const { faqItems: faqItemsData, error } = await fetchFaqItems();

  // Error is already logged in fetchFaqItems

  // Use fetched FAQ items (or empty array if error)
  // Map to the structure expected by AccordionGroup
  const faqItemsForAccordion = (faqItemsData || []).map((item: FaqItem) => ({
    question: item.question,
    answer: item.answer,
    // Include other fields if AccordionGroup uses them
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-hacker-green border-b border-medium-gray pb-2 font-philosopher">Frequently Asked Questions</h1>

      {/* Optional Search Bar */}
      {/* <SearchBar /> */}

      {error && <p className="text-red-500">Could not fetch FAQ items. Please try again later.</p>}
      {!error && faqItemsForAccordion.length === 0 && <p>No frequently asked questions available at the moment.</p>}
      {!error && faqItemsForAccordion.length > 0 && <AccordionGroup items={faqItemsForAccordion} />}

      {/* TODO: Implement search functionality if needed */}
    </div>
  );
}