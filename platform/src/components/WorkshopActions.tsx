'use client';

import Link from 'next/link';
import { deleteWorkshop } from '@/app/admin/workshops/actions'; // Adjust path as necessary
import React from 'react';

interface WorkshopActionsProps {
  workshopId: string;
}

export default function WorkshopActions({ workshopId }: WorkshopActionsProps) {
  // Bind the workshopId to the deleteWorkshop server action
  const deleteWorkshopWithId = deleteWorkshop.bind(null, workshopId);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm('Are you sure you want to delete this workshop?')) {
      event.preventDefault();
    }
  };

  return (
    <div className="flex space-x-2">
      <Link
        href={`/admin/workshops/${workshopId}/edit`}
        className="text-blue-600 hover:text-blue-800"
      >
        Edit
      </Link>
      <form action={deleteWorkshopWithId} onSubmit={handleSubmit}>
        <button
          type="submit"
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </form>
    </div>
  );
}