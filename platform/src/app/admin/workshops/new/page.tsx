import WorkshopForm from '@/components/WorkshopForm';
import React from 'react';

import { addWorkshop } from '../actions';

export default function AddNewWorkshopPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Add New Workshop</h1>

      <div className="max-w-2xl rounded border bg-white p-6 shadow-sm">
        <WorkshopForm action={addWorkshop} />
      </div>
    </div>
  );
}