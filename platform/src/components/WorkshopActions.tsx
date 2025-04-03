'use client';

import React from 'react';

interface WorkshopActionsProps {
  workshopId: string;
}

export default function WorkshopActions({ workshopId }: WorkshopActionsProps) {
  const handleDeleteClick = () => {
    alert('Delete functionality temporarily disabled during deployment');
    // For future implementation
    console.log('Workshop ID to delete:', workshopId);
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleDeleteClick}
        className="text-red-600 hover:text-red-800 hover:underline transition duration-300"
      >
        Delete
      </button>
    </div>
  );
}