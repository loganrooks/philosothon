import FaqForm from '@/components/FaqForm'; // Adjust import path if necessary

import { addFaqItem } from '../actions';

export default function AddNewFaqPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        Add New FAQ Item
      </h1>
      <div className="max-w-2xl">
        <FaqForm
          action={addFaqItem}
        />
      </div>
    </div>
  );
}