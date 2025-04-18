// platform/src/app/admin/faq/new/page.tsx
import { FaqForm } from '../components/FaqForm';
import { createFaqItem } from '../actions';

export default function AddNewFaqPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white font-philosopher">Add New FAQ Item</h1>
      <FaqForm action={createFaqItem} />
    </div>
  );
}