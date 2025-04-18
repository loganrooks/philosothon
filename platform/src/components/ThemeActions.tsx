'use client';

import React from 'react';

interface ThemeActionsProps {
  themeId: string;
}

export default function ThemeActions({ themeId }: ThemeActionsProps) {

  const handleDeleteClick = () => {
    // Replace with client-side notification until server actions are implemented
    alert('Delete functionality temporarily disabled during deployment');
    // You can implement a client-side alternative or API call here
    console.log('Theme ID to delete (for future implementation):', themeId);
  };

  return (
    <div className="flex item-center justify-center">
      <button
        onClick={handleDeleteClick}
        className="text-red-600 hover:text-red-800 hover:underline transition duration-300"
      >
        Delete
      </button>
    </div>
  );
}