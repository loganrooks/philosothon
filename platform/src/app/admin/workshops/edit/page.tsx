// platform/src/app/admin/workshops/edit/page.tsx
import { notFound } from 'next/navigation';
import { WorkshopForm } from '../components/WorkshopForm';
import { updateWorkshop } from '../actions';
import { fetchWorkshopById, type Workshop } from '@/lib/data/workshops'; // Import DAL function and type
// TODO: Import fetchThemes from themes DAL if implementing multi-select

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

  // Fetch workshop using the DAL function
  const { workshop: workshopData, error } = await fetchWorkshopById(id);

  if (error || !workshopData) {
    // Error is already logged in fetchWorkshopById
    notFound();
  }

  // TODO: Fetch themes using themes DAL if implementing multi-select
  // const { themes } = await fetchThemes();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white font-philosopher">Edit Workshop</h1>
      <WorkshopForm
        action={updateWorkshop}
        initialData={workshopData}
        // themes={themes || []} // Pass themes if implementing multi-select
      />
    </div>
  );
}