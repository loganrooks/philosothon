// platform/src/app/admin/themes/new/page.tsx
import { ThemeForm } from '../components/ThemeForm';
import { createTheme } from '../actions';

export default function AddNewThemePage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white">Add New Theme</h1>
      <ThemeForm action={createTheme} />
    </div>
  );
}