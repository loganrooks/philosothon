// platform/src/app/admin/workshops/new/page.tsx
import { WorkshopForm } from '../components/WorkshopForm';
import { createWorkshop } from '../actions';

// TODO: Fetch available themes if implementing multi-select dropdown for relevant_themes

export default async function AddNewWorkshopPage() {
  // const themes = await fetchThemes(); // Fetch themes if needed for form

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white font-philosopher">Add New Workshop</h1>
      <WorkshopForm action={createWorkshop} /* themes={themes} */ />
    </div>
  );
}

// Helper function placeholder if needed
// async function fetchThemes() {
//   // ... fetch themes from Supabase ...
//   return [];
// }