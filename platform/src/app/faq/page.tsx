import AccordionGroup from "@/components/AccordionGroup";
import { createClient } from '@/lib/supabase/server'; // Import server client

// Define the type for an FAQ item based on the database schema
interface FaqItem {
  id: string; // Assuming UUID is treated as string
  created_at: string; // Assuming TIMESTAMPTZ is treated as string
  question: string;
  answer: string;
  category: string | null; // Assuming TEXT, nullable
  display_order: number | null; // Assuming INT4, nullable
}

// This page will be statically generated at build time (SSG)
// because it's an async Server Component without dynamic functions or revalidate.

export default async function FaqPage() {
  const supabase = await createClient();

  // Fetch data from Supabase
  // Fetch data from Supabase, explicitly typing the expected return data
  const { data: faqItemsData, error } = await supabase
    .from('faq_items') // Ensure this table name matches your Supabase schema
    .select('*') // Let Supabase client infer types, or use DB types if available
    .order('display_order', { ascending: true, nullsFirst: false }) // Order by display_order, then maybe by creation date
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching FAQ items:', error);
    // Optionally render an error message to the user
  }

  // Use fetched FAQ items (or empty array if error)
  // Map to the structure expected by AccordionGroup if necessary
  const faqItems = (faqItemsData || []).map((item: FaqItem) => ({ // Explicitly type 'item'
    question: item.question,
    answer: item.answer,
    // Include other fields if AccordionGroup uses them, e.g., for categorization
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">Frequently Asked Questions</h1>

      {/* Optional Search Bar */}
      {/* <SearchBar /> */}

      {error && <p className="text-red-500">Could not fetch FAQ items. Please try again later.</p>}
      {!error && faqItems.length === 0 && <p>No frequently asked questions available at the moment.</p>}
      {!error && faqItems.length > 0 && <AccordionGroup items={faqItems} />}

      {/* TODO: Implement search functionality if needed */}
    </div>
  );
}