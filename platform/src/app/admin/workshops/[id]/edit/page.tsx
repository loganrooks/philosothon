import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WorkshopForm from '@/components/WorkshopForm';
import { updateWorkshop } from '@/app/admin/workshops/actions'; // Import the update action using alias
// TODO: Generate and import Supabase types (e.g., using `supabase gen types typescript --project-id <your-project-id> --schema public > src/lib/database.types.ts`)
// import { Database } from '@/lib/database.types';
// type Workshop = Database['public']['Tables']['workshops']['Row'];
// Define a local interface for the expected workshop data structure
interface WorkshopData {
  id: string;
  title: string;
  description: string;
  relevant_themes: unknown;
  facilitator?: string | null;
  max_capacity?: number | null;
  // Add other fields as needed based on your actual schema
}
export default async function EditWorkshopPage({ params }: { params: { id: string } }) {
  const supabase = await createClient(); // Await the client creation
  let workshopData: WorkshopData | null = null;
  // Removed unused fetchError variable

  try {
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .eq('id', params.id)
      .single(); // Expect only one row

    if (error) {
      throw error;
    }
    if (!data) {
      notFound(); // Trigger 404 if no data found
    }
    // Assert the type after confirming data exists and is not null
    workshopData = data as WorkshopData;
  } catch (error) {
    console.error('Error fetching workshop:', error);
    // Log the error, maybe show a generic error message or redirect
    // For now, we trigger notFound for simplicity if fetch fails or data is null
    notFound();
  // Add a check to ensure workshopData is not null before proceeding.
  // This case should ideally be handled by the notFound() in catch,
  // but adding an explicit check for robustness and type narrowing.
  if (!workshopData) {
    notFound();
  }
  }

  // Bind the updateWorkshop action with the current workshop's ID
  const updateWorkshopAction = updateWorkshop.bind(null, workshopData.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Edit Workshop: {workshopData.title}
      </h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Pass fetched data to the form */}
        {/* workshopData is now known to be WorkshopData, matching the expected prop type */}
        <WorkshopForm initialData={workshopData} action={updateWorkshopAction} />
      </div>
    </div>
  );
}