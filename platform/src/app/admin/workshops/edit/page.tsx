// platform/src/app/admin/workshops/edit/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { WorkshopForm } from '../components/WorkshopForm';
import { updateWorkshop } from '../actions';
import type { Workshop } from '../page'; // Import Workshop type

interface EditWorkshopPageProps {
  searchParams?: {
    id?: string;
  };
}

export default async function EditWorkshopPage({ searchParams }: EditWorkshopPageProps) {
  const id = searchParams?.id;

  if (!id) {
    notFound();
  }

  const supabase = await createClient();
  // TODO: Fetch themes if needed for multi-select in form
  const { data: workshop, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !workshop) {
    console.error('Error fetching workshop for edit:', error);
    notFound();
  }

  // Cast the fetched data
  const workshopData = workshop as Workshop;

  // Placeholder for themes data if implementing multi-select
  // const { data: themes } = await supabase.from('themes').select('id, title');

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white">Edit Workshop</h1>
      <WorkshopForm
        action={updateWorkshop}
        initialData={workshopData}
        // themes={themes || []} // Pass themes if implementing multi-select
      />
    </div>
  );
}